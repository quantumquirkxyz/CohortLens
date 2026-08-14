import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type RegisterLensInput } from '../lib/api';

export function useLenses() {
  return useQuery({ queryKey: ['lenses'], queryFn: api.listLenses });
}

export function useLensResults(lensId: string) {
  return useQuery({
    queryKey: ['lenses', lensId, 'results'],
    queryFn: () => api.lensResults(lensId),
    enabled: lensId.length > 0,
  });
}

export function useRegisterLens() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterLensInput) => api.registerLens(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lenses'] }),
  });
}

export function usePublishLens() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lensId: string) => api.publishLens(lensId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lenses'] }),
  });
}

export function useExecuteLens() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lensId, params }: { lensId: string; params: Record<string, unknown> }) =>
      api.executeLens(lensId, params),
    onSuccess: (result) =>
      queryClient.setQueryData(['lenses', result.lensId, 'results'], result),
  });
}
