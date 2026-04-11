'use client';

import type { NoteBlock } from '@/types/note';
import type { Lorebook } from '@/types/lorebook';

interface Props {
  blocks: NoteBlock[];
  lorebooks: Lorebook[];
  loadingLorebooks: boolean;
  publishingId: string | null;
  onClose: () => void;
  onPublish: (lorebookId: string) => void;
  onNavigateToNewLorebook: () => void;
}

export default function PublishLorebookModal({
  blocks,
  lorebooks,
  loadingLorebooks,
  publishingId,
  onClose,
  onPublish,
  onNavigateToNewLorebook,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background)] p-6">
        <h2 className="mb-1 text-base font-semibold text-[var(--foreground)]">
          로어북으로 발행
        </h2>
        <p className="mb-4 text-xs text-[var(--muted)]">
          현재 노트의 블록 {blocks.length}개가 선택한 로어북의 섹션으로 추가됩니다.
        </p>
        {loadingLorebooks ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">불러오는 중...</p>
        ) : lorebooks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--muted)]">로어북이 없어요.</p>
            <button
              type="button"
              onClick={onNavigateToNewLorebook}
              className="mt-2 text-xs text-[var(--accent)] hover:underline"
            >
              새 로어북 만들기 →
            </button>
          </div>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {lorebooks.map((lb) => (
              <li key={lb.id}>
                <button
                  type="button"
                  disabled={publishingId === lb.id}
                  onClick={() => onPublish(lb.id)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-2)] disabled:opacity-50"
                >
                  <p className="text-sm font-medium text-[var(--foreground)]">{lb.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {lb.is_public ? '공개' : '비공개'}
                    {publishingId === lb.id && ' · 발행 중...'}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-[var(--radius-md)] border border-[var(--border)] py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          취소
        </button>
      </div>
    </div>
  );
}
