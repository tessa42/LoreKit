'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import LorcraftMarkdown from '@/components/lorecraft/LorcraftMarkdown';
import type { Lorebook, LorebookSection } from '@/types/lorebook';

interface Props {
  lorebook: Lorebook;
  sections: LorebookSection[];
}

export default function LorebookViewerClient({ lorebook, sections: initialSections }: Props) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(lorebook.is_public);
  const [savingPublic, setSavingPublic] = useState(false);
  const [title, setTitle] = useState(lorebook.title);
  const [sections, setSections] = useState(initialSections);
  const [publishing, setPublishing] = useState(false);

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

  async function handleTitleBlur() {
    const trimmed = title.trim() || '제목 없음';
    if (trimmed === lorebook.title) return;
    await fetch(`/api/lorebooks/${lorebook.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    });
    setTitle(trimmed);
  }

  async function handlePublish() {
    if (!lorebook.source_note_id) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/lorebooks/${lorebook.id}/publish`, { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        // 발행된 섹션 다시 조회
        const secRes = await fetch(`/api/lorebooks/${lorebook.id}/sections`);
        const secJson = await secRes.json();
        if (secJson.ok) setSections(secJson.sections);
      }
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* 헤더 */}
      <div className="mb-8 flex items-start justify-between gap-3">
        <div className="flex-1">
          <button
            type="button"
            onClick={() => router.push('/mypage/lorebook')}
            className="mb-3 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            ← 로어북 목록
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full bg-transparent text-3xl font-bold text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
            placeholder="제목 없음"
          />
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 mt-7">
          <Button
            size="sm"
            variant={isPublic ? 'primary' : 'secondary'}
            loading={savingPublic}
            onClick={handleTogglePublic}
          >
            {isPublic ? '공개 중' : '비공개'}
          </Button>
          {lorebook.source_note_id && (
            <button
              type="button"
              onClick={() => router.push(`/mypage/note/${lorebook.source_note_id}`)}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] underline underline-offset-2"
            >
              수정
            </button>
          )}
          {lorebook.source_note_id && (
            <Button size="sm" variant="ghost" loading={publishing} onClick={handlePublish}>
              발행
            </Button>
          )}
        </div>
      </div>

      {/* 섹션 목록 */}
      <div>
        {sections.map((section, index) => (
          <div key={section.id}>
            <div className="py-8">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{section.title}</h2>
                {!section.is_public && (
                  <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-[var(--muted)]/20 text-[var(--muted)]">
                    비공개
                  </span>
                )}
              </div>
              <LorcraftMarkdown text={section.content} />
            </div>
            {index < sections.length - 1 && (
              <div className="border-b border-[var(--border)]" />
            )}
          </div>
        ))}
        {sections.length === 0 && (
          <p className="py-8 text-sm text-[var(--muted)]">섹션이 없습니다. 작가 노트에서 편집해 주세요.</p>
        )}
      </div>
    </div>
  );
}
