import { describe, expect, it } from 'vitest';
import { fieldErrors, withoutError } from './formErrors.js';

describe('form errors', () => {
  it('takes the first message of each field of a 422', () => {
    expect(fieldErrors({ status: 422, errors: { name: ['Nama wajib diisi.', 'x'] } })).toEqual({ name: 'Nama wajib diisi.' });
    expect(fieldErrors({ status: 500, errors: { name: ['x'] } })).toEqual({});
  });
  it('clears the message of a changed field', () => {
    expect(withoutError({ name: 'a', sku: 'b' }, 'name')).toEqual({ sku: 'b' });
    expect(withoutError({ category_id: 'a' }, 'category')).toEqual({});
    const same = { sku: 'b' };
    expect(withoutError(same, 'name')).toBe(same);
  });
});
