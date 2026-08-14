import { describe, expect, it } from 'vitest';
import type { CapitalFlow } from '@cohortlens/shared';
import { edgeWidthForAmount, flowsToGraph, NODE_COLORS } from './graph';

function flow(overrides: Partial<CapitalFlow>): CapitalFlow {
  return {
    id: 'flow-1',
    from: { id: 'wallet-1', type: 'wallet' },
    to: { id: 'pool-1', type: 'pool' },
    type: 'Deposit',
    amount: '100',
    asset: 'USDC',
    chain: 'Ethereum',
    timestamp: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('flowsToGraph', () => {
  it('creates one node per unique endpoint', () => {
    const flows = [
      flow({ id: 'f1', from: { id: 'a', type: 'wallet' }, to: { id: 'b', type: 'pool' } }),
      flow({ id: 'f2', from: { id: 'a', type: 'wallet' }, to: { id: 'c', type: 'pool' } }),
      flow({ id: 'f3', from: { id: 'c', type: 'pool' }, to: { id: 'd', type: 'protocol' } }),
    ];
    const { nodes, edges } = flowsToGraph(flows);
    expect(nodes.map((n) => n.id)).toEqual(['d', 'b', 'c', 'a']);
    expect(edges).toHaveLength(3);
  });

  it('lays nodes out deterministically by type column', () => {
    const flows = [
      flow({ id: 'f1', from: { id: 'w1', type: 'wallet' }, to: { id: 'p1', type: 'pool' } }),
      flow({ id: 'f2', from: { id: 'w2', type: 'wallet' }, to: { id: 'p1', type: 'pool' } }),
    ];
    const { nodes } = flowsToGraph(flows);
    const w1 = nodes.find((n) => n.id === 'w1')!;
    const w2 = nodes.find((n) => n.id === 'w2')!;
    const p1 = nodes.find((n) => n.id === 'p1')!;
    // Same type column, distinct rows.
    expect(w1.position.x).toBe(w2.position.x);
    expect(w1.position.y).not.toBe(w2.position.y);
    // wallet column (index 4) is to the right of pool column (index 3).
    expect(w1.position.x).toBeGreaterThan(p1.position.x);
  });

  it('maps edges to flow type labels and scaled stroke widths', () => {
    const flows = [
      flow({ id: 'f1', type: 'Borrow', amount: '1000' }),
      flow({ id: 'f2', type: 'Transfer', amount: '2' }),
    ];
    const { edges } = flowsToGraph(flows);
    expect(edges[0]).toMatchObject({ id: 'f1', source: 'wallet-1', target: 'pool-1', label: 'Borrow' });
    expect(edges[1]).toMatchObject({ label: 'Transfer' });
  });

  it('uses the labels map when provided', () => {
    const flows = [flow({ id: 'f1' })];
    const { nodes } = flowsToGraph(flows, { 'wallet-1': 'Alice Wallet' });
    expect(nodes.find((n) => n.id === 'wallet-1')?.data.label).toBe('Alice Wallet');
  });

  it('exposes a color per node type', () => {
    const flows = [flow({ id: 'f1' })];
    const { nodes } = flowsToGraph(flows);
    const wallet = nodes.find((n) => n.id === 'wallet-1')!;
    expect(NODE_COLORS[wallet.data.type]).toBeDefined();
  });
});

describe('edgeWidthForAmount', () => {
  it('clamps small and large amounts', () => {
    expect(edgeWidthForAmount('0')).toBe(1);
    expect(edgeWidthForAmount('1e30')).toBe(6);
    expect(edgeWidthForAmount('not-a-number')).toBe(1);
  });

  it('scales within bounds', () => {
    expect(edgeWidthForAmount('10')).toBeGreaterThanOrEqual(1);
    expect(edgeWidthForAmount('10')).toBeLessThanOrEqual(6);
  });
});
