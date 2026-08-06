import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NotificationContext = createContext(null);

let nextId = 1;

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leaving: true } : n)),
    );
    window.setTimeout(() => {
      setItems((prev) => prev.filter((n) => n.id !== id));
    }, 320);
  }, []);

  const notify = useCallback((message, options = {}) => {
    const id = nextId++;
    const type = options.type || 'info';
    const ttl = options.ttl ?? 3200;
    const item = { id, message, type, leaving: false };
    setItems((prev) => [...prev, item].slice(-4));
    if (ttl > 0) {
      window.setTimeout(() => dismiss(id), ttl);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((message, options) => notify(message, { ...options, type: 'success' }), [notify]);
  const error = useCallback((message, options) => notify(message, { ...options, type: 'error' }), [notify]);
  const info = useCallback((message, options) => notify(message, { ...options, type: 'info' }), [notify]);
  const warn = useCallback((message, options) => notify(message, { ...options, type: 'warn' }), [notify]);

  const value = useMemo(() => ({
    items,
    notify,
    success,
    error,
    info,
    warn,
    dismiss,
  }), [items, notify, success, error, info, warn, dismiss]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider');
  return ctx;
}
