import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from '../lib/api.js';
import { AuthContext } from './AuthContext.js';

// sessionEnded: true after the server refused the saved token (expired, or the account was deactivated and its
// sessions ended). The login page reads it, so the message survives every redirect to /masuk (QA bug #21).
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(getToken() ? 'loading' : 'guest'); // 'loading' | 'authenticated' | 'guest'
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSessionEnded(true);
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
      .catch((error) => {
        if (cancelled) return;
        if (error?.status === 401) setSessionEnded(true);
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
    setSessionEnded(false);
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
    setSessionEnded(false);
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

  const value = useMemo(
    () => ({ user, status, sessionEnded, login, logout, refreshUser }),
    [user, status, sessionEnded, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
