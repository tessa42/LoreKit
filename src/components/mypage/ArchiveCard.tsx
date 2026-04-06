'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { ArchiveItem, SimulatorPayload, LoreCraftPayload, LoreCheckPayload } from '@/types/mypage';

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
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
      {payload.content && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
          {payload.content}
        </p>
      )}
    </div>
  );
}

function LoreCheckContent({ payload, title }: { payload: LoreCheckPayload; title: string }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
      {typeof payload.score === 'number' && (
        <p className="text-sm text-[var(--muted)]">
          개연성 점수: <span className="font-medium text-[var(--foreground)]">{payload.score}점</span>
        </p>
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
