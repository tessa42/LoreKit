import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LorebookViewerClient from '@/components/mypage/lorebook/LorebookViewerClient';
import type { Lorebook, LorebookSection } from '@/types/lorebook';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LorebookViewPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 로어북 조회
  const { data: lorebookRow, error: lorebookError } = await supabase
    .from('lorebooks')
    .select('id, user_id, title, cover_image, is_public, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (lorebookError || !lorebookRow) notFound();

  // 섹션 조회
  const { data: sectionsData } = await supabase
    .from('lorebook_sections')
    .select('*')
    .eq('lorebook_id', id)
    .eq('user_id', user.id)
    .order('order_index', { ascending: true });

  const lorebook = lorebookRow as Lorebook;
  const sections = (sectionsData ?? []) as LorebookSection[];

  return (
    <LorebookViewerClient
      lorebook={lorebook}
      sections={sections}
    />
  );
}
