/**
 * Seed spending helpers for Cloudflare Pages Functions.
 *
 * Every fetch() and json() call is guarded so this module never throws —
 * it always returns a structured SpendResult. Callers can therefore use
 * the result directly without wrapping in try/catch.
 */

interface SpendResult {
  ok:      boolean;
  userId?: string;
  status?: number;
  error?:  string;
}

/** Strip trailing slashes and whitespace so URL construction never produces double-slashes or invalid URLs. */
function base(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/**
 * Verifies the user's auth token and atomically deducts `amount` seeds.
 * Never throws — returns a structured result in every code path.
 *
 * Returns { ok: false, status: 401 } if unauthenticated,
 *         { ok: false, status: 402 } if insufficient seeds,
 *         { ok: false, status: 503 } if Supabase is unreachable.
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
  const token   = authHeader.slice(7);
  const apiBase = base(supabaseUrl);

  // ── 1. Verify JWT via Supabase Auth ───────────────────────────────────────
  let userRes: Response;
  try {
    userRes = await fetch(`${apiBase}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey':        serviceKey,
      },
    });
  } catch (e) {
    console.error('[seeds] auth fetch failed:', e);
    return { ok: false, status: 503, error: 'Could not reach auth service.' };
  }

  if (!userRes.ok) {
    return { ok: false, status: 401, error: 'Authentication required.' };
  }

  let userId: string | undefined;
  try {
    const user = await userRes.json() as { id?: string };
    userId = user.id;
  } catch (e) {
    console.error('[seeds] auth response parse failed:', e);
    return { ok: false, status: 500, error: 'Unexpected auth response.' };
  }

  if (!userId) {
    return { ok: false, status: 401, error: 'Authentication required.' };
  }

  // ── 2. Atomically deduct seeds ────────────────────────────────────────────
  let rpcRes: Response;
  try {
    rpcRes = await fetch(`${apiBase}/rest/v1/rpc/spend_seeds`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ p_user_id: userId, p_amount: amount }),
    });
  } catch (e) {
    console.error('[seeds] rpc fetch failed:', e);
    return { ok: false, userId, status: 503, error: 'Could not reach database.' };
  }

  if (!rpcRes.ok) {
    const text = await rpcRes.text().catch(() => '(unreadable)');
    console.error('[seeds] spend_seeds RPC error', rpcRes.status, text);
    return { ok: false, userId, status: 500, error: 'Failed to process seeds.' };
  }

  let success: boolean;
  try {
    success = await rpcRes.json() as boolean;
  } catch (e) {
    console.error('[seeds] rpc response parse failed:', e);
    return { ok: false, userId, status: 500, error: 'Unexpected database response.' };
  }

  if (!success) {
    return { ok: false, userId, status: 402, error: 'Insufficient seeds.' };
  }

  return { ok: true, userId };
}

/** Refunds seeds — called when the AI operation fails after deduction. Never throws. */
export async function refundSeeds(
  supabaseUrl: string,
  serviceKey:  string,
  userId:      string,
  amount:      number,
): Promise<void> {
  try {
    await fetch(`${base(supabaseUrl)}/rest/v1/rpc/add_seeds`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ p_user_id: userId, p_amount: amount }),
    });
  } catch (e) {
    console.error('[seeds] refund fetch failed:', e);
  }
}
