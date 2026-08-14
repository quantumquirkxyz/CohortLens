import { describe, expect, it } from 'vitest';
import type { CapitalFlow } from '../index';
import { detectCommunities } from './communities';

function flow(
  id: string,
  from: CapitalFlow['from'],
  to: CapitalFlow['to'],
): CapitalFlow {
  return {
    id,
    from,
    to,
    type: 'Deposit',
    amount: '100',
    asset: 'USDC',
    chain: 'Ethereum',
    timestamp: new Date('2026-08-01T00:00:00Z'),
    metadata: null,
  };
}

const pool = (id: string) => ({ id, type: 'pool' as const });
const wallet = (id: string) => ({ id, type: 'wallet' as const });

describe('detectCommunities', () => {
  it('groups wallets that share pools into cohorts', () => {
    const flows = [
      flow('f1', wallet('w1'), pool('pool-a')),
      flow('f2', wallet('w2'), pool('pool-a')),
      flow('f3', wallet('w3'), pool('pool-a')),
      flow('f4', wallet('w4'), pool('pool-b')),
      flow('f5', wallet('w5'), pool('pool-b')),
    ];
    const cohorts = detectCommunities(flows);

    expect(cohorts.length).toBe(2);
    const sizes = cohorts.map((c) => c.wallets.length).sort((a, b) => b - a);
    expect(sizes).toEqual([3, 2]);
    expect(cohorts[0]!.wallets).toEqual(['w1', 'w2', 'w3']);
    expect(cohorts[1]!.wallets).toEqual(['w4', 'w5']);
    expect(cohorts[0]!.id).toMatch(/^cohort-/);
  });

  it('links wallets that transfer directly between themselves', () => {
    const flows = [
      flow('f1', wallet('w1'), wallet('w2')),
      flow('f2', wallet('w1'), wallet('w2')),
    ];
    const cohorts = detectCommunities(flows);
    expect(cohorts.length).toBe(1);
    expect(cohorts[0]!.wallets).toEqual(['w1', 'w2']);
  });

  it('returns no cohorts when there are no wallets', () => {
    const flows = [flow('f1', pool('pool-a'), pool('pool-b'))];
    expect(detectCommunities(flows)).toEqual([]);
  });

  it('is deterministic for the same input', () => {
    const flows = [
      flow('f1', wallet('w1'), pool('pool-a')),
      flow('f2', wallet('w2'), pool('pool-a')),
      flow('f3', wallet('w3'), pool('pool-b')),
    ];
    expect(detectCommunities(flows)).toEqual(detectCommunities(flows));
  });
});
