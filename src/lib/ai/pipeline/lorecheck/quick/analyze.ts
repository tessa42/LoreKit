import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import { extractJson } from '@/lib/ai/pipeline/lorecraft/utils';
import type { NormalizedLorcheckQuickInput, LorcheckAnalyzeResult } from '@/types/lorecheck';

const SYSTEM_PROMPT = `당신은 창작 텍스트 분석 전문가입니다. 입력된 텍스트를 분석하여 JSON 형식으로만 응답하세요. 마크다운 코드 블록 없이 순수 JSON만 출력하세요.

출력 형식:
{
  "genre": string,
  "era": string,
  "setting": string,
  "materials": string[],
  "groups": string[],
  "uses_intentional_imagination": boolean
}

- genre: 텍스트의 장르 (예: "현대 판타지", "역사 소설", "SF")
- era: 시대적 배경 (예: "조선 후기", "근미래", "중세 유럽")
- setting: 공간적 배경 요약 (예: "서울 강남구", "마법 왕국 아르카디아")
- materials: 텍스트에 등장하는 주요 소재 목록
- groups: 텍스트에 등장하는 집단/조직/세력 목록
- uses_intentional_imagination: 작품이 의도적 상상력(역사 재해석, 대체역사, 픽션 세계관 등)을 사용하는지 여부`;

async function callAnalyze(input: NormalizedLorcheckQuickInput): Promise<LorcheckAnalyzeResult> {
  const client = getAnthropicClient();

  const userContent = [
    `텍스트:\n${input.text}`,
    input.genre ? `장르 힌트: ${input.genre}` : '',
    input.existingSetting ? `기존 설정:\n${input.existingSetting}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const message = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('[lorecheck/analyze] Unexpected response type');

  return JSON.parse(extractJson(block.text)) as LorcheckAnalyzeResult;
}

export async function analyzeLorcheckQuick(
  input: NormalizedLorcheckQuickInput,
): Promise<LorcheckAnalyzeResult> {
  return await callAnalyze(input);
}
