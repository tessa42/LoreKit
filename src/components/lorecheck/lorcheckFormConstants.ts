import type { LorcheckQuickPayload } from '@/types/lorecheck';

export const DRAFT_KEY = 'lorecheck_draft';

export interface LorcheckDraft {
  text: string;
  genre: string;
  existingSetting: string;
}

export const STEP_LABELS: Record<string, string> = {
  normalize: '입력값 검증 중...',
  analyze: '텍스트 분석 중...',
  check: '고증 검토 중...',
  format: '결과 정리 중...',
};

export type Status = 'idle' | 'running' | 'error';

export interface SseEvent {
  type: 'progress' | 'done' | 'error';
  step?: string;
  message?: string;
  payload?: LorcheckQuickPayload;
}
