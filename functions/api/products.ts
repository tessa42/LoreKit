/**
 * GET /api/products
 *
 * Returns Polar product details for the three LoreKit Nutrients plans.
 * Calls the Polar API and forwards the relevant fields to the
 * frontend so the Pricing page can render real names, prices, and
 * descriptions without hardcoding them.
 */

interface Env {
  POLAR_ACCESS_TOKEN: string;
}

const POLAR_API   = 'https://api.polar.sh/v1';
const PRODUCT_IDS = [
  'b297051d-b196-4c47-8d1d-438b2f625d58',
  'eb7df972-16ef-4d6f-8955-492eb8521a39',
  'ece78c7b-fb38-4c50-9338-2926a8ab2f8f',
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
