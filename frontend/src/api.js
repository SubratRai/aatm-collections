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
  getProducts: (search) =>
    request(`/api/products${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getProduct: (id) => request(`/api/products/${id}`),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/api/auth/me', { token }),
  getAdminSiteSettings: (token) => request('/api/admin/site-settings', { token }),
  updateSiteSettings: (token, payload) =>
    request('/api/admin/site-settings', { method: 'PUT', body: payload, token }),
};
