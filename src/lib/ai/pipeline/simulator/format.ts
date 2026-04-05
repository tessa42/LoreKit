import type { SimulatorResult } from '@/types/simulator';

export function formatResponse(raw: string): SimulatorResult {
  // ```json ... ``` 블록 제거
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`응답 JSON 파싱 실패: ${raw}`);
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).summary !== 'string' ||
    typeof (parsed as Record<string, unknown>).story !== 'string' ||
    typeof (parsed as Record<string, unknown>).quote !== 'string'
  ) {
    throw new Error(`응답 형식 불일치: ${JSON.stringify(parsed)}`);
  }

  const result = parsed as SimulatorResult;
  return {
    summary: result.summary.trim(),
    story: result.story.trim(),
    quote: result.quote.trim(),
  };
}
