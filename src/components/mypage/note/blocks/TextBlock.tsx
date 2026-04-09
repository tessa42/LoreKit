'use client';

import { useState } from 'react';
import type { TextContent } from '@/types/note';

interface Props {
  content: TextContent;
  onSave: (content: TextContent) => void;
}

export default function TextBlock({ content, onSave }: Props) {
  const [body, setBody] = useState(content.body);

  return (
    <textarea
      className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      rows={5}
      placeholder="내용을 입력하세요..."
      value={body}
      onChange={(e) => setBody(e.target.value)}
      onBlur={() => onSave({ body })}
    />
  );
}
