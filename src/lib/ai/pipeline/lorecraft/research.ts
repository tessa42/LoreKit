import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import type {
  NormalizedLorcraftInput,
  AnalyzeResult,
  PlanResult,
  PlanSection,
  ResearchResult,
} from '@/types/lorecraft';

const SECTION_SYSTEM_PROMPT = `당신은 창작 세계관 리서치 전문가입니다.
담당 섹션의 고증 및 배경 정보를 불릿 포인트 5개 이내로 정리하라.
각 항목은 1~2문장. JSON 없이 텍스트로만 출력.`;

// 모델 호출부 분리 — GPT 교체 시 이 함수만 수정
async function callSectionResearch(userContent: string): Promise<string> {
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: MODELS.sonnet,
    max_tokens: 500,
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
): Promise<{ title: string; content: string }> {
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

  const content = await callSectionResearch(userContent);
  return { title: section.title, content };
}

export async function researchLorecraft(
  input: NormalizedLorcraftInput,
  _analysis: AnalyzeResult,
  plan: PlanResult,
): Promise<ResearchResult> {
  const sections = await Promise.all(
    plan.sections.map((section) => researchSection(section, input)),
  );

  return { sections };
}
