'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import LorebookSectionList from './LorebookSectionList';
import type { Lorebook, LorebookSection } from '@/types/lorebook';
import type { NoteBlockForImport } from './LorebookSectionList';

interface Props {
  lorebook: Lorebook;
  initialSections: LorebookSection[];
  noteBlocks: NoteBlockForImport[];
}

export default function LorebookEditorClient({ lorebook, initialSections, noteBlocks }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(lorebook.title);
  const [isPublic, setIsPublic] = useState(lorebook.is_public);
  const [savingPublic, setSavingPublic] = useState(false);

  async function handleTitleBlur() {
    const trimmed = title.trim() || '제목 없음';
    if (trimmed === lorebook.title) return;
    await fetch(`/api/lorebooks/${lorebook.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    });
  }

  async function handleTogglePublic() {
    setSavingPublic(true);
    try {
      const next = !isPublic;
      const res = await fetch(`/api/lorebooks/${lorebook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: next }),
      });
      const json = await res.json();
      if (json.ok) setIsPublic(next);
    } finally {
      setSavingPublic(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* 헤더 */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex-1">
          <button
            type="button"
            onClick={() => router.push('/mypage/lorebook')}
            className="mb-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            ← 로어북 목록
          </button>
          <input
            type="text"
            className="w-full bg-transparent text-2xl font-bold text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
            placeholder="제목 없음"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
          />
        </div>

        {/* 전체 공개/비공개 토글 */}
        <Button
          size="sm"
          variant={isPublic ? 'primary' : 'secondary'}
          loading={savingPublic}
          onClick={handleTogglePublic}
          className="shrink-0 mt-6"
        >
          {isPublic ? '공개 중' : '비공개'}
        </Button>
      </div>

      {/* 섹션 목록 */}
      <LorebookSectionList
        lorebookId={lorebook.id}
        initialSections={initialSections}
        noteBlocks={noteBlocks}
      />
    </div>
  );
}
