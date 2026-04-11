'use client';

import { useState } from 'react';
import LorcraftMarkdown from '@/components/lorecraft/LorcraftMarkdown';
import type { LoreCraftPayload, LoreCraftSection } from '@/types/mypage';

interface LoreCraftContentProps {
  payload: LoreCraftPayload;
  title: string;
}

function SectionBlock({ section }: { section: LoreCraftSection }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {section.title}
      </p>
      <LorcraftMarkdown text={section.content} />
    </div>
  );
}

export default function LoreCraftContent({ payload, title }: LoreCraftContentProps) {
  const [expanded, setExpanded] = useState(false);

  const firstSection: LoreCraftSection | undefined = payload.sections?.[0];
  const restSections: LoreCraftSection[] = payload.sections?.slice(1) ?? [];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>

      {/* 메타 정보 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
        {payload.meta?.background && (
          <span>배경: <span className="text-[var(--foreground)]">{payload.meta.background}</span></span>
        )}
        {payload.meta?.genre && (
          <span>장르: <span className="text-[var(--foreground)]">{payload.meta.genre}</span></span>
        )}
      </div>

      {/* areas 태그 */}
      {payload.meta?.areas?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {payload.meta.areas.map((area) => (
            <span
              key={area}
              className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs text-[var(--muted)]"
            >
              {area}
            </span>
          ))}
        </div>
      )}

      {/* 첫 번째 섹션 */}
      {firstSection && (
        <SectionBlock section={firstSection} />
      )}

      {/* 나머지 섹션 (토글) */}
      {restSections.length > 0 && (
        <>
          {expanded && restSections.map((section, i) => (
            <SectionBlock key={i} section={section} />
          ))}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-[var(--accent)] hover:underline"
          >
            {expanded ? '접기' : `더 보기 (${restSections.length}개 섹션)`}
          </button>
        </>
      )}
    </div>
  );
}
