
import { addCredits } from '@/lib/credits/transaction';

const SEEDS_BY_PRODUCT: Record<string, number> = {
  'b297051d-b196-4c47-8d1d-438b2f625d58': 5,
  'eb7df972-16ef-4d6f-8955-492eb8521a39': 12,
  'ece78c7b-fb38-4c50-9338-2926a8ab2f8f': 30,
};

async function verifySignature(
  rawBody: string,
  msgId: string,
  msgTimestamp: string,
  msgSignature: string,
  secret: string,
): Promise<boolean> {
  console.log('[webhook] secret length:', secret.length);
  // Standard Webhooks: signed content = "{msgId}.{msgTimestamp}.{body}"
  const signedContent = `${msgId}.${msgTimestamp}.${rawBody}`;

  // Secret is base64-encoded (strip "whsec_" or "polar_whs_" prefix if present)
  const secretBase64 = secret.replace(/^(whsec_|polar_whs_)/, '');
  console.log('[webhook] secretBase64 length:', secretBase64.length);
  console.log('[webhook] msgId:', msgId);
  console.log('[webhook] msgTimestamp:', msgTimestamp);
  console.log('[webhook] msgSignature:', msgSignature?.substring(0, 30));
  const secretBytes = Uint8Array.from(atob(secretBase64), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const msgBytes = new TextEncoder().encode(signedContent);
  const sigBuffer = await crypto.subtle.sign('HMAC', key, msgBytes);
  const computed = Buffer.from(new Uint8Array(sigBuffer)).toString('base64');
  console.log('[webhook] computed sig:', computed?.substring(0, 20));

  // webhook-signature may contain multiple space-separated "v1,<sig>" entries
  const normalize = (s: string) => s.replace(/=+$/, '');
  return msgSignature.split(' ').some((entry) => {
    const [, sig] = entry.split(',');
    if (!sig) return false;
    return normalize(computed) === normalize(sig);
  });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  console.log('[webhook] all headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));

  const msgId = req.headers.get('webhook-id') ?? '';
  const msgTimestamp = req.headers.get('webhook-timestamp') ?? '';
  const msgSignature = req.headers.get('webhook-signature') ?? '';
  const secret = process.env.POLAR_WEBHOOK_SECRET ?? '';

  if (!msgId || !msgTimestamp || !msgSignature || !secret) {
    return new Response('Missing webhook headers or secret', { status: 400 });
  }

  const valid = await verifySignature(rawBody, msgId, msgTimestamp, msgSignature, secret);
  if (!valid) {
    return new Response('Invalid signature', { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const event = payload.type as string;

  if (event === 'order.paid') {
    const order = payload.data as Record<string, unknown>;
    const metadata = (order.metadata ?? {}) as Record<string, string>;
    const userId = metadata.user_id;

    const product = order.product as Record<string, unknown> | undefined;
    const productId = (product?.id ?? '') as string;
    const seeds = SEEDS_BY_PRODUCT[productId];

    if (!userId || !seeds) {
      console.error('[webhook/polar] unknown product or missing user_id', { productId, userId });
      return new Response('Unprocessable', { status: 422 });
    }

    try {
      await addCredits(userId, seeds, `purchase:${productId}`, order.id as string);
    } catch (err) {
      console.error('[webhook/polar] addCredits failed:', err);
      return new Response('Internal error', { status: 500 });
    }
  }

  return new Response('OK', { status: 200 });
}
