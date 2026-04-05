import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Lorekit — 창작자를 위한 세계관 설계 도구',
    template: '%s | Lorekit',
  },
  description: 'AI로 세계관을 설계하고, 설정의 개연성을 검증하세요.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://lorekit.app'
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
