import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// Purchases — docs/desain-v2.md B5.1, B9.2. total_value, unit_price and line_total are absent for Gudang.

// Receiving or cancelling changes stock, so stock screens reload too.
function invalidate(queryClient) {
  ['purchases', 'products', 'movements', 'reports', 'dashboard'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}

export function usePurchases(params) {
  return useQuery({
    queryKey: ['purchases', params],
    queryFn: () => api('/purchases', { query: params }),
    placeholderData: keepPreviousData,
  });
}

// id undefined (new purchase form) -> nothing is loaded.
export function usePurchase(id) {
  return useQuery({
    queryKey: ['purchases', 'detail', String(id)],
    queryFn: () => api(`/purchases/${id}`),
    enabled: id !== undefined,
  });
}

export function useSavePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => (id ? api(`/purchases/${id}`, { method: 'PUT', body }) : api('/purchases', { method: 'POST', body })),
    onSuccess: (data) => {
      if (data?.data?.id) {
        queryClient.setQueryData(['purchases', 'detail', String(data.data.id)], data);
      }
      invalidate(queryClient);
    },
  });
}

// action: 'receive' | 'cancel' | 'delete'. reason is only sent for 'cancel'.
export function usePurchaseAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }) =>
      action === 'delete'
        ? api(`/purchases/${id}`, { method: 'DELETE' })
        : api(`/purchases/${id}/${action}`, { method: 'POST', body: action === 'cancel' ? { reason } : {} }),
    onSuccess: (data, variables) => {
      if (data?.data?.id) {
        queryClient.setQueryData(['purchases', 'detail', String(data.data.id)], data);
      } else if (variables?.id && variables.action === 'delete') {
        queryClient.removeQueries({ queryKey: ['purchases', 'detail', String(variables.id)] });
      }
      invalidate(queryClient);
    },
  });
}
