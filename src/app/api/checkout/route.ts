import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await req.json() as { productId?: string };
  const { productId } = body;

  if (!productId) {
    return Response.json({ ok: false, error: 'productId가 필요합니다.' }, { status: 400 });
  }

  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`;
  const successUrl = `${baseUrl}/mypage/billing?success=true`;

  const polarRes = await fetch('https://api.polar.sh/v1/checkouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      product_id: productId,
      customer_email: user.email,
      success_url: successUrl,
      metadata: { user_id: user.id },
    }),
  });

  if (!polarRes.ok) {
    const err = await polarRes.text();
    console.error('[checkout] Polar API error:', err);
    return Response.json({ ok: false, error: '결제 페이지 생성에 실패했습니다.' }, { status: 500 });
  }

  const data = await polarRes.json() as { url?: string };
  if (!data.url) {
    return Response.json({ ok: false, error: '결제 URL을 받지 못했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true, url: data.url });
}
