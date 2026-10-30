import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// Excel import — docs/desain-v2.md B5.7. Max 10 uploads per hour per user (server limit).

export function downloadProductTemplate() {
  return api('/imports/products/template', { responseType: 'blob' });
}

export function useImportProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => {
      const body = new FormData();
      body.append('file', file);
      return api('/imports/products', { method: 'POST', body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['units'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['movements'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' });
    },
  });
}

export function downloadOpeningStockTemplate() {
  return api('/imports/opening-stocks/template', { responseType: 'blob' });
}

// Opening stock import (Owner and Finance) — docs/desain-v2.md B5.6, B5.7.
export function useImportOpeningStocks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => {
      const body = new FormData();
      body.append('file', file);
      return api('/imports/opening-stocks', { method: 'POST', body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['movements'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' });
    },
  });
}
