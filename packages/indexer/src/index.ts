import { serve } from '@hono/node-server';
import { createDb } from '@cohortlens/database';
import { createSyncApp } from './app';
import { createGraphqlSubgraphClient } from './subgraph-client';
import { createDbSyncStore } from './store';

const port = Number(process.env.PORT ?? 8001);

// Subgraph endpoints, one per chain: SUBGRAPH_URL_ETHEREUM=...
const endpoints: Record<string, string> = {};
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith('SUBGRAPH_URL_') && value) {
    endpoints[key.replace('SUBGRAPH_URL_', '').toLowerCase()] = value;
  }
}
const chains = Object.keys(endpoints);
if (chains.length === 0) {
  console.warn(
    'No SUBGRAPH_URL_<CHAIN> env vars set — /sync will fail until endpoints are configured.',
  );
}

const db = createDb();
const app = createSyncApp({
  subgraph: createGraphqlSubgraphClient(endpoints),
  store: createDbSyncStore(db),
  chains,
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`CohortLens indexer listening on http://localhost:${info.port}`);
});
