import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// Reports — docs/desain-v2.md B9.2 Reports. Read-only.
// project-profit, stock-value and cost-history are Owner/Finance only (Gudang gets 403).
// movements is for every role; money keys are absent for Gudang (the API removes them).

export function useProjectProfitReport(params) {
  return useQuery({
    queryKey: ['reports', 'project-profit', params],
    queryFn: () => api('/reports/project-profit', { query: params }),
    placeholderData: keepPreviousData,
  });
}

export function useStockValueReport(params) {
  return useQuery({
    queryKey: ['reports', 'stock-value', params],
    queryFn: () => api('/reports/stock-value', { query: params }),
    placeholderData: keepPreviousData,
  });
}

// enabled: false while the date filters are wrong (T6.03), so the page does not ask the API.
export function useMovementsReport(params, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['reports', 'movements', params],
    queryFn: () => api('/reports/movements', { query: params }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCostHistory(params, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['reports', 'cost-history', params],
    queryFn: () => api('/reports/cost-history', { query: params }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

// "Riwayat Harga Modal" tab on the product page.
export function useProductCostHistory(productId, params) {
  return useQuery({
    queryKey: ['reports', 'cost-history', 'product', String(productId), params],
    queryFn: () => api(`/products/${productId}/cost-history`, { query: params }),
    placeholderData: keepPreviousData,
  });
}

// Excel export of a report with the same filters (docs/desain-v2.md T6.01). Returns a Blob.
// report: 'project-profit' and 'stock-value' (Owner/Finance) or 'movements' (every role; Gudang's file has no money).
export function downloadReport(report, params) {
  return api(`/reports/${report}/export`, { query: params, responseType: 'blob' });
}
