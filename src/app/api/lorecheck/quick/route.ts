import { NextRequest } from 'next/server';
import { normalizeLorcheckQuick } from '@/lib/ai/pipeline/lorecheck/quick/normalize';
import { analyzeLorcheckQuick } from '@/lib/ai/pipeline/lorecheck/quick/analyze';
import { checkLorcheckQuick } from '@/lib/ai/pipeline/lorecheck/quick/check';
import { formatLorcheckQuick } from '@/lib/ai/pipeline/lorecheck/quick/format';
import type { LorcheckQuickInput } from '@/types/lorecheck';

function sseEvent(type: string, data: unknown): string {
  return `data: ${JSON.stringify({ type, ...(typeof data === 'object' ? data : { value: data }) })}\n\n`;
}

export async function POST(request: NextRequest) {
  let body: LorcheckQuickInput;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: '잘못된 요청입니다.', code: 'invalid_json' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(type, data)));
      };

      try {
        // 1. normalize
        const normalized = normalizeLorcheckQuick(body);
        send('progress', { step: 'normalize', message: '입력값 검증 완료' });

        // 2. analyze
        send('progress', { step: 'analyze', message: '텍스트 분석 중...' });
        const analysis = await analyzeLorcheckQuick(normalized);
        send('progress', { step: 'analyze', message: '텍스트 분석 완료' });

        // 3. check
        send('progress', { step: 'check', message: '고증 검토 중...' });
        const checkResult = await checkLorcheckQuick(normalized, analysis);
        send('progress', { step: 'check', message: '고증 검토 완료' });

        // 4. format
        const payload = formatLorcheckQuick(normalized, checkResult);
        send('done', { step: 'format', payload });

        controller.close();
      } catch (err) {
        console.error('[lorecheck/quick] pipeline failed:', err);
        const message = err instanceof Error ? err.message : '고증 검토에 실패했습니다.';
        send('error', { message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
