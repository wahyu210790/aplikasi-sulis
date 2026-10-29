// Indonesian names for the audit actions of docs/desain-v2.md B8 (AuditAction on the server).
// A new action without a label here falls back to its group name, then to the raw text.

export const ACTION_GROUPS = [
  { value: 'auth', label: 'Masuk dan keluar' },
  { value: 'user', label: 'Pengguna' },
  { value: 'category', label: 'Kategori' },
  { value: 'unit', label: 'Satuan' },
  { value: 'product', label: 'Barang' },
  { value: 'supplier', label: 'Pemasok' },
  { value: 'project', label: 'Proyek' },
  { value: 'project_cost', label: 'Biaya lain proyek' },
  { value: 'purchase', label: 'Pembelian' },
  { value: 'opening_stock', label: 'Stok awal' },
  { value: 'stock_out', label: 'Barang keluar' },
  { value: 'stock_return', label: 'Pengembalian' },
  { value: 'stock_transaction', label: 'Pembatalan dokumen' },
  { value: 'opname', label: 'Stok opname' },
];

const ACTION_LABELS = {
  'auth.login': 'Masuk',
  'auth.login_failed': 'Gagal masuk',
  'auth.logout': 'Keluar',
  'auth.password_changed': 'Ganti password',
  'user.created': 'Tambah pengguna',
  'user.updated': 'Ubah pengguna',
  'user.password_reset': 'Reset password',
  'user.deactivated': 'Nonaktifkan pengguna',
  'user.activated': 'Aktifkan pengguna',
  'category.created': 'Tambah kategori',
  'category.updated': 'Ubah kategori',
  'unit.created': 'Tambah satuan',
  'unit.updated': 'Ubah satuan',
  'product.created': 'Tambah barang',
  'product.updated': 'Ubah barang',
  'product.imported': 'Impor barang',
  'supplier.created': 'Tambah pemasok',
  'supplier.updated': 'Ubah pemasok',
  'project.created': 'Tambah proyek',
  'project.updated': 'Ubah proyek',
  'project.status_changed': 'Ubah status proyek',
  'project_cost.created': 'Tambah biaya lain',
  'project_cost.updated': 'Ubah biaya lain',
  'project_cost.deleted': 'Hapus biaya lain',
  'purchase.created': 'Buat pembelian',
  'purchase.updated': 'Ubah pembelian',
  'purchase.deleted': 'Hapus pembelian',
  'purchase.received': 'Terima pembelian',
  'purchase.cancelled': 'Batalkan pembelian',
  'opening_stock.created': 'Input stok awal',
  'opening_stock.imported': 'Impor stok awal',
  'stock_out.created': 'Barang keluar',
  'stock_return.created': 'Pengembalian barang',
  'stock_transaction.reversed': 'Batalkan dokumen stok',
  'opname.created': 'Buat stok opname',
  'opname.updated': 'Isi hasil hitung opname',
  'opname.submitted': 'Ajukan stok opname',
  'opname.rejected': 'Tolak stok opname',
  'opname.posted': 'Setujui stok opname',
  'opname.cancelled': 'Batalkan stok opname',
};

export function actionLabel(action) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const group = ACTION_GROUPS.find((g) => action.startsWith(`${g.value}.`));
  return group ? group.label : action;
}

export function isFailure(action) {
  return action === 'auth.login_failed';
}
