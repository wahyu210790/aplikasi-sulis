import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

export function useChangePassword() {
  return useMutation({
    mutationFn: (body) => api('/auth/password', { method: 'PUT', body }),
  });
}
