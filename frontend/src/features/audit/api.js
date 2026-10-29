import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// Audit log — docs/desain-v2.md B8. Read-only, Owner only.

// enabled: false while the date filters are wrong (T6.03), so the page does not ask the API.
export function useAuditLogs(params, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => api('/audit-logs', { query: params }),
    placeholderData: keepPreviousData,
    enabled,
  });
}
