import { describe, expect, it } from 'vitest';
import { diffClass, qtyDiff } from './diff.js';

describe('opname qtyDiff', () => {
  it('counted minus system stock with 3 decimals', () => {
    expect(qtyDiff('112', '115.000')).toBe('-3.000');
    expect(qtyDiff('13', '12.500')).toBe('0.500');
    expect(qtyDiff('0.3', '0.1')).toBe('0.200');
    expect(qtyDiff('26', '26.000')).toBe('0.000');
  });

  it('null when the count or the stock is missing', () => {
    expect(qtyDiff('', '1.000')).toBe(null);
    expect(qtyDiff(null, '1.000')).toBe(null);
    expect(qtyDiff('2', null)).toBe(null);
    expect(qtyDiff('abc', '1')).toBe(null);
  });

  it('colors more, less and none', () => {
    expect(diffClass('0.500')).toBe('text-success');
    expect(diffClass('-3.000')).toBe('text-warning');
    expect(diffClass('0.000')).toBe('text-muted');
    expect(diffClass(null)).toBe('text-muted');
  });
});
