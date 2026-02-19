/**
 * In-memory per-IP rate limiter for Cloudflare Pages Functions.
 *
 * NOTE: Each Cloudflare Worker isolate has its own memory, so this store
 * is NOT shared across edge locations or worker restarts. For a hackathon
 * / demo scale this is perfectly acceptable.
 */

// ─── Types ────────────────────────────────────────────────────────────────────
interface StoreEntry {
  count:       number;
  windowStart: number;
}

export interface RateLimitConfig {
  /** Length of the sliding window in milliseconds. Default: 60_000 (1 min). */
  windowMs:    number;
  /** Maximum requests allowed within the window. Default: 20. */
  maxRequests: number;
}

export interface RateLimitResult {
  allowed:   boolean;
  /** Requests remaining in this window. */
  remaining: number;
  /** Milliseconds until the window resets. */
  resetIn:   number;
  limit:     number;
}

// ─── In-memory store ──────────────────────────────────────────────────────────
const store = new Map<string, StoreEntry>();

const DEFAULTS: RateLimitConfig = {
  windowMs:    60_000,
  maxRequests: 20,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Removes entries whose window has expired to prevent unbounded memory growth.
 * Called on every check — cheap because Maps iterate in insertion order and
 * most entries will be at the front.
 */
function pruneExpired(windowMs: number): void {
  const now = Date.now();
  for (const [ip, entry] of store) {
    if (now - entry.windowStart >= windowMs) {
      store.delete(ip);
    }
  }
}

/**
 * Extracts the real client IP from a Cloudflare-proxied request.
 * Prefers the `CF-Connecting-IP` header set by Cloudflare's edge.
 * Falls back to `X-Forwarded-For` and finally `'unknown'`.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

/**
 * Checks (and increments) the request count for `ip`.
 * Returns a {@link RateLimitResult} describing whether the call is allowed.
 *
 * @example
 *   const ip     = getClientIp(request);
 *   const result = checkRateLimit(ip);
 *   if (!result.allowed) return rateLimitResponse(result.resetIn);
 */
export function checkRateLimit(
  ip:      string,
  config?: Partial<RateLimitConfig>,
): RateLimitResult {
  const { windowMs, maxRequests } = { ...DEFAULTS, ...config };
  const now = Date.now();

  pruneExpired(windowMs);

  const entry = store.get(ip);

  if (!entry || now - entry.windowStart >= windowMs) {
    // Fresh window
    store.set(ip, { count: 1, windowStart: now });
    return {
      allowed:   true,
      remaining: maxRequests - 1,
      resetIn:   windowMs,
      limit:     maxRequests,
    };
  }

  // Within existing window
  const remaining = maxRequests - entry.count;
  if (remaining <= 0) {
    return {
      allowed:   false,
      remaining: 0,
      resetIn:   windowMs - (now - entry.windowStart),
      limit:     maxRequests,
    };
  }

  entry.count += 1;
  return {
    allowed:   true,
    remaining: remaining - 1,
    resetIn:   windowMs - (now - entry.windowStart),
    limit:     maxRequests,
  };
}
