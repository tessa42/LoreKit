'use client';

import { useState } from 'react';
import type { SettingContent } from '@/types/note';

interface Props {
  content: SettingContent;
  onSave: (content: SettingContent) => void;
}

export default function SettingBlock({ content, onSave }: Props) {
  const [title, setTitle] = useState(content.title);
  const [body, setBody] = useState(content.body);

  const save = () => onSave({ title, body });

  return (
    <div className="space-y-2">
      <input
        type="text"
        className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        placeholder="설정 항목 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={save}
      />
      <textarea
        className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        rows={5}
        placeholder="설정 내용을 작성하세요..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onBlur={save}
      />
    </div>
  );
}
