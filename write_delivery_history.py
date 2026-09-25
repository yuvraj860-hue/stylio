content = """import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { fmt } from '../../utils/format';
import { SearchIcon, FilterIcon, ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, MapPinIcon, CheckCircleIcon, ClockIcon, PackageIcon } from '../AdminIcons';

const statusColors = {
  placed: 'badge-gold',
  processing: 'badge-gold',
  shipped: 'badge-muted',
  delivered: 'badge-muted',
  cancelled: 'badge-error',
};

export default function DeliveryHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ status: '' });
  const [sort, setSort] = useState({ field: 'createdAt', order: 'desc' });
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDeliveryOrders(filters.status);
      const sortedOrders = [...res.orders || []].sort((a, b) => {
        const aVal = a[sort.field];
        const bVal = b[sort.field];
        if (aVal < bVal) return sort.order === 'desc' ? 1 : -1;
        if (aVal > bVal) return sort.order === 'desc' ? -1 : 1;
        return 0;
      });
      const start = (pagination.page - 1) * pagination.limit;
      const end = start + pagination.limit;
      setOrders(sortedOrders.slice(start, end));
      setPagination(prev => ({ ...prev, total: res.orders?.length || 0, pages: Math.ceil((res.orders?.length || 0) / pagination.limit) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, filters, sort]);

  const handleSort = (field) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc',
    }));
    setSortMenuOpen(false);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  if (loading && orders.length === 0) {
    return <div className="dashboard-loading"><div className="spinner" /></div>;
  }

  return (
    <div className="delivery-page">
      <div className="page-header">
        <div>
          <h1>Delivery History</h1>
          <p className="text-muted">View your delivery history and completed orders</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="delivered">Delivered</option>
            <option value="shipped">Shipped</option>
            <option value="processing">Processing</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="sort-dropdown">
          <button className="sort-btn" onClick={() => setSortMenuOpen(!sortMenuOpen)}>
            <span>Sort: {sort.field} ({sort.order === 'desc' ? '↓' : '↑'})</span>
            <ChevronDownIcon size={16} />
          </button>
          {sortMenuOpen && (
            <div className="sort-menu">
              {['orderId', 'createdAt', 'total', 'status'].map(field => (
                <button
                  key={field}
                  className={"sort-option " + (sort.field === field ? "active" : "")}
                  onClick={() => handleSort(field)}
                >
                  {field} ({sort.field === field && sort.order === 'desc' ? '↓' : '↑'})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Address</th>
              <th>Status</th>
              <th>Total</th>
              <th>Delivered Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id || order.id}>
                <td>
                  <Link to="/admin/orders/" + (order._id || order.id) className="order-id">
                    {String(order._id || order.id).slice(-8).toUpperCase()}
                  </Link>
                </td>
                <td>
                  <div>
                    <span className="customer-name">{order.userId?.name || 'Guest'}</span>
                    <div className="text-muted small">{order.userId?.email || 'N/A'}</div>
                  </div>
                </td>
                <td>
                  {order.shippingAddress?.street || ''}, {order.shippingAddress?.city || ''}
                </td>
                <td>
                  <span className="badge " + (statusColors[order.status] || "badge-muted")>
                    {order.status}
                  </span>
                </td>
                <td>{fmt(order.total)}</td>
                <td>{order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : new Date(order.updatedAt || order.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="actions-cell">
                    <Link to="/admin/orders/" + (order._id || order.id) className="action-btn view" title="View Details">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="modal-close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="order-detail-section">
                <h4>Order Info</h4>
                <div className="detail-grid">
                  <div><label>Order ID</label><span>{String(selectedOrder._id || selectedOrder.id).slice(-8).toUpperCase()}</span></div>
                  <div><label>Status</label><span className="badge " + (statusColors[selectedOrder.status] || "badge-muted")>{selectedOrder.status}</span></div>
                  <div><label>Date</label><span>{new Date(selectedOrder.createdAt).toLocaleString()}</span></div>
                  <div><label>Total</label><span className="text-lg font-bold">{fmt(selectedOrder.total)}</span></div>
                </div>
              </div>
              <div className="order-detail-section">
                <h4>Customer</h4>
                <div className="detail-grid">
                  <div><label>Name</label><span>{selectedOrder.userId?.name || 'Guest'}</span></div>
                  <div><label>Email</label><span>{selectedOrder.userId?.email || 'N/A'}</span></div>
                  <div><label>Phone</label><span>{selectedOrder.shippingAddress?.phone || 'N/A'}</span></div>
                </div>
              </div>
              <div className="order-detail-section">
                <h4>Delivery Address</h4>
                <p>{selectedOr
