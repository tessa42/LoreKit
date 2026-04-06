'use client';

import LorcraftForm from '@/components/lorecraft/LorcraftForm';

export default function LorcraftPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-10">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
          Lorecraft
        </p>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">세계관 설정집 생성</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          배경과 장르를 입력하면 AI가 세계 내부자 시점의 설정집 챕터를 작성합니다.
        </p>
      </div>

      <LorcraftForm />
    </div>
  );
}
