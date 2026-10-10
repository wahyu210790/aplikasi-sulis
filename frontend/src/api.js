// src/api.js
export const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

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
    const response = await fetch(`${API_BASE_URL}${url}`, options);
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
