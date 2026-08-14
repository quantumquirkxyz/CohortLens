import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createDb,
  createFlow,
  getFlow,
  getNeighborhood,
  getStats,
  listFlows,
  listNodes,
  type Db,
} from '../src/index';

const TEST_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://cohortlens:cohortlens@localhost:5432/cohortlens_test';

let db: Db;

beforeAll(() => {
  db = createDb(TEST_URL);
});

afterAll(async () => {
  await db.$client.end();
});

describe('graph repository (integration)', () => {
  it('seeds the sample graph', async () => {
    const nodes = await listNodes(db);
    expect(nodes.filter((n) => n.type === 'chain')).toHaveLength(3);
    expect(nodes.filter((n) => n.type === 'protocol')).toHaveLength(5);
    expect(nodes.filter((n) => n.type === 'asset')).toHaveLength(10);
    expect(nodes.filter((n) => n.type === 'wallet')).toHaveLength(8);

    const flows = await listFlows(db, 200);
    expect(flows.length).toBeGreaterThanOrEqual(50);
  });

  it('lists flows with resolved asset, chain, and typed endpoints', async () => {
    const flows = await listFlows(db, 5);
    expect(flows.length).toBeGreaterThan(0);
    for (const flow of flows) {
      expect(flow.asset).toBeTruthy();
      expect(flow.chain).toBeTruthy();
      expect(flow.from.id).toBeTruthy();
      expect(flow.to.type).toBeTruthy();
      expect(flow.amount).toMatch(/^\d+(\.\d+)?$/);
    }
  });

  it('fetches a single flow by id', async () => {
    const flows = await listFlows(db, 1);
    const expected = flows[0];
    expect(expected).toBeDefined();
    const got = await getFlow(db, expected!.id);
    expect(got).not.toBeNull();
    expect(got!.id).toBe(expected!.id);
  });

  it('returns null for an unknown flow id', async () => {
    expect(await getFlow(db, 'does-not-exist')).toBeNull();
  });

  it('computes stats consistent across node and flow counts', async () => {
    const stats = await getStats(db);
    expect(stats.flows).toBeGreaterThanOrEqual(50);
    expect(Object.keys(stats.nodes)).toHaveLength(6);
    expect(stats.nodes.chain).toBe(3);
    expect(stats.nodes.protocol).toBe(5);
    const sumByType = Object.values(stats.flowsByType).reduce((a, b) => a + b, 0);
    expect(sumByType).toBe(stats.flows);
  });

  it('returns the neighborhood of a wallet node', async () => {
    const flows = await listFlows(db, 200);
    const walletFlow = flows.find((f) => f.from.type === 'wallet');
    expect(walletFlow).toBeDefined();
    const ref = walletFlow!.from;

    const nb = await getNeighborhood(db, ref.id);
    expect(nb).not.toBeNull();
    expect(nb!.node.type).toBe('wallet');
    expect(nb!.node.id).toBe(ref.id);
    expect(nb!.flows.length).toBeGreaterThan(0);
    for (const flow of nb!.flows) {
      expect(flow.from.id === ref.id || flow.to.id === ref.id).toBe(true);
    }
  });

  it('returns null neighborhood for an unknown node', async () => {
    expect(await getNeighborhood(db, 'does-not-exist')).toBeNull();
  });

  it('creates a flow and re-reads it', async () => {
    const created = await createFlow(db, {
      fromNodeId: 'wallet-1',
      fromNodeType: 'wallet',
      toNodeId: 'aave-v3-usdc-ethereum',
      toNodeType: 'pool',
      type: 'Deposit',
      amount: '42.5',
      assetId: 'usdc',
      chainId: 'ethereum',
      metadata: { txHash: '0xdeadbeef' },
    });
    expect(created.id).toBeTruthy();
    expect(created.amount).toBe('42.5');
    expect(created.asset).toBe('USDC');
    expect(created.chain).toBe('Ethereum');
    expect(created.from.type).toBe('wallet');
    expect(created.to.type).toBe('pool');

    const got = await getFlow(db, created.id);
    expect(got).not.toBeNull();
    expect(got!.metadata).toEqual({ txHash: '0xdeadbeef' });
  });
});
