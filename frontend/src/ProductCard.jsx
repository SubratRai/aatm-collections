import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';
import { useNotify } from './NotificationContext';
import { useStoreLists } from './wishlistCompare';

export function ProductCard({ product }) {
  const { token, user } = useAuth();
  const { success, error: notifyError, info } = useNotify();
  const navigate = useNavigate();
  const { isWished, isCompared, toggleWishlist, toggleCompare } = useStoreLists();
  const wished = isWished(product.id);
  const compared = isCompared(product.id);

  const onWish = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist(product.id);
    info(added ? 'Added to wishlist' : 'Removed from wishlist');
  };

  const onCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = toggleCompare(product.id);
    if (res.full) {
      notifyError('Compare list is full (max 4). Remove one first.');
      return;
    }
    info(res.added ? 'Added to compare' : 'Removed from compare');
  };

  const onAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { returnUrl: `/products/${product.id}` } });
      return;
    }
    if (product.stockQty <= 0) {
      notifyError('Out of stock');
      return;
    }
    try {
      await api.addToCart(token, product.id, 1);
      success(`${product.name} added to cart`);
    } catch (err) {
      notifyError(err.message || 'Could not add to cart');
    }
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-link">
        <div className="product-image">
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} />
            : <div className="ph">{product.name.slice(0, 1)}</div>}
          {product.stockQty <= 0 ? <span className="badge badge-out">Out of stock</span> : null}
          {product.stockQty > 0 && product.stockQty <= 5
            ? <span className="badge badge-low">Only {product.stockQty} left</span>
            : null}
          <div className="card-hover-actions">
            <button type="button" className={wished ? 'on' : ''} onClick={onWish} title="Wishlist">♡</button>
            <button type="button" className={compared ? 'on' : ''} onClick={onCompare} title="Compare">⇄</button>
            <button type="button" onClick={onAdd} title="Add to cart">＋</button>
          </div>
        </div>
        <span className="card-category">{product.category || 'General'}</span>
        <h3>{product.name}</h3>
        <div className="card-footer">
          <strong className="price">₹{Number(product.price).toFixed(2)}</strong>
          <span className="card-cta">View →</span>
        </div>
      </Link>
    </article>
  );
}
