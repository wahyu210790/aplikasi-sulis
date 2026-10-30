// Readable "Sebelum / Sesudah" rows for the audit log detail (QA bug #10): Indonesian field names instead of the
// raw keys, rupiah and quantities formatted like the rest of the app, and only the fields that really changed.
// Pure functions, no React. A field without a name here falls back to its raw key.
import { ROLE_LABELS } from '../../lib/constants.js';
import { formatDate, formatQty, formatRupiah } from '../../lib/format.js';

export const FIELD_LABELS = {
  address: 'Alamat',
  amount: 'Jumlah biaya',
  categories_created: 'Kategori baru',
  category_id: 'ID kategori',
  client_name: 'Nama klien',
  code: 'Kode',
  contract_value: 'Nilai kontrak',
  cost_date: 'Tanggal biaya',
  created: 'Ditambahkan',
  description: 'Keterangan',
  email: 'Email',
  end_date: 'Tanggal selesai',
  file: 'Berkas',
  invoice_no: 'No. faktur',
  is_active: 'Aktif',
  items: 'Daftar barang',
  location: 'Lokasi',
  min_stock: 'Stok minimum',
  movement_date: 'Tanggal',
  name: 'Nama',
  notes: 'Catatan',
  number: 'Nomor',
  opname_date: 'Tanggal opname',
  person_name: 'Pengambil / Pengembali',
  phone: 'Telepon',
  project_id: 'ID proyek',
  purchase_date: 'Tanggal beli',
  reason: 'Alasan',
  role: 'Peran',
  skipped: 'Dilewati',
  sku: 'SKU',
  start_date: 'Tanggal mulai',
  status: 'Status',
  supplier_id: 'ID pemasok',
  symbol: 'Simbol',
  total_value: 'Nilai total',
  transaction_date: 'Tanggal',
  unit_id: 'ID satuan',
  units_created: 'Satuan baru',
  updated: 'Diubah',
};

// Fields inside an "items" list.
export const ITEM_FIELD_LABELS = {
  counted_qty: 'Hitung fisik',
  diff_qty: 'Selisih',
  line_total: 'Subtotal',
  product_id: 'ID barang',
  qty: 'Jumlah',
  qty_change: 'Perubahan',
  sku: 'SKU',
  system_qty: 'Stok sistem',
  unit_cost: 'Harga modal',
  unit_price: 'Harga satuan',
  value: 'Nilai',
  value_change: 'Perubahan nilai',
};

const MONEY = new Set(['amount', 'contract_value', 'total_value', 'line_total', 'unit_cost', 'unit_price', 'value', 'value_change']);
const QTY = new Set(['min_stock', 'counted_qty', 'diff_qty', 'qty', 'qty_change', 'system_qty']);
const DATE = /(^|_)date$/;

export function fieldLabel(key) {
  return FIELD_LABELS[key] ?? key;
}

// One value as text. Lists of objects (e.g. "items") become one line per entry.
export function formatValue(key, value) {
  if (value === undefined || value === null || value === '') return '–';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (Array.isArray(value)) {
    if (value.length === 0) return '–';
    return value.map((entry) => (entry && typeof entry === 'object' ? formatItem(entry) : formatValue(key, entry))).join('\n');
  }
  if (typeof value === 'object') return formatItem(value);
  if (MONEY.has(key)) return formatRupiah(value);
  if (QTY.has(key)) return formatQty(value);
  if (key === 'role') return ROLE_LABELS[value] ?? String(value);
  if (DATE.test(key) && typeof value === 'string') return formatDate(value);
  return String(value);
}

function formatItem(entry) {
  return Object.entries(entry)
    .map(([k, v]) => `${ITEM_FIELD_LABELS[k] ?? FIELD_LABELS[k] ?? k}: ${formatValue(k, v)}`)
    .join(' · ');
}

// Rows for the table. With a "before" (an edit) only the changed fields are listed, unless showAll is set;
// without one (a new record, a failed login) every field is listed.
export function changeRows(changes, { showAll = false } = {}) {
  const before = changes?.before ?? {};
  const after = changes?.after ?? {};
  const hasBefore = Object.keys(before).length > 0;
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const rows = keys.map((key) => ({
    key,
    label: fieldLabel(key),
    before: formatValue(key, before[key]),
    after: formatValue(key, after[key]),
    changed: hasBefore && JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  }));
  return { rows: hasBefore && !showAll ? rows.filter((row) => row.changed) : rows, hasBefore, total: rows.length };
}

// The person shown for an entry; entries made by the system (seeding, scheduled jobs) have no user.
export function actorName(user) {
  return user ? `${user.name} (${ROLE_LABELS[user.role] ?? user.role})` : 'Sistem';
}
