import { describe, expect, it } from 'vitest';
import { needsRequestKey, newRequestKey } from './requestKey.js';

describe('requestKey', () => {
  it('makes a new key of 32+ safe characters every time', () => {
    const a = newRequestKey();
    const b = newRequestKey();
    expect(a).toMatch(/^[A-Za-z0-9-]{32,100}$/);
    expect(a).not.toBe(b);
  });

  it('only changes need a key, the login request does not', () => {
    expect(needsRequestKey('POST', '/categories')).toBe(true);
    expect(needsRequestKey('PUT', '/categories/1')).toBe(true);
    expect(needsRequestKey('DELETE', '/purchases/1')).toBe(true);
    expect(needsRequestKey('GET', '/categories')).toBe(false);
    expect(needsRequestKey('POST', '/auth/login')).toBe(false);
  });
});
