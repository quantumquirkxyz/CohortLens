import { Hono } from 'hono';
import type { SubgraphClient } from './types';
import type { SyncStore } from './store';
import { transformFlows } from './transform';

export interface SyncAppDeps {
  subgraph: SubgraphClient;
  store: SyncStore;
  /** Chain ids (subgraph endpoint keys) for the /status endpoint. */
  chains: string[];
}

export function createSyncApp(deps: SyncAppDeps): Hono {
  const app = new Hono();

  // Poll the subgraph for new capital flows and write them into the CFG.
  app.post('/sync', async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== 'object' || typeof (body as Record<string, unknown>).chain !== 'string') {
      return c.json({ error: 'chain is required' }, 400);
    }
    const chain = (body as { chain: string }).chain;

    const cursor = await deps.store.getCursor(chain);
    const flows = await deps.subgraph.queryCapitalFlows(chain, cursor);

    if (flows.length === 0) {
      return c.json({ synced: 0, lastBlock: cursor });
    }

    const lastBlock = flows.reduce(
      (max, flow) => Math.max(max, Number(flow.blockNumber)),
      cursor,
    );
    const batch = transformFlows(flows);
    const synced = await deps.store.ingest(batch);
    await deps.store.setCursor(chain, lastBlock);

    return c.json({ synced, lastBlock });
  });

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.get('/status', async (c) => {
    const cursors: Array<{ chain: string; lastBlock: number }> = [];
    for (const chain of deps.chains) {
      cursors.push({ chain, lastBlock: await deps.store.getCursor(chain) });
    }
    return c.json({ chains: cursors });
  });

  return app;
}
