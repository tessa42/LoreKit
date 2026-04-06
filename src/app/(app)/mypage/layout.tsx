import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MypageNav from '@/components/mypage/MypageNav';

export default async function MypageLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        {/* 사이드바 (데스크탑) / 탭바 (모바일) */}
        <MypageNav />

        {/* 콘텐츠 영역 */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
