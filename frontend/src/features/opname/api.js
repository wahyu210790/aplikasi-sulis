import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// Stock opname — docs/desain-v2.md B5.5. Quantities only: the API sends no money for any role.

// Approving changes stock, so stock screens reload too.
function invalidate(queryClient) {
  ['opnames', 'products', 'movements', 'reports', 'dashboard'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}

export function useOpnames(params) {
  return useQuery({
    queryKey: ['opnames', params],
    queryFn: () => api('/stock-opnames', { query: params }),
    placeholderData: keepPreviousData,
  });
}

export function useOpname(id) {
  return useQuery({
    queryKey: ['opnames', 'detail', String(id)],
    queryFn: () => api(`/stock-opnames/${id}`),
  });
}

export function useCreateOpname() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => api('/stock-opnames', { method: 'POST', body }),
    onSuccess: () => invalidate(queryClient),
  });
}

// items: [{ product_id, counted_qty (string or null), notes }] — replaces the whole list of a draft.
export function useSaveOpnameItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }) => api(`/stock-opnames/${id}/items`, { method: 'PUT', body: { items } }),
    onSuccess: () => invalidate(queryClient),
  });
}

// action: 'submit' | 'post' | 'reject' | 'cancel'. reason is only sent for 'reject'.
export function useOpnameAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }) =>
      api(`/stock-opnames/${id}/${action}`, { method: 'POST', body: action === 'reject' ? { reason } : {} }),
    onSuccess: () => invalidate(queryClient),
  });
}
