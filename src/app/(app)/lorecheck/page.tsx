'use client';

import LorcheckForm from '@/components/lorecheck/LorcheckForm';

export default function LorcheckPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-10">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
          Lorecheck Quick
        </p>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">고증 검토</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          텍스트를 입력하면 AI가 역사·문화·설정 고증 이슈를 분석합니다.
        </p>
      </div>

      <LorcheckForm />
    </div>
  );
}
