import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import type { NormalizedLorcraftInput, SynthesizeResult, ReviewResult } from '@/types/lorecraft';

const SYSTEM_PROMPT = `당신은 창작 세계관 설정 검토 전문가입니다.
섹션 초안을 검토하고 보정하여 최종 생성 단계에 전달할 완성 텍스트를 만드세요.
JSON 없이 텍스트로만 출력.

검토 항목:
1. 누락 영역 — 선택된 영역이 모두 포함되어 있는지 확인
2. 설정 충돌 — 섹션 간 모순되는 내용 수정
3. 일관성 — 장르/시대/배경과 어긋나는 부분 수정

보정이 없으면 원문 그대로 출력.`;

async function callReview(
  input: NormalizedLorcraftInput,
  synthesized: SynthesizeResult,
): Promise<ReviewResult> {
  const client = getAnthropicClient();

  const sectionsText = synthesized.sections
    .map((s) => `## ${s.title}\n${s.content}`)
    .join('\n\n');

  const userContent = [
    `배경: ${input.background}`,
    `장르: ${input.genre}`,
    `선택된 영역: ${input.areas.join(', ')}`,
    ``,
    `섹션 초안:`,
    sectionsText,
  ].join('\n');

  const message = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('[review] Unexpected response type');

  // ## 제목 기준으로 섹션 파싱
  const lines = block.text.split('\n');
  const sections: { title: string; content: string }[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
      }
      currentTitle = h2[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
  }

  // 파싱 실패 시 synthesized 그대로 반환
  return { sections: sections.length > 0 ? sections : synthesized.sections };
}

export async function reviewLorecraft(
  input: NormalizedLorcraftInput,
  synthesized: SynthesizeResult,
): Promise<ReviewResult> {
  try {
    return await callReview(input, synthesized);
  } catch {
    return synthesized;
  }
}
