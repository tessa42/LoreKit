'use client';

import { useRouter } from 'next/navigation';
import type { LorebookWithSectionCount } from '@/types/lorebook';

interface Props {
  lorebook: LorebookWithSectionCount;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function LorebookCard({ lorebook, onDelete, deleting }: Props) {
  const router = useRouter();

  return (
    <div
      className="group flex cursor-pointer items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-2)]"
      onClick={() => router.push(`/mypage/lorebook/${lorebook.id}`)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-[var(--foreground)]">{lorebook.title}</p>
          <span
            className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              lorebook.is_public
                ? 'bg-blue-500/10 text-blue-400'
                : 'bg-[var(--surface-2)] text-[var(--muted)]'
            }`}
          >
            {lorebook.is_public ? '공개' : '비공개'}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          {formatDate(lorebook.updated_at)} · 섹션 {lorebook.section_count}개
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(lorebook.id);
        }}
        disabled={deleting}
        className="shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--muted)] opacity-0 transition-opacity hover:bg-[var(--surface-3)] hover:text-red-400 group-hover:opacity-100 disabled:opacity-40"
      >
        {deleting ? '삭제 중...' : '삭제'}
      </button>
    </div>
  );
}
