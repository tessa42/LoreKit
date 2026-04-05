'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import LoginPromptModal from '@/components/common/LoginPromptModal';
import type { SimulatorResult } from '@/types/simulator';

type StoredResult = SimulatorResult & { name: string };
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function SimulatorResultPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [result, setResult] = useState<StoredResult | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  useEffect(() => {
    const raw = sessionStorage.getItem('simulator:result');
    if (!raw) {
      router.replace('/simulator');
      return;
    }
    try {
      setResult(JSON.parse(raw));
    } catch {
      router.replace('/simulator');
    }
  }, [router]);

  const handleSave = useCallback(async () => {
    if (!result) return;

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setSaveState('saving');
    try {
      const supabase = createClient();
      const { error } = await supabase.from('archive_items').insert({
        user_id: user.id,
        type: 'simulator',
        title: `${result.name} — 캐릭터 카드`,
        payload: result,
      });

      if (error) throw error;

      setSaveState('saved');
      sessionStorage.removeItem('simulator:result');
    } catch (err) {
      console.error('[simulator] save failed:', err);
      setSaveState('error');
    }
  }, [result, user]);

  if (!result) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* 헤더 */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
              Character Card
            </p>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {result.name}
            </h1>
          </div>

          <SaveButton
            state={saveState}
            authLoading={authLoading}
            onClick={handleSave}
          />
        </div>

        {/* 한 줄 설정 요약 */}
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-5 py-3">
          <p className="text-sm font-medium text-[var(--foreground)]">{result.summary}</p>
        </div>

        {/* 스토리텔링 */}
        <Section label="서사">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
            {result.story}
          </p>
        </Section>

        {/* 시그니처 대사 */}
        <Section label="시그니처 대사">
          <blockquote className="rounded-lg border-l-2 border-[var(--accent)] bg-[var(--accent)]/5 px-5 py-4">
            <p className="text-sm italic leading-relaxed text-[var(--foreground)]">
              &ldquo;{result.quote}&rdquo;
            </p>
          </blockquote>
        </Section>

        {/* 저장 에러 */}
        {saveState === 'error' && (
          <div className="mt-4 rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            저장에 실패했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        )}

        {/* TODO: SNS 공유 버튼 (트위터, 인스타그램 등) */}

        {/* 하단 액션 */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/simulator"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
          >
            다시 생성
          </Link>
          {saveState === 'saved' && (
            <Link
              href="/mypage/archive"
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              내 서재에서 보기
            </Link>
          )}
        </div>
      </div>

      {showLoginModal && (
        <LoginPromptModal
          onClose={() => setShowLoginModal(false)}
          next="/simulator/result"
        />
      )}
    </>
  );
}

/* ── 헬퍼 컴포넌트 ── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        {label}
      </h2>
      {children}
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
      <div className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-emerald-400">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
        </svg>
        저장됨
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={state === 'saving' || authLoading}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {state === 'saving' ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--foreground)]" />
          저장 중…
        </>
      ) : (
        <>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2h7.5L13 4.5V13H2V2z" />
            <path d="M5 2v3.5h5V2" />
            <path d="M4 8.5h7" />
            <path d="M4 11h5" />
          </svg>
          아카이브에 저장
        </>
      )}
    </button>
  );
}
