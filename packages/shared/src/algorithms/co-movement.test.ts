import { describe, expect, it } from 'vitest';
import type { CapitalFlow } from '../index';
import { detectCoMovement } from './co-movement';

const node = (id: string) => ({ id, type: 'pool' as const });

function flow(
  id: string,
  asset: string,
  amount: string,
  day: string,
): CapitalFlow {
  return {
    id,
    from: node('pool-a'),
    to: node('pool-b'),
    type: 'Swap',
    amount,
    asset,
    chain: 'Ethereum',
    timestamp: new Date(`${day}T12:00:00Z`),
    metadata: null,
  };
}

describe('detectCoMovement', () => {
  it('finds positively and negatively correlated asset pairs', () => {
    const flows = [
      flow('f1', 'USDC', '100', '2026-08-01'),
      flow('f2', 'DAI', '50', '2026-08-01'),
      flow('f3', 'WBTC', '30', '2026-08-01'),
      flow('f4', 'USDC', '200', '2026-08-02'),
      flow('f5', 'DAI', '100', '2026-08-02'),
      flow('f6', 'WBTC', '20', '2026-08-02'),
      flow('f7', 'USDC', '300', '2026-08-03'),
      flow('f8', 'DAI', '150', '2026-08-03'),
      flow('f9', 'WBTC', '10', '2026-08-03'),
    ];
    const result = detectCoMovement(flows);

    expect(result.assets.sort()).toEqual(['DAI', 'USDC', 'WBTC']);
    expect(result.bucket).toBe('day');

    const usdcDai = result.pairs.find(
      (p) => p.assetA === 'USDC' && p.assetB === 'DAI',
    );
    const usdcWbtc = result.pairs.find(
      (p) => p.assetA === 'USDC' && p.assetB === 'WBTC',
    );
    expect(usdcDai).toBeDefined();
    expect(usdcDai!.correlation).toBeCloseTo(1, 3);
    expect(usdcWbtc).toBeDefined();
    expect(usdcWbtc!.correlation).toBeCloseTo(-1, 3);
    expect(usdcDai!.samples).toBe(3);

    // sorted by |correlation| desc
    expect(Math.abs(result.pairs[0]!.correlation)).toBe(1);
  });

  it('filters by requested assets', () => {
    const flows = [
      flow('f1', 'USDC', '100', '2026-08-01'),
      flow('f2', 'DAI', '50', '2026-08-01'),
      flow('f3', 'USDC', '200', '2026-08-02'),
      flow('f4', 'DAI', '100', '2026-08-02'),
    ];
    const result = detectCoMovement(flows, ['USDC', 'DAI']);
    expect(result.assets.sort()).toEqual(['DAI', 'USDC']);
    expect(result.pairs).toHaveLength(1);
    expect(result.pairs[0]!.assetA).toBe('USDC');
  });

  it('drops degenerate series and short samples', () => {
    const flows = [
      flow('f1', 'USDC', '100', '2026-08-01'),
      flow('f2', 'DAI', '50', '2026-08-01'),
    ];
    // only one shared day -> no pair; USDC alone has zero variance
    const result = detectCoMovement(flows, ['USDC', 'DAI']);
    expect(result.pairs).toHaveLength(0);
  });
});
