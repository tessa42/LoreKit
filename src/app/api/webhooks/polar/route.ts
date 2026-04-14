
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { addCredits } from '@/lib/credits/transaction';

const SEEDS_BY_PRODUCT: Record<string, number> = {
  'b297051d-b196-4c47-8d1d-438b2f625d58': 5,
  'eb7df972-16ef-4d6f-8955-492eb8521a39': 12,
  'ece78c7b-fb38-4c50-9338-2926a8ab2f8f': 30,
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.POLAR_WEBHOOK_SECRET ?? '';

  let payload: ReturnType<typeof validateEvent>;
  try {
    payload = validateEvent(rawBody, Object.fromEntries(req.headers.entries()), secret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }
    return Response.json({ error: 'Bad request' }, { status: 400 });
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
