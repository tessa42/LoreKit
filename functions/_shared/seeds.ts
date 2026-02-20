/**
 * Seed spending helpers for Cloudflare Pages Functions.
 *
 * Uses Supabase service role to atomically deduct seeds from a user's profile.
 * The user's identity is verified by forwarding their Supabase session JWT.
 */

interface SpendResult {
  ok:      boolean;
  userId?: string;
  status?: number;
  error?:  string;
}

/**
 * Verifies the user's auth token and atomically deducts `amount` seeds.
 * Returns `{ ok: false, status: 401 }` if unauthenticated,
 *         `{ ok: false, status: 402 }` if insufficient seeds.
 */
export async function spendSeeds(
  supabaseUrl: string,
  serviceKey:  string,
  authHeader:  string | null,
  amount:      number,
): Promise<SpendResult> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Authentication required.' };
  }
  const token = authHeader.slice(7);

  // Verify token and get user ID
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey':        serviceKey,
    },
  });

  if (!userRes.ok) {
    return { ok: false, status: 401, error: 'Authentication required.' };
  }

  const user   = await userRes.json() as { id?: string };
  const userId = user.id;

  if (!userId) {
    return { ok: false, status: 401, error: 'Authentication required.' };
  }

  // Atomically deduct seeds (returns false if balance insufficient)
  const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/spend_seeds`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ p_user_id: userId, p_amount: amount }),
  });

  if (!rpcRes.ok) {
    console.error('[seeds] spend_seeds RPC failed:', await rpcRes.text());
    return { ok: false, userId, status: 500, error: 'Failed to process seeds.' };
  }

  const success = await rpcRes.json() as boolean;
  if (!success) {
    return { ok: false, userId, status: 402, error: 'Insufficient seeds.' };
  }

  return { ok: true, userId };
}

/** Refunds seeds back to a user — called when the AI operation fails after deduction. */
export async function refundSeeds(
  supabaseUrl: string,
  serviceKey:  string,
  userId:      string,
  amount:      number,
): Promise<void> {
  await fetch(`${supabaseUrl}/rest/v1/rpc/add_seeds`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ p_user_id: userId, p_amount: amount }),
  });
}
