import { describe, expect, it } from 'vitest';
import type { CapitalFlow } from '@cohortlens/shared';
import { createEngine } from '../src/execution';
import type { GraphPort } from '../src/graph-port';
import { highRiskWallets } from '../src/lenses/high-risk-wallets';
import { LensRegistry } from '../src/registry';

const pool = { id: 'pool-x', type: 'pool' as const };

function flow(
  id: string,
  from: CapitalFlow['from'],
  to: CapitalFlow['to'],
  type: CapitalFlow['type'],
  amount: string,
): CapitalFlow {
  return {
    id,
    from,
    to,
    type,
    amount,
    asset: 'USDC',
    chain: 'Ethereum',
    timestamp: new Date(),
    metadata: null,
  };
}

function graphWith(flows: CapitalFlow[]): GraphPort {
  return {
    listNodes: async () => [],
    listFlows: async () => flows,
    getStats: async () => ({ nodes: {}, flows: flows.length }),
  };
}

const wallet = (id: string) => ({ id, type: 'wallet' as const });

function run(flows: CapitalFlow[], params: Record<string, unknown> = {}) {
  const registry = new LensRegistry();
  registry.register(highRiskWallets);
  return createEngine(registry).execute('high-risk-wallets', params, graphWith(flows));
}

describe('high-risk-wallets lens', () => {
  it('flags the most active wallet first', async () => {
    const flows = [
      flow('f1', wallet('wallet-a'), pool, 'Deposit', '1000'),
      flow('f2', wallet('wallet-a'), pool, 'Deposit', '1000'),
      flow('f3', wallet('wallet-a'), pool, 'Deposit', '1000'),
      flow('f4', wallet('wallet-b'), pool, 'Deposit', '10'),
    ];
    const result = await run(flows);
    expect(result.signal).toBe('risk');
    expect(result.findings.length).toBeGreaterThanOrEqual(1);
    expect(result.findings[0]!.nodeId).toBe('wallet-a');
    expect(result.findings[0]!.nodeType).toBe('wallet');
    expect(result.findings[0]!.score).toBeGreaterThan(0);
    expect(result.findings[0]!.reasons.length).toBeGreaterThan(0);
  });

  it('boosts borrow/withdraw exposure', async () => {
    const flows = [
      flow('f1', wallet('wallet-a'), pool, 'Deposit', '100'),
      flow('f2', wallet('wallet-b'), pool, 'Borrow', '100'),
    ];
    const result = await run(flows, { minScore: 0 });
    const byWallet = new Map(result.findings.map((f) => [f.nodeId, f.score]));
    // wallet-b has borrow exposure (0.2 bonus) over wallet-a with equal volume.
    expect(byWallet.get('wallet-b')!).toBeGreaterThan(byWallet.get('wallet-a')!);
  });

  it('respects the limit param', async () => {
    const flows = [
      flow('f1', wallet('w1'), pool, 'Deposit', '100'),
      flow('f2', wallet('w2'), pool, 'Deposit', '100'),
      flow('f3', wallet('w3'), pool, 'Deposit', '100'),
    ];
    const result = await run(flows, { limit: 2 });
    expect(result.findings.length).toBe(2);
  });

  it('filters by minScore', async () => {
    const flows = [flow('f1', wallet('w1'), pool, 'Deposit', '100')];
    const result = await run(flows, { minScore: 0.99 });
    expect(result.findings.length).toBe(0);
    expect(result.summary).toContain('0 wallet(s)');
  });

  it('ignores non-wallet endpoints', async () => {
    const flows = [
      flow('f1', wallet('w1'), pool, 'Deposit', '100'),
      flow('f2', pool, { id: 'pool-y', type: 'pool' }, 'Swap', '100'),
    ];
    const result = await run(flows);
    expect(result.findings.every((f) => f.nodeId === 'w1' && f.nodeType === 'wallet')).toBe(
      true,
    );
  });
});
