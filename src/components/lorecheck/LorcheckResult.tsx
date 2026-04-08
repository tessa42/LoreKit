'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import Badge from '@/components/ui/Badge';
import Button, { buttonVariants } from '@/components/ui/Button';
import LoginPromptModal from '@/components/common/LoginPromptModal';
import type {
  LorcheckQuickPayload,
  LorcheckIssue,
  IssueType,
  IssueSeverity,
} from '@/types/lorecheck';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/* ── 타입별 레이블 ── */
const TYPE_LABELS: Record<IssueType, string> = {
  immersion_break: '몰입 저해',
  intentional: '이 설정의 강점',
  insider_context: '독자 맥락',
};

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

/* ── 타입별 스타일 ── */
function getTypeBadgeVariant(type: IssueType) {
  if (type === 'immersion_break') return 'error' as const;
  if (type === 'intentional') return 'success' as const;
  return 'warning' as const;
}

function getSeverityBadgeVariant(severity: IssueSeverity) {
  if (severity === 'high') return 'error' as const;
  if (severity === 'medium') return 'warning' as const;
  return 'default' as const;
}

function getCardStyle(type: IssueType): string {
  if (type === 'immersion_break') {
    return 'border-[var(--error-border)] bg-[var(--error-subtle)]';
  }
  if (type === 'intentional') {
    return 'border-[var(--success)]/30 bg-[var(--success-subtle)]';
  }
  return 'border-[var(--warning)]/30 bg-[var(--warning)]/5';
}

function IssueCard({ issue }: { issue: LorcheckIssue }) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border px-5 py-4 space-y-3 ${getCardStyle(issue.type)}`}
    >
      {/* 뱃지 행 */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={getTypeBadgeVariant(issue.type)}>
          {TYPE_LABELS[issue.type]}
        </Badge>
        {issue.type !== 'intentional' && issue.severity && (
          <Badge variant={getSeverityBadgeVariant(issue.severity)}>
            {SEVERITY_LABELS[issue.severity]}
          </Badge>
        )}
      </div>

      {/* 설명 */}
      <p className="text-sm leading-relaxed text-[var(--foreground)]">
        {issue.description}
      </p>

      {/* 제안 */}
      {issue.suggestion && (
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          {issue.type === 'intentional' ? '💡 ' : '→ '}
          {issue.suggestion}
        </p>
      )}
    </div>
  );
}

function SaveButton({
  state,
  authLoading,
  onClick,
}: {
  state: SaveState;
  authLoading: boolean;
  onClick: () => void;
}) {
  if (state === 'saved') {
    return (
      <div className="flex items-center gap-1.5 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-[var(--success)]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
        </svg>
        저장됨
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      size="md"
      loading={state === 'saving'}
      disabled={authLoading}
      onClick={onClick}
    >
      {state !== 'saving' && (
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 2h7.5L13 4.5V13H2V2z" />
          <path d="M5 2v3.5h5V2" />
          <path d="M4 8.5h7" />
          <path d="M4 11h5" />
        </svg>
      )}
      {state === 'saving' ? '저장 중…' : '아카이브에 저장'}
    </Button>
  );
}

export default function LorcheckResult({ payload }: { payload: LorcheckQuickPayload }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const hasIssues = payload.issues.length > 0;

  const handleSave = useCallback(async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setSaveState('saving');
    try {
      const supabase = createClient();
      const genre = payload.genre || '장르 미지정';
      const title = `${genre} — Lorecheck Quick`;
      const { error } = await supabase.from('archive_items').insert({
        user_id: user.id,
        type: 'lorecheck_quick',
        title,
        payload,
      });

      if (error) throw error;

      setSaveState('saved');
      sessionStorage.removeItem('lorecheck:result');
    } catch (err) {
      console.error('[lorecheck] save failed:', err);
      setSaveState('error');
    }
  }, [payload, user]);

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* 헤더 */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
              Lorecheck Quick
            </p>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">고증 검토 결과</h1>
            {payload.genre && (
              <p className="mt-1 text-sm text-[var(--muted)]">{payload.genre}</p>
            )}
          </div>

          <SaveButton state={saveState} authLoading={authLoading} onClick={handleSave} />
        </div>

        {/* 결과 */}
        {!hasIssues ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--success)]/30 bg-[var(--success-subtle)] px-6 py-8 text-center">
            <p className="text-base font-medium text-[var(--success)]">
              문제가 발견되지 않았습니다
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              검토한 텍스트에서 고증 이슈를 찾지 못했습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payload.issues.map((issue, i) => (
              <IssueCard key={i} issue={issue} />
            ))}
          </div>
        )}

        {/* 저장 에러 */}
        {saveState === 'error' && (
          <div
            className="mt-8 rounded-[var(--radius-md)] border border-[var(--error-border)] bg-[var(--error-subtle)] px-4 py-3 text-sm text-[var(--error)]"
            role="alert"
          >
            저장에 실패했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        )}

        {/* 하단 액션 */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/lorecheck" className={buttonVariants({ variant: 'secondary', size: 'md' })}>
            다시 검토
          </Link>
          {saveState === 'saved' && (
            <Link
              href="/mypage/archive"
              className={buttonVariants({ variant: 'primary', size: 'md' })}
            >
              내 서재에서 보기
            </Link>
          )}
        </div>
      </div>

      {showLoginModal && (
        <LoginPromptModal
          onClose={() => setShowLoginModal(false)}
          next="/lorecheck/result"
        />
      )}
    </>
  );
}
