import { describe, it, expect } from 'vitest';
import { formatRupiah, formatQty, parseQty, formatDate, formatDateTime, formatPercent } from './format.js';
describe('format', () => {
  it('rupiah', () => { expect(formatRupiah(1322500)).toBe('Rp 1.322.500'); expect(formatRupiah(0)).toBe('Rp 0'); expect(formatRupiah(-575000)).toBe('-Rp 575.000'); expect(formatRupiah(undefined)).toBe(''); });
  it('qty', () => { expect(formatQty('12.500', 'm')).toBe('12,5 m'); expect(formatQty('1250.000')).toBe('1.250'); expect(formatQty('0.125','kg')).toBe('0,125 kg'); });
  it('parseQty', () => { expect(parseQty('12,5')).toBe('12.5'); expect(parseQty('1.250')).toBe('1250'); expect(parseQty('abc')).toBe(null); expect(parseQty('1,2345')).toBe(null); });
  it('dates', () => { expect(formatDate('2026-10-26')).toBe('26 Okt 2026'); expect(formatDateTime('2026-10-26T15:30:00+07:00')).toBe('26 Okt 2026, 15.30 WIB'); expect(formatDateTime('2026-10-26T08:30:00Z')).toBe('26 Okt 2026, 15.30 WIB'); });
  it('percent', () => { expect(formatPercent(80.4)).toBe('80,4%'); expect(formatPercent(null)).toBe(''); });
});
