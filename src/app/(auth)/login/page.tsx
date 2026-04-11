
import Link from 'next/link';

export const metadata = { title: '로그인' };

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_failed: '인증에 실패했습니다. 다시 시도해 주세요.',
  oauth_init_failed: 'Google 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const signinHref = `/api/auth/signin${next ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Link href="/" className="text-2xl font-semibold text-[var(--foreground)]">
          Lorekit
        </Link>
        <p className="mt-2 text-sm text-[var(--muted)]">창작자를 위한 세계관 설계 도구</p>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <h1 className="mb-1 text-xl font-semibold text-[var(--foreground)]">로그인</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">계속하려면 Google 계정으로 로그인하세요.</p>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {ERROR_MESSAGES[error] ?? '알 수 없는 오류가 발생했습니다.'}
          </div>
        )}

        {/* Google Sign In */}
        <a
          href={signinHref}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <GoogleIcon />
          Google로 계속하기
        </a>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-[var(--accent)] hover:underline">
            회원가입
          </Link>
        </p>
      </div>

      {/* Footer links */}
      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        로그인하면{' '}
        <Link href="/terms" className="underline hover:text-[var(--foreground)]">
          서비스 이용약관
        </Link>
        {' '}및{' '}
        <Link href="/privacy" className="underline hover:text-[var(--foreground)]">
          개인정보처리방침
        </Link>
        에 동의하게 됩니다.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}
