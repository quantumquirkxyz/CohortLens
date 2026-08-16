import type { MiddlewareHandler } from 'hono';

/**
 * Baseline security headers for every API response (Fase 8 — Security).
 */
export const securityHeaders = (): MiddlewareHandler =>
  async (c, next) => {
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    await next();
  };
