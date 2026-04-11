'use client';

import type { RefObject } from 'react';

interface Props {
  title: string;
  titleRef: RefObject<HTMLInputElement>;
  onTitleChange: (value: string) => void;
  onTitleBlur: () => void;
  onBack: () => void;
}

export default function NoteEditorHeader({
  title,
  titleRef,
  onTitleChange,
  onTitleBlur,
  onBack,
}: Props) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div className="flex-1">
        <button
          type="button"
          onClick={onBack}
          className="mb-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← 노트 목록
        </button>
        <input
          ref={titleRef}
          type="text"
          className="w-full bg-transparent text-2xl font-bold text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
          placeholder="제목 없음"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
        />
      </div>
    </div>
  );
}
