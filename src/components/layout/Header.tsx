'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Lorecraft', href: '/lorecraft' },
  { label: 'Lorecheck', href: '/lorecheck' },
  { label: 'Simulator', href: '/simulator' },
] as const;

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
        >
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
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  active
                    ? 'text-[var(--accent)] bg-[var(--accent)]/10'
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
          {/* 씨앗 잔액 — 로그인 상태일 때만 (추후 useCredits 연결) */}
          {/* <SeedBalance /> */}

          <Link
            href="/mypage"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
          >
            My Page
          </Link>

          {/* 로그인 버튼 — 비로그인 시 표시 (추후 useAuth 연결) */}
          <Link
            href="/login"
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            로그인
          </Link>
        </div>
      </div>
    </header>
  );
}
