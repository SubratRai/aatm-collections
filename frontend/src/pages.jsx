import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useNotify } from './NotificationContext';
import { useSite } from './SiteContext';

const DEFAULT_FILTERS = {
  search: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
  sort: 'name',
};

export function HomePage() {
  const { error: notifyError } = useNotify();
  const { settings } = useSite();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api.getProducts({
        search: filters.search,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStock: filters.inStock ? 'true' : '',
        sort: filters.sort,
      })
        .then((data) => {
          setProducts(data);
          setError('');
        })
        .catch((e) => {
          setError(e.message);
          notifyError(e.message || 'Could not load products');
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [filters, notifyError]);

  const setFilter = (name, value) => setFilters((f) => ({ ...f, [name]: value }));
  const hasActiveFilters = filters.search || filters.category || filters.minPrice
    || filters.maxPrice || filters.inStock || filters.sort !== 'name';

  return (
    <section>
      <div className="hero">
        <div className="hero-text">
          <p className="hero-kicker">Curated collections</p>
          <h1>{settings?.siteName || 'Aatm Collections'}</h1>
          <p className="hero-sub">
            {settings?.metaDescription || 'Handpicked pieces for your home and wardrobe, delivered with care.'}
          </p>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="search"
          placeholder="Search name, SKU, description…"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
        <select
          value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="number"
          min="0"
          className="price-input"
          placeholder="Min ₹"
          value={filters.minPrice}
          onChange={(e) => setFilter('minPrice', e.target.value)}
        />
        <input
          type="number"
          min="0"
          className="price-input"
          placeholder="Max ₹"
          value={filters.maxPrice}
          onChange={(e) => setFilter('maxPrice', e.target.value)}
        />
        <select
          value={filters.sort}
          onChange={(e) => setFilter('sort', e.target.value)}
          aria-label="Sort"
        >
          <option value="name">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        <label className="check-label">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => setFilter('inStock', e.target.checked)}
          />
          In stock
        </label>
        {hasActiveFilters ? (
          <button type="button" className="linkish" onClick={() => setFilters(DEFAULT_FILTERS)}>
            Clear
          </button>
        ) : null}
      </div>

      {error && <p className="error">{error}</p>}
      <p className="muted result-count">
        {loading ? 'Loading…' : `${products.length} product${products.length === 1 ? '' : 's'}`}
      </p>
      <div className="product-grid">
        {products.map((p) => (
          <Link to={`/products/${p.id}`} key={p.id} className="product-card">
            <div className="product-image">
              {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : <div className="ph">{p.name.slice(0, 1)}</div>}
              {p.stockQty <= 0 ? <span className="badge badge-out">Out of stock</span> : null}
              {p.stockQty > 0 && p.stockQty <= 5 ? <span className="badge badge-low">Only {p.stockQty} left</span> : null}
            </div>
            <span className="card-category">{p.category || 'General'}</span>
            <h3>{p.name}</h3>
            <div className="card-footer">
              <strong className="price">₹{Number(p.price).toFixed(2)}</strong>
              <span className="card-cta">View →</span>
            </div>
          </Link>
        ))}
      </div>
      {!products.length && !error && !loading ? (
        <div className="empty-state">
          <p>No products match your filters.</p>
          <button type="button" className="btn" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
        </div>
      ) : null}
    </section>
  );
}

export function ProductPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const { success, error: notifyError } = useNotify();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getProduct(id)
      .then(setProduct)
      .catch((e) => {
        setError(e.message);
        notifyError(e.message || 'Product unavailable');
      });
  }, [id, notifyError]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <p>Loading…</p>;

  const onAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { returnUrl: `/products/${id}` } });
      return;
    }
    setAdding(true);
    try {
      await api.addToCart(token, product.id, qty);
      success(`${product.name} added to cart`);
    } catch (err) {
      notifyError(err.message || 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  const outOfStock = product.stockQty <= 0;

  return (
    <section className="product-detail">
      <div className="product-image large">
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="ph">{product.name.slice(0, 1)}</div>}
      </div>
      <div>
        <span className="card-category">{product.category || 'General'}</span>
        <h1>{product.name}</h1>
        <p className="muted">SKU: {product.sku}</p>
        <p>{product.description}</p>
        <p className="detail-price">₹{Number(product.price).toFixed(2)}</p>
        <p className={outOfStock ? 'error' : 'muted'}>
          {outOfStock ? 'Out of stock' : `${product.stockQty} in stock`}
        </p>
        {!outOfStock && (
          <div className="add-to-cart-row">
            <div className="qty-control">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty(Math.min(product.stockQty, qty + 1))}>+</button>
            </div>
            <button type="button" className="btn" onClick={onAddToCart} disabled={adding}>
              {adding ? 'Adding…' : 'Add to cart'}
            </button>
            <Link className="linkish" to="/cart">View cart</Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function LoginPage() {
  const { login, register } = useAuth();
  const { error: notifyError } = useNotify();
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
      notifyError(err.message || (mode === 'login' ? 'Login failed' : 'Sign up failed'));
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

const EMPTY_CHECKOUT = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  paymentMethod: 'COD',
};

export function CartPage() {
  const { token, user } = useAuth();
  const { success, error: notifyError } = useNotify();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_CHECKOUT });
  const [placing, setPlacing] = useState(false);

  const loadCart = () => {
    api.getCart(token).then(setCart).catch((e) => notifyError(e.message || 'Could not load cart'));
  };

  useEffect(() => {
    loadCart();
    setForm((f) => ({ ...f, fullName: user?.fullName || '', phone: user?.phone || '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!cart) return <p>Loading…</p>;

  const onQty = async (item, quantity) => {
    if (quantity < 1) return;
    try {
      setCart(await api.updateCartItem(token, item.id, quantity));
    } catch (err) {
      notifyError(err.message || 'Could not update quantity');
    }
  };

  const onRemove = async (item) => {
    try {
      setCart(await api.removeCartItem(token, item.id));
    } catch (err) {
      notifyError(err.message || 'Could not remove item');
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onPlaceOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const order = await api.checkout(token, form);
      success(`Order placed successfully (₹${Number(order.totalAmount).toFixed(2)})`);
      navigate('/orders');
    } catch (err) {
      notifyError(err.message || 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <section>
      <h1>Your cart</h1>
      {!cart.items.length ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link className="btn" to="/">Browse products</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-thumb">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <div className="ph">{item.name.slice(0, 1)}</div>}
                </div>
                <div className="cart-item-info">
                  <strong>{item.name}</strong>
                  <span className="muted">₹{Number(item.unitPrice).toFixed(2)} each</span>
                </div>
                <div className="qty-control">
                  <button type="button" onClick={() => onQty(item, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => onQty(item, item.quantity + 1)}>+</button>
                </div>
                <strong className="price">₹{Number(item.lineTotal).toFixed(2)}</strong>
                <button type="button" className="linkish" onClick={() => onRemove(item)}>Remove</button>
              </div>
            ))}
            <div className="cart-total">
              <span>Total ({cart.itemCount} item{cart.itemCount === 1 ? '' : 's'})</span>
              <strong className="price">₹{Number(cart.total).toFixed(2)}</strong>
            </div>
          </div>

          <div className="admin-card checkout-card">
            {!checkoutOpen ? (
              <button type="button" className="btn full-width" onClick={() => setCheckoutOpen(true)}>
                Proceed to checkout
              </button>
            ) : (
              <form className="form" onSubmit={onPlaceOrder}>
                <h2>Delivery details</h2>
                <label>Full name<input name="fullName" required value={form.fullName} onChange={onChange} /></label>
                <label>Phone (10+ digits)<input name="phone" required minLength={10} value={form.phone} onChange={onChange} /></label>
                <label>Address line 1<input name="line1" required value={form.line1} onChange={onChange} /></label>
                <label>Address line 2<input name="line2" value={form.line2} onChange={onChange} /></label>
                <label>City<input name="city" required value={form.city} onChange={onChange} /></label>
                <label>State<input name="state" value={form.state} onChange={onChange} /></label>
                <label>PIN code<input name="postalCode" required value={form.postalCode} onChange={onChange} /></label>
                <label>Payment
                  <select name="paymentMethod" value={form.paymentMethod} onChange={onChange}>
                    <option value="COD">Cash on Delivery</option>
                  </select>
                </label>
                <button className="btn" type="submit" disabled={placing}>
                  {placing ? 'Placing order…' : `Place order · ₹${Number(cart.total).toFixed(2)}`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

const ORDER_STATUS_LABEL = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export function OrdersPage() {
  const { token } = useAuth();
  const { error: notifyError } = useNotify();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.myOrders(token)
      .then(setOrders)
      .catch((e) => notifyError(e.message || 'Could not load orders'));
  }, [token, notifyError]);

  if (!orders) return <p>Loading…</p>;

  return (
    <section>
      <h1>Your orders</h1>
      {!orders.length ? (
        <div className="empty-state">
          <p>No orders yet.</p>
          <Link className="btn" to="/">Start shopping</Link>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <div className="order-card" key={o.id}>
              <div className="order-head">
                <div>
                  <strong>Order #{o.id.slice(0, 8).toUpperCase()}</strong>
                  <span className="muted"> · {new Date(o.createdAt).toLocaleString()}</span>
                </div>
                <span className={`order-status status-${o.status.toLowerCase()}`}>
                  {ORDER_STATUS_LABEL[o.status] || o.status}
                </span>
              </div>
              <div className="order-items">
                {o.items.map((item, i) => (
                  <div className="order-item" key={i}>
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{Number(item.lineTotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="order-foot">
                <span className="muted">
                  {o.paymentMethod} · {o.paymentStatus === 'PENDING' ? 'Pay on delivery' : o.paymentStatus}
                  {o.erpOrderId ? ` · Ref ${o.erpOrderId}` : ''}
                </span>
                <strong className="price">₹{Number(o.totalAmount).toFixed(2)}</strong>
              </div>
              {o.deliveryAddress ? <p className="muted order-address">Deliver to: {o.deliveryAddress}</p> : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function CatalogSyncPage() {
  const { token } = useAuth();
  const { success, error: notifyError } = useNotify();
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const loadStatus = () => {
    api.erpStatus(token).then(setStatus).catch(() => {});
  };

  useEffect(loadStatus, [token]);

  const onSync = async () => {
    setSyncing(true);
    setLastResult(null);
    try {
      const result = await api.erpSync(token);
      setLastResult(result);
      success(`Synced ${result.totalErpItems} products from Retail360`);
      loadStatus();
    } catch (err) {
      notifyError(err.message || 'ERP sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section className="admin-card">
      <h1>Catalog Sync (Retail360)</h1>
      <p className="muted">
        Pull products, prices, and stock from the Retail360 ERP e-commerce channel.
        Products you have manually edited keep their local values; only stock is refreshed for them.
      </p>
      {status ? (
        <dl className="status-list">
          <div><dt>ERP</dt><dd>{status.erpBaseUrl}</dd></div>
          <div><dt>Channel</dt><dd>{status.channelCode}</dd></div>
          <div><dt>Auto sync</dt><dd>{status.scheduledSyncEnabled ? 'Every 15 min' : 'Off (manual only)'}</dd></div>
          <div><dt>Last sync</dt><dd>{status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'Never'}</dd></div>
          <div className="full"><dt>Summary</dt><dd>{status.lastSyncSummary}</dd></div>
        </dl>
      ) : null}
      <button className="btn" type="button" onClick={onSync} disabled={syncing}>
        {syncing ? 'Syncing…' : 'Sync now from Retail360'}
      </button>
      {lastResult ? (
        <div className="sync-result">
          <p className="ok">Sync complete.</p>
          <ul className="muted">
            <li>{lastResult.totalErpItems} products received from ERP</li>
            <li>{lastResult.created} created · {lastResult.updated} updated</li>
            <li>{lastResult.stockOnlyUpdated} stock-only (admin-edited) · {lastResult.skippedNoPrice} skipped (no price)</li>
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function WebsiteConfigPage() {
  const { token } = useAuth();
  const { settings, reload } = useSite();
  const { success, error: notifyError } = useNotify();
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
      success('Website configuration saved successfully');
    } catch (err) {
      setError(err.message);
      notifyError(err.message || 'Failed to save configuration');
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
