export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import type { NoteBlockContent } from '@/types/note';

interface RouteContext {
  params: Promise<{ id: string; blockId: string }>;
}

// PUT /api/notes/[id]/blocks/[blockId]
export async function PUT(request: Request, { params }: RouteContext) {
  const { id: noteId, blockId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: { content?: NoteBlockContent; order_index?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.content !== undefined) updates.content = body.content;
  if (body.order_index !== undefined) updates.order_index = body.order_index;

  if (Object.keys(updates).length === 0) {
    return Response.json({ ok: false, error: '수정할 내용이 없습니다.' }, { status: 400 });
  }

  const { data: block, error } = await supabase
    .from('note_blocks')
    .update(updates)
    .eq('id', blockId)
    .eq('note_id', noteId)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error || !block) {
    console.error('[blocks/blockId] update error:', error);
    return Response.json({ ok: false, error: '블록 수정에 실패했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true, block });
}

// DELETE /api/notes/[id]/blocks/[blockId]
export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id: noteId, blockId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { error } = await supabase
    .from('note_blocks')
    .delete()
    .eq('id', blockId)
    .eq('note_id', noteId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[blocks/blockId] delete error:', error);
    return Response.json({ ok: false, error: '블록 삭제에 실패했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
