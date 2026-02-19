/**
 * Shared response utilities for Cloudflare Pages Functions.
 *
 * Centralises:
 *  - CORS headers
 *  - JSON success / error response construction
 *  - CORS preflight handler
 *  - API-key guard
 */

// ─── CORS headers ─────────────────────────────────────────────────────────────
// Included on every JSON response so the browser never blocks a cross-origin call.
export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

// ─── Success response ─────────────────────────────────────────────────────────
/**
 * Returns a JSON `200 OK` (or custom status) with CORS headers.
 *
 * @example
 *   return jsonOk({ result: 'hello' });
 *   return jsonOk({ created: true }, 201);
 */
export function jsonOk(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}

// ─── Error response ───────────────────────────────────────────────────────────
/**
 * Returns a JSON error response with CORS headers.
 * `details` is included only when provided, keeping clean error shapes for clients.
 *
 * @example
 *   return jsonError('Missing required field: worldType.', 400);
 *   return jsonError('AI service error.', 502, aiMessage);
 */
export function jsonError(
  message: string,
  status = 500,
  details?: string,
): Response {
  const body: Record<string, string> = { error: message };
  if (details) body.details = details;
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS,
  });
}

// ─── CORS preflight ───────────────────────────────────────────────────────────
/**
 * Returns a well-formed CORS preflight response.
 * Re-export this as `onRequestOptions` in each function file:
 *
 * @example
 *   export const onRequestOptions: PagesFunction = () => Promise.resolve(corsPreflightResponse());
 */
export function corsPreflightResponse(methods = 'GET, POST, OPTIONS'): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// ─── API-key guard ────────────────────────────────────────────────────────────
/**
 * Returns a `500` error Response when the OpenAI key is absent, otherwise `null`.
 * Call at the top of every AI-dependent handler.
 *
 * @example
 *   const guard = requireApiKey(env.OPENAI_API_KEY);
 *   if (guard) return guard;
 */
export function requireApiKey(key: string | undefined): Response | null {
  if (!key?.trim()) {
    return jsonError(
      'Server configuration error: OPENAI_API_KEY is not set.',
      500,
    );
  }
  return null;
}

// ─── Rate-limit response ───────────────────────────────────────────────────────
/**
 * Returns a `429 Too Many Requests` response with a `Retry-After` header.
 *
 * @param resetInMs - Milliseconds until the current rate-limit window resets.
 *
 * @example
 *   const rl = checkRateLimit(ip);
 *   if (!rl.allowed) return rateLimitResponse(rl.resetIn);
 */
export function rateLimitResponse(resetInMs: number): Response {
  const retryAfterSec = Math.ceil(resetInMs / 1_000);
  return new Response(
    JSON.stringify({
      error:    'Too many requests. Please wait before trying again.',
      retryAfterSeconds: retryAfterSec,
    }),
    {
      status:  429,
      headers: {
        ...CORS_HEADERS,
        'Retry-After': String(retryAfterSec),
      },
    },
  );
}
