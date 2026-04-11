'use client';

import Button from '@/components/ui/Button';
import AddBlockMenu from './AddBlockMenu';
import type { NoteBlockType } from '@/types/note';

interface Props {
  addingBlock: boolean;
  showBlockMenu: boolean;
  hasArchiveItems: boolean;
  blocksEmpty: boolean;
  onToggleMenu: () => void;
  onAddBlock: (type: NoteBlockType) => void;
  onOpenArchiveModal: () => void;
  onOpenPublishModal: () => void;
}

export default function NoteEditorActionBar({
  addingBlock,
  showBlockMenu,
  hasArchiveItems,
  blocksEmpty,
  onToggleMenu,
  onAddBlock,
  onOpenArchiveModal,
  onOpenPublishModal,
}: Props) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <AddBlockMenu
        addingBlock={addingBlock}
        showMenu={showBlockMenu}
        onToggleMenu={onToggleMenu}
        onAddBlock={onAddBlock}
      />

      {hasArchiveItems && (
        <Button size="sm" variant="ghost" onClick={onOpenArchiveModal}>
          아카이브에서 불러오기
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        disabled={blocksEmpty}
        onClick={onOpenPublishModal}
        className="ml-auto"
      >
        로어북으로 발행
      </Button>
    </div>
  );
}
