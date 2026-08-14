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
  // Binary-heap Dijkstra: O((V + E) log V). Stale entries are skipped on pop.
  const queue = new MinHeap();
  queue.push(source, 0);

  while (queue.size > 0) {
    const { node: current, priority } = queue.pop()!;
    if (priority !== (dist.get(current) ?? Infinity)) continue; // stale entry
    if (current === target) break;

    for (const edge of edgesOut.get(current) ?? []) {
      const next = (dist.get(current) ?? Infinity) + cost(current, edge.to);
      if (next < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, next);
        prev.set(edge.to, { node: current, flow: edge.flow });
        queue.push(edge.to, next);
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

/** Minimal binary min-heap of (node, priority) pairs. */
class MinHeap {
  private items: Array<{ node: string; priority: number }> = [];

  get size(): number {
    return this.items.length;
  }

  push(node: string, priority: number): void {
    this.items.push({ node, priority });
    this.siftUp(this.items.length - 1);
  }

  pop(): { node: string; priority: number } | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0]!;
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  private siftUp(index: number): void {
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.items[parent]!.priority <= this.items[index]!.priority) break;
      [this.items[parent], this.items[index]] = [
        this.items[index]!,
        this.items[parent]!,
      ];
      index = parent;
    }
  }

  private siftDown(index: number): void {
    const size = this.items.length;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;
      if (left < size && this.items[left]!.priority < this.items[smallest]!.priority) {
        smallest = left;
      }
      if (right < size && this.items[right]!.priority < this.items[smallest]!.priority) {
        smallest = right;
      }
      if (smallest === index) break;
      [this.items[index], this.items[smallest]] = [
        this.items[smallest]!,
        this.items[index]!,
      ];
      index = smallest;
    }
  }
}
