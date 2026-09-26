import { apiGet, apiPost, apiPatch, apiDelete } from '../services/api';

export const adminApi = {
  // Dashboard
  getStats: () => apiGet('/admin/dashboard/stats'),

  // Users
  getUsers: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        qs.append(key, value);
      }
    });
    return apiGet(`/admin/users${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  getUser: (id) => apiGet(`/admin/users/${id}`),
  updateUserRole: (id, role) => apiPatch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => apiDelete(`/admin/users/${id}`),

  // Orders
  getOrders: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        qs.append(key, value);
      }
    });
    return apiGet(`/admin/orders${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  getOrder: (id) => apiGet(`/admin/orders/${id}`),
  updateOrderStatus: (id, status, trackingNumber, courierName) => 
    apiPatch(`/admin/orders/${id}/status`, { status, trackingNumber, courierName }),
  assignDeliveryPartner: (id, deliveryPartnerId) => 
    apiPost(`/admin/orders/${id}/assign`, { deliveryPartnerId }),

  // Products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        qs.append(key, value);
      }
    });
    return apiGet(`/admin/products${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  createProduct: (data) => apiPost('/admin/products', data),
  updateProduct: (id, data) => apiPatch(`/admin/products/${id}`, data),
  deleteProduct: (id) => apiDelete(`/admin/products/${id}`),
  updateStock: (id, stock, quantity) => 
    apiPatch(`/admin/products/${id}/stock`, { stock, quantity }),
  getLowStock: (threshold = 10) => apiGet(`/admin/products/low-stock?threshold=${threshold}`),

  // Warehouse
  getWarehouseStats: () => apiGet('/admin/warehouse/stats'),

  // Activity Logs
  getActivityLogs: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        qs.append(key, value);
      }
    });
    return apiGet(`/admin/activity-logs${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  // Delivery Partner
  getDeliveryStats: () => apiGet('/delivery/stats'),
  getDeliveryOrders: (status) => apiGet(`/delivery/orders${status ? `?status=${status}` : ''}`),
  getLiveOrders: () => apiGet('/delivery/orders/live'),
  acceptOrder: (id) => apiPost(`/delivery/orders/${id}/accept`),
  updateDeliveryStatus: (id, status, otp) => 
    apiPatch(`/delivery/orders/${id}/status`, { status, otp }),
};