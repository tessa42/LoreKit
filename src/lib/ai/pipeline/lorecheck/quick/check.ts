import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import { extractJson } from '@/lib/ai/pipeline/lorecraft/utils';
import type {
  NormalizedLorcheckQuickInput,
  LorcheckAnalyzeResult,
  LorcheckResearchResult,
  LorcheckCheckResult,
} from '@/types/lorecheck';

const SYSTEM_PROMPT = `당신은 독자 몰입 관점에서 창작 텍스트를 검토하는 전문가입니다. 입력된 텍스트에서 독자 몰입을 해칠 수 있는 문제를 분석하여 JSON 형식으로만 응답하세요. 마크다운 코드 블록 없이 순수 JSON만 출력하세요.

판단 원칙:
1. 확신이 없으면 지적하지 않는다. 불확실한 사항은 이슈로 올리지 않는다.
2. 장르 관습은 오류가 아니다. 해당 장르에서 통용되는 설정은 문제 삼지 않는다.
3. 의도적 재해석이 명백하면 오류로 분류하지 않는다. 대체역사, 패러디, 세계관 변형 등은 intentional로 분류한다.
4. 이슈를 지적할 때는 반드시 독자가 왜 위화감을 느끼는지 구체적 근거를 제시한다.

이슈 유형:
- immersion_break: 독자 몰입을 파괴하는 사실 오류나 설정 모순. severity 필수 (low/medium/high).
- intentional: 의도적 상상력 사용 (대체역사, 픽션 세계관, 의도적 재해석). severity 없음.
- insider_context: 해당 분야 내부자만 알 수 있는 맥락 오류. severity 필수 (low/medium/high).

출력 형식:
{
  "issues": [
    {
      "type": "immersion_break" | "intentional" | "insider_context",
      "severity": "low" | "medium" | "high",  // intentional 타입은 이 필드 생략
      "description": string,  // 문제 설명 + 독자가 위화감을 느끼는 이유
      "suggestion": string    // 개선 제안 또는 의도 확인 요청
    }
  ]
}

이슈가 없으면 "issues": [] 를 반환한다.`;

async function callCheck(
  input: NormalizedLorcheckQuickInput,
  analysis: LorcheckAnalyzeResult,
  research: LorcheckResearchResult,
): Promise<LorcheckCheckResult> {
  const client = getAnthropicClient();

  const insiderRulesLines = research.insider_rules.map(
    ({ subject, rules }) => `내부자 맥락 규칙 - ${subject}: ${rules.join(', ')}`,
  );

  const userContent = [
    `텍스트:\n${input.text}`,
    `분석 결과:`,
    `- 장르: ${analysis.genre}`,
    `- 시대: ${analysis.era}`,
    `- 배경: ${analysis.setting}`,
    `- 주요 소재: ${analysis.materials.join(', ')}`,
    `- 등장 집단: ${analysis.groups.join(', ')}`,
    `- 의도적 상상력 사용 여부: ${analysis.uses_intentional_imagination ? '예' : '아니오'}`,
    insiderRulesLines.length > 0 ? `\n${insiderRulesLines.join('\n')}` : '',
    input.existingSetting ? `\n기존 설정:\n${input.existingSetting}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const message = await client.messages.create({
    model: MODELS.sonnet,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('[lorecheck/check] Unexpected response type');

  return JSON.parse(extractJson(block.text)) as LorcheckCheckResult;
}

export async function checkLorcheckQuick(
  input: NormalizedLorcheckQuickInput,
  analysis: LorcheckAnalyzeResult,
  research: LorcheckResearchResult,
): Promise<LorcheckCheckResult> {
  return await callCheck(input, analysis, research);
}
