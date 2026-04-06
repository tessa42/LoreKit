'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { formatLorecraft } from '@/lib/ai/pipeline/lorecraft/format';
import LoginPromptModal from '@/components/common/LoginPromptModal';
import LorcraftMarkdown from '@/components/lorecraft/LorcraftMarkdown';
import Button, { buttonVariants } from '@/components/ui/Button';
import type { LorcraftArea, LorcraftPayload, FormatSection } from '@/types/lorecraft';

interface StoredData {
  generatedText: string;
  background: string;
  genre: string;
  areas: LorcraftArea[];
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function LorcraftResultPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [payload, setPayload] = useState<LorcraftPayload | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  useEffect(() => {
    const raw = sessionStorage.getItem('lorecraft:result');
    if (!raw) {
      router.replace('/lorecraft');
      return;
    }
    try {
      const stored: StoredData = JSON.parse(raw);
      const formatted = formatLorecraft(stored.generatedText, {
        background: stored.background,
        genre: stored.genre,
        existingSetting: '',
        areas: stored.areas,
      });
      setPayload(formatted);
    } catch {
      router.replace('/lorecraft');
    }
  }, [router]);

  const handleSave = useCallback(async () => {
    if (!payload) return;

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setSaveState('saving');
    try {
      const supabase = createClient();
      const title = `${payload.genre} — 세계관 설정집`;
      const { error } = await supabase.from('archive_items').insert({
        user_id: user.id,
        type: 'lorecraft',
        title,
        payload,
      });

      if (error) throw error;

      setSaveState('saved');
      sessionStorage.removeItem('lorecraft:result');
    } catch (err) {
      console.error('[lorecraft] save failed:', err);
      setSaveState('error');
    }
  }, [payload, user]);

  if (!payload) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
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
              Lorecraft
            </p>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{payload.genre}</h1>
            <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">{payload.background}</p>
          </div>

          <SaveButton state={saveState} authLoading={authLoading} onClick={handleSave} />
        </div>

        {/* 섹션별 렌더링 */}
        <div className="space-y-12">
          {payload.sections.map((section, i) => (
            <ResultSection key={i} index={i} section={section} />
          ))}
        </div>

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
          <Link href="/lorecraft" className={buttonVariants({ variant: 'secondary', size: 'md' })}>
            다시 생성
          </Link>
          {saveState === 'saved' && (
            <Link href="/mypage/archive" className={buttonVariants({ variant: 'primary', size: 'md' })}>
              내 서재에서 보기
            </Link>
          )}
        </div>
      </div>

      {showLoginModal && (
        <LoginPromptModal
          onClose={() => setShowLoginModal(false)}
          next="/lorecraft/result"
        />
      )}
    </>
  );
}

/* ── 헬퍼 컴포넌트 ── */

function stripEmoji(str: string) {
  return str.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}]/gu, '').trim();
}

function ResultSection({ section, index }: { section: FormatSection; index: number }) {
  const title = stripEmoji(section.title);
  return (
    <div>
      <h2 className="mb-4 text-base font-bold text-[var(--foreground)]">
        {index + 1}. {title}
      </h2>
      <LorcraftMarkdown text={section.content} />
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
