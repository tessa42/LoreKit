'use client';

import type { NoteBlock } from '@/types/note';
import { NOTE_BLOCK_TYPE_LABELS } from '@/types/note';
import { blockPreview } from './lorebookSectionUtils';

export interface NoteBlockForImport {
  id: string;
  note_id: string;
  note_title: string;
  type: NoteBlock['type'];
  content: NoteBlock['content'];
  order_index: number;
}

interface ImportModalProps {
  noteBlocks: NoteBlockForImport[];
  onSelect: (block: NoteBlockForImport) => void;
  onClose: () => void;
  importingId: string | null;
}

export default function ImportModal({ noteBlocks, onSelect, onClose, importingId }: ImportModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background)] p-6">
        <h2 className="mb-1 text-base font-semibold text-[var(--foreground)]">
          작가 노트에서 가져오기
        </h2>
        <p className="mb-4 text-xs text-[var(--muted)]">
          선택한 블록이 섹션으로 추가됩니다.
        </p>
        {noteBlocks.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">
            가져올 수 있는 블록이 없어요.
          </p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {noteBlocks.map((block) => {
              const preview = blockPreview(block);
              return (
                <li key={block.id}>
                  <button
                    type="button"
                    disabled={importingId === block.id}
                    onClick={() => onSelect(block)}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-2)] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--muted)]">
                        {NOTE_BLOCK_TYPE_LABELS[block.type]}
                      </span>
                      <span className="text-xs text-[var(--muted)]">{block.note_title}</span>
                    </div>
                    {preview && (
                      <p className="mt-1 truncate text-sm text-[var(--foreground)]">{preview}</p>
                    )}
                  </button>
                </li>
              );
            })}
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
