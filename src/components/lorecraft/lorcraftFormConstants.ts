import type { LorcraftArea } from '@/types/lorecraft';

export const DRAFT_KEY = 'lorecraft_draft';

export interface LorcraftDraft {
  background: string;
  genre: string;
  existingSetting: string;
  areas: LorcraftArea[];
}

export const STEP_LABELS: Record<string, string> = {
  analyze: '분석 중...',
  research: '리서치 중...',
  synthesize: '정보 통합 중...',
  generate: '설정집 생성 중...',
  review: '검토 중...',
  normalize: '마무리 중...',
};

export const AREAS: LorcraftArea[] = [
  '역사와 배경',
  '지리와 공간',
  '사회 구조와 계층',
  '조직과 세력',
  '기술/마법 체계',
  '문화와 일상',
  '주요 인물',
  '사건과 갈등 구조',
];

export type Status = 'idle' | 'running' | 'error';

export interface SseEvent {
  type: 'progress' | 'chunk' | 'done' | 'error';
  step?: string;
  message?: string;
  text?: string;
}
