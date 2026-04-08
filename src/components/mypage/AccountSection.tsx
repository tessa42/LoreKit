'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface AccountSectionProps {
  email: string;
  createdAt: string;
  balance: number;
}

export default function AccountSection({ email, createdAt, balance }: AccountSectionProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const formattedDate = new Date(createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? '계정 삭제에 실패했습니다.');
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '계정 삭제에 실패했습니다.');
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">계정 설정</h1>

        {/* 계정 정보 */}
        <Card>
          <div className="divide-y divide-[var(--border)]">
            <InfoRow label="이메일" value={email} />
            <InfoRow label="가입일" value={formattedDate} />
            <InfoRow label="씨앗 잔액" value={`${balance.toLocaleString()} 씨앗`} />
          </div>
        </Card>

        {/* 로그아웃 */}
        <Card>
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">로그아웃</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">현재 기기에서 로그아웃합니다.</p>
            </div>
            <Button variant="secondary" size="sm" loading={loggingOut} onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </Card>

        {/* 회원 탈퇴 */}
        <Card>
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">회원 탈퇴</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">계정과 모든 데이터가 삭제됩니다.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="border-[var(--error,#ef4444)] text-[var(--error,#ef4444)] hover:bg-[var(--error,#ef4444)]/10"
              onClick={() => setDeleteModalOpen(true)}
            >
              탈퇴하기
            </Button>
          </div>
        </Card>
      </div>

      {/* 탈퇴 확인 모달 */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleting && setDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[var(--radius-lg)] bg-[var(--surface)] p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-[var(--foreground)]">정말 탈퇴하시겠습니까?</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>
            {deleteError && (
              <p className="mt-3 text-sm text-[var(--error,#ef4444)]">{deleteError}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={deleting}
                onClick={() => setDeleteModalOpen(false)}
              >
                취소
              </Button>
              <Button
                size="sm"
                loading={deleting}
                className="bg-[var(--error,#ef4444)] hover:bg-[var(--error,#ef4444)]/90 focus-visible:ring-[var(--error,#ef4444)]"
                onClick={handleDelete}
              >
                탈퇴하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--foreground)]">{value}</span>
    </div>
  );
}
