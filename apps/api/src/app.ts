import { Hono } from 'hono';
import { APP_NAME } from '@cohortlens/shared';
import { getStats, listFlows, listNodes } from '@cohortlens/database';
import {
  ExecutionStore,
  LensRegistry,
  createEngine,
  highRiskWallets,
  type GraphPort,
} from '@cohortlens/lenses';
import { getDb } from './db';
import { graph } from './routes/graph';
import { createLensRoutes } from './routes/lenses';

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

const lensRegistry = new LensRegistry();
lensRegistry.register(highRiskWallets);
const lensGraph: GraphPort = {
  listNodes: () => listNodes(getDb()),
  listFlows: (opts) => listFlows(getDb(), opts),
  getStats: () => getStats(getDb()),
};
app.route(
  '/api/lenses',
  createLensRoutes({
    registry: lensRegistry,
    engine: createEngine(lensRegistry),
    store: new ExecutionStore(),
    graph: lensGraph,
  }),
);
