import { afterEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { corsMiddleware } from './cors';
import { createRateLimiter } from './rate-limit';
import { securityHeaders } from './security';

describe('securityHeaders', () => {
  it('sets baseline security headers on every response', async () => {
    const app = new Hono();
    app.use('*', securityHeaders());
    app.get('/x', (c) => c.json({ ok: true }));

    const res = await app.request('/x');
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(res.headers.get('Permissions-Policy')).toContain('camera=()');
  });
});

describe('createRateLimiter', () => {
  it('rejects requests above the per-window limit with 429', async () => {
    const app = new Hono();
    app.use(
      '*',
      createRateLimiter({ max: 2, windowMs: 1_000 }),
    );
    app.get('/x', (c) => c.json({ ok: true }));

    expect((await app.request('/x')).status).toBe(200);
    expect((await app.request('/x')).status).toBe(200);
    const rejected = await app.request('/x');
    expect(rejected.status).toBe(429);
    expect(rejected.headers.get('Retry-After')).toBeTruthy();
    expect(await rejected.json()).toEqual({ error: 'rate limit exceeded' });
  });

  it('keys buckets by client IP', async () => {
    const app = new Hono();
    app.use('*', createRateLimiter({ max: 1, windowMs: 1_000 }));
    app.get('/x', (c) => c.json({ ok: true }));

    expect((await app.request('/x', { headers: { 'x-real-ip': '1.1.1.1' } })).status).toBe(200);
    expect((await app.request('/x', { headers: { 'x-real-ip': '2.2.2.2' } })).status).toBe(200);
    expect((await app.request('/x', { headers: { 'x-real-ip': '1.1.1.1' } })).status).toBe(429);
  });

  it('uses x-forwarded-for when trustProxy is enabled', async () => {
    const app = new Hono();
    app.use('*', createRateLimiter({ max: 1, windowMs: 1_000, trustProxy: true }));
    app.get('/x', (c) => c.json({ ok: true }));

    const forwarded = { headers: { 'x-forwarded-for': '9.9.9.9' } };
    expect((await app.request('/x', forwarded)).status).toBe(200);
    expect((await app.request('/x', forwarded)).status).toBe(429);
  });

  it('skips requests matched by the skip predicate', async () => {
    const app = new Hono();
    app.use('*', createRateLimiter({ max: 1, windowMs: 1_000, skip: (c) => c.req.path === '/health' }));
    app.get('/health', (c) => c.json({ status: 'ok' }));

    expect((await app.request('/health')).status).toBe(200);
    expect((await app.request('/health')).status).toBe(200);
  });

  it('exposes rate limit headers', async () => {
    const app = new Hono();
    app.use('*', createRateLimiter({ max: 5, windowMs: 1_000 }));
    app.get('/x', (c) => c.json({ ok: true }));

    const res = await app.request('/x');
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('4');
  });
});

describe('corsMiddleware', () => {
  const ORIGINAL = process.env.CORS_ORIGIN;

  afterEach(() => {
    process.env.CORS_ORIGIN = ORIGINAL;
  });

  it('returns null (same-origin only) when CORS_ORIGIN is unset', () => {
    delete process.env.CORS_ORIGIN;
    expect(corsMiddleware()).toBeNull();
  });

  it('allows configured origins and rejects others', async () => {
    process.env.CORS_ORIGIN = 'https://app.cohortlens.com, https://admin.cohortlens.com';
    const app = new Hono();
    const cors = corsMiddleware();
    if (cors) app.use('*', cors);
    app.get('/x', (c) => c.json({ ok: true }));

    const allowed = await app.request('/x', { headers: { origin: 'https://app.cohortlens.com' } });
    expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe('https://app.cohortlens.com');

    const denied = await app.request('/x', { headers: { origin: 'https://evil.example.com' } });
    expect(denied.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
