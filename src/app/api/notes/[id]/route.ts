
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/notes/[id]
export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { data: note, error } = await supabase
    .from('notes')
    .select('id, user_id, title, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !note) {
    return Response.json({ ok: false, error: '노트를 찾을 수 없습니다.' }, { status: 404 });
  }

  return Response.json({ ok: true, note });
}

// PUT /api/notes/[id] — 제목 수정
export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: { title?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 });
  }

  if (!body.title || typeof body.title !== 'string') {
    return Response.json({ ok: false, error: 'title이 필요합니다.' }, { status: 400 });
  }

  const { data: note, error } = await supabase
    .from('notes')
    .update({ title: body.title })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, title, created_at, updated_at')
    .single();

  if (error || !note) {
    console.error('[notes/id] update error:', error);
    return Response.json({ ok: false, error: '노트 수정에 실패했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true, note });
}

// DELETE /api/notes/[id]
export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[notes/id] delete error:', error);
    return Response.json({ ok: false, error: '노트 삭제에 실패했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
