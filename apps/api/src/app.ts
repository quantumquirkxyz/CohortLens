import { Hono } from 'hono';
import { APP_NAME } from '@cohortlens/shared';
import { graph } from './routes/graph';

export const app = new Hono();

app.get('/', (c) =>
  c.json({
    name: APP_NAME,
    service: 'api',
    version: '0.1.0',
    health: '/health',
  }),
);

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/api/graph', graph);
