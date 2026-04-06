import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import type { NormalizedLorcraftInput, AnalyzeResult } from '@/types/lorecraft';

const SYSTEM_PROMPT = `당신은 창작 세계관 분석 전문가입니다. 입력된 세계관 정보를 분석하여 JSON 형식으로만 응답하세요. 마크다운 코드 블록 없이 순수 JSON만 출력하세요.

출력 형식:
{
  "setting_type": "real" | "fictional" | "hybrid",
  "priority_axes": string[],
  "genre_tone": string,
  "research_needs": string[],
  "fictional_elements": string[]
}

- setting_type: 실존 배경(real), 완전 가상(fictional), 혼합(hybrid)
- priority_axes: 이 세계관에서 가장 중요한 설정 축
- genre_tone: 장르와 분위기 요약
- research_needs: 실존 고증이 필요한 항목 목록
- fictional_elements: 순수 가상으로 구성할 요소 목록`;

async function callAnalyze(input: NormalizedLorcraftInput): Promise<AnalyzeResult> {
  const client = getAnthropicClient();

  const userContent = [
    `배경: ${input.background}`,
    `장르: ${input.genre}`,
    input.existingSetting ? `기존 설정:\n${input.existingSetting}` : '',
    `요청 영역: ${input.areas.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  const message = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('[analyze] Unexpected response type');

  return JSON.parse(block.text) as AnalyzeResult;
}

export async function analyzeLorecraft(input: NormalizedLorcraftInput): Promise<AnalyzeResult> {
  try {
    return await callAnalyze(input);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return await callAnalyze(input);
    }
    throw err;
  }
}
