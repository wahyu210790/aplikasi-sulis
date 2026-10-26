import { LayoutDashboard, Users } from 'lucide-react';
import { can } from '../../lib/permissions.js';

// Sidebar / drawer menu — docs/desain-v2.md B12.5. Later tasks ADD items to the right group.
// bottomBar: true => also shown in the Gudang mobile bottom bar (max 3 items, added in Fase 3).
export const NAV_GROUPS = [
  {
    label: 'Utama',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, action: 'dashboard.view', end: true }],
  },
  { label: 'Transaksi', items: [] },
  { label: 'Data', items: [] },
  { label: 'Laporan', items: [] },
  {
    label: 'Admin',
    items: [{ to: '/pengguna', label: 'Pengguna', icon: Users, action: 'users.manage' }],
  },
];

// Items for the Gudang mobile bottom bar (empty in Fase 1).
export function bottomBarItems(user) {
  if (!user || user.role !== 'gudang') return [];
  return NAV_GROUPS.flatMap((group) => group.items).filter((item) => item.bottomBar && can(user, item.action));
}
