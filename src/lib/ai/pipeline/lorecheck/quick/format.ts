import type {
  NormalizedLorcheckQuickInput,
  LorcheckCheckResult,
  LorcheckQuickPayload,
} from '@/types/lorecheck';

export function formatLorcheckQuick(
  input: NormalizedLorcheckQuickInput,
  checkResult: LorcheckCheckResult,
): LorcheckQuickPayload {
  return {
    text: input.text,
    genre: input.genre,
    existingSetting: input.existingSetting,
    issues: checkResult.issues,
    checked_at: new Date().toISOString(),
  };
}
