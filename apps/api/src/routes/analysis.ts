import { Hono } from 'hono';
import type { CapitalFlow } from '@cohortlens/shared';
import {
  betweennessCentrality,
  degreeCentrality,
  detectCoMovement,
  detectCommunities,
  findCheapestPath,
  isRecord,
} from '@cohortlens/shared';

export interface AnalysisRoutesDeps {
  /** Loads the full Capital Flow Graph edge list for analysis. */
  loadFlows: () => Promise<CapitalFlow[]>;
}

export function createAnalysisRoutes(deps: AnalysisRoutesDeps): Hono {
  const app = new Hono();

  app.get('/communities', async (c) => {
    const flows = await deps.loadFlows();
    return c.json({ cohorts: detectCommunities(flows) });
  });

  app.get('/path', async (c) => {
    const source = c.req.query('source');
    const target = c.req.query('target');
    if (!source || !target) {
      return c.json({ error: 'source and target query params are required' }, 400);
    }
    const flows = await deps.loadFlows();
    const route = findCheapestPath(flows, source, target);
    if (!route) return c.json({ error: `no path found from ${source} to ${target}` }, 404);
    return c.json({ route });
  });

  app.get('/centrality', async (c) => {
    const flows = await deps.loadFlows();
    return c.json({
      degree: degreeCentrality(flows),
      betweenness: betweennessCentrality(flows),
    });
  });

  app.get('/co-movement', async (c) => {
    const assetsParam = c.req.query('assets');
    const assets = assetsParam
      ? assetsParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    const flows = await deps.loadFlows();
    return c.json({ result: detectCoMovement(flows, assets) });
  });

  // Generic dispatcher for custom graph queries (plan §3.3).
  app.post('/custom', async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!isRecord(body)) return c.json({ error: 'invalid JSON body' }, 400);
    const algorithm = body.algorithm;
    const params = isRecord(body.params) ? body.params : {};
    const flows = await deps.loadFlows();

    switch (algorithm) {
      case 'communities':
        return c.json({ result: { cohorts: detectCommunities(flows) } });
      case 'centrality':
        return c.json({
          result: {
            degree: degreeCentrality(flows),
            betweenness: betweennessCentrality(flows),
          },
        });
      case 'co-movement': {
        const assets =
          Array.isArray(params.assets) && params.assets.every((a) => typeof a === 'string')
            ? (params.assets as string[])
            : undefined;
        return c.json({ result: detectCoMovement(flows, assets) });
      }
      case 'path': {
        if (typeof params.source !== 'string' || typeof params.target !== 'string') {
          return c.json({ error: 'params.source and params.target are required' }, 400);
        }
        const route = findCheapestPath(flows, params.source, params.target);
        if (!route) return c.json({ error: 'no path found' }, 404);
        return c.json({ result: { route } });
      }
      default:
        return c.json({ error: `unknown algorithm: ${String(algorithm)}` }, 400);
    }
  });

  return app;
}
