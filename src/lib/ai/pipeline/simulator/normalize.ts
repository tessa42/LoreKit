import { MOODS } from './contexts/moods';
import { GENRES } from './contexts/genres';
import type { SimulatorInput } from '@/types/simulator';

export interface NormalizedSimulatorInput {
  name: string;
  mood: string;
  genre: string;
}

export function validateInput(input: SimulatorInput): string | null {
  if (!input.name?.trim()) return '캐릭터 이름을 입력해 주세요.';

  const mood = input.mood?.trim();
  if (!mood) return '분위기를 선택해 주세요.';
  if (!(MOODS as readonly string[]).includes(mood)) {
    return `유효하지 않은 분위기입니다. (${MOODS.join(', ')} 중 하나여야 합니다)`;
  }

  const genre = input.genre?.trim();
  if (!genre) return '세계관을 선택해 주세요.';
  if (!(GENRES as readonly string[]).includes(genre)) {
    return `유효하지 않은 세계관입니다. (${GENRES.join(', ')} 중 하나여야 합니다)`;
  }

  return null;
}

export function normalizeInput(input: SimulatorInput): NormalizedSimulatorInput {
  return {
    name: input.name.trim(),
    mood: input.mood.trim(),
    genre: input.genre.trim(),
  };
}
