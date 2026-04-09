import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NoteEditorClient from '@/components/mypage/note/NoteEditorClient';
import type { Note, NoteBlock } from '@/types/note';
import type { LoreCraftPayload } from '@/types/mypage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NoteEditPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 노트 조회
  const { data: noteRow, error: noteError } = await supabase
    .from('notes')
    .select('id, user_id, title, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (noteError || !noteRow) notFound();

  // 블록 조회
  const { data: blocksData } = await supabase
    .from('note_blocks')
    .select('*')
    .eq('note_id', id)
    .eq('user_id', user.id)
    .order('order_index', { ascending: true });

  // Lorecraft 아카이브 목록 조회
  const { data: archiveData } = await supabase
    .from('archive_items')
    .select('id, title, payload')
    .eq('user_id', user.id)
    .eq('type', 'lorecraft')
    .order('created_at', { ascending: false });

  const note = noteRow as Note;
  const blocks = (blocksData ?? []) as NoteBlock[];
  const lorearchiveItems = (archiveData ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    payload: item.payload as LoreCraftPayload,
  }));

  return (
    <NoteEditorClient
      note={note}
      initialBlocks={blocks}
      lorearchiveItems={lorearchiveItems}
    />
  );
}
