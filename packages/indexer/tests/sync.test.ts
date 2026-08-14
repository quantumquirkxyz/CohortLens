import { describe, expect, it, vi } from 'vitest';
import { createSyncApp } from '../src/app';
import type { SubgraphCapitalFlow, SubgraphClient } from '../src/types';
import type { SyncStore } from '../src/store';
import type { SyncBatch } from '../src/transform';

function fixtureFlow(blockNumber: string, id = '0xabc-1'): SubgraphCapitalFlow {
  return {
    id,
    type: 'DEPOSIT',
    fromWallet: { id: '0x1111', address: '0x1111' },
    toWallet: { id: '0x2222', address: '0x2222' },
    pool: {
      id: '0xpool',
      address: '0xpool',
      protocol: { id: 'aave', name: 'Aave V3', chain: { id: 'ethereum', name: 'Ethereum' } },
    },
    asset: { id: '0xtoken', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    chain: { id: 'ethereum', name: 'Ethereum' },
    amount: '100',
    timestamp: '1700000000',
    blockNumber,
    transactionHash: '0xabc',
  };
}

function makeDeps(overrides: Partial<{ flows: SubgraphCapitalFlow[] }> = {}) {
  const queryCapitalFlows = vi.fn().mockResolvedValue(overrides.flows ?? []);
  const subgraph: SubgraphClient = { queryCapitalFlows };

  const ingest = vi.fn(async (batch: SyncBatch) => batch.flows.length);
  const store: SyncStore = {
    getCursor: vi.fn(async () => 0),
    setCursor: vi.fn(async () => undefined),
    ingest,
  };

  const app = createSyncApp({ subgraph, store, chains: ['ethereum', 'polygon'] });
  return { app, queryCapitalFlows, store };
}

describe('sync service', () => {
  it('health check responds ok', async () => {
    const { app } = makeDeps();
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('syncs flows after the stored cursor and advances it', async () => {
    const { app, queryCapitalFlows, store } = makeDeps({
      flows: [fixtureFlow('200'), fixtureFlow('210'), fixtureFlow('205')],
    });
    (store.getCursor as ReturnType<typeof vi.fn>).mockResolvedValue(150);

    const res = await app.request('/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chain: 'ethereum' }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ synced: 3, lastBlock: 210 });
    expect(queryCapitalFlows).toHaveBeenCalledWith('ethereum', 150);
    expect(store.ingest).toHaveBeenCalledTimes(1);
    expect(store.setCursor).toHaveBeenCalledWith('ethereum', 210);
  });

  it('reports synced 0 and keeps the cursor when there are no new flows', async () => {
    const { app, store } = makeDeps({ flows: [] });

    const res = await app.request('/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chain: 'polygon' }),
    });

    expect(await res.json()).toEqual({ synced: 0, lastBlock: 0 });
    expect(store.ingest).not.toHaveBeenCalled();
    expect(store.setCursor).not.toHaveBeenCalled();
  });

  it('rejects a sync without a chain', async () => {
    const { app } = makeDeps();
    const res = await app.request('/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('reports per-chain cursors on /status', async () => {
    const { app, store } = makeDeps();
    (store.getCursor as ReturnType<typeof vi.fn>).mockResolvedValueOnce(42).mockResolvedValueOnce(7);

    const res = await app.request('/status');
    expect(await res.json()).toEqual({
      chains: [
        { chain: 'ethereum', lastBlock: 42 },
        { chain: 'polygon', lastBlock: 7 },
      ],
    });
  });
});
