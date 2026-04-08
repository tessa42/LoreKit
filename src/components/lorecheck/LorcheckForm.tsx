'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import LoginPromptModal from '@/components/common/LoginPromptModal';
import type { LorcheckQuickInput, LorcheckQuickPayload } from '@/types/lorecheck';

const STEP_LABELS: Record<string, string> = {
  normalize: '입력값 검증 중...',
  analyze: '텍스트 분석 중...',
  check: '고증 검토 중...',
  format: '결과 정리 중...',
};

type Status = 'idle' | 'running' | 'error';

interface SseEvent {
  type: 'progress' | 'done' | 'error';
  step?: string;
  message?: string;
  payload?: LorcheckQuickPayload;
}

function ProgressView({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
        aria-hidden="true"
      />
      <p className="text-sm text-[var(--muted)]">
        {STEP_LABELS[message] ?? message}
      </p>
    </div>
  );
}

export default function LorcheckForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [genre, setGenre] = useState('');
  const [existingSetting, setExistingSetting] = useState('');

  const [status, setStatus] = useState<Status>('idle');
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isValid = text.trim().length > 0;
  const isRunning = status === 'running';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isRunning) return;

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setStatus('running');
    setError(null);
    setProgressMessage('normalize');

    const input: LorcheckQuickInput = {
      text: text.trim(),
      genre: genre.trim() || undefined,
      existingSetting: existingSetting.trim() || undefined,
    };

    try {
      const res = await fetch('/api/lorecheck/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok || !res.body) {
        throw new Error('서버 요청에 실패했습니다.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;

          let event: SseEvent;
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          if (event.type === 'progress' && event.step) {
            setProgressMessage(event.step);
          } else if (event.type === 'done' && event.payload) {
            sessionStorage.setItem('lorecheck:result', JSON.stringify(event.payload));
            router.push('/lorecheck/result');
            return;
          } else if (event.type === 'error') {
            throw new Error(event.message ?? '검토 중 오류가 발생했습니다.');
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '요청 중 오류가 발생했습니다.';
      setError(message);
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {isRunning ? (
        <ProgressView message={progressMessage} />
      ) : (
        <>
          {/* 장르 */}
          <Input
            label="장르 (선택)"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            maxLength={100}
            placeholder="예: 조선시대 / 중세 판타지 / 근미래 SF"
          />

          {/* 검토할 텍스트 */}
          <div className="space-y-1.5">
            <Textarea
              label="검토할 텍스트"
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={3000}
              placeholder="고증 검토를 받을 텍스트를 입력하세요."
              className="min-h-[200px]"
            />
            <p
              className={`text-right text-xs ${
                text.length >= 3000 ? 'text-[var(--error)]' : 'text-[var(--muted)]'
              }`}
            >
              {text.length}/3000
            </p>
          </div>

          {/* 기존 설정 */}
          <div className="space-y-1.5">
            <Textarea
              label="기존 설정 (선택)"
              value={existingSetting}
              onChange={(e) => setExistingSetting(e.target.value)}
              maxLength={1000}
              placeholder="세계관 설정이나 작품 내 규칙이 있다면 입력하세요."
              className="min-h-[100px]"
            />
            <p
              className={`text-right text-xs ${
                existingSetting.length >= 1000 ? 'text-[var(--error)]' : 'text-[var(--muted)]'
              }`}
            >
              {existingSetting.length}/1000
            </p>
          </div>
        </>
      )}

      {/* 에러 */}
      {error && (
        <div
          className="rounded-[var(--radius-md)] border border-[var(--error-border)] bg-[var(--error-subtle)] px-4 py-3 text-sm text-[var(--error)]"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* 제출 */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isRunning}
        disabled={!isValid}
        className="w-full"
      >
        {isRunning ? '검토 중…' : '고증 검토 실행'}
      </Button>

      {showLoginModal && (
        <LoginPromptModal onClose={() => setShowLoginModal(false)} next="/lorecheck" />
      )}
    </form>
  );
}
