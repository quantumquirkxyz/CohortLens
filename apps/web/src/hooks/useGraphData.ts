import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useGraphStats() {
  return useQuery({ queryKey: ['graph', 'stats'], queryFn: api.getStats });
}

export function useGraphNodes() {
  return useQuery({ queryKey: ['graph', 'nodes'], queryFn: api.getNodes });
}

export function useGraphFlows(limit = 100) {
  return useQuery({ queryKey: ['graph', 'flows', limit], queryFn: () => api.getFlows(1, limit) });
}

export function useNeighborhood(nodeId: string | null) {
  return useQuery({
    queryKey: ['graph', 'neighborhood', nodeId],
    queryFn: () => api.getNeighborhood(nodeId as string),
    enabled: nodeId !== null,
  });
}
