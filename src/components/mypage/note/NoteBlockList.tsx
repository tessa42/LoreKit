'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { NoteBlock, NoteBlockContent } from '@/types/note';
import NoteBlockEditor from './NoteBlockEditor';

interface Props {
  noteId: string;
  blocks: NoteBlock[];
  onBlocksChange: (blocks: NoteBlock[]) => void;
  onDeleteBlock: (blockId: string) => void;
  onSaveBlock: (blockId: string, content: NoteBlockContent) => Promise<void>;
}

export default function NoteBlockList({
  noteId,
  blocks,
  onBlocksChange,
  onDeleteBlock,
  onSaveBlock,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({
      ...b,
      order_index: i,
    }));

    onBlocksChange(reordered);

    // 순서 변경된 블록들 저장 (병렬)
    await Promise.all(
      reordered
        .filter((b, i) => b.order_index !== blocks[i]?.order_index)
        .map((b) =>
          fetch(`/api/notes/${noteId}/blocks/${b.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: b.order_index }),
          }),
        ),
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] px-6 py-12 text-center">
        <p className="text-sm text-[var(--muted)]">아직 블록이 없어요.</p>
        <p className="mt-0.5 text-xs text-[var(--muted)]">아래 버튼으로 블록을 추가해 보세요.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {blocks.map((block) => (
            <NoteBlockEditor
              key={block.id}
              block={block}
              noteId={noteId}
              onDelete={onDeleteBlock}
              onSave={onSaveBlock}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
