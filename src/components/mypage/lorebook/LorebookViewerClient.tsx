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

export default function LorebookViewerClient({ lorebook, sections }: Props) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(lorebook.is_public);
  const [savingPublic, setSavingPublic] = useState(false);

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
          <h1 className="text-3xl font-bold text-[var(--foreground)]">{lorebook.title}</h1>
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
          <button
            type="button"
            onClick={() => router.push('/mypage/note')}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] underline underline-offset-2"
          >
            작가 노트에서 편집
          </button>
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
