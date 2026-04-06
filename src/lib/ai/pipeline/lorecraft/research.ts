import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import type { NormalizedLorcraftInput, AnalyzeResult, PlanResult, ResearchResult } from '@/types/lorecraft';

const SYSTEM_PROMPT = `당신은 창작 세계관 고증 리서치 전문가입니다. 제시된 세계관의 실존 배경에 대한 역사, 지리, 문화, 직업 등의 고증 정보를 수집하고 정리하세요. 마크다운 코드 블록 없이 순수 JSON만 출력하세요.

출력 형식:
{
  "sources_summary": [
    {
      "topic": string,
      "facts": string[],
      "confidence": "high" | "medium" | "low"
    }
  ],
  "gaps": string[],
  "creative_flex_points": string[]
}

- sources_summary: 실존 정보 기반의 주제별 고증 데이터
- confidence: high(확실한 역사적 사실), medium(일반적으로 알려진 정보), low(추정 또는 불확실)
- gaps: 정보 부족으로 고증이 어려운 영역
- creative_flex_points: 역사적 공백이나 가상 요소로 창작 자유도가 높은 지점`;

export async function researchLorecraft(
  input: NormalizedLorcraftInput,
  analysis: AnalyzeResult,
  plan: PlanResult,
): Promise<ResearchResult> {
  const client = getAnthropicClient();

  const userContent = [
    `원본 입력:`,
    `배경: ${input.background}`,
    `장르: ${input.genre}`,
    input.existingSetting ? `기존 설정:\n${input.existingSetting}` : '',
    ``,
    `분석 결과:`,
    `- 설정 유형: ${analysis.setting_type}`,
    `- 리서치 필요 항목: ${analysis.research_needs.join(', ')}`,
    `- 장르 분위기: ${analysis.genre_tone}`,
    ``,
    `생성 계획 섹션:\n${JSON.stringify(plan.sections, null, 2)}`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  const message = await client.messages.create({
    model: MODELS.sonnet,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('[research] Unexpected response type');

  return JSON.parse(block.text) as ResearchResult;
}
