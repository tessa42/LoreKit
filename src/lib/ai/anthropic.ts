import Anthropic from '@anthropic-ai/sdk';

// 모든 Anthropic API 호출은 이 클라이언트를 통해서만 합니다.
// Edge Runtime 호환: fetch 명시적 지정, 싱글턴 캐싱 제거
export function getAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: {
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    fetch: fetch,
  });
}

export const MODELS = {
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5-20251001',
} as const;
