'use client';

import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Button from '@/components/ui/Button';
import type { LorebookSection } from '@/types/lorebook';
import SectionItem from './SectionItem';
import ImportModal from './ImportModal';
import type { NoteBlockForImport } from './ImportModal';
import { useLorebookSections } from './useLorebookSections';

// re-export for backward compatibility (LorebookEditorClient imports from here)
export type { NoteBlockForImport } from './ImportModal';

interface Props {
  lorebookId: string;
  initialSections: LorebookSection[];
  noteBlocks: NoteBlockForImport[];
}

export default function LorebookSectionList({ lorebookId, initialSections, noteBlocks }: Props) {
  const {
    sections,
    addingSection,
    deletingId,
    showImportModal,
    importingId,
    sensors,
    setShowImportModal,
    handleDragEnd,
    handleAddSection,
    handleImportBlock,
    handleDeleteSection,
    handleUpdateSection,
  } = useLorebookSections(lorebookId, initialSections);

  return (
    <div>
      {sections.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] px-6 py-12 text-center">
          <p className="text-sm text-[var(--muted)]">아직 섹션이 없어요.</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">섹션을 추가하거나 노트에서 가져와 보세요.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sections.map((section) => (
                <SectionItem
                  key={section.id}
                  section={section}
                  lorebookId={lorebookId}
                  onUpdate={handleUpdateSection}
                  onDelete={handleDeleteSection}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 액션 바 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={handleAddSection} loading={addingSection}>
          + 섹션 추가
        </Button>
        {noteBlocks.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setShowImportModal(true)}>
            작가 노트에서 가져오기
          </Button>
        )}
        {deletingId && (
          <span className="self-center text-xs text-[var(--muted)]">삭제 중...</span>
        )}
      </div>

      {showImportModal && (
        <ImportModal
          noteBlocks={noteBlocks}
          onSelect={handleImportBlock}
          onClose={() => setShowImportModal(false)}
          importingId={importingId}
        />
      )}
    </div>
  );
}
