'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useProfile } from '@/hooks/useProfile';

const NAV_ITEMS = [
  { label: 'Lorecraft', href: '/lorecraft' },
  { label: 'Lorecheck', href: '/lorecheck' },
  { label: 'Simulator', href: '/simulator' },
] as const;

export default function Header() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { balance } = useCredits();
  const { profile } = useProfile();
  const myPageLabel = profile?.nickname ?? profile?.display_name ?? 'My Page';

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
        >
          <Image
            src="/images/icon.png"
            alt="Lorekit 마스코트"
            width={28}
            height={28}
            className="rounded-full"
            priority
          />
          Lorekit
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map(({ label, href }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'px-3 py-1.5 rounded-[var(--radius-md)] text-sm transition-colors',
                  active
                    ? 'text-[var(--accent)] bg-[var(--accent-subtle)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]',
                ].join(' ')}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* 씨앗 잔액 — 로그인 상태일 때만 */}
          {!authLoading && user && balance !== null && (
            <Link
              href="/mypage/shop"
              className="hidden sm:flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
              title="씨앗 구매"
            >
              <span aria-hidden="true">🌱</span>
              <span className="font-medium tabular-nums">{balance.toLocaleString()}</span>
            </Link>
          )}

          {!authLoading && (
            user ? (
              <Link
                href="/mypage"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
              >
                {myPageLabel}
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-[var(--radius-md)] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                로그인
              </Link>
            )
          )}
        </div>
      </div>

    </header>
  );
}
