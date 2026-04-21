import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');
  return (
    <div className="mx-auto max-w-4xl px-4 py-24 text-center">
      {/* Hero */}
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
        세계관을 설계하세요,{' '}
        <span className="text-[var(--accent)]">AI와 함께</span>
      </h1>
      <p className="mx-auto mb-10 max-w-xl text-base text-[var(--muted)] sm:text-lg">
        Lorekit은 창작자를 위한 세계관 설계 도구입니다.
        설정집 생성부터 개연성 검토, 캐릭터 시뮬레이션까지.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/lorecraft"
          className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          Lorecraft 시작하기
        </Link>
        <Link
          href="/simulator"
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
        >
          Simulator 체험하기
        </Link>
      </div>

      {/* Feature cards */}
      <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-left">
        {FEATURES.map(({ title, desc, href }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]"
          >
            <h2 className="mb-2 text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              {title}
            </h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: 'Lorecraft',
    desc: '장르, 분위기, 키워드를 입력하면 AI가 세계관 설정집을 생성합니다.',
    href: '/lorecraft',
  },
  {
    title: 'Lorecheck',
    desc: '작성한 설정의 논리적 개연성을 검토하고 모순을 찾아냅니다.',
    href: '/lorecheck',
  },
  {
    title: 'Simulator',
    desc: '특정 상황에서 캐릭터가 어떻게 행동할지 시뮬레이션합니다. 비로그인 체험 가능.',
    href: '/simulator',
  },
] as const;
