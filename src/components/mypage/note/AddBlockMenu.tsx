'use client';

import Button from '@/components/ui/Button';
import type { NoteBlockType } from '@/types/note';
import { NOTE_BLOCK_TYPE_LABELS } from '@/types/note';

const BLOCK_TYPES: NoteBlockType[] = [
  'text', 'world_overview', 'setting', 'character', 'timeline', 'plot',
];

interface Props {
  addingBlock: boolean;
  showMenu: boolean;
  onToggleMenu: () => void;
  onAddBlock: (type: NoteBlockType) => void;
}

export default function AddBlockMenu({ addingBlock, showMenu, onToggleMenu, onAddBlock }: Props) {
  return (
    <div className="relative">
      <Button
        size="sm"
        variant="secondary"
        onClick={onToggleMenu}
        loading={addingBlock}
      >
        + 블록 추가
      </Button>
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={onToggleMenu}
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-lg">
            {BLOCK_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onAddBlock(type)}
                className="w-full px-4 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--surface-2)]"
              >
                {NOTE_BLOCK_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
