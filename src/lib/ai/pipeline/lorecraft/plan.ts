import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import { extractJson } from './utils';
import type { NormalizedLorcraftInput, AnalyzeResult, PlanResult } from '@/types/lorecraft';

const SYSTEM_PROMPT = `당신은 창작 세계관 설정집 기획 전문가입니다. 분석 결과를 바탕으로 섹션별 생성 계획을 수립하세요. 마크다운 코드 블록 없이 순수 JSON만 출력하세요.

출력 형식:
{
  "sections": [
    {
      "title": string,
      "area": string,
      "type": "real" | "fictional" | "hybrid",
      "focus": string,
      "key_points": string[]
    }
  ]
}

규칙:
- 선택된 각 영역에 대해 최소 하나의 섹션을 계획할 것
- type: real은 실존 고증 기반, fictional은 가상 설정 기반, hybrid는 혼합
- focus: 해당 섹션에서 가장 중점적으로 다룰 내용 한 문장
- key_points: 섹션에 반드시 포함해야 할 핵심 항목 목록`;

async function callPlan(input: NormalizedLorcraftInput, analysis: AnalyzeResult): Promise<PlanResult> {
  const client = getAnthropicClient();

  const userContent = [
    `분석 결과:\n${JSON.stringify(analysis, null, 2)}`,
    `원본 입력:`,
    `배경: ${input.background}`,
    `장르: ${input.genre}`,
    `선택된 영역: ${input.areas.join(', ')}`,
  ].join('\n');

  const message = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('[plan] Unexpected response type');

  return JSON.parse(extractJson(block.text)) as PlanResult;
}

export async function planLorecraft(input: NormalizedLorcraftInput, analysis: AnalyzeResult): Promise<PlanResult> {
  try {
    return await callPlan(input, analysis);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return await callPlan(input, analysis);
    }
    throw err;
  }
}
