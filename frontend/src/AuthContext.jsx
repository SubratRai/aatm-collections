import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('aatm_access') || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('aatm_refresh') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('aatm_access')));

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me(token);
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          localStorage.removeItem('aatm_access');
          localStorage.removeItem('aatm_refresh');
          setToken('');
          setRefreshToken('');
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(() => ({
    token,
    refreshToken,
    user,
    loading,
    isAdmin: user?.role === 'ADMIN',
    async login(email, password) {
      const res = await api.login({ email, password });
      localStorage.setItem('aatm_access', res.accessToken);
      localStorage.setItem('aatm_refresh', res.refreshToken);
      setToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      setUser(res.user);
      return res.user;
    },
    async register(payload) {
      const res = await api.register(payload);
      localStorage.setItem('aatm_access', res.accessToken);
      localStorage.setItem('aatm_refresh', res.refreshToken);
      setToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      setUser(res.user);
      return res.user;
    },
    logout() {
      localStorage.removeItem('aatm_access');
      localStorage.removeItem('aatm_refresh');
      setToken('');
      setRefreshToken('');
      setUser(null);
    },
  }), [token, refreshToken, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
