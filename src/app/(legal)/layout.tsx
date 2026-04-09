import Link from 'next/link';
import Image from 'next/image';

const LEGAL_LINKS = [
  { label: '서비스 이용약관', href: '/terms' },
  { label: '개인정보처리방침', href: '/privacy' },
  { label: '환불 정책', href: '/refund' },
] as const;

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
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
            />
            Lorekit
          </Link>
          <nav className="flex gap-4">
            {LEGAL_LINKS.map(({ label, href }) => (
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
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-[var(--muted)]">
            &copy; {new Date().getFullYear()} Lorekit. All rights reserved.
          </p>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 sm:justify-end">
            {LEGAL_LINKS.map(({ label, href }) => (
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
    </div>
  );
}
