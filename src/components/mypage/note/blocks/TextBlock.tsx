'use client';

import { useState } from 'react';
import LorcraftMarkdown from '@/components/lorecraft/LorcraftMarkdown';
import type { TextContent } from '@/types/note';

interface Props {
  content: TextContent;
  onSave: (content: TextContent) => void;
}

export default function TextBlock({ content, onSave }: Props) {
  const [body, setBody] = useState(content.body);
  const [isEditing, setIsEditing] = useState(false);

  function handleBlur() {
    onSave({ body });
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="min-h-[80px] cursor-text rounded-[var(--radius-md)] border border-transparent px-3 py-2.5 hover:border-[var(--border)] hover:bg-[var(--surface)]"
      >
        {body ? (
          <LorcraftMarkdown text={body} />
        ) : (
          <p className="text-sm text-[var(--muted)]">내용을 입력하세요...</p>
        )}
      </div>
    );
  }

  return (
    <textarea
      autoFocus
      className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      rows={5}
      placeholder="내용을 입력하세요..."
      value={body}
      onChange={(e) => setBody(e.target.value)}
      onBlur={handleBlur}
    />
  );
}
