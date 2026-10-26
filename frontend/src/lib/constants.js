// Indonesian labels for enum values — docs/desain-v2.md B3/B12.6. Enum values must match the backend exactly.

export const ROLES = { OWNER: 'owner', GUDANG: 'gudang', FINANCE: 'finance' };

export const ROLE_LABELS = { owner: 'Owner', gudang: 'Gudang', finance: 'Finance' };

export const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'gudang', label: 'Gudang' },
  { value: 'finance', label: 'Finance' },
];

// tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export const STATUS = {
  user: {
    active: { label: 'Aktif', tone: 'success' },
    inactive: { label: 'Nonaktif', tone: 'neutral' },
  },
  project: {
    aktif: { label: 'Aktif', tone: 'success' },
    selesai: { label: 'Selesai', tone: 'info' },
    batal: { label: 'Batal', tone: 'danger' },
  },
  purchase: {
    draft: { label: 'Draft', tone: 'warning' },
    diterima: { label: 'Diterima', tone: 'success' },
    batal: { label: 'Batal', tone: 'danger' },
  },
  stock_transaction: {
    posted: { label: 'Tercatat', tone: 'success' },
    reversed: { label: 'Dibatalkan', tone: 'danger' },
  },
  opname: {
    draft: { label: 'Draft', tone: 'warning' },
    menunggu_persetujuan: { label: 'Menunggu Persetujuan', tone: 'warning' },
    selesai: { label: 'Selesai', tone: 'success' },
    batal: { label: 'Batal', tone: 'danger' },
  },
};

export const MOVEMENT_TYPES = {
  opening: { label: 'Stok Awal', tone: 'neutral' },
  purchase_in: { label: 'Pembelian Masuk', tone: 'success' },
  project_out: { label: 'Keluar ke Proyek', tone: 'primary' },
  project_return: { label: 'Pengembalian', tone: 'info' },
  opname_in: { label: 'Koreksi Opname +', tone: 'success' },
  opname_out: { label: 'Koreksi Opname −', tone: 'warning' },
  reversal: { label: 'Pembatalan', tone: 'danger' },
};
