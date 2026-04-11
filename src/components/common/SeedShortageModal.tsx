'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentBalance: number;
  requiredAmount: number;
}

export default function SeedShortageModal({
  isOpen,
  onClose,
  onConfirm,
  currentBalance,
  requiredAmount,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const shortage = requiredAmount - currentBalance;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seed-shortage-title"
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
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/15 text-2xl">
          🌱
        </div>

        <h2
          id="seed-shortage-title"
          className="mb-1 text-lg font-semibold text-[var(--foreground)]"
        >
          씨앗이 부족합니다
        </h2>
        <p className="mb-5 text-sm text-[var(--muted)] leading-relaxed">
          씨앗을 충전하러 가시겠어요?
        </p>

        {/* 잔액 정보 */}
        <div className="mb-6 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">현재 잔액</span>
            <span className="font-medium text-[var(--foreground)]">🌱 {currentBalance}개</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted)]">필요한 씨앗</span>
            <span className="font-medium text-[var(--foreground)]">🌱 {requiredAmount}개</span>
          </div>
          <div className="flex justify-between text-sm border-t border-[var(--border)] pt-1 mt-1">
            <span className="text-[var(--muted)]">부족한 씨앗</span>
            <span className="font-medium text-[var(--error)]">🌱 {shortage}개</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="primary" size="md" className="w-full" onClick={onConfirm}>
            충전하러 가기
          </Button>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
