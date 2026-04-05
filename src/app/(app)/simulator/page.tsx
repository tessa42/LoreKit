import type { Metadata } from 'next';
import SimulatorForm from '@/components/simulator/SimulatorForm';

export const metadata: Metadata = {
  title: 'Simulator',
  description: '캐릭터의 성격과 상황을 입력하면 AI가 행동 반응을 시뮬레이션합니다.',
};

export default function SimulatorPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Simulator</h1>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          캐릭터의 성격과 상황을 입력하면 AI가 그 캐릭터답게 반응합니다.
          로그인 없이 체험할 수 있습니다.
        </p>
      </div>

      {/* 폼 카드 */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
        <SimulatorForm />
      </div>
    </div>
  );
}
