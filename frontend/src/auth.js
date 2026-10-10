// src/auth.js
import { apiClient } from './api.js';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function login(email, password) {
  // Use API client with relative URL
  const data = await apiClient.post('/auth/login', { email, password });
  const token = data.data.access_token;
  setToken(token);
  if (data.data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
  }
  return token;
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    // Ensure local token is cleared regardless of network errors
    clearToken();
  }
}

export async function fetchCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const resp = await apiClient.get('/auth/me');
    if (resp.data) {
      localStorage.setItem(USER_KEY, JSON.stringify(resp.data));
    }
    return resp.data;
  } catch (err) {
    if (err.status === 401) {
      // Unauthorized / token expired
      clearToken();
    }
    // For other errors, propagate so caller can handle
    throw err;
  }
}
