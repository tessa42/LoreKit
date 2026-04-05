'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MOODS } from '@/lib/ai/pipeline/simulator/contexts/moods';
import { GENRES } from '@/lib/ai/pipeline/simulator/contexts/genres';
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
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--foreground)]">
          캐릭터 이름 <span className="text-[var(--accent)]">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="예: 이도하"
          className={inputClass}
          disabled={isPending}
        />
      </div>

      {/* 분위기 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--foreground)]">
          분위기 <span className="text-[var(--accent)]">*</span>
        </label>
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
        <label className="text-sm font-medium text-[var(--foreground)]">
          세계관 <span className="text-[var(--accent)]">*</span>
        </label>
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
        <div className="rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* 제출 */}
      <button
        type="submit"
        disabled={!isValid || isPending}
        className="w-full rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {isPending ? '생성 중…' : '캐릭터 카드 생성'}
      </button>
    </form>
  );
}

function TagButton({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'rounded-full border px-3.5 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        selected
          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
          : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

const inputClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50 transition-colors';
