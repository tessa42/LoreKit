'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import LorebookCard from './LorebookCard';
import type { LorebookWithSectionCount } from '@/types/lorebook';

interface Props {
  initialLorebooks: LorebookWithSectionCount[];
}

export default function LorebookListClient({ initialLorebooks }: Props) {
  const router = useRouter();
  const [lorebooks, setLorebooks] = useState(initialLorebooks);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch('/api/lorebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '제목 없음' }),
      });
      const json = await res.json();
      if (json.ok) {
        router.push(`/mypage/lorebook/${json.lorebook.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('로어북을 삭제할까요? 포함된 섹션도 모두 삭제됩니다.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lorebooks/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        setLorebooks((prev) => prev.filter((lb) => lb.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--foreground)]">로어북</h1>
        <Button size="sm" onClick={handleCreate} loading={creating}>
          + 새 로어북
        </Button>
      </div>

      {lorebooks.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] px-6 py-16 text-center">
          <p className="text-sm text-[var(--muted)]">아직 만든 로어북이 없어요.</p>
          <p className="mt-1 text-sm text-[var(--muted)]">세계관 설정을 로어북으로 정리해 보세요.</p>
          <Button size="sm" className="mt-4" onClick={handleCreate} loading={creating}>
            + 새 로어북 만들기
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {lorebooks.map((lb) => (
            <li key={lb.id}>
              <LorebookCard
                lorebook={lb}
                onDelete={handleDelete}
                deleting={deletingId === lb.id}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
