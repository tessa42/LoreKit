/**
 * POST /api/webhook
 *
 * Receives and verifies Polar webhook events.
 * Register this URL in the Polar sandbox dashboard:
 *   https://sandbox.polar.sh → Settings → Webhooks → Add Endpoint
 *   URL: https://<your-deployment>.pages.dev/api/webhook
 *
 * Required env var: POLAR_WEBHOOK_SECRET  (from the Polar dashboard)
 *
 * Handled events
 * ──────────────
 * order.paid           → one-time purchase confirmed  (grant Nutrients)
 * subscription.active  → subscription started         (grant Nutrients)
 * subscription.updated → plan changed
 * subscription.canceled → subscription ended
 */

import { Webhook } from 'standardwebhooks';

interface Env {
  POLAR_ACCESS_TOKEN:  string;
  POLAR_WEBHOOK_SECRET: string;
}

// ─── Nutrients to grant per product ──────────────────────────────────────────
const NUTRIENTS_BY_PRODUCT: Record<string, number> = {
  'ecc31cfc-ffe1-4e5c-9432-0ffdac8a0fa3': 500,
  '5f9f2e9f-1a05-401d-8257-5391ab39c04c': 2000,
  '494592b3-c33e-48f3-a88d-c5dc0bad8467': 999999, // unlimited tier
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.POLAR_WEBHOOK_SECRET) {
    console.error('[webhook] POLAR_WEBHOOK_SECRET not set');
    return new Response('Webhook not configured', { status: 503 });
  }

  const rawBody = await request.text();

  // ── Verify signature ────────────────────────────────────────────────────────
  // Polar provides the secret as a raw string; standardwebhooks needs it
  // base64-encoded.
  let payload: Record<string, unknown>;
  try {
    const b64Secret = btoa(env.POLAR_WEBHOOK_SECRET);
    const wh = new Webhook(b64Secret);
    payload = wh.verify(rawBody, {
      'webhook-id':        request.headers.get('webhook-id')        ?? '',
      'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
      'webhook-signature': request.headers.get('webhook-signature') ?? '',
    }) as Record<string, unknown>;
  } catch (err) {
    console.warn('[webhook] signature verification failed:', err);
    return new Response('Invalid signature', { status: 403 });
  }

  const type = payload['type'] as string | undefined;
  const data = payload['data'] as Record<string, unknown> | undefined;

  console.log(`[webhook] received: ${type}`);

  switch (type) {
    case 'order.paid': {
      const productId      = (data?.['product'] as Record<string, unknown>)?.['id'] as string | undefined;
      const externalUserId = (data?.['customer'] as Record<string, unknown>)?.['external_id'] as string | undefined;
      const nutrients      = productId ? (NUTRIENTS_BY_PRODUCT[productId] ?? 0) : 0;

      console.log(`[webhook] order.paid — product=${productId} user=${externalUserId} nutrients=+${nutrients}`);

      // TODO: credit Nutrients to the user in Supabase
      // Example:
      // await supabase.rpc('add_nutrients', { user_id: externalUserId, amount: nutrients });
      break;
    }

    case 'subscription.active': {
      const productId      = (data?.['product'] as Record<string, unknown>)?.['id'] as string | undefined;
      const externalUserId = (data?.['customer'] as Record<string, unknown>)?.['external_id'] as string | undefined;

      console.log(`[webhook] subscription.active — product=${productId} user=${externalUserId}`);

      // TODO: activate subscription benefits in Supabase
      break;
    }

    case 'subscription.canceled': {
      const externalUserId = (data?.['customer'] as Record<string, unknown>)?.['external_id'] as string | undefined;
      console.log(`[webhook] subscription.canceled — user=${externalUserId}`);

      // TODO: revoke subscription benefits in Supabase
      break;
    }

    default:
      console.log(`[webhook] unhandled event type: ${type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
