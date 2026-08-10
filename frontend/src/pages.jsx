import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useNotify } from './NotificationContext';
import { useSite } from './SiteContext';
import { ProductCard } from './ProductCard';
import { useStoreLists } from './wishlistCompare';
import { CATEGORY_TREE, STORE, TRUST_POINTS } from './storeContent';

export function HomePage() {
  const { settings } = useSite();
  const { error: notifyError } = useNotify();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getProducts({ sort: 'name' })
      .then((data) => setProducts(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch((e) => notifyError(e.message || 'Could not load products'));
  }, [notifyError]);

  const tiles = categories.length
    ? categories.slice(0, 8)
    : CATEGORY_TREE.map((c) => c.label).slice(0, 8);

  return (
    <section>
      <div className="hero">
        <div className="hero-text">
          <p className="hero-kicker">AATM Collection</p>
          <h1>{settings?.siteName || STORE.name}</h1>
          <p className="hero-sub">
            {settings?.metaDescription || STORE.welcome}
          </p>
          <div className="hero-actions">
            <Link className="btn btn-hero" to="/shop">Shop Now</Link>
            <Link className="btn btn-secondary" to="/about">About us</Link>
          </div>
        </div>
      </div>

      <div className="home-cats">
        <div className="section-head">
          <h2>Shop by category</h2>
          <Link to="/shop">View all →</Link>
        </div>
        <div className="cat-tiles">
          {tiles.map((c) => (
            <Link key={c} className="cat-tile" to={`/shop?category=${encodeURIComponent(c)}`}>
              <span>{c}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="trust-strip home-trust">
        {TRUST_POINTS.map((t) => (
          <div className="trust-item" key={t.title}>
            <span className="trust-icon" aria-hidden="true">{t.icon}</span>
            <div><strong>{t.title}</strong><span>{t.text}</span></div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h2>Featured products</h2>
        <Link to="/shop">Shop all →</Link>
      </div>
      <div className="product-grid">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      <div className="newsletter-band">
        <div>
          <h2>Subscribe to our newsletter and join us!</h2>
          <p className="muted">New arrivals, festival gifting and artisan stories.</p>
        </div>
        <form
          className="newsletter-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.currentTarget.reset();
          }}
        >
          <input type="email" required placeholder="Your email" aria-label="Email" />
          <button className="btn" type="submit">Subscribe</button>
        </form>
      </div>
    </section>
  );
}

export function ProductPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const { success, error: notifyError, info } = useNotify();
  const navigate = useNavigate();
  const { isWished, isCompared, toggleWishlist, toggleCompare } = useStoreLists();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
    api.getProduct(id)
      .then(setProduct)
      .catch((e) => {
        setError(e.message);
        notifyError(e.message || 'Product unavailable');
      });
  }, [id, notifyError]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <p>Loading…</p>;

  const gallery = (Array.isArray(product.imageUrls) && product.imageUrls.length
    ? product.imageUrls
    : (product.imageUrl ? [product.imageUrl] : [])
  ).filter(Boolean);
  const mainImage = gallery[Math.min(activeImage, Math.max(gallery.length - 1, 0))] || null;

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
      <div className="product-gallery">
        {gallery.length > 1 ? (
          <div className="gallery-thumbs" role="listbox" aria-label="Product images">
            {gallery.map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                className={`gallery-thumb ${index === activeImage ? 'active' : ''}`}
                onClick={() => setActiveImage(index)}
                aria-label={`View image ${index + 1}`}
                aria-selected={index === activeImage}
              >
                <img src={url} alt="" />
              </button>
            ))}
          </div>
        ) : null}
        <div className="product-image large gallery-main">
          {mainImage
            ? <img src={mainImage} alt={product.name} />
            : <div className="ph">{product.name.slice(0, 1)}</div>}
        </div>
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
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => info(toggleWishlist(product.id) ? 'Added to wishlist' : 'Removed from wishlist')}
            >
              {isWished(product.id) ? 'Wishlisted' : 'Add to wishlist'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const res = toggleCompare(product.id);
                if (res.full) notifyError('Compare list is full (max 4).');
                else info(res.added ? 'Added to compare' : 'Removed from compare');
              }}
            >
              {isCompared(product.id) ? 'In compare' : 'Compare'}
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
  const [syncingStock, setSyncingStock] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [lastStockResult, setLastStockResult] = useState(null);

  const loadStatus = () => {
    api.erpStatus(token).then(setStatus).catch(() => {});
  };

  useEffect(loadStatus, [token]);

  const onSyncProducts = async () => {
    setSyncing(true);
    setLastResult(null);
    try {
      const result = await api.erpSync(token);
      setLastResult(result);
      success(`Synced ${result.totalErpItems} products from Retail360`);
      loadStatus();
    } catch (err) {
      notifyError(err.message || 'Product sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const onSyncStock = async () => {
    setSyncingStock(true);
    setLastStockResult(null);
    try {
      const result = await api.erpSyncStock(token);
      setLastStockResult(result);
      success(`Stock refreshed: ${result.changed} updated of ${result.checked} checked`);
      loadStatus();
    } catch (err) {
      notifyError(err.message || 'Stock sync failed');
    } finally {
      setSyncingStock(false);
    }
  };

  return (
    <section className="admin-card">
      <h1>Product Sync (Retail360)</h1>
      <p className="muted">
        Keep website products aligned with Retail360 inventory.
        Use <strong>Sync Products</strong> to update names, prices, images, and stock.
        Quantities also refresh automatically every minute, and again right before checkout.
      </p>
      {status ? (
        <dl className="status-list">
          <div><dt>ERP</dt><dd>{status.erpBaseUrl}</dd></div>
          <div><dt>Channel</dt><dd>{status.channelCode}</dd></div>
          <div><dt>Product auto-sync</dt><dd>{status.scheduledSyncEnabled ? 'Every 15 min' : 'Off'}</dd></div>
          <div><dt>Stock auto-sync</dt><dd>{status.stockSyncEnabled ? 'Every 1 min' : 'Off'}</dd></div>
          <div><dt>Last product sync</dt><dd>{status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'Never'}</dd></div>
          <div><dt>Last stock sync</dt><dd>{status.lastStockSyncAt ? new Date(status.lastStockSyncAt).toLocaleString() : 'Never'}</dd></div>
          <div className="full"><dt>Product summary</dt><dd>{status.lastSyncSummary}</dd></div>
          <div className="full"><dt>Stock summary</dt><dd>{status.lastStockSyncSummary}</dd></div>
        </dl>
      ) : null}
      <div className="btn-row">
        <button className="btn" type="button" onClick={onSyncProducts} disabled={syncing || syncingStock}>
          {syncing ? 'Syncing products…' : 'Sync Products'}
        </button>
        <button className="btn btn-secondary" type="button" onClick={onSyncStock} disabled={syncing || syncingStock}>
          {syncingStock ? 'Refreshing stock…' : 'Refresh Stock Now'}
        </button>
      </div>
      {lastResult ? (
        <div className="sync-result">
          <p className="ok">Product sync complete.</p>
          <ul className="muted">
            <li>{lastResult.totalErpItems} products received from ERP</li>
            <li>{lastResult.created} created · {lastResult.updated} updated</li>
            <li>{lastResult.stockOnlyUpdated} stock-only (admin-edited) · {lastResult.skippedNoPrice || 0} imported without ERP price</li>
            <li>{lastResult.linkedLocal || 0} local products linked · {lastResult.deactivatedLocal || 0} deactivated (unlinked/seed)</li>
          </ul>
        </div>
      ) : null}
      {lastStockResult ? (
        <div className="sync-result">
          <p className="ok">Stock refresh complete.</p>
          <ul className="muted">
            <li>{lastStockResult.checked} products checked · {lastStockResult.changed} quantities updated</li>
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
