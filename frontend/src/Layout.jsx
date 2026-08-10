import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useNotify } from './NotificationContext';
import { useSite } from './SiteContext';
import { useStoreLists } from './wishlistCompare';
import { CATEGORY_TREE, STORE } from './storeContent';

export function StoreLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useSite();
  const { wishCount, compareCount } = useStoreLists();
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
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : '/shop');
    setMenuOpen(false);
  };

  const activeCategory = searchParams.get('category') || '';
  const liveCats = categories.length ? categories : CATEGORY_TREE.map((c) => c.label);
  const siteName = settings?.siteName || STORE.name;

  const iconNav = (
    <>
      <NavLink to="/wishlist" className="icon-link" onClick={() => setMenuOpen(false)}>
        Wishlist{wishCount ? <span className="count-pill">{wishCount}</span> : null}
      </NavLink>
      <NavLink to="/compare" className="icon-link" onClick={() => setMenuOpen(false)}>
        Compare{compareCount ? <span className="count-pill">{compareCount}</span> : null}
      </NavLink>
      <NavLink to="/cart" className="icon-link" onClick={() => setMenuOpen(false)}>Cart</NavLink>
      {user ? (
        <>
          <NavLink to="/account" onClick={() => setMenuOpen(false)}>My Account</NavLink>
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
      <div className="announce-bar">
        <span>Free Shipping · Easy Return · 100% Payment Secure</span>
        <a href={`tel:${STORE.phone.replace(/\s/g, '')}`}>Call Us {STORE.phone}</a>
      </div>

      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={siteName} className="brand-logo" />
            ) : (
              <span className="brand-mark">{siteName.slice(0, 1)}</span>
            )}
            <span className="brand-text">
              <span className="brand-name">{siteName}</span>
              <span className="brand-tag">{STORE.tagline}</span>
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

          <nav className="nav desktop-only">{iconNav}</nav>

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
          <nav className="mobile-nav">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
            <NavLink to="/shop" onClick={() => setMenuOpen(false)}>Shop</NavLink>
            <NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink>
            <NavLink to="/blog" onClick={() => setMenuOpen(false)}>Blog</NavLink>
            <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
            {iconNav}
          </nav>
        </div>
      )}
      {menuOpen && <button type="button" className="mobile-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <nav className="category-strip mega-strip" aria-label="Shop menu">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
        <Link to="/shop" className={location.pathname.startsWith('/shop') && !activeCategory ? 'active' : ''}>Shop</Link>
        {liveCats.slice(0, 10).map((c) => (
          <Link
            key={c}
            to={`/shop?category=${encodeURIComponent(c)}`}
            className={activeCategory === c ? 'active' : ''}
          >
            {c}
          </Link>
        ))}
        <Link to="/about">About</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/contact">Contact</Link>
      </nav>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand">{siteName}</div>
            <p className="footer-tagline">{STORE.tagline}</p>
            <p className="footer-desc">{STORE.welcome}</p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <Link to="/shop">Shop</Link>
            <Link to="/wishlist">My Wishlist</Link>
            <Link to="/compare">Compare products</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/account">My Account</Link>
          </div>
          <div className="footer-col">
            <h4>Help</h4>
            <Link to="/about">About AATM Collection</Link>
            <Link to="/contact">Contact us</Link>
            <Link to="/policy/privacy">Privacy Policy</Link>
            <Link to="/policy/refunds">Refund and Returns Policy</Link>
          </div>
          <div className="footer-col">
            <h4>Contact Us</h4>
            <a href={`tel:${STORE.phone.replace(/\s/g, '')}`}>{STORE.phone}</a>
            <a href={`mailto:${STORE.emails.info}`}>{STORE.emails.info}</a>
            <a href={`mailto:${STORE.emails.sales}`}>{STORE.emails.sales}</a>
            <a href={STORE.social.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
            <span>{STORE.address}</span>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} {siteName} · All rights reserved
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
