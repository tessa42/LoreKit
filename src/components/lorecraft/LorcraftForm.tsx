'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import TagButton from '@/components/ui/TagButton';
import LoginPromptModal from '@/components/common/LoginPromptModal';
import SeedShortageModal from '@/components/common/SeedShortageModal';
import LorcraftMarkdown from '@/components/lorecraft/LorcraftMarkdown';
import type { LorcraftArea, LorcraftInput } from '@/types/lorecraft';

const DRAFT_KEY = 'lorecraft_draft';

interface LorcraftDraft {
  background: string;
  genre: string;
  existingSetting: string;
  areas: LorcraftArea[];
}

const STEP_LABELS: Record<string, string> = {
  analyze: '분석 중...',
  research: '리서치 중...',
  synthesize: '정보 통합 중...',
  generate: '설정집 생성 중...',
  review: '검토 중...',
  normalize: '마무리 중...',
};

function StreamingPreview({
  progressMessage,
  streamedText,
}: {
  progressMessage: string;
  streamedText: string;
}) {
  return (
    <div className="space-y-4">
      {/* 진행 단계 */}
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <span
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
          aria-hidden="true"
        />
        <span className="text-sm text-[var(--muted)]">
          {STEP_LABELS[progressMessage] ?? progressMessage}
        </span>
      </div>

      {/* 생성 중 텍스트 프리뷰 */}
      {streamedText && (
        <div className="max-h-[60vh] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] px-5 py-4">
          <LorcraftMarkdown text={streamedText} />
        </div>
      )}
    </div>
  );
}

const AREAS: LorcraftArea[] = [
  '역사와 배경',
  '지리와 공간',
  '사회 구조와 계층',
  '조직과 세력',
  '기술/마법 체계',
  '문화와 일상',
  '주요 인물',
  '사건과 갈등 구조',
];

type Status = 'idle' | 'running' | 'error';

interface SseEvent {
  type: 'progress' | 'chunk' | 'done' | 'error';
  step?: string;
  message?: string;
  text?: string;
}

export default function LorcraftForm() {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 스트리밍 중: 입력 폼 숨기고 미리보기만 표시 */}
      {isRunning ? (
        <StreamingPreview progressMessage={progressMessage} streamedText={streamedText} />
      ) : (
        <>
          {/* 배경 */}
          <div className="space-y-1.5">
            <Textarea
              label="세계관 배경"
              required
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              maxLength={500}
              placeholder="예: 1920년대 경성을 배경으로 한 대체역사. 일제강점기이지만 조선의 독립운동 세력이 비밀 마법 결사를 운영하고 있다."
              className="min-h-[140px]"
            />
            <p className={`text-right text-xs ${background.length >= 500 ? 'text-[var(--error)]' : 'text-[var(--muted)]'}`}>
              {background.length}/500
            </p>
          </div>

          {/* 장르 */}
          <Input
            label="장르"
            required
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            maxLength={100}
            placeholder="예: 대체역사 / 다크 판타지 / SF 스릴러"
          />

          {/* 기존 설정 */}
          <div className="space-y-1.5">
            <Textarea
              label="기존 설정 (선택)"
              value={existingSetting}
              onChange={(e) => setExistingSetting(e.target.value)}
              maxLength={1000}
              placeholder="이미 구성해 둔 설정이 있다면 입력하세요. 없으면 비워두세요."
              className="min-h-[100px]"
            />
            <p className={`text-right text-xs ${existingSetting.length >= 1000 ? 'text-[var(--error)]' : 'text-[var(--muted)]'}`}>
              {existingSetting.length}/1000
            </p>
          </div>

          {/* 요청 영역 */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--foreground)]">
              생성 영역 <span className="text-[var(--accent)]">*</span>
            </p>
            <p className="text-xs text-[var(--muted)]">원하는 항목을 복수 선택하세요.</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {AREAS.map((area) => (
                <TagButton
                  key={area}
                  label={area}
                  selected={areas.includes(area)}
                  onClick={() => toggleArea(area)}
                />
              ))}
            </div>
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
        {isRunning ? '설정집 생성 중…' : (
          <>설정집 생성 <span className="text-xs opacity-70 ml-1">🌱 5</span></>
        )}
      </Button>

      {showLoginModal && (
        <LoginPromptModal
          onClose={() => setShowLoginModal(false)}
          next="/lorecraft"
        />
      )}

      {seedModal && (
        <SeedShortageModal
          isOpen
          currentBalance={seedModal.currentBalance}
          requiredAmount={seedModal.requiredAmount}
          onClose={() => setSeedModal(null)}
          onConfirm={() => {
            const draft: LorcraftDraft = { background, genre, existingSetting, areas };
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
            router.push('/mypage/shop');
          }}
        />
      )}
    </form>
  );
}
