'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MOODS } from '@/lib/ai/pipeline/simulator/contexts/moods';
import { GENRES } from '@/lib/ai/pipeline/simulator/contexts/genres';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TagButton from '@/components/ui/TagButton';
import type { SimulatorInput, SimulatorApiResponse } from '@/types/simulator';

export default function SimulatorForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [mood, setMood] = useState('');
  const [genre, setGenre] = useState('');

  const isValid = name.trim().length > 0 && mood !== '' && genre !== '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: SimulatorInput = { name: name.trim(), mood, genre };

    startTransition(async () => {
      try {
        const res = await fetch('/api/simulator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        const json: SimulatorApiResponse = await res.json();

        if (!json.ok) {
          setError(json.error);
          return;
        }

        sessionStorage.setItem(
          'simulator:result',
          JSON.stringify({ name: input.name, ...json.data }),
        );
        router.push('/simulator/result');
      } catch {
        setError('요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 캐릭터 이름 */}
      <Input
        label="캐릭터 이름"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        placeholder="예: 이도하"
        disabled={isPending}
      />

      {/* 분위기 선택 */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--foreground)]">
          분위기 <span className="text-[var(--accent)]">*</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <TagButton
              key={m}
              label={m}
              selected={mood === m}
              disabled={isPending}
              onClick={() => setMood(mood === m ? '' : m)}
            />
          ))}
        </div>
      </div>

      {/* 세계관 선택 */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--foreground)]">
          세계관 <span className="text-[var(--accent)]">*</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <TagButton
              key={g}
              label={g}
              selected={genre === g}
              disabled={isPending}
              onClick={() => setGenre(genre === g ? '' : g)}
            />
          ))}
        </div>
      </div>

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
        loading={isPending}
        disabled={!isValid}
        className="w-full"
      >
        {isPending ? '생성 중…' : '캐릭터 카드 생성'}
      </Button>
    </form>
  );
}
