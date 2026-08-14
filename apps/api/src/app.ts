import { Hono } from 'hono';

export const app = new Hono();

app.get('/', (c) =>
  c.json({
    name: 'CohortLens API',
    version: '0.1.0',
    health: '/health',
  }),
);

app.get('/health', (c) => c.json({ status: 'ok' }));
