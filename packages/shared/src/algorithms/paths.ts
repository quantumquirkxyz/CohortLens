import type { CapitalFlow, Route } from '../index';

/**
 * Find the cheapest directed path between two nodes with Dijkstra.
 *
 * Edge cost is a friction proxy: `1 / totalVolume(u→v)` — routing through
 * larger flows is treated as cheaper (more liquid). Real fee/slippage data
 * lands with the indexer/contracts; the cost model is isolated here so it can
 * be swapped later. Returns null when no path exists.
 */
export function findCheapestPath(
  flows: CapitalFlow[],
  source: string,
  target: string,
): Route | null {
  if (source === target) {
    return { source, target, nodes: [source], steps: [], totalCost: 0 };
  }

  const edgesOut = new Map<string, Array<{ to: string; flow: CapitalFlow }>>();
  const volume = new Map<string, number>();
  for (const flow of flows) {
    const from = flow.from.id;
    const to = flow.to.id;
    volume.set(`${from}->${to}`, (volume.get(`${from}->${to}`) ?? 0) + (Number(flow.amount) || 0));
    const list = edgesOut.get(from) ?? [];
    list.push({ to, flow });
    edgesOut.set(from, list);
  }

  const cost = (from: string, to: string) =>
    1 / Math.max(volume.get(`${from}->${to}`) ?? 0, 1e-12);

  const dist = new Map<string, number>([[source, 0]]);
  const prev = new Map<string, { node: string; flow: CapitalFlow }>();
  const settled = new Set<string>();
  const frontier = new Set<string>([source]);

  while (frontier.size > 0) {
    const current = [...frontier].sort(
      (a, b) => (dist.get(a) ?? Infinity) - (dist.get(b) ?? Infinity),
    )[0]!;
    frontier.delete(current);
    settled.add(current);
    if (current === target) break;

    for (const edge of edgesOut.get(current) ?? []) {
      if (settled.has(edge.to)) continue;
      const next = (dist.get(current) ?? Infinity) + cost(current, edge.to);
      if (next < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, next);
        prev.set(edge.to, { node: current, flow: edge.flow });
        frontier.add(edge.to);
      }
    }
  }

  const prevEntry = prev.get(target);
  if (!prevEntry) return null;

  const steps: CapitalFlow[] = [];
  const nodes: string[] = [target];
  let current = target;
  while (current !== source) {
    const entry = prev.get(current);
    if (!entry) return null;
    steps.unshift(entry.flow);
    nodes.unshift(entry.node);
    current = entry.node;
  }

  return {
    source,
    target,
    nodes,
    steps,
    totalCost: dist.get(target) ?? Infinity,
  };
}
