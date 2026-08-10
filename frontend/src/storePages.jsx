import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from './api';
import { useNotify } from './NotificationContext';
import { useStoreLists } from './wishlistCompare';
import { ProductCard } from './ProductCard';
import { BLOG_POSTS, CATEGORY_TREE, STORE } from './storeContent';

const DEFAULT_FILTERS = {
  search: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
  sort: 'name',
};

export function useProductCatalog() {
  const { error: notifyError } = useNotify();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setFilters((f) => ({
      ...f,
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
    }));
  }, [searchParams]);

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

  const setFilter = (name, value) => {
    setFilters((f) => ({ ...f, [name]: value }));
    if (name === 'search' || name === 'category') {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(name, value);
      else next.delete(name);
      setSearchParams(next, { replace: true });
    }
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = filters.search || filters.category || filters.minPrice
    || filters.maxPrice || filters.inStock || filters.sort !== 'name';

  return {
    products, categories, filters, setFilter, clearFilters, hasActiveFilters,
    filtersOpen, setFiltersOpen, loading, error,
  };
}

function CatalogFilters({ catalog }) {
  const {
    categories, filters, setFilter, clearFilters, hasActiveFilters,
    filtersOpen, setFiltersOpen, loading, products,
  } = catalog;
  return (
    <>
      <div className="catalog-toolbar">
        <p className="muted result-count">
          {loading ? 'Loading…' : `${products.length} product${products.length === 1 ? '' : 's'}`}
        </p>
        <button
          type="button"
          className="btn btn-secondary filter-toggle mobile-only"
          onClick={() => setFiltersOpen((o) => !o)}
        >
          {filtersOpen ? 'Hide filters' : 'Filters'}
        </button>
      </div>
      <div className={`filter-bar${filtersOpen ? ' open' : ''}`}>
        <input
          className="search"
          placeholder="Search name, SKU, description…"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
        <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="number" min="0" className="price-input" placeholder="Min ₹" value={filters.minPrice} onChange={(e) => setFilter('minPrice', e.target.value)} />
        <input type="number" min="0" className="price-input" placeholder="Max ₹" value={filters.maxPrice} onChange={(e) => setFilter('maxPrice', e.target.value)} />
        <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort">
          <option value="name">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        <label className="check-label">
          <input type="checkbox" checked={filters.inStock} onChange={(e) => setFilter('inStock', e.target.checked)} />
          In stock
        </label>
        {hasActiveFilters ? <button type="button" className="linkish" onClick={clearFilters}>Clear</button> : null}
      </div>
    </>
  );
}

export function ShopPage() {
  const catalog = useProductCatalog();
  return (
    <section>
      <div className="page-hero">
        <p className="hero-kicker">Shop</p>
        <h1>All products</h1>
        <p className="muted">Brass décor, pooja articles, healing gemstones and gifting — synced from our Retail360 catalogue.</p>
      </div>
      <CatalogFilters catalog={catalog} />
      {catalog.error && <p className="error">{catalog.error}</p>}
      <div className="product-grid">
        {catalog.products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      {!catalog.products.length && !catalog.error && !catalog.loading ? (
        <div className="empty-state">
          <p>No products match your filters.</p>
          <button type="button" className="btn" onClick={catalog.clearFilters}>Reset filters</button>
        </div>
      ) : null}
    </section>
  );
}

export function AboutPage() {
  return (
    <section className="content-page">
      <p className="hero-kicker">About AATM Collection</p>
      <h1>Timeless Indian craftsmanship</h1>
      <p>{STORE.welcome}</p>
      <p>
        We help you create class and elegance for your home — pooja articles, brass décor,
        healing gemstones, metal utensils and thoughtful gifting collections.
      </p>
      <p>
        Every piece is made by skilled artisans. Browse the shop, add favourites to your wishlist,
        compare products, and checkout with Cash on Delivery or online payment.
      </p>
      <Link className="btn" to="/shop">Shop the collection</Link>
    </section>
  );
}

export function ContactPage() {
  const { success } = useNotify();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const onSubmit = (e) => {
    e.preventDefault();
    success('Thank you. We will get back to you shortly.');
    setForm({ name: '', email: '', phone: '', message: '' });
  };
  return (
    <section className="content-page contact-page">
      <div>
        <p className="hero-kicker">Contact us</p>
        <h1>We would love to hear from you</h1>
        <dl className="contact-dl">
          <div><dt>Call us</dt><dd><a href={`tel:${STORE.phone.replace(/\s/g, '')}`}>{STORE.phone}</a></dd></div>
          <div><dt>Email</dt><dd><a href={`mailto:${STORE.emails.info}`}>{STORE.emails.info}</a></dd></div>
          <div><dt>Sales</dt><dd><a href={`mailto:${STORE.emails.sales}`}>{STORE.emails.sales}</a></dd></div>
          <div><dt>WhatsApp</dt><dd><a href={STORE.social.whatsapp} target="_blank" rel="noreferrer">Chat with us</a></dd></div>
          <div><dt>Address</dt><dd>{STORE.address}</dd></div>
        </dl>
      </div>
      <form className="form admin-card" onSubmit={onSubmit}>
        <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <label>Message<textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
        <button className="btn" type="submit">Send message</button>
      </form>
    </section>
  );
}

export function BlogListPage() {
  return (
    <section className="content-page">
      <p className="hero-kicker">Blog</p>
      <h1>Stories & inspiration</h1>
      <div className="blog-list">
        {BLOG_POSTS.map((post) => (
          <article key={post.slug} className="blog-card">
            <p className="muted">{post.date}</p>
            <h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2>
            <p>{post.excerpt}</p>
            <Link to={`/blog/${post.slug}`}>Read more →</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function BlogPostPage() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) {
    return (
      <section className="content-page">
        <h1>Post not found</h1>
        <Link to="/blog">Back to blog</Link>
      </section>
    );
  }
  return (
    <section className="content-page">
      <p className="muted">{post.date}</p>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
      <Link to="/blog">← All posts</Link>
    </section>
  );
}

export function PolicyPage({ kind }) {
  const title = kind === 'privacy' ? 'Privacy Policy' : 'Refund and Returns Policy';
  return (
    <section className="content-page">
      <h1>{title}</h1>
      {kind === 'privacy' ? (
        <>
          <p>We collect only the information needed to process orders, deliver products and support your account.</p>
          <p>Contact, address and order details are shared with Retail360 for fulfilment. We do not sell your personal data.</p>
          <p>For questions write to <a href={`mailto:${STORE.emails.info}`}>{STORE.emails.info}</a>.</p>
        </>
      ) : (
        <>
          <p>If an item arrives damaged or is not as described, contact us within 7 days of delivery.</p>
          <p>Approved refunds are processed from the Refunds desk in Retail360. COD orders are refunded after the return is received.</p>
          <p>Call {STORE.phone} or email {STORE.emails.info} to start a return.</p>
        </>
      )}
    </section>
  );
}

export function WishlistPage() {
  const { wishlist } = useStoreLists();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProducts().then((all) => {
      setProducts(all.filter((p) => wishlist.includes(String(p.id))));
    }).finally(() => setLoading(false));
  }, [wishlist]);

  return (
    <section>
      <div className="page-hero">
        <h1>My Wishlist</h1>
        <p className="muted">{wishlist.length} saved item{wishlist.length === 1 ? '' : 's'}</p>
      </div>
      {loading ? <p>Loading…</p> : null}
      {!loading && !products.length ? (
        <div className="empty-state">
          <p>Your wishlist is empty.</p>
          <Link className="btn" to="/shop">Browse shop</Link>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}

export function ComparePage() {
  const { compare, toggleCompare, clearCompare } = useStoreLists();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.getProducts().then((all) => {
      setProducts(compare.map((id) => all.find((p) => String(p.id) === id)).filter(Boolean));
    });
  }, [compare]);

  return (
    <section>
      <div className="page-hero">
        <h1>Compare products</h1>
        <p className="muted">Compare up to 4 items side by side.</p>
        {products.length > 0 && (
          <button type="button" className="linkish" onClick={clearCompare}>Clear compare</button>
        )}
      </div>
      {!products.length ? (
        <div className="empty-state">
          <p>No products selected for compare.</p>
          <Link className="btn" to="/shop">Browse shop</Link>
        </div>
      ) : (
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th> </th>
                {products.map((p) => (
                  <th key={p.id}>
                    {p.imageUrl ? <img src={p.imageUrl} alt="" /> : null}
                    <Link to={`/products/${p.id}`}>{p.name}</Link>
                    <button type="button" className="linkish" onClick={() => toggleCompare(p.id)}>Remove</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><th>Price</th>{products.map((p) => <td key={p.id}>₹{Number(p.price).toFixed(2)}</td>)}</tr>
              <tr><th>SKU</th>{products.map((p) => <td key={p.id}>{p.sku}</td>)}</tr>
              <tr><th>Category</th>{products.map((p) => <td key={p.id}>{p.category || '—'}</td>)}</tr>
              <tr><th>Stock</th>{products.map((p) => <td key={p.id}>{p.stockQty}</td>)}</tr>
              <tr><th>Description</th>{products.map((p) => <td key={p.id}>{p.description || '—'}</td>)}</tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function AccountPage() {
  return (
    <section className="content-page">
      <h1>My Account</h1>
      <p>Manage your shopping from one place.</p>
      <div className="account-links">
        <Link className="admin-card" to="/orders"><strong>Orders</strong><span>Track and review purchases</span></Link>
        <Link className="admin-card" to="/cart"><strong>Cart</strong><span>Items ready for checkout</span></Link>
        <Link className="admin-card" to="/wishlist"><strong>Wishlist</strong><span>Saved favourites</span></Link>
        <Link className="admin-card" to="/compare"><strong>Compare</strong><span>Side-by-side products</span></Link>
      </div>
    </section>
  );
}

export { CATEGORY_TREE };
