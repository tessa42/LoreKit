/**
 * GET /api/health
 *
 * Lightweight liveness probe. Returns:
 *  - ok: true
 *  - timestamp: ISO-8601 string
 *  - service name / version
 *  - whether OPENAI_API_KEY is present (without exposing its value)
 */
import type { Env } from '../_shared/env';
import { jsonOk, corsPreflightResponse } from '../_shared/response';

export const onRequestGet: PagesFunction<Env> = ({ env }) => {
  return Promise.resolve(
    jsonOk({
      ok:        true,
      timestamp: new Date().toISOString(),
      service:   'LoreKit API',
      version:   '1.0.0',
      env: {
        openai: env.OPENAI_API_KEY ? 'configured' : 'missing',
      },
    }),
  );
};

export const onRequestOptions: PagesFunction = () =>
  Promise.resolve(corsPreflightResponse('GET, OPTIONS'));
