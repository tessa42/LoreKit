'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LorcraftMarkdown from '@/components/lorecraft/LorcraftMarkdown';
import type { ArchiveItem, SimulatorPayload, LoreCraftPayload, LoreCheckPayload, LoreCraftSection } from '@/types/mypage';
import type { LorcheckIssue, IssueType, IssueSeverity } from '@/types/lorecheck';

interface ArchiveCardProps {
  item: ArchiveItem;
  onDelete: (id: string) => void;
}

const TYPE_LABEL: Record<ArchiveItem['type'], string> = {
  simulator: 'Simulator',
  lorecraft: 'Lorecraft',
  lorecheck_quick: 'Lorecheck',
  lorecheck_deep: 'Lorecheck Deep',
};

const TYPE_BADGE_VARIANT: Record<ArchiveItem['type'], 'accent' | 'default' | 'success'> = {
  simulator: 'accent',
  lorecraft: 'success',
  lorecheck_quick: 'default',
  lorecheck_deep: 'default',
};

export default function ArchiveCard({ item, onDelete }: ArchiveCardProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('이 항목을 삭제할까요?')) return;
    setDeleting(true);
    onDelete(item.id);
  }

  return (
    <Card className="p-5">
      {/* 헤더 */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={TYPE_BADGE_VARIANT[item.type]}>
            {TYPE_LABEL[item.type]}
          </Badge>
          <time className="text-xs text-[var(--muted)]" dateTime={item.created_at}>
            {formatDate(item.created_at)}
          </time>
        </div>
        <Button
          variant="ghost"
          size="sm"
          loading={deleting}
          onClick={handleDelete}
          className="shrink-0 text-[var(--muted)] hover:text-[var(--error)] px-2"
          aria-label="삭제"
        >
          {!deleting && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 3h12M4.5 3V2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v1M5.5 6v5M8.5 6v5M2.5 3l.7 8.5a.5.5 0 0 0 .5.5h6.6a.5.5 0 0 0 .5-.5L11.5 3" />
            </svg>
          )}
        </Button>
      </div>

      {/* 본문 — type별 분기 */}
      {item.type === 'simulator' && (
        <SimulatorContent payload={item.payload as SimulatorPayload} title={item.title} />
      )}
      {item.type === 'lorecraft' && (
        <LoreCraftContent payload={item.payload as LoreCraftPayload} title={item.title} />
      )}
      {(item.type === 'lorecheck_quick' || item.type === 'lorecheck_deep') && (
        <LoreCheckContent payload={item.payload as LoreCheckPayload} title={item.title} />
      )}
    </Card>
  );
}

/* ── type별 컨텐츠 컴포넌트 ── */

function SimulatorContent({ payload, title }: { payload: SimulatorPayload; title: string }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>

      {payload.summary && (
        <p className="text-sm text-[var(--muted)]">{payload.summary}</p>
      )}

      {payload.story && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">서사</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
            {payload.story}
          </p>
        </div>
      )}

      {payload.quote && (
        <blockquote className="rounded-[var(--radius-md)] border-l-2 border-[var(--accent)] bg-[var(--accent-subtle)] px-4 py-3">
          <p className="text-sm italic leading-relaxed text-[var(--foreground)]">
            &ldquo;{payload.quote}&rdquo;
          </p>
        </blockquote>
      )}
    </div>
  );
}

function LoreCraftContent({ payload, title }: { payload: LoreCraftPayload; title: string }) {
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

const ISSUE_TYPE_LABEL: Record<IssueType, string> = {
  immersion_break: '몰입 저해',
  intentional: '의도적 설정',
  insider_context: '독자 맥락',
};

const ISSUE_SEVERITY_LABEL: Record<IssueSeverity, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

const ISSUE_BORDER_CLASS: Record<IssueType, string> = {
  immersion_break: 'border-l-2 border-red-400',
  intentional: 'border-l-2 border-green-400',
  insider_context: 'border-l-2 border-yellow-400',
};

const ISSUE_TYPE_BADGE_CLASS: Record<IssueType, string> = {
  immersion_break: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  intentional: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  insider_context: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const ISSUE_SEVERITY_BADGE_CLASS: Record<IssueSeverity, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function LoreCheckContent({ payload, title }: { payload: LoreCheckPayload; title: string }) {
  const issues: LorcheckIssue[] = payload.issues ?? [];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>

      {issues.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">문제가 발견되지 않았습니다</p>
      ) : (
        <div className="space-y-2">
          {issues.map((issue, i) => (
            <div
              key={i}
              className={`rounded-r-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3 space-y-1 ${ISSUE_BORDER_CLASS[issue.type]}`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ISSUE_TYPE_BADGE_CLASS[issue.type]}`}>
                  {ISSUE_TYPE_LABEL[issue.type]}
                </span>
                {issue.type !== 'intentional' && issue.severity && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ISSUE_SEVERITY_BADGE_CLASS[issue.severity]}`}>
                    {ISSUE_SEVERITY_LABEL[issue.severity]}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--foreground)]">{issue.description}</p>
              <p className="text-xs text-[var(--muted)]">{issue.suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 유틸 ── */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
