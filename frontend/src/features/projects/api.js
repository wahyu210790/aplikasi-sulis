import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// Projects — docs/desain-v2.md B9.2 Projects. contract_value is absent for Gudang (the API removes it).

export function useProjects(params) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => api('/projects', { query: params }),
    placeholderData: keepPreviousData,
  });
}

export function useProject(id) {
  return useQuery({
    queryKey: ['projects', 'detail', String(id)],
    queryFn: () => api(`/projects/${id}`),
  });
}

export function useSaveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => (id ? api(`/projects/${id}`, { method: 'PUT', body }) : api('/projects', { method: 'POST', body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}
