export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST() {
  // 로그인 사용자 확인
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // service role 클라이언트로 계정 삭제
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    console.error('[account/delete] failed:', error);
    return Response.json({ ok: false, error: '계정 삭제에 실패했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
