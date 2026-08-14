import type { CapitalFlow, CoMovementPair, CoMovementResult } from '../index';

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Detect asset co-movement: bucket flow volume per asset by day and compute
 * Pearson correlation between every asset pair over the union of their days
 * (missing days are treated as zero). Pairs with fewer than two shared
 * buckets or zero variance are dropped. Returns pairs sorted by |correlation|.
 */
export function detectCoMovement(
  flows: CapitalFlow[],
  assets?: string[],
): CoMovementResult {
  const series = new Map<string, Map<string, number>>();
  for (const flow of flows) {
    const bucket = flow.timestamp.toISOString().slice(0, 10);
    const seriesForAsset = series.get(flow.asset) ?? new Map<string, number>();
    seriesForAsset.set(bucket, (seriesForAsset.get(bucket) ?? 0) + (Number(flow.amount) || 0));
    series.set(flow.asset, seriesForAsset);
  }

  const names = assets && assets.length > 0
    ? assets.filter((asset) => series.has(asset))
    : [...series.keys()];

  const pairs: CoMovementPair[] = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i]!;
      const b = names[j]!;
      const seriesA = series.get(a)!;
      const seriesB = series.get(b)!;
      const days = [...new Set([...seriesA.keys(), ...seriesB.keys()])].sort();
      if (days.length < 2) continue;

      const valuesA = days.map((day) => seriesA.get(day) ?? 0);
      const valuesB = days.map((day) => seriesB.get(day) ?? 0);
      const correlation = pearson(valuesA, valuesB);
      if (correlation !== null) {
        pairs.push({ assetA: a, assetB: b, correlation: round3(correlation), samples: days.length });
      }
    }
  }

  pairs.sort((x, y) => Math.abs(y.correlation) - Math.abs(x.correlation));
  return { assets: names, bucket: 'day', pairs };
}

/** Pearson correlation, or null when variance is zero (degenerate series). */
function pearson(x: number[], y: number[]): number | null {
  const n = x.length;
  const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / n;
  const meanX = mean(x);
  const meanY = mean(y);

  let numerator = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i]! - meanX;
    const dy = y[i]! - meanY;
    numerator += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }
  if (varianceX === 0 || varianceY === 0) return null;
  return numerator / Math.sqrt(varianceX * varianceY);
}
