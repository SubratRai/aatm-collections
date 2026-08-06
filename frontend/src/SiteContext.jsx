import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { useNotify } from './NotificationContext';

const SiteContext = createContext(null);

export function applyTheme(settings) {
  if (!settings) return;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', settings.primaryColor || '#1f4b3a');
  root.style.setProperty('--color-secondary', settings.secondaryColor || '#c4a35a');
  root.style.setProperty('--color-accent', settings.accentColor || '#e8d5a3');
  root.style.setProperty('--color-bg', settings.backgroundColor || '#f7f4ef');
  root.style.setProperty('--color-text', settings.textColor || '#1a1a1a');
  root.style.setProperty('--font-family', settings.fontFamily || "Georgia, 'Times New Roman', serif");
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
