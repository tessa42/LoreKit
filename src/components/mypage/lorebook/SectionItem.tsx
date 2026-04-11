'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LorebookSection } from '@/types/lorebook';

export interface SectionItemProps {
  section: LorebookSection;
  lorebookId: string;
  onUpdate: (id: string, updates: Partial<LorebookSection>) => void;
  onDelete: (id: string) => void;
}

export default function SectionItem({ section, lorebookId, onUpdate, onDelete }: SectionItemProps) {
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
