import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// Audit log — docs/desain-v2.md B8. Read-only, Owner only.

export function useAuditLogs(params) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => api('/audit-logs', { query: params }),
    placeholderData: keepPreviousData,
  });
}
