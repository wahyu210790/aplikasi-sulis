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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}
