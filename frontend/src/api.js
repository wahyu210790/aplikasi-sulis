export function resolveApiBaseUrl(envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)) {
  const rawUrl = (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '')
    ? envUrl.trim()
    : '/api/v1';

  // Remove trailing slashes
  const trimmed = rawUrl.replace(/\/+$/, '');

  // Ensure the base URL ends with /api/v1 so endpoint paths like '/products' resolve to '.../api/v1/products'
  // If the user configured an origin (e.g. 'https://api.example.com'), append '/api/v1'
  if (!trimmed.endsWith('/api/v1')) {
    return `${trimmed}/api/v1`;
  }
  return trimmed;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = {
  async request(method, url, data = null) {
    const options = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include', // keep cookie support if backend uses it
    };
    // Attach Bearer token if present (auth.js stores under 'auth_token')
    const token = localStorage.getItem('auth_token');
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (data) {
      options.body = JSON.stringify(data);
    }
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    const response = await fetch(`${API_BASE_URL}${cleanPath}`, options);
    const contentType = response.headers.get('content-type') || '';
    let payload = null;
    if (contentType.includes('application/json')) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }
    if (!response.ok) {
      const error = new Error('API error');
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  },
  get(url) { return this.request('GET', url); },
  post(url, data) { return this.request('POST', url, data); },
  put(url, data) { return this.request('PUT', url, data); },
  patch(url, data) { return this.request('PATCH', url, data); },
  delete(url) { return this.request('DELETE', url); },
};
