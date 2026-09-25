import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { fmt } from '../../utils/format';
import { TruckIcon, PackageIcon, CheckCircleIcon, ClockIcon, DollarSignIcon, TrendingUpIcon, MapPinIcon, CalendarIcon, AlertTriangleIcon } from '../../components/AdminIcons';

const statusColors = {
  placed: 'badge-gold',
  processing: 'badge-gold',
  shipped: 'badge-muted',
  delivered: 'badge-muted',
  cancelled: 'badge-error',
};

export default function DeliveryDashboardPage() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes] = await Promise.all([
        adminApi.getDeliveryStats(),
        adminApi.getDeliveryOrders('all'),
      ]);
      setStats(statsRes.stats);
      setOrders(ordersRes.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusLabels = {
    placed: 'Placed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  if (loading) {
    return <div className="dashboard-loading"><div className="spinner" /></div>;
  }

  return (
    <div className="delivery-page">
      <div className="page-header">
        <div>
          <h1>Delivery Dashboard</h1>
          <p className="text-muted">Manage your deliveries and track performance</p>
        </div>
        <Link to="/delivery/orders/live" className="btn btn-dark">
          <PackageIcon size={18} /> View Live Orders
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard 
          label="Assigned Orders" 
          value={stats?.assignedOrders || 0} 
          icon={PackageIcon} 
          color="#3b82f6" 
        />
        <StatCard 
          label="Delivered" 
          value={stats?.deliveredOrders || 0} 
          icon={CheckCircleIcon} 
          color="#10b981" 
        />
        <StatCard 
          label="Pending" 
          value={stats?.pendingOrders || 0} 
          icon={ClockIcon} 
          color="#f59e0b" 
        />
        <StatCard 
          label="Total Earnings" 
          value={fmt(stats?.totalEarnings || 0)} 
          icon={DollarSignIcon} 
          color="#10b981" 
        />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section full-width">
          <div className="section-header">
            <h2>My Assigned Orders</h2>
            <Link to="/delivery/orders" className="view-all">View All</Link>
          </div>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Assigned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map(order => (
                  <tr key={order._id || order.id}>
                    <td>
                      <Link to={`/admin/orders/${order._id || order.id}`} className="order-id">
                        {String(order._id || order.id).slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td>{order.userId?.name || 'Guest'}</td>
                    <td>
                      {order.shippingAddress?.street || ''}, {order.shippingAddress?.city || ''}
                    </td>
                    <td>
                      <span className={`badge ${statusColors[order.status] || 'badge-muted'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{fmt(order.total)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="actions-cell">
                        <Link to={`/admin/orders/${order._id || order.id}`} className="action-btn view" title="View Details">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <Link to="/delivery/orders/live" className="action-card">
              <PackageIcon size={28} />
              <h4>Live Orders</h4>
              <p>View and accept new orders</p>
            </Link>
            <Link to="/delivery/orders" className="action-card">
              <PackageIcon size={28} />
              <h4>All Orders</h4>
              <p>View all assigned orders</p>
            </Link>
            <Link to="/delivery/history" className="action-card">
              <PackageIcon size={28} />
              <h4>History</h4>
              <p>View delivery history</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-icon" style={{ background: color }}>
        <icon size={24} />
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}