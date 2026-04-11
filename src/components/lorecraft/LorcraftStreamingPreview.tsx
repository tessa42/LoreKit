'use client';

import LorcraftMarkdown from '@/components/lorecraft/LorcraftMarkdown';
import { STEP_LABELS } from './lorcraftFormConstants';

interface LorcraftStreamingPreviewProps {
  progressMessage: string;
  streamedText: string;
}

export default function LorcraftStreamingPreview({
  progressMessage,
  streamedText,
}: LorcraftStreamingPreviewProps) {
  return (
    <div className="space-y-4">
      {/* 진행 단계 */}
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <span
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
          aria-hidden="true"
        />
        <span className="text-sm text-[var(--muted)]">
          {STEP_LABELS[progressMessage] ?? progressMessage}
        </span>
      </div>

      {/* 생성 중 텍스트 프리뷰 */}
      {streamedText && (
        <div className="max-h-[60vh] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] px-5 py-4">
          <LorcraftMarkdown text={streamedText} />
        </div>
      )}
    </div>
  );
}
