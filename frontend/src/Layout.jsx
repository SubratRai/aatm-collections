import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useNotify } from './NotificationContext';
import { useSite } from './SiteContext';

export function StoreLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useSite();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.siteName || 'Logo'} className="brand-logo" />
          ) : null}
          <span>{settings?.siteName || 'Aatm Collections'}</span>
        </Link>
        <nav className="nav">
          <NavLink to="/">Shop</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          {user ? (
            <>
              <NavLink to="/orders">Orders</NavLink>
              {isAdmin && <NavLink to="/admin/website">Website</NavLink>}
              {isAdmin && <NavLink to="/admin/catalog">Sync Products</NavLink>}
              <button type="button" className="linkish" onClick={logout}>Logout</button>
            </>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div>{settings?.siteName || 'Aatm Collections'}</div>
        <div>
          {settings?.supportEmail || '—'}
          {settings?.supportPhone ? ` · ${settings.supportPhone}` : ''}
        </div>
      </footer>
    </div>
  );
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const { warn } = useNotify();
  const navigate = useNavigate();
  const warned = React.useRef(false);
  React.useEffect(() => {
    if (!loading && !user) {
      if (!warned.current) {
        warned.current = true;
        warn('Please log in to continue.');
      }
      navigate('/login', { replace: true, state: { returnUrl: window.location.pathname } });
    }
  }, [user, loading, navigate, warn]);
  if (loading) return <p>Loading…</p>;
  if (!user) return null;
  return children;
}

export function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const { warn } = useNotify();
  const navigate = useNavigate();
  const warned = React.useRef(false);
  React.useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      if (!warned.current) {
        warned.current = true;
        warn('Admin access is required for this page.');
      }
      navigate('/login', { replace: true });
    }
  }, [user, loading, isAdmin, navigate, warn]);
  if (loading) return <p>Loading…</p>;
  if (!isAdmin) return null;
  return children;
}
