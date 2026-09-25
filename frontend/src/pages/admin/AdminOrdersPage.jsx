import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { fmt } from '../../utils/format';
import { SearchIcon, FilterIcon, ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, PackageIcon, TruckIcon } from '../../components/AdminIcons';
import { PrinterIcon } from '../../components/icons';
import InvoiceModal from '../../components/InvoiceModal';

const statusColors = {
  placed: 'badge-gold',
  processing: 'badge-gold',
  shipped: 'badge-muted',
  delivered: 'badge-muted',
  cancelled: 'badge-error',
};

const paymentStatusColors = {
  pending: 'badge-gold',
  paid: 'badge-muted',
  failed: 'badge-error',
  refunded: 'badge-muted',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', paymentStatus: '' });
  const [sort, setSort] = useState({ field: 'createdAt', order: 'desc' });
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getOrders({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        status: filters.status,
        paymentStatus: filters.paymentStatus,
        sort: (sort.order === 'desc' ? '-' : '') + sort.field,
      });
      setOrders(res.orders || []);
      setPagination(prev => ({ ...prev, total: res.total, pages: res.pages }));
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

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignDelivery = async (orderId, deliveryPartnerId) => {
    try {
      await adminApi.assignDeliveryPartner(orderId, deliveryPartnerId);
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && orders.length === 0) {
    return <div className="dashboard-loading"><div className="spinner" /></div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p className="text-muted">Manage and track all orders</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <SearchIcon size={18} />
          <input
            type="text"
            placeholder="Search by order ID or customer name..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            onKeyDown={e => e.key === 'Enter' && fetchOrders()}
          />
        </div>

        <div className="filter-group">
          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="placed">Placed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.paymentStatus}
            onChange={e => setFilters(prev => ({ ...prev, paymentStatus: e.target.value, page: 1 }))}
            className="filter-select"
          >
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="sort-dropdown">
          <button className="sort-btn" onClick={() => setSortMenuOpen(!sortMenuOpen)}>
            <span>Sort: {sort.field} ({sort.order === 'desc' ? '↓' : '↑'})</span>
            <ChevronDownIcon size={16} />
          </button>
          {sortMenuOpen && (
            <div className="sort-menu">
              {['orderId', 'createdAt', 'total', 'status', 'paymentStatus'].map(field => (
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
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id || order.id}>
                <td>
                  <Link to={"/admin/orders/" + (order._id || order.id)} className="order-id">
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
                  <div className="order-items-preview">
                    {order.items?.slice(0, 3).map((item, i) => (
                      <span key={i} className="item-tag">
                        {item.name || item.productId?.name} x {item.qty}
                      </span>
                    ))}
                    {order.items && order.items.length > 3 && (
                      <span className="text-muted">+{order.items.length - 3} more</span>
                    )}
                  </div>
                </td>
                <td>{fmt(order.total)}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={e => handleStatusChange(order._id || order.id, e.target.value)}
                    className={"status-select " + (statusColors[order.status] || 'badge-muted')}
                  >
                    <option value="placed">Placed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>
                  <span className={"badge " + (paymentStatusColors[order.paymentStatus] || "badge-muted")}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="actions-cell">
                    <Link to={`/admin/orders/${order._id || order.id}`} className="action-btn view" title="View">
                      <EyeIcon size={16} />
                    </Link>
                    <button className="action-btn print" title="Print">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-10"/><rect x="6" y="14" width="12" height="8"/></svg>
                    </button>
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
                  <div><label>Status</label><span className={`badge ${statusColors[selectedOrder.status] || "badge-muted"}`}>{selectedOrder.status}</span></div>
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
                <p>{selectedOrder.shippingAddress?.street || ''}, {selectedOrder.shippingAddress?.city || ''}, {selectedOrder.shippingAddress?.state || ''} {selectedOrder.shippingAddress?.zip || ''}</p>
              </div>
              <div className="order-detail-section">
                <h4>Items</h4>
                <div className="data-table">
                  <table>
                    <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                    <tbody>
                      {selectedOrder.items?.map((item, i) => (
                        <tr key={i}>
                          <td>{item.name || item.productId?.name}</td>
                          <td>{item.qty}</td>
                          <td>{fmt(item.price)}</td>
                          <td>{fmt(item.price * item.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setInvoiceOrder(selectedOrder)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.82rem' }}
              >
                <PrinterIcon size={16} />
                <span>Print / Tax Invoice</span>
              </button>
              <button onClick={() => setSelectedOrder(null)} className="btn btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}

      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          disabled={pagination.page <= 1}
        >
          <ChevronLeftIcon size={16} /> Previous
        </button>
        <span className="pagination-info">
          Page {pagination.page} of {pagination.pages} ({pagination.total} total)
        </span>
        <button
          className="pagination-btn"
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          disabled={pagination.page >= pagination.pages}
        >
          Next <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}