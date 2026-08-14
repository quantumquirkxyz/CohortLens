import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useCohorts() {
  return useQuery({ queryKey: ['analysis', 'cohorts'], queryFn: api.getCohorts });
}

export function useCoMovement(assets: string[]) {
  const key = assets.join(',');
  return useQuery({
    queryKey: ['analysis', 'co-movement', key],
    queryFn: () => api.getCoMovement(assets),
    enabled: assets.length > 0,
  });
}

export function useCentrality() {
  return useQuery({ queryKey: ['analysis', 'centrality'], queryFn: api.getCentrality });
}

export function usePath(source: string | null, target: string | null) {
  return useQuery({
    queryKey: ['analysis', 'path', source, target],
    queryFn: () => api.findPath(source as string, target as string),
    enabled: source !== null && target !== null && source !== target,
    retry: false,
  });
}
