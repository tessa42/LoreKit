/**
 * POST /api/checkout
 *
 * Creates a Polar checkout session and returns the redirect URL.
 *
 * Body
 * ────
 * {
 *   productId:     string,   // Polar product ID
 *   customerEmail?: string,  // pre-fill email (optional)
 * }
 *
 * Response (200)
 * ──────────────
 * { url: string }  — redirect the user here to complete payment
 *
 * Response (4xx / 5xx)
 * ────────────────────
 * { error: string }
 */

interface Env {
  POLAR_ACCESS_TOKEN: string;
}

const POLAR_API = 'https://sandbox-api.polar.sh/v1';

const ALLOWED_PRODUCTS = new Set([
  'ecc31cfc-ffe1-4e5c-9432-0ffdac8a0fa3',
  '5f9f2e9f-1a05-401d-8257-5391ab39c04c',
  '494592b3-c33e-48f3-a88d-c5dc0bad8467',
]);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.POLAR_ACCESS_TOKEN) {
    return json({ error: 'Polar not configured' }, 503);
  }

  let body: { productId?: string; customerEmail?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { productId, customerEmail } = body;

  if (!productId || !ALLOWED_PRODUCTS.has(productId)) {
    return json({ error: 'Invalid productId' }, 400);
  }

  const origin     = new URL(request.url).origin;
  const successUrl = `${origin}/checkout/success?checkout_id={CHECKOUT_ID}`;

  const payload: Record<string, unknown> = {
    products:    [productId],
    success_url: successUrl,
  };
  if (customerEmail) payload['customer_email'] = customerEmail;

  try {
    const res = await fetch(`${POLAR_API}/checkouts/`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      console.error('[checkout] Polar error:', data);
      return json({ error: 'Could not create checkout session' }, 502);
    }

    return json({ url: data['url'] });
  } catch (err) {
    console.error('[checkout] fetch error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
