
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/lorebooks/[id]/sections
export async function GET(_req: Request, { params }: RouteContext) {
  const { id: lorebookId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { data: sections, error } = await supabase
    .from('lorebook_sections')
    .select('*')
    .eq('lorebook_id', lorebookId)
    .eq('user_id', user.id)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('[sections] fetch error:', error);
    return Response.json({ ok: false, error: '섹션을 불러오지 못했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true, sections: sections ?? [] });
}

// POST /api/lorebooks/[id]/sections — 새 섹션 생성
export async function POST(request: Request, { params }: RouteContext) {
  const { id: lorebookId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // 로어북 소유권 확인
  const { data: lorebook } = await supabase
    .from('lorebooks')
    .select('id')
    .eq('id', lorebookId)
    .eq('user_id', user.id)
    .single();

  if (!lorebook) {
    return Response.json({ ok: false, error: '로어북을 찾을 수 없습니다.' }, { status: 404 });
  }

  let body: { title?: string; content?: string; note_block_id?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 });
  }

  // 마지막 order_index 조회
  const { data: lastSection } = await supabase
    .from('lorebook_sections')
    .select('order_index')
    .eq('lorebook_id', lorebookId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const orderIndex = lastSection ? lastSection.order_index + 1 : 0;

  const { data: section, error } = await supabase
    .from('lorebook_sections')
    .insert({
      lorebook_id: lorebookId,
      user_id: user.id,
      title: body.title ?? '새 섹션',
      content: body.content ?? '',
      order_index: orderIndex,
      note_block_id: body.note_block_id ?? null,
      is_public: false,
      is_usable: true,
    })
    .select('*')
    .single();

  if (error || !section) {
    console.error('[sections] create error:', error);
    return Response.json({ ok: false, error: '섹션 생성에 실패했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true, section }, { status: 201 });
}
