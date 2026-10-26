import { parseQty } from '../../lib/format.js';

// Helpers shared by the stock forms (Barang Keluar, Pengembalian, Pembelian, Stok Awal).

const DAY_MS = 24 * 60 * 60 * 1000;

function jakartaDate(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

// Today in Asia/Jakarta as 'YYYY-MM-DD' (default value of every date field).
export function todayIso() {
  return jakartaDate(new Date());
}

// Earliest date the API accepts (today − 30 days, B10). Used as the date field's min attribute.
export function minBusinessDate() {
  return jakartaDate(new Date(Date.now() - 30 * DAY_MS));
}

// Unit symbol of a product from GET /products ({ unit: { symbol } }) or from a document line ({ unit_symbol }).
export function unitOf(product) {
  return product?.unit?.symbol ?? product?.unit_symbol ?? '';
}

let nextKey = 1;

// One row of an item list. product = a product object (see unitOf) or null; qty = typed text; price = rupiah or null.
export function newRow(product = null, qty = '', price = null) {
  nextKey += 1;
  return { key: nextKey, product, qty, price };
}

// Rows -> API items, in the same order (so the API error "items.2.qty" belongs to the 3rd row).
// qty is converted with parseQty ("12,5" -> "12.5"); text that cannot be read is sent as typed so the
// API answers with its Indonesian message. priceKey: 'unit_price' (purchase), 'unit_cost' (opening stock) or null.
export function rowsToItems(rows, priceKey = null) {
  return rows.map((row) => ({
    product_id: row.product?.id ?? null,
    qty: parseQty(row.qty) ?? row.qty,
    ...(priceKey ? { [priceKey]: row.price } : {}),
  }));
}

// Quick check before the confirmation step (the API checks everything again).
// Returns field errors in the API format, e.g. { 'items.1.qty': '...' }; {} when the rows look fine.
export function checkRows(rows, priceKey = null) {
  const errors = {};
  if (rows.length === 0) errors.items = 'Tambahkan minimal 1 barang.';
  rows.forEach((row, index) => {
    if (!row.product) errors[`items.${index}.product_id`] = 'Pilih barang.';
    const qty = parseQty(row.qty);
    if (qty === null || Number(qty) <= 0) errors[`items.${index}.qty`] = 'Isi jumlah lebih dari 0 (maksimal 3 angka di belakang koma).';
    if (priceKey && (row.price === null || row.price === undefined)) errors[`items.${index}.${priceKey}`] = 'Isi harga.';
  });
  return errors;
}
