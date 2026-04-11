'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { LorcraftArea, LorcraftInput } from '@/types/lorecraft';
import {
  DRAFT_KEY,
  AREAS,
  type LorcraftDraft,
  type Status,
  type SseEvent,
} from './lorcraftFormConstants';

export function useLorcraftForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [background, setBackground] = useState('');
  const [genre, setGenre] = useState('');
  const [existingSetting, setExistingSetting] = useState('');
  const [areas, setAreas] = useState<LorcraftArea[]>([]);

  const [status, setStatus] = useState<Status>('idle');
  const [progressMessage, setProgressMessage] = useState('');
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [seedModal, setSeedModal] = useState<{ currentBalance: number; requiredAmount: number } | null>(null);

  // draft 복원
  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft: LorcraftDraft = JSON.parse(raw);
      setBackground(draft.background ?? '');
      setGenre(draft.genre ?? '');
      setExistingSetting(draft.existingSetting ?? '');
      setAreas(draft.areas ?? []);
    } catch {
      // 파싱 실패 시 무시
    }
    sessionStorage.removeItem(DRAFT_KEY);
  }, []);

  const isValid =
    background.trim().length > 0 && genre.trim().length > 0 && areas.length > 0;
  const isRunning = status === 'running';

  function toggleArea(area: LorcraftArea) {
    setAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
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
    setStreamedText('');
    setProgressMessage('준비 중...');

    const input: LorcraftInput = {
      background: background.trim(),
      genre: genre.trim(),
      existingSetting: existingSetting.trim() || undefined,
      areas,
    };

    try {
      const res = await fetch('/api/lorecraft', {
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
            requiredAmount: data.requiredAmount ?? 5,
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
      let accumulated = '';

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

          if (event.type === 'progress' && event.message) {
            setProgressMessage(event.message);
          } else if (event.type === 'chunk' && event.text) {
            accumulated += event.text;
            setStreamedText(accumulated);
          } else if (event.type === 'done') {
            sessionStorage.setItem(
              'lorecraft:result',
              JSON.stringify({
                generatedText: accumulated,
                background: input.background,
                genre: input.genre,
                areas: input.areas,
              }),
            );
            router.push('/lorecraft/result');
            return;
          } else if (event.type === 'error') {
            throw new Error(event.message ?? '생성 중 오류가 발생했습니다.');
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '요청 중 오류가 발생했습니다.';
      setError(message);
      setStatus('error');
    }
  }

  function handleSeedModalConfirm() {
    const draft: LorcraftDraft = { background, genre, existingSetting, areas };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    router.push('/mypage/shop');
  }

  return {
    // 입력 상태
    background,
    setBackground,
    genre,
    setGenre,
    existingSetting,
    setExistingSetting,
    areas,
    toggleArea,
    // 실행 상태
    isValid,
    isRunning,
    error,
    progressMessage,
    streamedText,
    // 모달 상태
    showLoginModal,
    setShowLoginModal,
    seedModal,
    setSeedModal,
    // 핸들러
    handleSubmit,
    handleSeedModalConfirm,
    // 상수
    AREAS,
  };
}
