export const runtime = 'edge';

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/utils/api';
import { validateInput, normalizeInput } from '@/lib/ai/pipeline/simulator/normalize';
import { generateSimulation } from '@/lib/ai/pipeline/simulator/generate';
import { formatResponse } from '@/lib/ai/pipeline/simulator/format';
import type { SimulatorInput } from '@/types/simulator';

export async function POST(request: NextRequest) {
  let body: SimulatorInput;

  try {
    body = await request.json();
  } catch {
    return apiError('잘못된 요청입니다.', 'invalid_json', 400);
  }

  const validationError = validateInput(body);
  if (validationError) {
    return apiError(validationError, 'validation_error', 400);
  }

  const input = normalizeInput(body);

  try {
    const raw = await generateSimulation(input);
    const result = formatResponse(raw);
    return apiSuccess(result);
  } catch (err) {
    console.error('[simulator] generation failed:', err);
    return apiError('시뮬레이션 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'generation_failed', 500);
  }
}
