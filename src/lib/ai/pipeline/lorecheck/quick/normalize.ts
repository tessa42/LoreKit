import type { LorcheckQuickInput, NormalizedLorcheckQuickInput } from '@/types/lorecheck';

const MAX_TEXT = 3000;
const MAX_EXISTING_SETTING = 1000;

export function normalizeLorcheckQuick(input: LorcheckQuickInput): NormalizedLorcheckQuickInput {
  if (!input.text?.trim()) {
    throw new Error('텍스트는 필수입니다.');
  }
  if (input.text.length > MAX_TEXT) {
    throw new Error(`텍스트는 ${MAX_TEXT}자 이하여야 합니다.`);
  }

  const genre = input.genre?.trim() ?? '';
  const existingSetting = input.existingSetting?.trim() ?? '';

  if (existingSetting.length > MAX_EXISTING_SETTING) {
    throw new Error(`기존 설정은 ${MAX_EXISTING_SETTING}자 이하여야 합니다.`);
  }

  return {
    text: input.text.trim(),
    genre,
    existingSetting,
  };
}
