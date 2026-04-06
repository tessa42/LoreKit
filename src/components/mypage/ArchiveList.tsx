'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ArchiveCard from '@/components/mypage/ArchiveCard';
import type { ArchiveItem, ArchiveFilter } from '@/types/mypage';

const FILTERS: { label: string; value: ArchiveFilter }[] = [
  { label: '전체', value: 'all' },
  { label: 'Lorecraft', value: 'lorecraft' },
  { label: 'Lorecheck', value: 'lorecheck_quick' },
  { label: 'Simulator', value: 'simulator' },
];

interface ArchiveListProps {
  initialItems: ArchiveItem[];
  currentFilter: ArchiveFilter;
}

export default function ArchiveList({ initialItems, currentFilter }: ArchiveListProps) {
  const router = useRouter();
  const [items, setItems] = useState<ArchiveItem[]>(initialItems);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  function handleFilterChange(filter: ArchiveFilter) {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('type', filter);
    startTransition(() => {
      router.push(`/mypage/archive${params.size ? `?${params}` : ''}`);
    });
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('archive_items').delete().eq('id', id);
    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  }

  return (
    <div>
      {/* 필터 탭 */}
      <div className="mb-6 flex gap-1 flex-wrap">
        {FILTERS.map(({ label, value }) => {
          const active = value === currentFilter;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleFilterChange(value)}
              className={[
                'rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-[#7c6af7] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 아이템 목록 */}
      {items.length === 0 ? (
        <EmptyState filter={currentFilter} />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ArchiveCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ filter }: { filter: ArchiveFilter }) {
  const messages: Record<ArchiveFilter, string> = {
    all: '아직 저장된 항목이 없어요.',
    lorecraft: '저장된 Lorecraft 결과가 없어요.',
    lorecheck_quick: '저장된 Lorecheck 결과가 없어요.',
    lorecheck_deep: '저장된 Lorecheck Deep 결과가 없어요.',
    simulator: '저장된 시뮬레이터 결과가 없어요.',
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-4xl mb-4">🌱</p>
      <p className="text-sm text-[var(--muted)]">{messages[filter]}</p>
    </div>
  );
}
