import assert from 'node:assert';
import { resolveApiBaseUrl, API_BASE_URL } from './src/api.js';

console.log('--- Testing API Base URL Resolution ---');

// Test 1: Default tanpa VITE_API_BASE_URL harus ke /api/v1 (produksi satu domain)
assert.strictEqual(API_BASE_URL, '/api/v1', 'Default API_BASE_URL harus /api/v1');
assert.strictEqual(resolveApiBaseUrl(), '/api/v1', 'resolveApiBaseUrl() default harus /api/v1');
assert.strictEqual(resolveApiBaseUrl(undefined), '/api/v1', 'Undefined env harus fallback ke /api/v1');
assert.strictEqual(resolveApiBaseUrl(''), '/api/v1', 'Empty string env harus fallback ke /api/v1');
assert.strictEqual(resolveApiBaseUrl('   '), '/api/v1', 'Whitespace env harus fallback ke /api/v1');

// Test 2: Eksplisit /api/v1 atau dengan trailing slash tidak boleh menghasilkan /api/v1/api/v1
assert.strictEqual(resolveApiBaseUrl('/api/v1'), '/api/v1', 'Harus tetap /api/v1');
assert.strictEqual(resolveApiBaseUrl('/api/v1/'), '/api/v1', 'Trailing slash harus dibersihkan');
assert.strictEqual(resolveApiBaseUrl('/api/v1///'), '/api/v1', 'Multiple trailing slashes harus dibersihkan');

// Test 3: Mendukung konfigurasi origin eksternal / subdomain (misal https://api.domain.com atau http://127.0.0.1:8000)
assert.strictEqual(resolveApiBaseUrl('http://127.0.0.1:8000'), 'http://127.0.0.1:8000/api/v1', 'Origin lokal harus dilengkapi /api/v1');
assert.strictEqual(resolveApiBaseUrl('http://127.0.0.1:8000/'), 'http://127.0.0.1:8000/api/v1', 'Origin lokal dengan slash harus dilengkapi /api/v1');
assert.strictEqual(resolveApiBaseUrl('http://127.0.0.1:8000/api/v1'), 'http://127.0.0.1:8000/api/v1', 'Full path tidak boleh menduplikasi /api/v1');
assert.strictEqual(resolveApiBaseUrl('https://api.domain.com'), 'https://api.domain.com/api/v1', 'Subdomain API harus dilengkapi /api/v1');
assert.strictEqual(resolveApiBaseUrl('https://api.domain.com/api/v1/'), 'https://api.domain.com/api/v1', 'Subdomain full path tidak boleh duplikasi');

// Test 4: Verifikasi simulasi pembentukan URL endpoint
function buildUrl(base, endpoint) {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanPath}`;
}

assert.strictEqual(buildUrl(resolveApiBaseUrl('/api/v1'), '/auth/login'), '/api/v1/auth/login');
assert.strictEqual(buildUrl(resolveApiBaseUrl('/api/v1'), 'products'), '/api/v1/products');
assert.strictEqual(buildUrl(resolveApiBaseUrl('http://127.0.0.1:8000'), '/purchases'), 'http://127.0.0.1:8000/api/v1/purchases');

console.log('✓ Seluruh pengujian resolusi URL API berhasil (100% PASS)');
