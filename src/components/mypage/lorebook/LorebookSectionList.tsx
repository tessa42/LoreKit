'use client';

import { useState } from 'react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '@/components/ui/Button';
import type { LorebookSection } from '@/types/lorebook';
import { NOTE_BLOCK_TYPE_LABELS } from '@/types/note';
import type { NoteBlock, NoteBlockContent, TextContent, WorldOverviewContent, SettingContent, CharacterContent, TimelineContent, PlotContent } from '@/types/note';

type BlockLike = { type: NoteBlock['type']; content: NoteBlock['content'] };

// 노트 블록 → 섹션 title/content 변환
function blockToSection(block: BlockLike): { title: string; content: string } {
  const c = block.content as NoteBlockContent;
  switch (block.type) {
    case 'text':
      return { title: '텍스트', content: (c as TextContent).body };
    case 'world_overview': {
      const wc = c as WorldOverviewContent;
      return { title: wc.title || '세계관 개요', content: wc.body };
    }
    case 'setting': {
      const sc = c as SettingContent;
      return { title: sc.title || '설정 항목', content: sc.body };
    }
    case 'character': {
      const ch = c as CharacterContent;
      const parts: string[] = [];
      if (ch.role) parts.push(`역할: ${ch.role}`);
      if (ch.description) parts.push(ch.description);
      if (ch.traits.length) parts.push(`특성: ${ch.traits.join(', ')}`);
      return { title: ch.name || '인물 카드', content: parts.join('\n\n') };
    }
    case 'timeline': {
      const tl = c as TimelineContent;
      return {
        title: '타임라인',
        content: tl.events.map((e) => `${e.date}: ${e.description}`).join('\n'),
      };
    }
    case 'plot': {
      const pl = c as PlotContent;
      return {
        title: '플롯',
        content: pl.cards.map((card) => card.content).join('\n\n'),
      };
    }
  }
}

// 섹션 미리보기 텍스트
function blockPreview(block: BlockLike): string {
  const { content } = blockToSection(block);
  return content.slice(0, 60) + (content.length > 60 ? '…' : '');
}

// 개별 섹션 에디터 (sortable)
interface SectionItemProps {
  section: LorebookSection;
  lorebookId: string;
  onUpdate: (id: string, updates: Partial<LorebookSection>) => void;
  onDelete: (id: string) => void;
}

function SectionItem({ section, lorebookId, onUpdate, onDelete }: SectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const [title, setTitle] = useState(section.title);
  const [content, setContent] = useState(section.content);

  async function saveField(field: 'title' | 'content', value: string) {
    if (value === (field === 'title' ? section.title : section.content)) return;
    await fetch(`/api/lorebooks/${lorebookId}/sections/${section.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    onUpdate(section.id, { [field]: value });
  }

  async function togglePublic() {
    const next = !section.is_public;
    await fetch(`/api/lorebooks/${lorebookId}/sections/${section.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: next }),
    });
    onUpdate(section.id, { is_public: next });
  }

  async function toggleUsable() {
    const next = !section.is_usable;
    await fetch(`/api/lorebooks/${lorebookId}/sections/${section.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_usable: next }),
    });
    onUpdate(section.id, { is_usable: next });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      {/* 헤더 */}
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-[var(--muted)] hover:text-[var(--foreground)] active:cursor-grabbing"
          aria-label="드래그하여 순서 변경"
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
            <circle cx="4" cy="3" r="1.5" fill="currentColor" />
            <circle cx="8" cy="3" r="1.5" fill="currentColor" />
            <circle cx="4" cy="8" r="1.5" fill="currentColor" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            <circle cx="4" cy="13" r="1.5" fill="currentColor" />
            <circle cx="8" cy="13" r="1.5" fill="currentColor" />
          </svg>
        </button>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => saveField('title', title.trim() || '새 섹션')}
          className="flex-1 bg-transparent text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
          placeholder="섹션 제목"
        />

        {/* 공개 토글 */}
        <button
          type="button"
          onClick={togglePublic}
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
            section.is_public
              ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
              : 'bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--surface-3)]'
          }`}
        >
          {section.is_public ? '공개' : '비공개'}
        </button>

        {/* AI 사용 토글 */}
        <button
          type="button"
          onClick={toggleUsable}
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
            section.is_usable
              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
              : 'bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--surface-3)]'
          }`}
          title="AI 컨텍스트 포함 여부"
        >
          {section.is_usable ? 'AI ✓' : 'AI ✗'}
        </button>

        <button
          type="button"
          onClick={() => onDelete(section.id)}
          className="shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-red-400"
        >
          삭제
        </button>
      </div>

      {/* 내용 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={() => saveField('content', content)}
        rows={4}
        className="w-full resize-y bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
        placeholder="섹션 내용을 입력하세요..."
      />
    </div>
  );
}

// 노트 블록 import 모달
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

function ImportModal({ noteBlocks, onSelect, onClose, importingId }: ImportModalProps) {
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

// 메인 컴포넌트
interface Props {
  lorebookId: string;
  initialSections: LorebookSection[];
  noteBlocks: NoteBlockForImport[];
}

export default function LorebookSectionList({ lorebookId, initialSections, noteBlocks }: Props) {
  const [sections, setSections] = useState<LorebookSection[]>(initialSections);
  const [addingSection, setAddingSection] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order_index: i,
    }));

    setSections(reordered);

    const oldIndexMap = new Map(sections.map((s) => [s.id, s.order_index]));
    await Promise.all(
      reordered
        .filter((s) => s.order_index !== oldIndexMap.get(s.id))
        .map((s) =>
          fetch(`/api/lorebooks/${lorebookId}/sections/${s.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: s.order_index }),
          }),
        ),
    );
  }

  async function handleAddSection() {
    setAddingSection(true);
    try {
      const res = await fetch(`/api/lorebooks/${lorebookId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '새 섹션', content: '' }),
      });
      const json = await res.json();
      if (json.ok) {
        setSections((prev) => [...prev, json.section as LorebookSection]);
      }
    } finally {
      setAddingSection(false);
    }
  }

  async function handleImportBlock(block: NoteBlockForImport) {
    setImportingId(block.id);
    try {
      const { title, content } = blockToSection(block);
      const res = await fetch(`/api/lorebooks/${lorebookId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, note_block_id: block.id }),
      });
      const json = await res.json();
      if (json.ok) {
        setSections((prev) => [...prev, json.section as LorebookSection]);
        setShowImportModal(false);
      }
    } finally {
      setImportingId(null);
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm('섹션을 삭제할까요?')) return;
    setDeletingId(sectionId);
    try {
      const res = await fetch(`/api/lorebooks/${lorebookId}/sections/${sectionId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.ok) {
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleUpdateSection(id: string, updates: Partial<LorebookSection>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }

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
