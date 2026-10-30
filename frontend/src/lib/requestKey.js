// A new random key for one change request (header "Idempotency-Key", QA bug #2).
// The server saves a change only once per key, so a copy of the same request that the network sends again
// gets the first answer back instead of a false "sudah digunakan" error.
export function newRequestKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Changes (POST/PUT/PATCH/DELETE) get a key; reads and the login request do not.
export function needsRequestKey(method, path) {
  return method !== 'GET' && method !== 'HEAD' && path !== '/auth/login';
}
