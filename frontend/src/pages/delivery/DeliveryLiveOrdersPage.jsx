import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { fmt } from '../../utils/format';
import { PackageIcon, MapPinIcon, ClockIcon, AlertTriangleIcon, CheckIcon, XIcon, UserIcon, MapPinIcon as MapPinIcon2 } from '../../components/AdminIcons';

const statusColors = {
  placed: 'badge-gold',
  processing: 'badge-gold',
  shipped: 'badge-muted',
  delivered: 'badge-muted',
  cancelled: 'badge-error',
};

export default function DeliveryLiveOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const fetchLiveOrders = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getLiveOrders();
      setOrders(res.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
    if (autoRefresh) {
      const interval = setInterval(fetchLiveOrders, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, autoRefresh]);

  const handleAccept = async (orderId) => {
    try {
      await adminApi.acceptOrder(orderId);
      fetchLiveOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (orderId) => {
    try {
      // For rejection, we could add a reject endpoint or just let another partner pick it up
      // For now, just remove from live view temporarily
      fetchLiveOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return <div className="dashboard-loading"><div className="spinner" /></div>;
  }

  return (
    <div className="delivery-page">
      <div className="page-header">
        <div>
          <h1>Live Orders</h1>
          <p className="text-muted">Available orders ready for pickup</p>
        </div>
        <div className="header-actions">
          <label className="checkbox-filter">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh</span>
            <span className="text-muted small">({refreshInterval / 1000}s)</span>
          </label>
          <select
            value={refreshInterval}
            onChange={e => setRefreshInterval(parseInt(e.target.value))}
            className="filter-select"
            style={{ width: 'auto' }}
          >
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
            <option value={120000}>2m</option>
          </select>
          <button className="btn btn-outline" onClick={fetchLiveOrders} disabled={loading}>
            <PackageIcon size={16} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="empty-state live-orders-empty">
          <PackageIcon size={64} className="empty-icon" />
          <h3>No Live Orders</h3>
          <p>No orders are currently waiting for pickup. Check back soon!</p>
          {autoRefresh && <p className="text-muted small">Auto-refreshing every {refreshInterval / 1000}s...</p>}
        </div>
      ) : (
        <div className="live-orders-grid">
          {orders.map(order => (
            <div key={order._id || order.id} className="live-order-card">
              <div className="order-header">
                <div className="order-id-section">
                  <Link to={`/admin/orders/${order._id || order.id}`} className="order-id">
                    {String(order._id || order.id).slice(-8).toUpperCase()}
                  </Link>
                  <span className={`badge ${statusColors[order.status] || 'badge-muted'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-time">
                  <ClockIcon size={14} />
                  <span>{formatTimeAgo(order.createdAt)}</span>
                </div>
              </div>

              <div className="order-customer">
                <UserIcon size={18} />
                <div>
                  <div className="customer-name">{order.userId?.name || 'Guest'}</div>
                  <div className="text-muted small">{order.userId?.email || 'N/A'}</div>
                </div>
              </div>

              <div className="order-address">
                <MapPinIcon2 size={18} />
                <div>
                  <div className="address-line">{order.shippingAddress?.street || ''}</div>
                  <div className="address-line small">{order.shippingAddress?.city || ''}, {order.shippingAddress?.state || ''} {order.shippingAddress?.zip || ''}</div>
                </div>
              </div>

              <div className="order-items">
                <h4>Items ({order.items?.length || 0})</h4>
                {order.items?.slice(0, 3).map((item, i) => (
                  <div key={i} className="item-row">
                    <span className="item-name">{item.name || item.productId?.name}</span>
                    <span className="item-qty">× {item.qty}</span>
                    <span className="item-price">{fmt(item.price * item.qty)}</span>
                  </div>
                ))}
                {order.items && order.items.length > 3 && (
                  <div className="text-muted small">+{order.items.length - 3} more items</div>
                )}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <span>Total</span>
                  <span className="total-amount">{fmt(order.total)}</span>
                </div>
                <div className="order-actions">
                  <button 
                    className="btn btn-ghost btn-sm reject-btn" 
                    onClick={() => handleReject(order._id || order.id)}
                    title="Reject"
                  >
                    <XIcon size={16} />
                  </button>
                  <button 
                    className="btn btn-dark accept-btn" 
                    onClick={() => handleAccept(order._id || order.id)}
                  >
                    <CheckIcon size={16} /> Accept
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}