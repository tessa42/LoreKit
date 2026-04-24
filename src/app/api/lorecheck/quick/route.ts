
import { NextRequest } from 'next/server';
import { normalizeLorcheckQuick } from '@/lib/ai/pipeline/lorecheck/quick/normalize';
import { analyzeLorcheckQuick } from '@/lib/ai/pipeline/lorecheck/quick/analyze';
import { researchLorcheckQuick } from '@/lib/ai/pipeline/lorecheck/quick/research';
import { checkLorcheckQuick } from '@/lib/ai/pipeline/lorecheck/quick/check';
import { formatLorcheckQuick } from '@/lib/ai/pipeline/lorecheck/quick/format';
import { createClient } from '@/lib/supabase/server';
import { canSpendCredits, spendCredits, refundCredits } from '@/lib/credits/transaction';
import type { LorcheckQuickInput } from '@/types/lorecheck';

const LORECHECK_QUICK_COST = 1;

function sseEvent(type: string, data: unknown): string {
  return `data: ${JSON.stringify({ type, ...(typeof data === 'object' ? data : { value: data }) })}\n\n`;
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

  const hasCredits = await canSpendCredits(user.id, LORECHECK_QUICK_COST);
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

  let body: LorcheckQuickInput;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: '잘못된 요청입니다.', code: 'invalid_json' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    await spendCredits(user.id, LORECHECK_QUICK_COST, 'lorecheck_quick');
    console.log('[lorecheck] credits spent:', user.id, LORECHECK_QUICK_COST);
  } catch (err) {
    console.error('[lorecheck] spendCredits failed:', err);
    return new Response(
      JSON.stringify({ ok: false, error: '씨앗 차감에 실패했습니다.', code: 'credit_error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
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
        const normalized = normalizeLorcheckQuick(body);
        send('progress', { step: 'normalize', message: '입력값 검증 완료' });

        // 2. analyze
        if (signal.aborted) return;
        send('progress', { step: 'analyze', message: '텍스트 분석 중...' });
        const analysis = await analyzeLorcheckQuick(normalized);
        send('progress', { step: 'analyze', message: '텍스트 분석 완료' });

        // 3. research
        if (signal.aborted) return;
        send('progress', { step: 'research', message: '내부자 맥락 분석 중...' });
        const research = await researchLorcheckQuick(normalized, analysis);
        send('progress', { step: 'research', message: '내부자 맥락 분석 완료' });

        // 4. check
        if (signal.aborted) return;
        send('progress', { step: 'check', message: '고증 검토 중...' });
        const checkResult = await checkLorcheckQuick(normalized, analysis, research);
        send('progress', { step: 'check', message: '고증 검토 완료' });

        // 5. format
        if (signal.aborted) return;
        const payload = formatLorcheckQuick(normalized, checkResult);
        send('done', { step: 'format', payload });

        controller.close();
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[lorecheck/quick] pipeline failed:', err);
        try {
          await refundCredits(user.id, LORECHECK_QUICK_COST, 'lorecheck_quick');
          console.log('[lorecheck] credits refunded:', user.id, LORECHECK_QUICK_COST);
        } catch (refundErr) {
          console.error('[lorecheck] refundCredits failed:', refundErr);
        }
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
