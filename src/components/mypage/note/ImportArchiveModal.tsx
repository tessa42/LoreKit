'use client';

import type { ArchiveItem } from './noteEditorUtils';

interface Props {
  lorearchiveItems: ArchiveItem[];
  importingId: string | null;
  onClose: () => void;
  onImport: (item: ArchiveItem) => void;
}

export default function ImportArchiveModal({ lorearchiveItems, importingId, onClose, onImport }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background)] p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
          아카이브에서 불러오기
        </h2>
        <p className="mb-4 text-xs text-[var(--muted)]">
          선택한 Lorecraft 결과의 섹션들이 세계관 개요 블록으로 추가됩니다.
        </p>
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {lorearchiveItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={importingId === item.id}
                onClick={() => onImport(item)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-2)] disabled:opacity-50"
              >
                <p className="text-sm font-medium text-[var(--foreground)]">{item.title}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  섹션 {item.payload.sections.length}개
                </p>
              </button>
            </li>
          ))}
        </ul>
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
