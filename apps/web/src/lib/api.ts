import type {
  CapitalFlow,
  Cohort,
  CoMovementResult,
  FlowType,
  GraphNode,
  LensDefinition,
  LensResult,
  NodeType,
  Route,
} from '@cohortlens/shared';

export interface GraphStats {
  nodes: Record<NodeType, number>;
  flows: number;
  flowsByType: Record<FlowType, number>;
}

export interface FlowsPage {
  flows: CapitalFlow[];
  page: number;
  limit: number;
}

export interface NodeNeighborhood {
  node: GraphNode;
  flows: CapitalFlow[];
}

export interface CentralityResult {
  degree: Record<string, number>;
  betweenness: Record<string, number>;
}

export interface RegisterLensInput {
  id: string;
  name: string;
  type: LensDefinition['type'];
  description: string;
  inputSchema: Record<string, unknown>;
  price: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: unknown };
    const message = typeof body.error === 'string' ? body.error : `request failed (${res.status})`;
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  // Graph
  getStats: () => request<GraphStats>('/api/graph/stats'),
  getNodes: () => request<{ nodes: GraphNode[] }>('/api/graph/nodes').then((d) => d.nodes),
  getFlows: (page = 1, limit = 100) =>
    request<FlowsPage>(`/api/graph/flows?page=${page}&limit=${limit}`),
  getFlow: (id: string) =>
    request<CapitalFlow>(`/api/graph/flow/${encodeURIComponent(id)}`),
  getNeighborhood: (id: string) =>
    request<NodeNeighborhood>(`/api/graph/neighborhood/${encodeURIComponent(id)}`),

  // Lenses
  listLenses: () => request<{ lenses: LensDefinition[] }>('/api/lenses').then((d) => d.lenses),
  getLens: (id: string) => request<LensDefinition>(`/api/lenses/${encodeURIComponent(id)}`),
  registerLens: (input: RegisterLensInput) =>
    request<LensDefinition>('/api/lenses', { method: 'POST', body: JSON.stringify(input) }),
  publishLens: (id: string) =>
    request<LensDefinition>(`/api/lenses/${encodeURIComponent(id)}/publish`, { method: 'POST' }),
  executeLens: (id: string, params: Record<string, unknown> = {}) =>
    request<{ result: LensResult }>(`/api/lenses/${encodeURIComponent(id)}/execute`, {
      method: 'POST',
      body: JSON.stringify({ params }),
    }).then((d) => d.result),
  lensResults: (id: string) =>
    request<{ result: LensResult }>(`/api/lenses/${encodeURIComponent(id)}/results`).then(
      (d) => d.result,
    ),

  // Analysis
  getCohorts: () =>
    request<{ cohorts: Cohort[] }>('/api/analysis/communities').then((d) => d.cohorts),
  findPath: (source: string, target: string) =>
    request<{ route: Route }>(
      `/api/analysis/path?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}`,
    ).then((d) => d.route),
  getCentrality: () => request<CentralityResult>('/api/analysis/centrality'),
  getCoMovement: (assets?: string[]) =>
    request<{ result: CoMovementResult }>(
      `/api/analysis/co-movement${assets && assets.length > 0 ? `?assets=${assets.join(',')}` : ''}`,
    ).then((d) => d.result),
};
