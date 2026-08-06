import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api';
import { useNotify } from './NotificationContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const notify = useNotify();
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const [token, setToken] = useState(() => localStorage.getItem('aatm_access') || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('aatm_refresh') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('aatm_access')));
  const sessionWarned = useRef(false);

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
        if (!cancelled) {
          setUser(me);
          sessionWarned.current = false;
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem('aatm_access');
          localStorage.removeItem('aatm_refresh');
          setToken('');
          setRefreshToken('');
          setUser(null);
          if (!sessionWarned.current) {
            sessionWarned.current = true;
            notifyRef.current.warn('Session expired. Please log in again.');
          }
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
      notifyRef.current.success('Login successful');
      return res.user;
    },
    async register(payload) {
      const res = await api.register(payload);
      localStorage.setItem('aatm_access', res.accessToken);
      localStorage.setItem('aatm_refresh', res.refreshToken);
      setToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      setUser(res.user);
      notifyRef.current.success('Account created successfully');
      return res.user;
    },
    logout() {
      localStorage.removeItem('aatm_access');
      localStorage.removeItem('aatm_refresh');
      setToken('');
      setRefreshToken('');
      setUser(null);
      notifyRef.current.success('Logout successful');
    },
  }), [token, refreshToken, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
