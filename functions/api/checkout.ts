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

const POLAR_API = 'https://api.polar.sh/v1';

const ALLOWED_PRODUCTS = new Set([
  'b297051d-b196-4c47-8d1d-438b2f625d58',
  'eb7df972-16ef-4d6f-8955-492eb8521a39',
  'ece78c7b-fb38-4c50-9338-2926a8ab2f8f',
]);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.POLAR_ACCESS_TOKEN) {
    return json({ error: 'Polar not configured' }, 503);
  }

  let body: { productId?: string; customerEmail?: string; userId?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { productId, customerEmail, userId } = body;

  if (!productId || !ALLOWED_PRODUCTS.has(productId)) {
    return json({ error: 'Invalid productId' }, 400);
  }

  const origin     = new URL(request.url).origin;
  const successUrl = `${origin}/checkout/success?checkout_id={CHECKOUT_ID}`;

  const payload: Record<string, unknown> = {
    products:    [productId],
    success_url: successUrl,
  };
  if (customerEmail) payload['customer_email']    = customerEmail;
  if (userId)        payload['customer_external_id'] = userId;

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
