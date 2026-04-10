import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string; sectionId: string }>;
}

// PUT /api/lorebooks/[id]/sections/[sectionId]
export async function PUT(request: Request, { params }: RouteContext) {
  const { sectionId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: {
    title?: string;
    content?: string;
    is_public?: boolean;
    is_usable?: boolean;
    order_index?: number;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;
  if (body.is_public !== undefined) updates.is_public = body.is_public;
  if (body.is_usable !== undefined) updates.is_usable = body.is_usable;
  if (body.order_index !== undefined) updates.order_index = body.order_index;

  if (Object.keys(updates).length === 0) {
    return Response.json({ ok: false, error: '수정할 내용이 없습니다.' }, { status: 400 });
  }

  const { data: section, error } = await supabase
    .from('lorebook_sections')
    .update(updates)
    .eq('id', sectionId)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error || !section) {
    console.error('[sections/id] update error:', error);
    return Response.json({ ok: false, error: '섹션 수정에 실패했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true, section });
}

// DELETE /api/lorebooks/[id]/sections/[sectionId]
export async function DELETE(_req: Request, { params }: RouteContext) {
  const { sectionId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { error } = await supabase
    .from('lorebook_sections')
    .delete()
    .eq('id', sectionId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[sections/id] delete error:', error);
    return Response.json({ ok: false, error: '섹션 삭제에 실패했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
