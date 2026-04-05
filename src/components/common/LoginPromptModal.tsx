'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface Props {
  onClose: () => void;
  /** 로그인 후 돌아올 경로 */
  next?: string;
}

export default function LoginPromptModal({ onClose, next }: Props) {
  // ESC 키로 닫기
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const loginHref = `/api/auth/signin${next ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-prompt-title"
    >
      {/* 딤 배경 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 카드 */}
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">
        {/* 닫기 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          aria-label="닫기"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z" />
          </svg>
        </button>

        {/* 아이콘 */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <h2 id="login-prompt-title" className="mb-1 text-lg font-semibold text-[var(--foreground)]">
          로그인이 필요합니다
        </h2>
        <p className="mb-6 text-sm text-[var(--muted)] leading-relaxed">
          시뮬레이션 결과를 저장하려면 로그인하세요.
          로그인 후 이 결과를 내 서재에서 다시 확인할 수 있습니다.
        </p>

        <div className="flex flex-col gap-2">
          <a
            href={loginHref}
            className="flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            로그인하고 저장하기
          </a>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            나중에 하기
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="text-[var(--accent)] hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
