
import { createClient } from '@/lib/supabase/server';

// GET /api/lorebooks — 내 로어북 목록
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('lorebooks')
    .select('id, user_id, title, cover_image, is_public, created_at, updated_at, lorebook_sections(count)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[lorebooks] fetch error:', error);
    return Response.json({ ok: false, error: '로어북을 불러오지 못했습니다.' }, { status: 500 });
  }

  const lorebooks = (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    cover_image: row.cover_image,
    is_public: row.is_public,
    created_at: row.created_at,
    updated_at: row.updated_at,
    section_count: Array.isArray(row.lorebook_sections)
      ? (row.lorebook_sections[0] as { count: number } | undefined)?.count ?? 0
      : 0,
  }));

  return Response.json({ ok: true, lorebooks });
}

// POST /api/lorebooks — 새 로어북 생성
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: { title?: string } = {};
  try {
    body = await request.json();
  } catch { /* body optional */ }

  const title = body.title ?? '제목 없음';

  const { data: lorebook, error } = await supabase
    .from('lorebooks')
    .insert({ user_id: user.id, title, is_public: false })
    .select('id, user_id, title, cover_image, is_public, created_at, updated_at')
    .single();

  if (error || !lorebook) {
    console.error('[lorebooks] create error:', error);
    return Response.json({ ok: false, error: '로어북 생성에 실패했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true, lorebook }, { status: 201 });
}
