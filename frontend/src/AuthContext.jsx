import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api';
import { useNotify } from './NotificationContext';

const AuthContext = createContext(null);

function clearStoredSession() {
  localStorage.removeItem('aatm_access');
  localStorage.removeItem('aatm_refresh');
}

export function AuthProvider({ children }) {
  const notify = useNotify();
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const [token, setToken] = useState(() => localStorage.getItem('aatm_access') || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('aatm_refresh') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('aatm_access') || localStorage.getItem('aatm_refresh')));
  const sessionWarned = useRef(false);

  const persistSession = (accessToken, nextRefresh, nextUser) => {
    localStorage.setItem('aatm_access', accessToken);
    localStorage.setItem('aatm_refresh', nextRefresh);
    setToken(accessToken);
    setRefreshToken(nextRefresh);
    if (nextUser) setUser(nextUser);
  };

  const endSession = (warn = false) => {
    clearStoredSession();
    setToken('');
    setRefreshToken('');
    setUser(null);
    if (warn && !sessionWarned.current) {
      sessionWarned.current = true;
      notifyRef.current.warn('Session expired. Please log in again.');
    }
  };

  useEffect(() => {
    if (!token && !refreshToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        if (token) {
          try {
            const me = await api.me(token);
            if (!cancelled) {
              setUser(me);
              sessionWarned.current = false;
            }
            return;
          } catch {
            // Access token expired/invalid — try refresh below.
          }
        }

        const storedRefresh = refreshToken || localStorage.getItem('aatm_refresh') || '';
        if (!storedRefresh) {
          if (!cancelled) endSession(true);
          return;
        }

        const refreshed = await api.refresh({ refreshToken: storedRefresh });
        if (cancelled) return;
        persistSession(refreshed.accessToken, refreshed.refreshToken, refreshed.user);
        sessionWarned.current = false;
      } catch {
        if (!cancelled) endSession(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refreshToken]);

  const value = useMemo(() => ({
    token,
    refreshToken,
    user,
    loading,
    isAdmin: user?.role === 'ADMIN',
    async login(email, password) {
      // Drop stale tokens first so a previous 401/403 session cannot interfere.
      clearStoredSession();
      setToken('');
      setRefreshToken('');
      setUser(null);
      sessionWarned.current = false;

      const res = await api.login({ email, password });
      persistSession(res.accessToken, res.refreshToken, res.user);
      notifyRef.current.success('Login successful');
      return res.user;
    },
    async register(payload) {
      clearStoredSession();
      setToken('');
      setRefreshToken('');
      setUser(null);
      sessionWarned.current = false;

      const res = await api.register(payload);
      persistSession(res.accessToken, res.refreshToken, res.user);
      notifyRef.current.success('Account created successfully');
      return res.user;
    },
    logout() {
      clearStoredSession();
      setToken('');
      setRefreshToken('');
      setUser(null);
      sessionWarned.current = false;
      notifyRef.current.success('Logout successful');
    },
  }), [token, refreshToken, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
