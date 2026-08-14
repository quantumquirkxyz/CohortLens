import type { CapitalFlow, NodeType } from '@cohortlens/shared';
import type { Edge, Node } from '@xyflow/react';

export interface GraphNodeData {
  label: string;
  type: NodeType;
  [key: string]: unknown;
}

/** Column order per node type: left (chains) to right (positions). */
const NODE_ORDER: Record<NodeType, number> = {
  chain: 0,
  protocol: 1,
  asset: 2,
  pool: 3,
  wallet: 4,
  position: 5,
};

export const NODE_COLORS: Record<NodeType, string> = {
  chain: '#64748b', // slate
  protocol: '#10b981', // emerald
  asset: '#f59e0b', // amber
  pool: '#8b5cf6', // violet
  wallet: '#0ea5e9', // sky
  position: '#f43f5e', // rose
};

const COLUMN_SPACING = 280;
const ROW_SPACING = 96;
const COLUMN_OFFSET = 40;
const ROW_OFFSET = 40;

/** Edge stroke width scaled by flow amount, clamped to [1, 6]. */
export function edgeWidthForAmount(amount: string): number {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(6, Math.max(1, Math.log10(value + 1)));
}

/**
 * Build React Flow nodes and edges from the edge list, with a deterministic
 * column-per-type layout so the graph is stable across renders and tests.
 */
export function flowsToGraph(
  flows: CapitalFlow[],
  labels: Record<string, string> = {},
): { nodes: Node<GraphNodeData>[]; edges: Edge[] } {
  const seen = new Map<string, { type: NodeType; count: number }>();

  const nodes: Node<GraphNodeData>[] = [];
  for (const flow of flows) {
    for (const ref of [flow.from, flow.to]) {
      const existing = seen.get(ref.id);
      if (existing) {
        existing.count += 1;
        continue;
      }
      seen.set(ref.id, { type: ref.type, count: 0 });
    }
  }

  // Deterministic order: type column first, then id.
  const ordered = [...seen.entries()].sort((a, b) => {
    const byType = NODE_ORDER[a[1].type] - NODE_ORDER[b[1].type];
    return byType !== 0 ? byType : a[0].localeCompare(b[0]);
  });

  const typeIndex = new Map<NodeType, number>();
  for (const [id, { type }] of ordered) {
    const index = typeIndex.get(type) ?? 0;
    typeIndex.set(type, index + 1);
    nodes.push({
      id,
      type: 'default',
      position: {
        x: COLUMN_OFFSET + NODE_ORDER[type] * COLUMN_SPACING,
        y: ROW_OFFSET + index * ROW_SPACING,
      },
      data: { label: labels[id] ?? id, type },
      style: {
        borderColor: NODE_COLORS[type],
        borderWidth: 2,
      },
    });
  }

  const edges: Edge[] = flows.map((flow) => ({
    id: flow.id,
    source: flow.from.id,
    target: flow.to.id,
    label: flow.type,
    animated: true,
    labelStyle: { fontSize: 10 },
    style: { strokeWidth: edgeWidthForAmount(flow.amount) },
  }));

  return { nodes, edges };
}
