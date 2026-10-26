import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// Stock documents and the stock ledger — docs/desain-v2.md B5.2–B5.6, B9.2 Stock.
// Money keys (value, total_value, value_change, unit_cost, ...) are absent for Gudang (the API removes them).

// After any stock change, every screen that shows stock (or project material cost) must reload.
function invalidateStock(queryClient) {
  ['stock-transactions', 'products', 'movements', 'issued-items', 'purchases', 'projects', 'reports'].forEach((key) =>
    queryClient.invalidateQueries({ queryKey: [key] }),
  );
}

export function useStockTransactions(params) {
  return useQuery({
    queryKey: ['stock-transactions', params],
    queryFn: () => api('/stock-transactions', { query: params }),
    placeholderData: keepPreviousData,
  });
}

export function useStockTransaction(id) {
  return useQuery({
    queryKey: ['stock-transactions', 'detail', String(id)],
    queryFn: () => api(`/stock-transactions/${id}`),
  });
}

// path: '/stock-outs' (Barang Keluar) or '/stock-returns' (Pengembalian).
export function useCreateStockDocument(path) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => api(path, { method: 'POST', body }),
    onSuccess: () => invalidateStock(queryClient),
  });
}

export function useReverseStockTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => api(`/stock-transactions/${id}/reverse`, { method: 'POST', body: { reason } }),
    onSuccess: () => invalidateStock(queryClient),
  });
}

// Products a project still holds (issued minus returned). Disabled until a project is chosen.
export function useIssuedItems(projectId) {
  return useQuery({
    queryKey: ['issued-items', String(projectId)],
    queryFn: () => api(`/projects/${projectId}/issued-items`),
    enabled: Boolean(projectId),
  });
}

export function useProductMovements(productId, params) {
  return useQuery({
    queryKey: ['movements', 'product', String(productId), params],
    queryFn: () => api(`/products/${productId}/movements`, { query: params }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateOpeningStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => api('/opening-stocks', { method: 'POST', body }),
    onSuccess: () => invalidateStock(queryClient),
  });
}
