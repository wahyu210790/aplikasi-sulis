import { describe, it, expect } from 'vitest';
import { dateRangeError } from './dateRange.js';
describe('dateRangeError', () => {
  it('accepts an empty or partial range', () => { expect(dateRangeError('', '')).toBe(''); expect(dateRangeError('2026-10-01', '')).toBe(''); expect(dateRangeError('', '2026-10-01')).toBe(''); });
  it('accepts from <= to', () => { expect(dateRangeError('2026-10-01', '2026-10-01')).toBe(''); expect(dateRangeError('2026-09-30', '2026-10-01')).toBe(''); });
  it('rejects from > to', () => { expect(dateRangeError('2026-10-02', '2026-10-01')).toBe('Tanggal "Sampai" tidak boleh sebelum tanggal "Dari".'); });
});
