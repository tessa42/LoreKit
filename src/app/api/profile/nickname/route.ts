import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,16}$/;

export async function PUT(req: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { nickname?: unknown };
  const nickname = body.nickname;

  if (typeof nickname !== 'string' || !NICKNAME_REGEX.test(nickname)) {
    return NextResponse.json(
      { error: '닉네임은 2~16자, 한글/영문/숫자만 사용할 수 있습니다.' },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from('profiles')
    .update({ nickname })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
