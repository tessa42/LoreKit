/**
 * POST /api/refund
 *
 * Initiates a refund for a completed Polar order.
 * Requires `refunds:write` scope on the access token.
 *
 * Body
 * ────
 * {
 *   orderId: string,         // Polar order ID to refund
 *   reason?: string,         // "customer_request" | "fraudulent" | "duplicate"
 *   amount?: number,         // partial refund amount in cents (omit for full refund)
 * }
 *
 * Response (200)
 * ──────────────
 * { id: string, status: string }
 *
 * Response (4xx / 5xx)
 * ────────────────────
 * { error: string }
 */

interface Env {
  POLAR_ACCESS_TOKEN: string;
}

const POLAR_API = 'https://api.polar.sh/v1';

const VALID_REASONS = new Set(['customer_request', 'fraudulent', 'duplicate']);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.POLAR_ACCESS_TOKEN) {
    return json({ error: 'Polar not configured' }, 503);
  }

  let body: { orderId?: string; reason?: string; amount?: number };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { orderId, reason = 'customer_request', amount } = body;

  if (!orderId || typeof orderId !== 'string') {
    return json({ error: 'orderId is required' }, 400);
  }

  if (!VALID_REASONS.has(reason)) {
    return json({ error: `Invalid reason. Must be one of: ${[...VALID_REASONS].join(', ')}` }, 400);
  }

  const payload: Record<string, unknown> = { order_id: orderId, reason };
  if (typeof amount === 'number' && amount > 0) {
    payload['amount'] = amount;
  }

  try {
    const res = await fetch(`${POLAR_API}/refunds/`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      console.error('[refund] Polar error:', data);
      return json({ error: 'Refund request failed' }, 502);
    }

    return json({ id: data['id'], status: data['status'] });
  } catch (err) {
    console.error('[refund] fetch error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
