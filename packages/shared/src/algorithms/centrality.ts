import type { CapitalFlow } from '../index';

/** Flow-count degree per node, normalized to [0, 1] by the max. */
export function degreeCentrality(flows: CapitalFlow[]): Record<string, number> {
  const degree = new Map<string, number>();
  for (const flow of flows) {
    degree.set(flow.from.id, (degree.get(flow.from.id) ?? 0) + 1);
    degree.set(flow.to.id, (degree.get(flow.to.id) ?? 0) + 1);
  }
  const max = Math.max(...degree.values(), 1);
  return Object.fromEntries(
    [...degree.entries()].map(([node, value]) => [node, value / max]),
  );
}

/**
 * Betweenness centrality via Brandes' algorithm (unweighted, directed),
 * normalized to [0, 1] by the max. Highlights protocols/wallets that bridge
 * otherwise separate parts of the graph.
 */
export function betweennessCentrality(flows: CapitalFlow[]): Record<string, number> {
  const adjacency = new Map<string, Set<string>>();
  const nodes = new Set<string>();
  for (const flow of flows) {
    nodes.add(flow.from.id);
    nodes.add(flow.to.id);
    const out = adjacency.get(flow.from.id) ?? new Set<string>();
    out.add(flow.to.id);
    adjacency.set(flow.from.id, out);
  }
  const nodeList = [...nodes];
  const betweenness = new Map<string, number>(nodeList.map((n) => [n, 0]));

  for (const source of nodeList) {
    const stack: string[] = [];
    const predecessors = new Map<string, string[]>();
    const sigma = new Map<string, number>(nodeList.map((n) => [n, 0]));
    const distance = new Map<string, number>(nodeList.map((n) => [n, -1]));
    sigma.set(source, 1);
    distance.set(source, 0);

    const queue = [source];
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      for (const w of adjacency.get(v) ?? []) {
        if (distance.get(w) === -1) {
          distance.set(w, (distance.get(v) ?? 0) + 1);
          queue.push(w);
        }
        if (distance.get(w) === (distance.get(v) ?? 0) + 1) {
          sigma.set(w, (sigma.get(w) ?? 0) + (sigma.get(v) ?? 0));
          const preds = predecessors.get(w) ?? [];
          preds.push(v);
          predecessors.set(w, preds);
        }
      }
    }

    const dependency = new Map<string, number>(nodeList.map((n) => [n, 0]));
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of predecessors.get(w) ?? []) {
        const contribution =
          ((sigma.get(v) ?? 0) / (sigma.get(w) ?? 1)) *
          (1 + (dependency.get(w) ?? 0));
        dependency.set(v, (dependency.get(v) ?? 0) + contribution);
      }
      if (w !== source) {
        betweenness.set(w, (betweenness.get(w) ?? 0) + (dependency.get(w) ?? 0));
      }
    }
  }

  const max = Math.max(...betweenness.values(), 1);
  return Object.fromEntries(
    [...betweenness.entries()].map(([node, value]) => [node, value / max]),
  );
}
