'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { LorcheckQuickInput } from '@/types/lorecheck';
import { DRAFT_KEY, type LorcheckDraft, type Status, type SseEvent } from './lorcheckFormConstants';

export function useLorcheckForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [genre, setGenre] = useState('');
  const [existingSetting, setExistingSetting] = useState('');

  const [status, setStatus] = useState<Status>('idle');
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [seedModal, setSeedModal] = useState<{ currentBalance: number; requiredAmount: number } | null>(null);

  // draft 복원
  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft: LorcheckDraft = JSON.parse(raw);
      setText(draft.text ?? '');
      setGenre(draft.genre ?? '');
      setExistingSetting(draft.existingSetting ?? '');
    } catch {
      // 파싱 실패 시 무시
    }
    sessionStorage.removeItem(DRAFT_KEY);
  }, []);

  const isValid = text.trim().length > 0;
  const isRunning = status === 'running';

  function saveDraftAndGoToShop() {
    const draft: LorcheckDraft = { text, genre, existingSetting };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    router.push('/mypage/shop');
  }

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

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as {
          error?: string;
          code?: string;
          currentBalance?: number;
          requiredAmount?: number;
        };
        if (data.code === 'insufficient_credits') {
          setStatus('idle');
          setSeedModal({
            currentBalance: data.currentBalance ?? 0,
            requiredAmount: data.requiredAmount ?? 1,
          });
          return;
        }
        throw new Error(data.error ?? '서버 요청에 실패했습니다.');
      }

      if (!res.body) {
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

  return {
    text, setText,
    genre, setGenre,
    existingSetting, setExistingSetting,
    status, progressMessage, error,
    isValid, isRunning,
    handleSubmit,
    showLoginModal, setShowLoginModal,
    seedModal, setSeedModal,
    saveDraftAndGoToShop,
  };
}
