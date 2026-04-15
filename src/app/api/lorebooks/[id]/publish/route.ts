
import { createClient } from '@/lib/supabase/server';
import type { NoteBlock } from '@/types/note';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function blockToSectionTitle(block: NoteBlock): string {
  const c = block.content;
  switch (block.type) {
    case 'text': return '텍스트';
    case 'world_overview': return (c as { title: string }).title || '세계관 개요';
    case 'setting': return (c as { title: string }).title || '설정 항목';
    case 'character': return (c as { name: string }).name || '인물 카드';
    case 'timeline': return '타임라인';
    case 'plot': return '플롯';
  }
}

function blockToSectionContent(block: NoteBlock): string {
  const c = block.content;
  switch (block.type) {
    case 'text': return (c as { body: string }).body;
    case 'world_overview': return (c as { body: string }).body;
    case 'setting': return (c as { body: string }).body;
    case 'character': {
      const ch = c as { role: string; description: string; traits: string[] };
      const parts: string[] = [];
      if (ch.role) parts.push(`역할: ${ch.role}`);
      if (ch.description) parts.push(ch.description);
      if (ch.traits.length) parts.push(`특성: ${ch.traits.join(', ')}`);
      return parts.join('\n\n');
    }
    case 'timeline': {
      const events = (c as { events: { date: string; description: string }[] }).events;
      return events.map((e) => `${e.date}: ${e.description}`).join('\n');
    }
    case 'plot': {
      const cards = (c as { cards: { content: string }[] }).cards;
      return cards.map((card) => card.content).join('\n\n');
    }
  }
}

// POST /api/lorebooks/[id]/publish — source_note_id 노트의 블록을 섹션으로 덮어쓰기 발행
export async function POST(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // 로어북 + source_note_id 조회
  const { data: lorebook, error: lorebookError } = await supabase
    .from('lorebooks')
    .select('id, source_note_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (lorebookError || !lorebook) {
    return Response.json({ ok: false, error: '로어북을 찾을 수 없습니다.' }, { status: 404 });
  }

  if (!lorebook.source_note_id) {
    return Response.json({ ok: false, error: '연결된 작가노트가 없습니다.' }, { status: 400 });
  }

  // 연결된 노트의 블록 조회
  const { data: blocks, error: blocksError } = await supabase
    .from('note_blocks')
    .select('*')
    .eq('note_id', lorebook.source_note_id)
    .eq('user_id', user.id)
    .order('order_index', { ascending: true });

  if (blocksError) {
    console.error('[publish] blocks fetch error:', blocksError);
    return Response.json({ ok: false, error: '노트 블록을 불러오지 못했습니다.' }, { status: 500 });
  }

  // 기존 섹션 전부 삭제
  const { error: deleteError } = await supabase
    .from('lorebook_sections')
    .delete()
    .eq('lorebook_id', id)
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('[publish] sections delete error:', deleteError);
    return Response.json({ ok: false, error: '기존 섹션 삭제에 실패했습니다.' }, { status: 500 });
  }

  // 블록 → 섹션으로 새로 INSERT
  if (blocks && blocks.length > 0) {
    const noteBlocks = blocks as NoteBlock[];
    const newSections = noteBlocks.map((block, index) => ({
      lorebook_id: id,
      user_id: user.id,
      title: blockToSectionTitle(block),
      content: blockToSectionContent(block),
      order_index: index,
      note_block_id: block.id,
      is_public: false,
      is_usable: true,
    }));

    const { error: insertError } = await supabase
      .from('lorebook_sections')
      .insert(newSections);

    if (insertError) {
      console.error('[publish] sections insert error:', insertError);
      return Response.json({ ok: false, error: '섹션 발행에 실패했습니다.' }, { status: 500 });
    }
  }

  return Response.json({ ok: true, section_count: blocks?.length ?? 0 });
}
