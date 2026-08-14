import { describe, expect, it } from 'vitest';
import type { CapitalFlow } from '../index';
import { findCheapestPath } from './paths';

const node = (id: string) => ({ id, type: 'pool' as const });

function flow(id: string, from: string, to: string, amount: string): CapitalFlow {
  return {
    id,
    from: node(from),
    to: node(to),
    type: 'Transfer',
    amount,
    asset: 'USDC',
    chain: 'Ethereum',
    timestamp: new Date('2026-08-01T00:00:00Z'),
    metadata: null,
  };
}

describe('findCheapestPath', () => {
  it('finds the low-friction route (high volume) between two nodes', () => {
    const flows = [
      flow('f1', 'a', 'x', '100'),
      flow('f2', 'x', 'y', '200'),
      flow('f3', 'y', 'b', '50'),
      // alternative with much lower volume -> higher friction cost
      flow('f4', 'a', 'z', '10'),
      flow('f5', 'z', 'b', '10'),
    ];
    const route = findCheapestPath(flows, 'a', 'b');
    expect(route).not.toBeNull();
    expect(route!.nodes).toEqual(['a', 'x', 'y', 'b']);
    expect(route!.steps).toHaveLength(3);
    expect(route!.steps.map((s) => s.id)).toEqual(['f1', 'f2', 'f3']);
    expect(route!.totalCost).toBeGreaterThan(0);
    expect(route!.totalCost).toBeLessThan(0.2); // cheaper than a->z->b
  });

  it('returns null when no path exists', () => {
    const flows = [flow('f1', 'a', 'b', '100')];
    expect(findCheapestPath(flows, 'a', 'c')).toBeNull();
    expect(findCheapestPath(flows, 'c', 'a')).toBeNull();
  });

  it('returns an empty route when source equals target', () => {
    const route = findCheapestPath([], 'a', 'a');
    expect(route).toEqual({ source: 'a', target: 'a', nodes: ['a'], steps: [], totalCost: 0 });
  });

  it('respects edge direction', () => {
    const flows = [flow('f1', 'a', 'b', '100')];
    expect(findCheapestPath(flows, 'b', 'a')).toBeNull();
  });
});
