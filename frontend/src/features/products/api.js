import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// Products — docs/desain-v2.md B9.2 Products. Money fields are absent for Gudang (the API removes them).

export function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api('/products', { query: params }),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: ['products', 'detail', String(id)],
    queryFn: () => api(`/products/${id}`),
  });
}

export function useSaveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => (id ? api(`/products/${id}`, { method: 'PUT', body }) : api('/products', { method: 'POST', body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}
