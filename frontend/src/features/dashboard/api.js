import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

// GET /dashboard (docs/desain-v2.md B9.2). The payload depends on the role:
// data.view 'money' (Owner/Finance) or 'gudang' (no money keys at all).
// Stock, purchase, project and product changes invalidate ['dashboard'].
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api('/dashboard'),
  });
}
