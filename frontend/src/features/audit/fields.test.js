import { describe, expect, it } from 'vitest';
import { actorName, changeRows, fieldLabel, formatValue } from './fields.js';

describe('audit fields', () => {
  it('names fields in Indonesian and keeps unknown keys', () => {
    expect(fieldLabel('contract_value')).toBe('Nilai kontrak');
    expect(fieldLabel('something_new')).toBe('something_new');
  });
  it('formats rupiah, quantities, dates, roles and yes/no', () => {
    expect(formatValue('contract_value', 150000000)).toBe('Rp 150.000.000');
    expect(formatValue('min_stock', '12.500')).toBe('12,5');
    expect(formatValue('purchase_date', '2026-10-27')).toBe('27 Okt 2026');
    expect(formatValue('role', 'gudang')).toBe('Gudang');
    expect(formatValue('is_active', false)).toBe('Tidak');
    expect(formatValue('notes', null)).toBe('–');
  });
  it('writes item lists one line per item', () => {
    expect(formatValue('items', [{ sku: 'KBL-1', qty: '2.000', unit_cost: 11500 }])).toBe('SKU: KBL-1 · Jumlah: 2 · Harga modal: Rp 11.500');
  });
  it('lists only changed fields of an edit unless asked for all', () => {
    const changes = { before: { name: 'A', is_active: true }, after: { name: 'A', is_active: false } };
    expect(changeRows(changes).rows.map((r) => r.key)).toEqual(['is_active']);
    expect(changeRows(changes, { showAll: true }).rows).toHaveLength(2);
    expect(changeRows({ after: { name: 'B' } }).rows).toHaveLength(1);
  });
  it('shows "Sistem" when there is no user', () => {
    expect(actorName(null)).toBe('Sistem');
    expect(actorName({ name: 'Andi', role: 'owner' })).toBe('Andi (Owner)');
  });
});
