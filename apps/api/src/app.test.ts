import { describe, expect, it } from 'vitest';
import { app } from './app';

describe('CohortLens API', () => {
  it('responds on /health', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('responds on / with the shared app name', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { name: string; service: string };
    expect(body.name).toBe('CohortLens');
    expect(body.service).toBe('api');
  });
});
