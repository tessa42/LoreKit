
import { NextRequest } from 'next/server';
import { normalizeLorecraft } from '@/lib/ai/pipeline/lorecraft/normalize';
import { analyzeLorecraft } from '@/lib/ai/pipeline/lorecraft/analyze';
import { planLorecraft } from '@/lib/ai/pipeline/lorecraft/plan';
import { researchLorecraft } from '@/lib/ai/pipeline/lorecraft/research';
import { synthesizeLorecraft } from '@/lib/ai/pipeline/lorecraft/synthesize';
import { reviewLorecraft } from '@/lib/ai/pipeline/lorecraft/review';
import { generateLorecraft } from '@/lib/ai/pipeline/lorecraft/generate';
import { createClient } from '@/lib/supabase/server';
import { canSpendCredits, spendCredits } from '@/lib/credits/transaction';
import type { LorcraftInput } from '@/types/lorecraft';

const LORECRAFT_COST = 5;

function sseEvent(type: string, data: unknown): string {
  return `data: ${JSON.stringify({ type, ...( typeof data === 'object' ? data : { value: data }) })}\n\n`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(
      JSON.stringify({ ok: false, error: '로그인이 필요합니다.', code: 'unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const hasCredits = await canSpendCredits(user.id, LORECRAFT_COST);
  if (!hasCredits) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: '씨앗이 부족합니다',
        code: 'insufficient_credits',
      }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: LorcraftInput;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: '잘못된 요청입니다.', code: 'invalid_json' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const encoder = new TextEncoder();

  const signal = request.signal;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(sseEvent(type, data)));
        } catch {
          // 연결 끊긴 경우 조용히 무시
        }
      };

      try {
        // 1. normalize
        const normalized = normalizeLorecraft(body);
        send('progress', { step: 'normalize', message: '입력값 검증 완료' });

        // 2. analyze
        if (signal.aborted) return;
        send('progress', { step: 'analyze', message: '세계관 분석 중...' });
        const analysis = await analyzeLorecraft(normalized);
        send('progress', { step: 'analyze', message: '세계관 분석 완료' });

        // 3. plan
        if (signal.aborted) return;
        send('progress', { step: 'plan', message: '생성 계획 수립 중...' });
        const plan = await planLorecraft(normalized, analysis);
        send('progress', { step: 'plan', message: '생성 계획 완료' });

        // 4. research
        if (signal.aborted) return;
        send('progress', { step: 'research', message: '배경 리서치 중...' });
        const research = await researchLorecraft(normalized, analysis, plan);
        send('progress', { step: 'research', message: '배경 리서치 완료' });

        // 5. synthesize
        if (signal.aborted) return;
        send('progress', { step: 'synthesize', message: '자료 합성 중...' });
        const synthesized = await synthesizeLorecraft(plan, research);
        send('progress', { step: 'synthesize', message: '자료 합성 완료' });

        // 6. review
        if (signal.aborted) return;
        send('progress', { step: 'review', message: '설정 검토 중...' });
        const reviewed = await reviewLorecraft(normalized, synthesized);
        send('progress', { step: 'review', message: '설정 검토 완료' });

        // 7. generate (streaming)
        if (signal.aborted) return;
        send('progress', { step: 'generate', message: '설정집 생성 중...' });
        const generateStream = await generateLorecraft(normalized, reviewed);
        const reader = generateStream.getReader();

        const decoder = new TextDecoder();
        while (true) {
          if (signal.aborted) return;
          const { done, value } = await reader.read();
          if (done) break;
          send('chunk', { text: decoder.decode(value) });
        }

        await spendCredits(user.id, LORECRAFT_COST, 'lorecraft');
        send('done', { step: 'generate', message: '생성 완료' });
        controller.close();
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[lorecraft] pipeline failed:', err);
        const message = err instanceof Error ? err.message : '설정집 생성에 실패했습니다.';
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
