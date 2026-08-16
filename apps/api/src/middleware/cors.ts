import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';

/**
 * CORS middleware configured from `CORS_ORIGIN` (comma-separated allowed
 * origins, e.g. `https://app.cohortlens.com,https://admin.cohortlens.com`).
 *
 * Returns `null` when CORS_ORIGIN is unset or `*` — the API then serves
 * same-origin traffic only (dev proxy / nginx proxy), the secure default.
 */
export function corsMiddleware(): MiddlewareHandler | null {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw || raw === '*') return null;

  const origins = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (origins.length === 0) return null;

  return cors({
    origin: (origin) => (origin && origins.includes(origin) ? origin : undefined),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86_400,
  });
}
