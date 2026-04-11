
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ArchiveList from '@/components/mypage/ArchiveList';
import type { ArchiveFilter, ArchiveItem } from '@/types/mypage';

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

const VALID_FILTERS: ArchiveFilter[] = [
  'all', 'lorecraft', 'lorecheck_quick', 'lorecheck_deep', 'simulator',
];

function parseFilter(raw: string | undefined): ArchiveFilter {
  if (raw && (VALID_FILTERS as string[]).includes(raw)) return raw as ArchiveFilter;
  return 'all';
}

export default async function ArchivePage({ searchParams }: PageProps) {
  const supabase = await createClient();

  // 인증 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { type: rawType } = await searchParams;
  const filter = parseFilter(rawType);

  // Supabase 조회
  let query = supabase
    .from('archive_items')
    .select('id, user_id, type, title, payload, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // lorecheck 필터 — quick/deep 둘 다 보여주는 탭은 따로 처리하지 않으므로 그대로 전달
  if (filter !== 'all') {
    query = query.eq('type', filter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[archive] fetch error:', error);
  }

  const items = (data ?? []) as ArchiveItem[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[var(--foreground)]">내 서재</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">저장한 캐릭터 카드와 세계관 기록을 확인해요.</p>
      </div>

      <ArchiveList initialItems={items} currentFilter={filter} />
    </div>
  );
}
