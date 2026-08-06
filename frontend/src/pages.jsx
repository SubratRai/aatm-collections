import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useSite } from './SiteContext';

export function HomePage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api.getProducts(search)
        .then(setProducts)
        .catch((e) => setError(e.message));
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <section>
      <div className="page-head">
        <h1>Shop</h1>
        <input
          className="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="product-grid">
        {products.map((p) => (
          <Link to={`/products/${p.id}`} key={p.id} className="product-card">
            <div className="product-image">
              {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : <div className="ph">{p.name.slice(0, 1)}</div>}
            </div>
            <h3>{p.name}</h3>
            <p className="muted">{p.category || 'General'}</p>
            <strong>₹{Number(p.price).toFixed(2)}</strong>
          </Link>
        ))}
      </div>
      {!products.length && !error ? <p className="muted">No products found.</p> : null}
    </section>
  );
}

export function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getProduct(id).then(setProduct).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <p>Loading…</p>;

  return (
    <section className="product-detail">
      <div className="product-image large">
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="ph">{product.name.slice(0, 1)}</div>}
      </div>
      <div>
        <h1>{product.name}</h1>
        <p className="muted">{product.sku} · {product.category || 'General'}</p>
        <p>{product.description}</p>
        <p><strong>₹{Number(product.price).toFixed(2)}</strong></p>
        <p>Stock: {product.stockQty}</p>
        <Link className="btn" to="/cart">Go to cart (login required)</Link>
      </div>
    </section>
  );
}

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '' });
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate(location.state?.returnUrl || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="auth-card">
      <h1>{mode === 'login' ? 'Login' : 'Create account'}</h1>
      <form onSubmit={onSubmit} className="form">
        {mode === 'register' && (
          <>
            <label>Full name<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
            <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          </>
        )}
        <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit">{mode === 'login' ? 'Login' : 'Sign up'}</button>
      </form>
      <button type="button" className="linkish" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Login'}
      </button>
    </section>
  );
}

export function CartPage() {
  return (
    <section>
      <h1>Your cart</h1>
      <p className="muted">Cart APIs are ready for the next phase. Login works; checkout wiring comes next.</p>
    </section>
  );
}

export function OrdersPage() {
  return (
    <section>
      <h1>Orders</h1>
      <p className="muted">Order history will appear here after checkout is enabled.</p>
    </section>
  );
}

export function WebsiteConfigPage() {
  const { token } = useAuth();
  const { settings, reload } = useSite();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  if (!form) return <p>Loading…</p>;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.updateSiteSettings(token, form);
      await reload();
      setMessage('Website configuration saved.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="admin-card">
      <h1>Website Configuration</h1>
      <p className="muted">Logo, theme colors, site name, and contact details for the storefront.</p>
      <form className="form grid-form" onSubmit={onSubmit}>
        <label>Website name<input name="siteName" value={form.siteName || ''} onChange={onChange} required /></label>
        <label>Logo URL<input name="logoUrl" value={form.logoUrl || ''} onChange={onChange} placeholder="https://…" /></label>
        <label>Favicon URL<input name="faviconUrl" value={form.faviconUrl || ''} onChange={onChange} /></label>
        <label>Primary color<input type="color" name="primaryColor" value={form.primaryColor || '#1f4b3a'} onChange={onChange} /></label>
        <label>Secondary color<input type="color" name="secondaryColor" value={form.secondaryColor || '#c4a35a'} onChange={onChange} /></label>
        <label>Accent color<input type="color" name="accentColor" value={form.accentColor || '#e8d5a3'} onChange={onChange} /></label>
        <label>Background<input type="color" name="backgroundColor" value={form.backgroundColor || '#f7f4ef'} onChange={onChange} /></label>
        <label>Text color<input type="color" name="textColor" value={form.textColor || '#1a1a1a'} onChange={onChange} /></label>
        <label>Font family<input name="fontFamily" value={form.fontFamily || ''} onChange={onChange} /></label>
        <label>Support email<input name="supportEmail" value={form.supportEmail || ''} onChange={onChange} /></label>
        <label>Support phone<input name="supportPhone" value={form.supportPhone || ''} onChange={onChange} /></label>
        <label>Meta title<input name="metaTitle" value={form.metaTitle || ''} onChange={onChange} /></label>
        <label className="full">Meta description<textarea name="metaDescription" rows={3} value={form.metaDescription || ''} onChange={onChange} /></label>
        {message && <p className="ok full">{message}</p>}
        {error && <p className="error full">{error}</p>}
        <button className="btn full" type="submit">Save configuration</button>
      </form>
    </section>
  );
}
