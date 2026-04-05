import Link from 'next/link';

const LINKS = [
  { label: '서비스 이용약관', href: '/terms' },
  { label: '개인정보처리방침', href: '/privacy' },
  { label: '환불 정책', href: '/refund' },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-xs text-[var(--muted)]">
          &copy; {new Date().getFullYear()} Lorekit. All rights reserved.
        </p>

        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 sm:justify-end">
          {LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
