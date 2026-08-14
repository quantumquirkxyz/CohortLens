import { Hono } from 'hono';
import {
  createFlow,
  getFlow,
  getNeighborhood,
  getStats,
  listFlows,
  listNodes,
  type CreateCapitalFlowInput,
} from '@cohortlens/database';
import { isFlowType, isNodeType } from '@cohortlens/shared';
import { getDb } from '../db';

export const graph = new Hono();

graph.get('/nodes', async (c) => {
  const nodes = await listNodes(getDb());
  return c.json({ nodes });
});

graph.get('/flows', async (c) => {
  const flows = await listFlows(getDb());
  return c.json({ flows });
});

graph.get('/flow/:id', async (c) => {
  const flow = await getFlow(getDb(), c.req.param('id'));
  if (!flow) return c.json({ error: 'flow not found' }, 404);
  return c.json(flow);
});

// Indexer webhook: ingest a new capital flow.
graph.post('/flows', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return c.json({ error: 'invalid JSON body' }, 400);
  }
  const input = parseFlowInput(body as Record<string, unknown>);
  if (!input) return c.json({ error: 'invalid capital flow payload' }, 400);

  try {
    const flow = await createFlow(getDb(), input);
    return c.json(flow, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return c.json({ error: `failed to create flow: ${message}` }, 400);
  }
});

graph.get('/stats', async (c) => {
  const stats = await getStats(getDb());
  return c.json(stats);
});

graph.get('/neighborhood/:id', async (c) => {
  const neighborhood = await getNeighborhood(getDb(), c.req.param('id'));
  if (!neighborhood) return c.json({ error: 'node not found' }, 404);
  return c.json(neighborhood);
});

function parseFlowInput(body: Record<string, unknown>): CreateCapitalFlowInput | null {
  const {
    fromNodeId,
    fromNodeType,
    toNodeId,
    toNodeType,
    type,
    amount,
    assetId,
    chainId,
    timestamp,
    metadata,
  } = body;

  if (typeof fromNodeId !== 'string' || fromNodeId.length === 0) return null;
  if (typeof toNodeId !== 'string' || toNodeId.length === 0) return null;
  if (!isNodeType(fromNodeType) || !isNodeType(toNodeType)) return null;
  if (!isFlowType(type)) return null;
  if (typeof amount !== 'string' || !/^\d+(\.\d+)?$/.test(amount)) return null;
  if (typeof assetId !== 'string' || assetId.length === 0) return null;
  if (typeof chainId !== 'string' || chainId.length === 0) return null;

  return {
    fromNodeId,
    fromNodeType,
    toNodeId,
    toNodeType,
    type,
    amount,
    assetId,
    chainId,
    timestamp: typeof timestamp === 'string' ? new Date(timestamp) : undefined,
    metadata:
      metadata && typeof metadata === 'object'
        ? (metadata as Record<string, unknown>)
        : undefined,
  };
}
