import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { useNotify } from './NotificationContext';

const SiteContext = createContext(null);

export function applyTheme(settings) {
  if (!settings) return;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', settings.primaryColor || '#ef9422');
  root.style.setProperty('--color-secondary', settings.secondaryColor || '#5b2c0e');
  root.style.setProperty('--color-accent', settings.accentColor || '#7e3f98');
  root.style.setProperty('--color-bg', settings.backgroundColor || '#faf6ef');
  root.style.setProperty('--color-text', settings.textColor || '#2b2118');
  root.style.setProperty('--font-family', settings.fontFamily || "'Jost', 'Segoe UI', system-ui, sans-serif");
  if (settings.metaTitle) document.title = settings.metaTitle;
  if (settings.faviconUrl) {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = settings.faviconUrl;
  }
}

export function SiteProvider({ children }) {
  const { error: notifyError } = useNotify();
  const notifyRef = useRef(notifyError);
  notifyRef.current = notifyError;
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const data = await api.getSiteSettings();
    setSettings(data);
    applyTheme(data);
    return data;
  };

  useEffect(() => {
    reload()
      .catch((e) => {
        notifyRef.current(e.message || 'Could not load website settings');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <SiteContext.Provider value={{ settings, loading, reload, setSettings }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
