'use client';

import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { TYPE_LABEL, TYPE_BADGE_VARIANT, formatDate } from './archiveCardUtils';
import type { ArchiveItem } from '@/types/mypage';

interface ArchiveCardHeaderProps {
  item: ArchiveItem;
  onDelete: (id: string) => void;
}

export default function ArchiveCardHeader({ item, onDelete }: ArchiveCardHeaderProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('이 항목을 삭제할까요?')) return;
    setDeleting(true);
    onDelete(item.id);
  }

  return (
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
  );
}
