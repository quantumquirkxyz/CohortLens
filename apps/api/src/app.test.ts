import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from './app';

const {
  mockListNodes,
  mockListFlows,
  mockGetFlow,
  mockCreateFlow,
  mockGetStats,
  mockGetNeighborhood,
} = vi.hoisted(() => ({
  mockListNodes: vi.fn(),
  mockListFlows: vi.fn(),
  mockGetFlow: vi.fn(),
  mockCreateFlow: vi.fn(),
  mockGetStats: vi.fn(),
  mockGetNeighborhood: vi.fn(),
}));

vi.mock('@cohortlens/database', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@cohortlens/database')>();
  return {
    ...mod,
    listNodes: mockListNodes,
    listFlows: mockListFlows,
    getFlow: mockGetFlow,
    createFlow: mockCreateFlow,
    getStats: mockGetStats,
    getNeighborhood: mockGetNeighborhood,
  };
});

const walletNode = { type: 'wallet', id: 'wallet-1', label: 'Algo Fund' };
// Timestamps arrive as ISO strings once serialized by Hono (c.json).
const sampleFlow = {
  id: 'flow-1',
  from: { id: 'wallet-1', type: 'wallet' },
  to: { id: 'aave-v3-usdc-ethereum', type: 'pool' },
  type: 'Deposit',
  amount: '42.5',
  asset: 'USDC',
  chain: 'Ethereum',
  timestamp: '2026-08-01T00:00:00.000Z',
  metadata: { txHash: '0xabc' },
};

describe('CohortLens API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListNodes.mockResolvedValue([walletNode]);
    mockListFlows.mockResolvedValue([sampleFlow]);
    mockGetFlow.mockResolvedValue(sampleFlow);
    mockCreateFlow.mockResolvedValue(sampleFlow);
    mockGetStats.mockResolvedValue({
      nodes: { chain: 3, protocol: 5, wallet: 8, asset: 10, pool: 10, position: 8 },
      flows: 50,
      flowsByType: {
        Deposit: 9,
        Borrow: 8,
        Repay: 9,
        Withdraw: 8,
        Swap: 8,
        Transfer: 8,
      },
    });
    mockGetNeighborhood.mockResolvedValue({ node: walletNode, flows: [sampleFlow] });
  });

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

  it('lists graph nodes', async () => {
    const res = await app.request('/api/graph/nodes');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { nodes: unknown[] };
    expect(body.nodes).toEqual([walletNode]);
    expect(mockListNodes).toHaveBeenCalledTimes(1);
  });

  it('lists graph flows with pagination metadata', async () => {
    const res = await app.request('/api/graph/flows');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ flows: [sampleFlow], page: 1, limit: 100 });
    expect(mockListFlows).toHaveBeenCalledWith(expect.anything(), {
      limit: 100,
      offset: 0,
    });
  });

  it('pages through flows with limit and page query params', async () => {
    const res = await app.request('/api/graph/flows?limit=5&page=2');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ flows: [sampleFlow], page: 2, limit: 5 });
    expect(mockListFlows).toHaveBeenCalledWith(expect.anything(), {
      limit: 5,
      offset: 5,
    });
  });

  it('clamps the limit query param to the max page size', async () => {
    await app.request('/api/graph/flows?limit=9999');
    expect(mockListFlows).toHaveBeenCalledWith(expect.anything(), {
      limit: 500,
      offset: 0,
    });
  });

  it('returns a single flow by id', async () => {
    const res = await app.request('/api/graph/flow/flow-1');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(sampleFlow);
  });

  it('returns 404 for an unknown flow', async () => {
    mockGetFlow.mockResolvedValue(null);
    const res = await app.request('/api/graph/flow/nope');
    expect(res.status).toBe(404);
  });

  it('creates a valid flow', async () => {
    const res = await app.request('/api/graph/flows', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fromNodeId: 'wallet-1',
        fromNodeType: 'wallet',
        toNodeId: 'aave-v3-usdc-ethereum',
        toNodeType: 'pool',
        type: 'Deposit',
        amount: '42.5',
        assetId: 'usdc',
        chainId: 'ethereum',
      }),
    });
    expect(res.status).toBe(201);
    expect(mockCreateFlow).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'Deposit', amount: '42.5' }),
    );
  });

  it('rejects a flow with an invalid type', async () => {
    const res = await app.request('/api/graph/flows', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fromNodeId: 'wallet-1',
        fromNodeType: 'wallet',
        toNodeId: 'aave-v3-usdc-ethereum',
        toNodeType: 'pool',
        type: 'Stake',
        amount: '42.5',
        assetId: 'usdc',
        chainId: 'ethereum',
      }),
    });
    expect(res.status).toBe(400);
    expect(mockCreateFlow).not.toHaveBeenCalled();
  });

  it('rejects a flow with a non-numeric amount', async () => {
    const res = await app.request('/api/graph/flows', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fromNodeId: 'wallet-1',
        fromNodeType: 'wallet',
        toNodeId: 'aave-v3-usdc-ethereum',
        toNodeType: 'pool',
        type: 'Deposit',
        amount: 'many',
        assetId: 'usdc',
        chainId: 'ethereum',
      }),
    });
    expect(res.status).toBe(400);
  });

  it('returns graph stats', async () => {
    const res = await app.request('/api/graph/stats');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { flows: number; nodes: Record<string, number> };
    expect(body.flows).toBe(50);
    expect(Object.keys(body.nodes)).toHaveLength(6);
  });

  it('returns the neighborhood of a node', async () => {
    const res = await app.request('/api/graph/neighborhood/wallet-1');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ node: walletNode, flows: [sampleFlow] });
  });

  it('returns 404 for an unknown node neighborhood', async () => {
    mockGetNeighborhood.mockResolvedValue(null);
    const res = await app.request('/api/graph/neighborhood/nope');
    expect(res.status).toBe(404);
  });
});
