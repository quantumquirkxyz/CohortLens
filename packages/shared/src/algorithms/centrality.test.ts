import { describe, expect, it } from 'vitest';
import type { CapitalFlow } from '../index';
import { betweennessCentrality, degreeCentrality } from './centrality';

const node = (id: string) => ({ id, type: 'pool' as const });

function flow(id: string, from: string, to: string): CapitalFlow {
  return {
    id,
    from: node(from),
    to: node(to),
    type: 'Transfer',
    amount: '10',
    asset: 'USDC',
    chain: 'Ethereum',
    timestamp: new Date('2026-08-01T00:00:00Z'),
    metadata: null,
  };
}

describe('degreeCentrality', () => {
  it('ranks the hub highest in a star graph', () => {
    const flows = [
      flow('f1', 'l1', 'hub'),
      flow('f2', 'l2', 'hub'),
      flow('f3', 'l3', 'hub'),
    ];
    const degree = degreeCentrality(flows);
    expect(degree['hub']).toBe(1);
    expect(degree['l1']).toBeCloseTo(1 / 3, 5);
    expect(degree['l2']).toBeCloseTo(1 / 3, 5);
    expect(degree['l3']).toBeCloseTo(1 / 3, 5);
  });
});

describe('betweennessCentrality', () => {
  it('gives the hub the highest betweenness', () => {
    const flows = [
      flow('f1', 'l1', 'hub'),
      flow('f2', 'hub', 'l2'),
      flow('f3', 'hub', 'l3'),
    ];
    const betweenness = betweennessCentrality(flows);
    expect(betweenness['hub']).toBe(1);
    expect(betweenness['l1']).toBe(0);
    expect(betweenness['l2']).toBe(0);
    expect(betweenness['l3']).toBe(0);
  });

  it('handles empty input', () => {
    expect(betweennessCentrality([])).toEqual({});
  });
});
