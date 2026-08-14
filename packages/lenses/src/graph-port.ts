import type { CapitalFlow, GraphNode } from '@cohortlens/shared';

export interface ListFlowsOptions {
  limit?: number;
  offset?: number;
}

export interface GraphStats {
  nodes: Record<string, number>;
  flows: number;
}

/**
 * The Capital Flow Graph surface available to a Lens while it executes.
 * Structurally compatible with the repository functions exported by
 * `@cohortlens/database`; the API wires the real database behind it.
 */
export interface GraphPort {
  listNodes(): Promise<GraphNode[]>;
  listFlows(opts?: ListFlowsOptions): Promise<CapitalFlow[]>;
  getStats(): Promise<GraphStats>;
}
