import { useEffect, useState } from 'react';

const WISH_KEY = 'aatm_wishlist';
const COMPARE_KEY = 'aatm_compare';
const MAX_COMPARE = 4;

function readIds(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

function writeIds(key, ids) {
  localStorage.setItem(key, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent('aatm-store-lists', { detail: { key, ids } }));
}

export function useStoreLists() {
  const [wishlist, setWishlist] = useState(() => readIds(WISH_KEY));
  const [compare, setCompare] = useState(() => readIds(COMPARE_KEY));

  useEffect(() => {
    const sync = () => {
      setWishlist(readIds(WISH_KEY));
      setCompare(readIds(COMPARE_KEY));
    };
    window.addEventListener('aatm-store-lists', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('aatm-store-lists', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggleWishlist = (productId) => {
    const id = String(productId);
    const next = wishlist.includes(id) ? wishlist.filter((x) => x !== id) : [...wishlist, id];
    writeIds(WISH_KEY, next);
    setWishlist(next);
    return !wishlist.includes(id);
  };

  const toggleCompare = (productId) => {
    const id = String(productId);
    let next;
    if (compare.includes(id)) {
      next = compare.filter((x) => x !== id);
    } else if (compare.length >= MAX_COMPARE) {
      return { added: false, full: true, next: compare };
    } else {
      next = [...compare, id];
    }
    writeIds(COMPARE_KEY, next);
    setCompare(next);
    return { added: next.includes(id), full: false, next };
  };

  const clearCompare = () => {
    writeIds(COMPARE_KEY, []);
    setCompare([]);
  };

  return {
    wishlist,
    compare,
    wishCount: wishlist.length,
    compareCount: compare.length,
    isWished: (id) => wishlist.includes(String(id)),
    isCompared: (id) => compare.includes(String(id)),
    toggleWishlist,
    toggleCompare,
    clearCompare,
    maxCompare: MAX_COMPARE,
  };
}
