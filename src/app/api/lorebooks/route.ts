
import { createClient } from '@/lib/supabase/server';

// GET /api/lorebooks — 내 로어북 목록 (?source_note_id=xxx 필터 지원)
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sourceNoteId = searchParams.get('source_note_id');

  let query = supabase
    .from('lorebooks')
    .select('id, user_id, title, cover_image, is_public, source_note_id, created_at, updated_at, lorebook_sections(count)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (sourceNoteId) {
    query = query.eq('source_note_id', sourceNoteId);
  }

  const { data, error } = await query;

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
    source_note_id: row.source_note_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    section_count: Array.isArray(row.lorebook_sections)
      ? (row.lorebook_sections[0] as { count: number } | undefined)?.count ?? 0
      : 0,
  }));

  return Response.json({ ok: true, lorebooks });
}

// POST /api/lorebooks — 새 로어북 생성 (동시에 같은 제목의 작가노트도 자동 생성)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: { title?: string; source_note_id?: string } = {};
  try {
    body = await request.json();
  } catch { /* body optional */ }

  const title = body.title ?? '제목 없음';
  let sourceNoteId = body.source_note_id ?? null;

  // source_note_id가 없을 때만 작가노트 자동 생성
  if (!sourceNoteId) {
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({ user_id: user.id, title })
      .select('id')
      .single();

    if (noteError || !note) {
      console.error('[lorebooks] note create error:', noteError);
      return Response.json({ ok: false, error: '작가노트 생성에 실패했습니다.' }, { status: 500 });
    }
    sourceNoteId = note.id as string;
  }

  // 로어북 생성 (source_note_id 연결)
  const { data: lorebook, error } = await supabase
    .from('lorebooks')
    .insert({ user_id: user.id, title, is_public: false, source_note_id: sourceNoteId })
    .select('id, user_id, title, cover_image, is_public, source_note_id, created_at, updated_at')
    .single();

  if (error || !lorebook) {
    console.error('[lorebooks] create error:', error);
    return Response.json({ ok: false, error: '로어북 생성에 실패했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true, lorebook }, { status: 201 });
}
