/**
 * POST /api/webhook
 *
 * Receives and verifies Polar webhook events.
 * Register this URL in the Polar dashboard:
 *   https://polar.sh → Settings → Webhooks → Add Endpoint
 *   URL: https://<your-deployment>.pages.dev/api/webhook
 *
 * Required env var: POLAR_WEBHOOK_SECRET  (from the Polar dashboard)
 *
 * Handled events
 * ──────────────
 * order.paid            → one-time purchase confirmed  (grant Nutrients)
 * order.refunded        → purchase refunded            (revoke Nutrients)
 * refund.created        → refund initiated
 * subscription.active   → subscription started         (grant Nutrients)
 * subscription.updated  → plan changed
 * subscription.canceled → subscription ended
 */

import { Webhook } from 'standardwebhooks';
import { sendEmail, purchaseEmail, refundEmail } from '../_shared/email';

interface Env {
  POLAR_ACCESS_TOKEN:   string;
  POLAR_WEBHOOK_SECRET: string;
  RESEND_API_KEY:       string;
  SUPABASE_URL:         string;
  SUPABASE_SERVICE_KEY: string;
}

// ─── Supabase seed helpers ────────────────────────────────────────────────────
async function callSeedsRpc(
  env: Env,
  fn: 'add_seeds' | 'remove_seeds',
  userId: string,
  amount: number,
): Promise<void> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ p_user_id: userId, p_amount: amount }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase RPC ${fn} failed: ${text}`);
  }
}

// ─── Nutrients to grant per product ──────────────────────────────────────────
const NUTRIENTS_BY_PRODUCT: Record<string, number> = {
  'b297051d-b196-4c47-8d1d-438b2f625d58': 500,    //  5 seeds
  'eb7df972-16ef-4d6f-8955-492eb8521a39': 2000,   // 12 seeds
  'ece78c7b-fb38-4c50-9338-2926a8ab2f8f': 999999, // 30 seeds (unlimited)
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
      const customer       = data?.['customer'] as Record<string, unknown> | undefined;
      const productId      = (data?.['product'] as Record<string, unknown>)?.['id'] as string | undefined;
      const orderId        = data?.['id'] as string | undefined;
      const customerEmail  = customer?.['email'] as string | undefined;
      const externalUserId = customer?.['external_id'] as string | undefined;
      const nutrients      = productId ? (NUTRIENTS_BY_PRODUCT[productId] ?? 0) : 0;

      console.log(`[webhook] order.paid — product=${productId} user=${externalUserId} nutrients=+${nutrients}`);

      if (externalUserId && nutrients && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
        await callSeedsRpc(env, 'add_seeds', externalUserId, nutrients);
        console.log(`[webhook] seeds credited: user=${externalUserId} +${nutrients}`);
      }

      if (customerEmail && productId && orderId && env.RESEND_API_KEY) {
        const { subject, html } = purchaseEmail(customerEmail, productId, orderId);
        sendEmail({ to: customerEmail, subject, html, apiKey: env.RESEND_API_KEY })
          .then(() => console.log(`[webhook] purchase email sent to ${customerEmail}`))
          .catch((err: unknown) => console.error('[webhook] purchase email failed:', err));
      }
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

    case 'order.refunded': {
      const customer       = data?.['customer'] as Record<string, unknown> | undefined;
      const productId      = (data?.['product'] as Record<string, unknown>)?.['id'] as string | undefined;
      const orderId        = data?.['id'] as string | undefined;
      const customerEmail  = customer?.['email'] as string | undefined;
      const externalUserId = customer?.['external_id'] as string | undefined;
      const nutrients      = productId ? (NUTRIENTS_BY_PRODUCT[productId] ?? 0) : 0;
      console.log(`[webhook] order.refunded — product=${productId} user=${externalUserId} nutrients=-${nutrients}`);

      if (externalUserId && nutrients && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
        await callSeedsRpc(env, 'remove_seeds', externalUserId, nutrients);
        console.log(`[webhook] seeds deducted: user=${externalUserId} -${nutrients}`);
      }

      if (customerEmail && productId && orderId && env.RESEND_API_KEY) {
        const { subject, html } = refundEmail(customerEmail, productId, orderId);
        sendEmail({ to: customerEmail, subject, html, apiKey: env.RESEND_API_KEY })
          .then(() => console.log(`[webhook] refund email sent to ${customerEmail}`))
          .catch((err: unknown) => console.error('[webhook] refund email failed:', err));
      }
      break;
    }

    case 'refund.created': {
      const orderId = data?.['order_id'] as string | undefined;
      const amount  = data?.['amount']   as number | undefined;
      console.log(`[webhook] refund.created — order=${orderId} amount=${amount}`);
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
