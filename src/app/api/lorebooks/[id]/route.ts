export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/lorebooks/[id]
export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { data: lorebook, error } = await supabase
    .from('lorebooks')
    .select('id, user_id, title, cover_image, is_public, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !lorebook) {
    return Response.json({ ok: false, error: '로어북을 찾을 수 없습니다.' }, { status: 404 });
  }

  return Response.json({ ok: true, lorebook });
}

// PUT /api/lorebooks/[id] — 제목, 공개 여부, 커버 이미지 수정
export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: { title?: string; is_public?: boolean; cover_image?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.is_public !== undefined) updates.is_public = body.is_public;
  if (body.cover_image !== undefined) updates.cover_image = body.cover_image;

  if (Object.keys(updates).length === 0) {
    return Response.json({ ok: false, error: '수정할 내용이 없습니다.' }, { status: 400 });
  }

  const { data: lorebook, error } = await supabase
    .from('lorebooks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, title, cover_image, is_public, created_at, updated_at')
    .single();

  if (error || !lorebook) {
    console.error('[lorebooks/id] update error:', error);
    return Response.json({ ok: false, error: '로어북 수정에 실패했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true, lorebook });
}

// DELETE /api/lorebooks/[id]
export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { error } = await supabase
    .from('lorebooks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[lorebooks/id] delete error:', error);
    return Response.json({ ok: false, error: '로어북 삭제에 실패했습니다.' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
