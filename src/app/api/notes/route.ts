import { createClient } from '@/lib/supabase/server';
import type { NoteBlockType } from '@/types/note';
import { defaultContent } from '@/types/note';

// GET /api/notes — 내 노트 목록
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('notes')
    .select('id, user_id, title, created_at, updated_at, note_blocks(count)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[notes] fetch error:', error);
    return Response.json({ ok: false, error: '노트를 불러오지 못했습니다.' }, { status: 500 });
  }

  const notes = (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    created_at: row.created_at,
    updated_at: row.updated_at,
    block_count: Array.isArray(row.note_blocks)
      ? (row.note_blocks[0] as { count: number } | undefined)?.count ?? 0
      : 0,
  }));

  return Response.json({ ok: true, notes });
}

// POST /api/notes — 새 노트 생성
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: { title?: string; initialBlockType?: NoteBlockType } = {};
  try {
    body = await request.json();
  } catch { /* body optional */ }

  const title = body.title ?? '제목 없음';

  const { data: note, error: noteError } = await supabase
    .from('notes')
    .insert({ user_id: user.id, title })
    .select('id, user_id, title, created_at, updated_at')
    .single();

  if (noteError || !note) {
    console.error('[notes] create error:', noteError);
    return Response.json({ ok: false, error: '노트 생성에 실패했습니다.' }, { status: 500 });
  }

  // 초기 블록 자동 생성 (선택 사항)
  if (body.initialBlockType) {
    await supabase.from('note_blocks').insert({
      note_id: note.id,
      user_id: user.id,
      type: body.initialBlockType,
      content: defaultContent(body.initialBlockType),
      order_index: 0,
    });
  }

  return Response.json({ ok: true, note }, { status: 201 });
}
