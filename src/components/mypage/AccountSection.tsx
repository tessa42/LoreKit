'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,16}$/;

interface AccountSectionProps {
  email: string;
  createdAt: string;
  balance: number;
  nickname: string | null;
}

export default function AccountSection({ email, createdAt, balance, nickname }: AccountSectionProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // 닉네임 편집 상태
  const [nicknameInput, setNicknameInput] = useState(nickname ?? '');
  const [nicknameEditing, setNicknameEditing] = useState(false);
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState(false);

  async function handleNicknameSave() {
    setNicknameError('');
    setNicknameSuccess(false);
    if (!NICKNAME_REGEX.test(nicknameInput)) {
      setNicknameError('2~16자, 한글/영문/숫자만 사용할 수 있습니다.');
      return;
    }
    setNicknameSaving(true);
    try {
      const res = await fetch('/api/profile/nickname', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nicknameInput }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? '저장에 실패했습니다.');
      setNicknameEditing(false);
      setNicknameSuccess(true);
    } catch (err) {
      setNicknameError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setNicknameSaving(false);
    }
  }

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

        {/* 닉네임 편집 */}
        <Card>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">닉네임</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">헤더에 표시되는 이름입니다.</p>
              </div>
              {!nicknameEditing && (
                <Button variant="secondary" size="sm" onClick={() => { setNicknameEditing(true); setNicknameSuccess(false); }}>
                  편집
                </Button>
              )}
            </div>
            {nicknameEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  maxLength={16}
                  placeholder="2~16자, 한글/영문/숫자"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                {nicknameError && (
                  <p className="text-xs text-[var(--error,#ef4444)]">{nicknameError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={nicknameSaving}
                    onClick={() => { setNicknameEditing(false); setNicknameInput(nickname ?? ''); setNicknameError(''); }}
                  >
                    취소
                  </Button>
                  <Button size="sm" loading={nicknameSaving} onClick={handleNicknameSave}>
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground)]">
                {nicknameInput || <span className="text-[var(--muted)]">닉네임 없음</span>}
              </p>
            )}
            {nicknameSuccess && !nicknameEditing && (
              <p className="text-xs text-green-500">닉네임이 저장되었습니다.</p>
            )}
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
