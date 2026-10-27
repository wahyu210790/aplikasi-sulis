import { ChartColumn, FolderKanban, LayoutDashboard, Package, PackageMinus, PackagePlus, Ruler, ShoppingCart, Tags, Truck, Undo2, Users } from 'lucide-react';
import { can } from '../../lib/permissions.js';

// Sidebar / drawer menu — docs/desain-v2.md B12.5. Later tasks ADD items to the right group.
// bottomBar: true => also shown in the Gudang mobile bottom bar (max 3 items: Barang Keluar, Pengembalian, Stok).
// bottomLabel: shorter text for the bottom bar (default: label).
export const NAV_GROUPS = [
  {
    label: 'Utama',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, action: 'dashboard.view', end: true }],
  },
  {
    label: 'Transaksi',
    items: [
      { to: '/pembelian', label: 'Pembelian', icon: ShoppingCart, action: 'purchases.view' },
      { to: '/barang-keluar', label: 'Barang Keluar', icon: PackageMinus, action: 'stock.view', bottomBar: true },
      { to: '/pengembalian', label: 'Pengembalian', icon: Undo2, action: 'stock.view', bottomBar: true },
      { to: '/stok-awal', label: 'Stok Awal', icon: PackagePlus, action: 'stock.opening' },
    ],
  },
  {
    label: 'Data',
    items: [
      { to: '/barang', label: 'Barang', icon: Package, action: 'products.view', bottomBar: true, bottomLabel: 'Stok' },
      { to: '/proyek', label: 'Proyek', icon: FolderKanban, action: 'projects.view' },
      { to: '/pemasok', label: 'Pemasok', icon: Truck, action: 'suppliers.manage' },
      { to: '/pengaturan/kategori', label: 'Kategori', icon: Tags, action: 'master.view' },
      { to: '/pengaturan/satuan', label: 'Satuan', icon: Ruler, action: 'master.view' },
    ],
  },
  {
    label: 'Laporan',
    items: [{ to: '/laporan', label: 'Laporan', icon: ChartColumn, action: 'reports.view' }],
  },
  {
    label: 'Admin',
    items: [{ to: '/pengguna', label: 'Pengguna', icon: Users, action: 'users.manage' }],
  },
];

// Items for the Gudang mobile bottom bar.
export function bottomBarItems(user) {
  if (!user || user.role !== 'gudang') return [];
  return NAV_GROUPS.flatMap((group) => group.items).filter((item) => item.bottomBar && can(user, item.action));
}
