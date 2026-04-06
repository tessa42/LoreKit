'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: '내 서재', href: '/mypage/archive', icon: '📚' },
  { label: '작가 노트', href: '/mypage/note', icon: '📝' },
  { label: '로어북', href: '/mypage/lorebook', icon: '📖' },
  { label: '계정', href: '/mypage/account', icon: '👤' },
  { label: '결제', href: '/mypage/billing', icon: '💳' },
] as const;

export default function MypageNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="My Page 네비게이션">
      {/* 모바일: 상단 가로 탭바 */}
      <div className="flex gap-1 overflow-x-auto pb-1 lg:hidden">
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                active
                  ? 'bg-[#7c6af7] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]',
              ].join(' ')}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>

      {/* 데스크탑: 좌측 사이드바 */}
      <div className="hidden lg:block w-48 shrink-0">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ label, href, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    'flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-[#7c6af7]/15 text-[#9585ff]'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]',
                  ].join(' ')}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
