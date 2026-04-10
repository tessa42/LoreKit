'use client';

import { useState } from 'react';
import LorcraftMarkdown from '@/components/lorecraft/LorcraftMarkdown';
import type { WorldOverviewContent } from '@/types/note';

interface Props {
  content: WorldOverviewContent;
  onSave: (content: WorldOverviewContent) => void;
}

export default function WorldOverviewBlock({ content, onSave }: Props) {
  const [title, setTitle] = useState(content.title);
  const [body, setBody] = useState(content.body);
  const [isBodyEditing, setIsBodyEditing] = useState(false);

  const save = () => onSave({ title, body });

  function handleBodyBlur() {
    onSave({ title, body });
    setIsBodyEditing(false);
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={save}
      />
      {isBodyEditing ? (
        <textarea
          autoFocus
          className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          rows={6}
          placeholder="세계관 개요를 작성하세요..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={handleBodyBlur}
        />
      ) : (
        <div
          onClick={() => setIsBodyEditing(true)}
          className="min-h-[80px] cursor-text rounded-[var(--radius-md)] border border-transparent px-3 py-2.5 hover:border-[var(--border)] hover:bg-[var(--surface)]"
        >
          {body ? (
            <LorcraftMarkdown text={body} />
          ) : (
            <p className="text-sm text-[var(--muted)]">세계관 개요를 작성하세요...</p>
          )}
        </div>
      )}
    </div>
  );
}
