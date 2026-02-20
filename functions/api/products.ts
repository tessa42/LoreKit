/**
 * GET /api/products
 *
 * Returns Polar product details for the three LoreKit Nutrients plans.
 * Calls the Polar sandbox API and forwards the relevant fields to the
 * frontend so the Pricing page can render real names, prices, and
 * descriptions without hardcoding them.
 */

interface Env {
  POLAR_ACCESS_TOKEN: string;
}

const POLAR_API   = 'https://sandbox-api.polar.sh/v1';
const PRODUCT_IDS = [
  'ecc31cfc-ffe1-4e5c-9432-0ffdac8a0fa3',
  '5f9f2e9f-1a05-401d-8257-5391ab39c04c',
  '494592b3-c33e-48f3-a88d-c5dc0bad8467',
] as const;

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.POLAR_ACCESS_TOKEN) {
    return json({ error: 'Polar not configured' }, 503);
  }

  try {
    const products = await Promise.all(
      PRODUCT_IDS.map(async (id) => {
        const res = await fetch(`${POLAR_API}/products/${id}`, {
          headers: { Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}` },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Polar ${res.status} for ${id}: ${text}`);
        }
        return res.json();
      }),
    );

    return json(products);
  } catch (err) {
    console.error('[products] error:', err);
    return json({ error: 'Failed to load products' }, 500);
  }
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
