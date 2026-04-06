import type { LorcraftArea, LorcraftInput, NormalizedLorcraftInput } from '@/types/lorecraft';

const VALID_AREAS: LorcraftArea[] = [
  '역사와 배경',
  '지리와 공간',
  '사회 구조와 계층',
  '조직과 세력',
  '기술/마법 체계',
  '문화와 일상',
  '주요 인물',
  '사건과 갈등 구조',
];

const MAX_BACKGROUND = 500;
const MAX_GENRE = 100;
const MAX_EXISTING_SETTING = 1000;

export function normalizeLorecraft(input: LorcraftInput): NormalizedLorcraftInput {
  if (!input.background?.trim()) {
    throw new Error('배경 설명은 필수입니다.');
  }
  if (input.background.length > MAX_BACKGROUND) {
    throw new Error(`배경 설명은 ${MAX_BACKGROUND}자 이하여야 합니다.`);
  }

  if (!input.genre?.trim()) {
    throw new Error('장르는 필수입니다.');
  }
  if (input.genre.length > MAX_GENRE) {
    throw new Error(`장르는 ${MAX_GENRE}자 이하여야 합니다.`);
  }

  const existingSetting = input.existingSetting?.trim() ?? '';
  if (existingSetting.length > MAX_EXISTING_SETTING) {
    throw new Error(`기존 설정은 ${MAX_EXISTING_SETTING}자 이하여야 합니다.`);
  }

  if (!input.areas || input.areas.length === 0) {
    throw new Error('생성 영역을 하나 이상 선택해야 합니다.');
  }
  const invalidAreas = input.areas.filter((a) => !VALID_AREAS.includes(a));
  if (invalidAreas.length > 0) {
    throw new Error(`유효하지 않은 영역입니다: ${invalidAreas.join(', ')}`);
  }

  return {
    background: input.background.trim(),
    genre: input.genre.trim(),
    existingSetting,
    areas: input.areas,
  };
}
