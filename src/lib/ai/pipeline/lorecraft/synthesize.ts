import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import { extractJson } from './utils';
import type { PlanResult, ResearchResult, SynthesizeResult } from '@/types/lorecraft';

const SYSTEM_PROMPT = `당신은 창작 세계관 설정 편집 전문가입니다. 리서치 결과를 설정집 작성에 활용할 수 있는 형태로 재구성하세요. 마크다운 코드 블록 없이 순수 JSON만 출력하세요.

출력 형식:
{
  "sections": [
    {
      "title": string,
      "key_points": string[],
      "tone_hints": string,
      "connections": string[]
    }
  ]
}

- title: 섹션 제목
- key_points: 설정집에 포함할 핵심 정보 (사실 기반, 간결하게)
- tone_hints: 해당 섹션을 서술할 때의 문체/분위기 가이드 한 문장
- connections: 다른 섹션 또는 설정 요소와의 연결 포인트`;

async function callSynthesize(plan: PlanResult, research: ResearchResult): Promise<SynthesizeResult> {
  const client = getAnthropicClient();

  const userContent = [
    `생성 계획:\n${JSON.stringify(plan, null, 2)}`,
    ``,
    `리서치 결과:\n${JSON.stringify(research, null, 2)}`,
  ].join('\n');

  const message = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('[synthesize] Unexpected response type');

  return JSON.parse(extractJson(block.text)) as SynthesizeResult;
}

export async function synthesizeLorecraft(plan: PlanResult, research: ResearchResult): Promise<SynthesizeResult> {
  try {
    return await callSynthesize(plan, research);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return await callSynthesize(plan, research);
    }
    throw err;
  }
}
