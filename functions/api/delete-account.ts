/**
 * DELETE /api/delete-account
 *
 * Verifies the caller's Supabase session and permanently deletes the account
 * using the Supabase Admin API (requires service_role key).
 *
 * Cascading deletes on profiles and saved_reports are handled by the DB.
 */

interface Env {
  SUPABASE_URL:         string;
  SUPABASE_SERVICE_KEY: string;
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return json({ error: 'Server not configured' }, 503);
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.slice(7);

  // ── Verify token and get user ID ──────────────────────────────────────────
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey':        env.SUPABASE_SERVICE_KEY,
    },
  });

  if (!userRes.ok) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const userData = await userRes.json() as { id?: string };
  const userId   = userData.id;

  if (!userId) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // ── Delete via Supabase Admin API ─────────────────────────────────────────
  const deleteRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method:  'DELETE',
    headers: {
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'apikey':        env.SUPABASE_SERVICE_KEY,
    },
  });

  if (!deleteRes.ok) {
    console.error('[delete-account] Admin API error:', await deleteRes.text());
    return json({ error: 'Failed to delete account' }, 500);
  }

  return json({ success: true });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
