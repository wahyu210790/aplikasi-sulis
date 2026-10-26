import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from '../lib/api.js';
import { AuthContext } from './AuthContext.js';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(getToken() ? 'loading' : 'guest'); // 'loading' | 'authenticated' | 'guest'

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus('guest');
      queryClient.clear();
      navigate('/masuk?alasan=sesi', { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate, queryClient]);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    api('/auth/me')
      .then((res) => {
        if (cancelled) return;
        setUser(res.data);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setUser(null);
        setStatus('guest');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(res.data.token);
    setUser(res.data.user);
    setStatus('authenticated');
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // ignore: token may already be invalid
    }
    clearToken();
    setUser(null);
    setStatus('guest');
    queryClient.clear();
    navigate('/masuk', { replace: true });
  }, [navigate, queryClient]);

  const refreshUser = useCallback(async () => {
    const res = await api('/auth/me');
    setUser(res.data);
    return res.data;
  }, []);

  const value = useMemo(() => ({ user, status, login, logout, refreshUser }), [user, status, login, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
