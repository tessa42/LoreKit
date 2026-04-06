import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import { extractJson } from './utils';
import type { NormalizedLorcraftInput, SynthesizeResult, ReviewResult } from '@/types/lorecraft';

const SYSTEM_PROMPT = `당신은 창작 세계관 설정 검토 전문가입니다. 합성된 설정 자료를 검토하고 보정하여 최종 생성 단계에 전달할 완성 자료를 만드세요. 마크다운 코드 블록 없이 순수 JSON만 출력하세요.

검토 항목:
1. 누락 섹션 — 선택된 영역이 모두 포함되어 있는지 확인, 없으면 추가
2. 설정 충돌 — 섹션 간 모순되는 내용 수정
3. 일관성 — 장르/시대/배경과 어긋나는 부분 수정

출력 형식 (synthesize와 동일한 구조):
{
  "sections": [
    {
      "title": string,
      "key_points": string[],
      "tone_hints": string,
      "connections": string[]
    }
  ]
}`;

async function callReview(input: NormalizedLorcraftInput, synthesized: SynthesizeResult): Promise<ReviewResult> {
  const client = getAnthropicClient();

  const userContent = [
    `원본 입력:`,
    `배경: ${input.background}`,
    `장르: ${input.genre}`,
    `선택된 영역: ${input.areas.join(', ')}`,
    ``,
    `합성 결과:\n${JSON.stringify(synthesized, null, 2)}`,
  ].join('\n');

  const message = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('[review] Unexpected response type');

  return JSON.parse(extractJson(block.text)) as ReviewResult;
}

export async function reviewLorecraft(input: NormalizedLorcraftInput, synthesized: SynthesizeResult): Promise<ReviewResult> {
  try {
    return await callReview(input, synthesized);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return await callReview(input, synthesized);
    }
    throw err;
  }
}
