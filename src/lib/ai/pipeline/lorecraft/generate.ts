import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import type { NormalizedLorcraftInput, ReviewResult } from '@/types/lorecraft';

const SYSTEM_PROMPT = `당신은 세계관 설정 아카이브의 편찬자입니다.
사용자가 제시한 창작 세계관의 정보를 토대로,
그 세계 안에 실제로 존재하는 공식 문서, 아카이브 자료,
혹은 세계 내부자가 편찬한 설정집의 한 챕터를 작성합니다.

핵심 원칙:
1. 세계 내부자 시점 유지 — 메타적 언급, 세계 바깥 설명 금지
2. 없는 것을 만들지 말 것 — 제시된 설정 외 임의 창작 금지. 공백은 공백으로 둘 것
3. 실존과 가상을 구분하여 서술
4. 고유 문법 우선 — 세계관 용어 그대로 사용, 현실 대응어 풀이 금지
5. 문서 작성자가 AI임을 드러내는 표현 금지
6. 표보다 산문 우선`;

export async function generateLorecraft(
  input: NormalizedLorcraftInput,
  reviewed: ReviewResult,
): Promise<ReadableStream<Uint8Array>> {
  const client = getAnthropicClient();

  const sectionGuide = reviewed.sections
    .map((s) => `## ${s.title}\n핵심 포인트: ${s.key_points.join(', ')}\n문체 가이드: ${s.tone_hints}`)
    .join('\n\n');

  const userContent = [
    `세계관 배경: ${input.background}`,
    `장르: ${input.genre}`,
    input.existingSetting ? `기존 설정:\n${input.existingSetting}` : '',
    ``,
    `생성할 섹션 및 핵심 정보:`,
    sectionGuide,
  ]
    .filter(Boolean)
    .join('\n');

  const stream = client.messages.stream({
    model: MODELS.sonnet,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
