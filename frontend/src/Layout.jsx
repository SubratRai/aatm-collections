import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useNotify } from './NotificationContext';
import { useSite } from './SiteContext';

export function StoreLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useSite();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setSearchText(searchParams.get('search') || '');
  }, [searchParams]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const onSearch = (e) => {
    e.preventDefault();
    const q = searchText.trim();
    navigate(q ? `/?search=${encodeURIComponent(q)}` : '/');
    setMenuOpen(false);
  };

  const activeCategory = searchParams.get('category') || '';

  const navLinks = (
    <>
      <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
      <NavLink to="/cart" onClick={() => setMenuOpen(false)}>Cart</NavLink>
      {user ? (
        <>
          <NavLink to="/orders" onClick={() => setMenuOpen(false)}>Orders</NavLink>
          {isAdmin && <NavLink to="/admin/website" onClick={() => setMenuOpen(false)}>Website</NavLink>}
          {isAdmin && <NavLink to="/admin/catalog" onClick={() => setMenuOpen(false)}>Sync</NavLink>}
          <button type="button" className="nav-btn" onClick={() => { logout(); setMenuOpen(false); }}>Logout</button>
        </>
      ) : (
        <NavLink to="/login" onClick={() => setMenuOpen(false)}>Login / Register</NavLink>
      )}
    </>
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.siteName || 'Logo'} className="brand-logo" />
            ) : (
              <span className="brand-mark">{(settings?.siteName || 'A').slice(0, 1)}</span>
            )}
            <span className="brand-text">
              <span className="brand-name">{settings?.siteName || 'Aatm Collections'}</span>
              <span className="brand-tag">Where Spirituality Meets Elegance</span>
            </span>
          </Link>

          <form className="header-search desktop-only" onSubmit={onSearch} role="search">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search for products"
              aria-label="Search for products"
            />
            <button type="submit" aria-label="Search">⌕</button>
          </form>

          <nav className="nav desktop-only">{navLinks}</nav>

          <button
            type="button"
            className={`menu-toggle mobile-only${menuOpen ? ' open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>

        <form className="header-search mobile-search mobile-only" onSubmit={onSearch} role="search">
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search for products"
            aria-label="Search for products"
          />
          <button type="submit" aria-label="Search">⌕</button>
        </form>
      </header>

      {menuOpen && (
        <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu">
          <nav className="mobile-nav">{navLinks}</nav>
        </div>
      )}
      {menuOpen && <button type="button" className="mobile-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      {categories.length > 0 && (
        <nav className="category-strip" aria-label="Categories">
          <Link to="/" className={!activeCategory ? 'active' : ''}>All Products</Link>
          {categories.map((c) => (
            <Link
              key={c}
              to={`/?category=${encodeURIComponent(c)}`}
              className={activeCategory === c ? 'active' : ''}
            >
              {c}
            </Link>
          ))}
        </nav>
      )}

      <main className="main">
        <Outlet />
      </main>

      <section className="trust-strip">
        <div className="trust-item"><span className="trust-icon" aria-hidden="true">🚚</span><div><strong>Free Shipping</strong><span>On all prepaid orders</span></div></div>
        <div className="trust-item"><span className="trust-icon" aria-hidden="true">💰</span><div><strong>Cash on Delivery</strong><span>Pay when it arrives</span></div></div>
        <div className="trust-item"><span className="trust-icon" aria-hidden="true">↩️</span><div><strong>Easy Returns</strong><span>Simple exchange policy</span></div></div>
        <div className="trust-item"><span className="trust-icon" aria-hidden="true">🔒</span><div><strong>Secure Checkout</strong><span>Your data stays safe</span></div></div>
      </section>

      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand">{settings?.siteName || 'Aatm Collections'}</div>
            <p className="footer-tagline">Where Spirituality Meets Elegance</p>
            <p className="footer-desc">
              {settings?.metaDescription
                || 'We help you create class and elegance for your home — pooja articles, brass decor, healing gemstones and more.'}
            </p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <Link to="/">Shop</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/login">Account</Link>
          </div>
          <div className="footer-col">
            <h4>Contact Us</h4>
            {settings?.supportEmail ? <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a> : null}
            {settings?.supportPhone ? <a href={`tel:${settings.supportPhone}`}>{settings.supportPhone}</a> : null}
            <span>India</span>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} {settings?.siteName || 'Aatm Collections'} · All rights reserved
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
