const API_BASE = import.meta.env.VITE_API_BASE || '';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  getSiteSettings: () => request('/api/public/site-settings'),
  getProducts: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, value);
    });
    const qs = params.toString();
    return request(`/api/products${qs ? `?${qs}` : ''}`);
  },
  getCategories: () => request('/api/products/categories'),
  getProduct: (id) => request(`/api/products/${id}`),
  erpSync: (token) => request('/api/admin/erp/sync', { method: 'POST', token }),
  erpStatus: (token) => request('/api/admin/erp/status', { token }),
  getCart: (token) => request('/api/cart', { token }),
  addToCart: (token, productId, quantity = 1) =>
    request('/api/cart/items', { method: 'POST', body: { productId, quantity }, token }),
  updateCartItem: (token, itemId, quantity) =>
    request(`/api/cart/items/${itemId}`, { method: 'PUT', body: { quantity }, token }),
  removeCartItem: (token, itemId) =>
    request(`/api/cart/items/${itemId}`, { method: 'DELETE', token }),
  checkout: (token, payload) =>
    request('/api/orders/checkout', { method: 'POST', body: payload, token }),
  myOrders: (token) => request('/api/orders', { token }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/api/auth/me', { token }),
  getAdminSiteSettings: (token) => request('/api/admin/site-settings', { token }),
  updateSiteSettings: (token, payload) =>
    request('/api/admin/site-settings', { method: 'PUT', body: payload, token }),
};
