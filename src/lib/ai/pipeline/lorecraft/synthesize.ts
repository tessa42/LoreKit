import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import type {
  PlanSection,
  PlanResult,
  ResearchResult,
  SynthesizeResult,
} from '@/types/lorecraft';

const SECTION_SYSTEM_PROMPT = `당신은 창작 세계관 설정 편집 전문가입니다.
research 재료를 바탕으로 섹션의 핵심 내용을 창작에 바로 활용할 수 있는 산문 초안으로 재구성하라.
실존 정보와 가상 설정을 자연스럽게 연결하라.
JSON 없이 텍스트로만 출력.`;

async function synthesizeSection(
  section: PlanSection,
  researchContent: string,
): Promise<{ title: string; content: string }> {
  const client = getAnthropicClient();

  const userContent = [
    `섹션 제목: ${section.title}`,
    `영역: ${section.area}`,
    `핵심 초점: ${section.focus}`,
    ``,
    `리서치 재료:`,
    researchContent,
  ].join('\n');

  const message = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 1500,
    system: SECTION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error(`[synthesize:${section.title}] Unexpected response type`);

  return { title: section.title, content: block.text.trim() };
}

export async function synthesizeLorecraft(
  plan: PlanResult,
  research: ResearchResult,
): Promise<SynthesizeResult> {
  const researchByTitle = new Map(research.sections.map((s) => [s.title, s.content]));

  const sections = await Promise.all(
    plan.sections.map((section) =>
      synthesizeSection(section, researchByTitle.get(section.title) ?? ''),
    ),
  );

  return { sections };
}
