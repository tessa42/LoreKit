export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NoteListClient from '@/components/mypage/note/NoteListClient';
import type { NoteWithBlockCount } from '@/types/note';

export default async function NotePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('notes')
    .select('id, user_id, title, created_at, updated_at, note_blocks(count)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[note page] fetch error:', error);
  }

  const notes: NoteWithBlockCount[] = (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    created_at: row.created_at,
    updated_at: row.updated_at,
    block_count: Array.isArray(row.note_blocks)
      ? (row.note_blocks[0] as { count: number } | undefined)?.count ?? 0
      : 0,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <NoteListClient initialNotes={notes} />
    </div>
  );
}
