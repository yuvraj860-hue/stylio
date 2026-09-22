const API_RAW = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
const ML_RAW = (import.meta.env.VITE_ML_BASE || '').replace(/\/$/, '');

const withApiSlash = (base, fallback) => {
  if (!base) return fallback;
  if (/(\/api\/?)$/.test(base)) return base;
  return `${base}/api`;
};

const API_BASE = withApiSlash(API_RAW, '/api');
const ML_BASE = ML_RAW || '/api/ml';

let clerkTokenGetter = null;

export function setClerkTokenGetter(fn) {
  clerkTokenGetter = fn;
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function showError(message) {
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(
      new CustomEvent('stylio:toast', { detail: { message } })
    );
  }
}

async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (clerkTokenGetter) {
    try {
      const token = await clerkTokenGetter();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      // Clerk token fetch failed, proceed without auth
    }
  }
  return headers;
}

async function handleResponse(res) {
  if (res.status === 401) {
    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('stylio:toast', {
          detail: { message: 'Your session has expired. Please sign in again.' },
        })
      );
    }
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }
  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Something went wrong (${res.status}). Please try again.`;
    throw new ApiError(message, res.status);
  }
  return data;
}

export async function apiGet(path) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, { headers });
  return handleResponse(res);
}

export async function apiPost(path, body) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiPut(path, body) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiDelete(path) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: headers['Authorization'] ? { Authorization: headers['Authorization'] } : {},
  });
  return handleResponse(res);
}

/* ------------------------- Products ------------------------- */
export const productApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => qs.append(key, v));
        } else {
          qs.append(key, value);
        }
      }
    });
    const query = qs.toString();
    return apiGet(`/products${query ? `?${query}` : ''}`);
  },

  get: (id) => apiGet(`/products/${id}`),

  recommend: (id, limit = 6) =>
    apiGet(`/products/${id}/related?limit=${limit}`),
};

/* ------------------------- Cart (server-side) ------------------------- */
export const cartApi = {
  get: () => apiGet('/cart'),
  add: (payload) => apiPost('/cart/items', payload),
  update: (id, qty) => apiPut(`/cart/items/${id}`, { qty }),
  remove: (id) => apiDelete(`/cart/items/${id}`),
  clear: () => apiDelete('/cart'),
};

/* ------------------------- Orders ------------------------- */
export const orderApi = {
  checkout: (items, shippingAddress) =>
    apiPost('/orders/checkout', { items, shippingAddress }),
  confirm: (paymentIntentId) => apiPost('/orders', { paymentIntentId }),
  razorpayCheckout: (items, shippingAddress) =>
    apiPost('/orders/razorpay-checkout', { items, shippingAddress }),
  razorpayVerify: (payload) =>
    apiPost('/orders/razorpay-verify', payload),
  myOrders: () => apiGet('/orders'),
};

/* ------------------------- Stylist ------------------------- */
export const stylistApi = {
  chat: (message, history = []) => apiPost('/stylist/chat', { message, history }),
};

/* ------------------------- Visual search (ML) ------------------------- */
export const visualSearchApi = {
  search: async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    const res = await fetch(`${ML_BASE}/visual-search`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },
};

export function friendlyError(err) {
  if (err && err.status >= 400 && err.status < 500) {
    showError(err.message);
  }
  return err && err.message ? err.message : 'Something went wrong. Please try again.';
}