export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LorebookListClient from '@/components/mypage/lorebook/LorebookListClient';
import type { LorebookWithSectionCount } from '@/types/lorebook';

export default async function LorebookListPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('lorebooks')
    .select('id, user_id, title, cover_image, is_public, created_at, updated_at, lorebook_sections(count)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const lorebooks: LorebookWithSectionCount[] = (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    cover_image: row.cover_image,
    is_public: row.is_public,
    created_at: row.created_at,
    updated_at: row.updated_at,
    section_count: Array.isArray(row.lorebook_sections)
      ? (row.lorebook_sections[0] as { count: number } | undefined)?.count ?? 0
      : 0,
  }));

  return <LorebookListClient initialLorebooks={lorebooks} />;
}
