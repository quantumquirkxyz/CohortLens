import type { Context, MiddlewareHandler } from 'hono';

export interface RateLimiterOptions {
  /** Maximum requests per window per client. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /**
   * When true, the client IP is taken from the `x-forwarded-for` header
   * (behind nginx / a load balancer). Never enable unless the API is only
   * reachable through a trusted proxy, otherwise the header can be spoofed.
   */
  trustProxy?: boolean;
  /** Requests matching this predicate are not counted (e.g. `/health`). */
  skip?: (c: Context) => boolean;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window in-memory rate limiter. Suitable for a single API instance;
 * scale-out deployments should swap in a shared store (e.g. Redis/Valkey —
 * see docs/deploy.md).
 */
export function createRateLimiter(options: RateLimiterOptions): MiddlewareHandler {
  const max = options.max > 0 ? options.max : 300;
  const windowMs = options.windowMs > 0 ? options.windowMs : 60_000;
  const buckets = new Map<string, Bucket>();

  // Periodically drop expired buckets so the map does not grow unbounded.
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, windowMs);
  timer.unref?.();

  return async (c, next) => {
    if (options.skip?.(c)) return next();

    const key = clientKey(c, options.trustProxy ?? false);
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(Math.max(max - bucket.count, 0)));

    if (bucket.count > max) {
      c.header('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return c.json({ error: 'rate limit exceeded' }, 429);
    }
    await next();
  };
}

function clientKey(c: Context, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = c.req.header('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim();
    if (ip) return ip;
  }
  return c.req.header('x-real-ip') ?? 'unknown';
}
