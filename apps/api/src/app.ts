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
import { corsMiddleware } from './middleware/cors';
import { createRateLimiter } from './middleware/rate-limit';
import { securityHeaders } from './middleware/security';
import { createAnalysisRoutes } from './routes/analysis';
import { graph } from './routes/graph';
import { createLensRoutes } from './routes/lenses';

export const app = new Hono();

// --- Security hardening (Fase 8). Registered before routes: Hono middleware
// must be in place before the handlers it wraps. ---
app.use('*', securityHeaders());

const cors = corsMiddleware();
if (cors) app.use('*', cors);

// Rate limiting only in production: dev/E2E/test traffic must not hit 429s.
if (process.env.NODE_ENV === 'production') {
  const trustProxy = process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true';
  app.use(
    '*',
    createRateLimiter({
      max: Number(process.env.RATE_LIMIT_MAX ?? 300),
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
      trustProxy,
      skip: (c) => c.req.path === '/health',
    }),
  );
}

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

const MAX_ANALYSIS_FLOWS = 10_000;

async function loadAllFlows(): Promise<Awaited<ReturnType<typeof listFlows>>> {
  const all: Awaited<ReturnType<typeof listFlows>> = [];
  let offset = 0;
  while (all.length < MAX_ANALYSIS_FLOWS) {
    const page = await listFlows(getDb(), { limit: 500, offset });
    all.push(...page);
    if (page.length < 500) break;
    offset += 500;
  }
  return all.slice(0, MAX_ANALYSIS_FLOWS);
}

app.route('/api/analysis', createAnalysisRoutes({ loadFlows: loadAllFlows }));
