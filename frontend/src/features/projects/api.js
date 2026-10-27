import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// Projects — docs/desain-v2.md B9.2 Projects. contract_value is absent for Gudang (the API removes it).
// GET /projects/{id} also returns summary { material_cost, other_costs, profit, margin_percent } for Owner/Finance only.

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
    // Contract value and status change the profit reports and the dashboard too.
    onSuccess: () => ['projects', 'reports', 'dashboard'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] })),
  });
}

// Material per product (GET /reports/projects/{id}/materials). net_value and totals are absent for Gudang.
export function useProjectMaterials(projectId) {
  return useQuery({
    queryKey: ['projects', 'materials', String(projectId)],
    queryFn: () => api(`/reports/projects/${projectId}/materials`),
  });
}

// Other project costs (B3.9) — Owner/Finance only.
export function useProjectCosts(projectId, params) {
  return useQuery({
    queryKey: ['projects', 'costs', String(projectId), params],
    queryFn: () => api(`/projects/${projectId}/costs`, { query: params }),
    placeholderData: keepPreviousData,
  });
}

// A cost changes the profit too: reload the project (summary), its costs and the reports.
function invalidateCosts(queryClient) {
  ['projects', 'reports', 'dashboard'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}

export function useSaveProjectCost(projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) =>
      id
        ? api(`/projects/${projectId}/costs/${id}`, { method: 'PUT', body })
        : api(`/projects/${projectId}/costs`, { method: 'POST', body }),
    onSuccess: () => invalidateCosts(queryClient),
  });
}

export function useDeleteProjectCost(projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api(`/projects/${projectId}/costs/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateCosts(queryClient),
  });
}
