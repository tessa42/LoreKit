import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import { extractJson } from '@/lib/ai/pipeline/lorecraft/utils';
import type {
  NormalizedLorcheckQuickInput,
  LorcheckAnalyzeResult,
  LorcheckResearchResult,
} from '@/types/lorecheck';

const SYSTEM_PROMPT = `당신은 창작 텍스트에 등장하는 소재/집단에 대한 내부자 맥락 전문가입니다.
주어진 소재 목록과 텍스트를 분석하여, 그 분야 내부자라면 당연히 알지만
외부인은 모를 수 있는 현실적 규칙과 관행을 수집하세요.
특히 아래 패턴에 집중하세요:
- 해당 집단/직군에서 갈등이나 이탈이 발생할 때 창작물이 잘못 묘사하는 방식
- 해당 집단 내 역할별 동기와 심리가 현실과 다르게 묘사되는 경우
- 그 집단에 속한 사람이 즉각 위화감을 느낄 장면 유형
확실하지 않은 내용은 포함하지 마세요.
마크다운 블록 없이 순수 JSON만 출력하세요.

출력 형식:
{
  "insider_rules": [
    {
      "subject": "소재/집단명",
      "rules": ["규칙1", "규칙2"]
    }
  ]
}`;

async function callResearch(
  input: NormalizedLorcheckQuickInput,
  analysis: LorcheckAnalyzeResult,
): Promise<LorcheckResearchResult> {
  const client = getAnthropicClient();

  const subjects = [...analysis.materials, ...analysis.groups].join(', ');

  const userContent = [
    `소재 목록: ${subjects}`,
    `장르: ${analysis.genre}`,
    `텍스트:\n${input.text}`,
  ].join('\n\n');

  const message = await client.messages.create({
    model: MODELS.sonnet,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('[lorecheck/research] Unexpected response type');

  return JSON.parse(extractJson(block.text)) as LorcheckResearchResult;
}

export async function researchLorcheckQuick(
  input: NormalizedLorcheckQuickInput,
  analysis: LorcheckAnalyzeResult,
): Promise<LorcheckResearchResult> {
  return await callResearch(input, analysis);
}
