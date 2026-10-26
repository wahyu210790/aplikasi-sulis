import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// Categories, units, suppliers — docs/desain-v2.md B9.2 Master.
// params.all = 1 returns active items only, without pagination (for dropdowns).

export function useCategories(params) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => api('/categories', { query: params }),
    placeholderData: keepPreviousData,
  });
}

export function useSaveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => (id ? api(`/categories/${id}`, { method: 'PUT', body }) : api('/categories', { method: 'POST', body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUnits(params) {
  return useQuery({
    queryKey: ['units', params],
    queryFn: () => api('/units', { query: params }),
    placeholderData: keepPreviousData,
  });
}

export function useSaveUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => (id ? api(`/units/${id}`, { method: 'PUT', body }) : api('/units', { method: 'POST', body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['units'] }),
  });
}

export function useSuppliers(params) {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => api('/suppliers', { query: params }),
    placeholderData: keepPreviousData,
  });
}

export function useSaveSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => (id ? api(`/suppliers/${id}`, { method: 'PUT', body }) : api('/suppliers', { method: 'POST', body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}
