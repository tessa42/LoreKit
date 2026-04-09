import { createClient } from '@/lib/supabase/server';
import type { NoteBlockType } from '@/types/note';
import { defaultContent } from '@/types/note';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/notes/[id]/blocks
export async function GET(_req: Request, { params }: RouteContext) {
  const { id: noteId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // 노트 소유권 확인
  const { data: note } = await supabase
    .from('notes')
    .select('id')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single();

  if (!note) {
    return Response.json({ ok: false, error: '노트를 찾을 수 없습니다.' }, { status: 404 });
  }

  const { data: blocks, error } = await supabase
    .from('note_blocks')
    .select('*')
    .eq('note_id', noteId)
    .eq('user_id', user.id)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('[blocks] fetch error:', error);
    return Response.json({ ok: false, error: '블록을 불러오지 못했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true, blocks: blocks ?? [] });
}

// POST /api/notes/[id]/blocks
export async function POST(request: Request, { params }: RouteContext) {
  const { id: noteId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // 노트 소유권 확인
  const { data: note } = await supabase
    .from('notes')
    .select('id')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single();

  if (!note) {
    return Response.json({ ok: false, error: '노트를 찾을 수 없습니다.' }, { status: 404 });
  }

  let body: { type: NoteBlockType; content?: unknown; source_archive_id?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 });
  }

  // 마지막 order_index 조회
  const { data: lastBlock } = await supabase
    .from('note_blocks')
    .select('order_index')
    .eq('note_id', noteId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const orderIndex = lastBlock ? lastBlock.order_index + 1 : 0;

  const { data: block, error } = await supabase
    .from('note_blocks')
    .insert({
      note_id: noteId,
      user_id: user.id,
      type: body.type,
      content: body.content ?? defaultContent(body.type),
      order_index: orderIndex,
      source_archive_id: body.source_archive_id ?? null,
    })
    .select('*')
    .single();

  if (error || !block) {
    console.error('[blocks] create error:', error);
    return Response.json({ ok: false, error: '블록 생성에 실패했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true, block }, { status: 201 });
}
