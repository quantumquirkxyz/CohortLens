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

/** Convert an ISO timestamp (the wire format) into a real Date. */
function toDate(value: unknown): Date {
  return typeof value === 'string' ? new Date(value) : (value as Date);
}

/**
 * API base URL, configured at build time via `VITE_API_URL`.
 *
 * - Unset: same-origin `/api` (dev: Vite proxy; Docker: nginx proxy).
 * - Absolute URL (e.g. https://api.cohortlens.com): dashboard and API live on
 *   different origins (e.g. Vercel + a container host) — the API must allow
 *   this origin through `CORS_ORIGIN`.
 */
const API_BASE = ((import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? '').replace(/\/$/, '');

function normalizeFlow(flow: CapitalFlow): CapitalFlow {
  return { ...flow, timestamp: toDate(flow.timestamp) };
}

function normalizeResult(result: LensResult): LensResult {
  return { ...result, generatedAt: toDate(result.generatedAt) };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
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
  getFlows: async (page = 1, limit = 100) => {
    const data = await request<FlowsPage>(`/api/graph/flows?page=${page}&limit=${limit}`);
    return { ...data, flows: data.flows.map(normalizeFlow) };
  },
  getFlow: async (id: string) => {
    const flow = await request<CapitalFlow>(`/api/graph/flow/${encodeURIComponent(id)}`);
    return normalizeFlow(flow);
  },
  getNeighborhood: async (id: string) => {
    const data = await request<NodeNeighborhood>(`/api/graph/neighborhood/${encodeURIComponent(id)}`);
    return { ...data, flows: data.flows.map(normalizeFlow) };
  },

  // Lenses
  listLenses: () => request<{ lenses: LensDefinition[] }>('/api/lenses').then((d) => d.lenses),
  getLens: (id: string) => request<LensDefinition>(`/api/lenses/${encodeURIComponent(id)}`),
  registerLens: (input: RegisterLensInput) =>
    request<LensDefinition>('/api/lenses', { method: 'POST', body: JSON.stringify(input) }),
  publishLens: (id: string) =>
    request<LensDefinition>(`/api/lenses/${encodeURIComponent(id)}/publish`, { method: 'POST' }),
  executeLens: async (id: string, params: Record<string, unknown> = {}) => {
    const data = await request<{ result: LensResult }>(
      `/api/lenses/${encodeURIComponent(id)}/execute`,
      { method: 'POST', body: JSON.stringify({ params }) },
    );
    return normalizeResult(data.result);
  },
  lensResults: async (id: string) => {
    const data = await request<{ result: LensResult }>(
      `/api/lenses/${encodeURIComponent(id)}/results`,
    );
    return normalizeResult(data.result);
  },

  // Analysis
  getCohorts: () =>
    request<{ cohorts: Cohort[] }>('/api/analysis/communities').then((d) => d.cohorts),
  findPath: async (source: string, target: string) => {
    const data = await request<{ route: Route }>(
      `/api/analysis/path?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}`,
    );
    return { ...data.route, steps: data.route.steps.map(normalizeFlow) };
  },
  getCentrality: () => request<CentralityResult>('/api/analysis/centrality'),
  getCoMovement: (assets?: string[]) =>
    request<{ result: CoMovementResult }>(
      `/api/analysis/co-movement${assets && assets.length > 0 ? `?assets=${assets.join(',')}` : ''}`,
    ).then((d) => d.result),
};
