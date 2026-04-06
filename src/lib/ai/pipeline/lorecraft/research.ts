import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import { extractJson } from './utils';
import type {
  NormalizedLorcraftInput,
  AnalyzeResult,
  PlanResult,
  PlanSection,
  ResearchSource,
  ResearchResult,
} from '@/types/lorecraft';

const SECTION_SYSTEM_PROMPT = `당신은 창작 세계관 고증 리서치 전문가입니다. 담당 섹션 하나에 집중하여 관련 정보를 수집하고 정리하세요.
마크다운 코드 블록 없이 순수 JSON만 출력하세요.

출력 형식:
{
  "topic": string,
  "facts": string[],
  "confidence": "high" | "medium" | "low",
  "gaps": string[],
  "creative_flex_points": string[]
}

- topic: 이 섹션의 리서치 주제
- facts: 섹션 설정을 뒷받침하는 고증/세부 정보
- confidence: high(확실한 역사적 사실) / medium(일반적으로 알려진 정보) / low(추정 또는 불확실)
- gaps: 정보가 부족하거나 고증이 어려운 영역
- creative_flex_points: 창작 자유도가 높은 지점`;

interface SectionResearchRaw {
  topic: string;
  facts: string[];
  confidence: 'high' | 'medium' | 'low';
  gaps: string[];
  creative_flex_points: string[];
}

// 모델 호출부 분리 — GPT 교체 시 이 함수만 수정
async function callSectionResearch(userContent: string): Promise<string> {
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: MODELS.sonnet,
    max_tokens: 2000,
    system: SECTION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('[research] Unexpected response type');
  return block.text;
}

async function researchSection(
  section: PlanSection,
  input: NormalizedLorcraftInput,
): Promise<SectionResearchRaw> {
  const userContent = [
    `섹션 제목: ${section.title}`,
    `영역: ${section.area}`,
    `핵심 초점: ${section.focus}`,
    `포함할 항목: ${section.key_points.join(', ')}`,
    ``,
    `세계관 배경: ${input.background}`,
    `장르: ${input.genre}`,
    input.existingSetting ? `기존 설정:\n${input.existingSetting}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const raw = await callSectionResearch(userContent);
  return JSON.parse(extractJson(raw)) as SectionResearchRaw;
}

export async function researchLorecraft(
  input: NormalizedLorcraftInput,
  _analysis: AnalyzeResult,
  plan: PlanResult,
): Promise<ResearchResult> {
  const results = await Promise.all(
    plan.sections.map((section) => researchSection(section, input)),
  );

  const sources_summary: ResearchSource[] = results.map((r) => ({
    topic: r.topic,
    facts: r.facts,
    confidence: r.confidence,
  }));

  return {
    sources_summary,
    gaps: results.flatMap((r) => r.gaps),
    creative_flex_points: results.flatMap((r) => r.creative_flex_points),
  };
}
