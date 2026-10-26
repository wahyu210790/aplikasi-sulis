import { FolderKanban, LayoutDashboard, Package, Ruler, Tags, Truck, Users } from 'lucide-react';
import { can } from '../../lib/permissions.js';

// Sidebar / drawer menu — docs/desain-v2.md B12.5. Later tasks ADD items to the right group.
// bottomBar: true => also shown in the Gudang mobile bottom bar (max 3 items, added in Fase 3).
export const NAV_GROUPS = [
  {
    label: 'Utama',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, action: 'dashboard.view', end: true }],
  },
  { label: 'Transaksi', items: [] },
  {
    label: 'Data',
    items: [
      { to: '/barang', label: 'Barang', icon: Package, action: 'products.view' },
      { to: '/proyek', label: 'Proyek', icon: FolderKanban, action: 'projects.view' },
      { to: '/pemasok', label: 'Pemasok', icon: Truck, action: 'suppliers.manage' },
      { to: '/pengaturan/kategori', label: 'Kategori', icon: Tags, action: 'master.view' },
      { to: '/pengaturan/satuan', label: 'Satuan', icon: Ruler, action: 'master.view' },
    ],
  },
  { label: 'Laporan', items: [] },
  {
    label: 'Admin',
    items: [{ to: '/pengguna', label: 'Pengguna', icon: Users, action: 'users.manage' }],
  },
];

// Items for the Gudang mobile bottom bar (empty until Fase 3).
export function bottomBarItems(user) {
  if (!user || user.role !== 'gudang') return [];
  return NAV_GROUPS.flatMap((group) => group.items).filter((item) => item.bottomBar && can(user, item.action));
}
