import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { fmt } from '../../utils/format';
import { UsersIcon, ShoppingCartIcon, PackageIcon, TruckIcon, ChartBarIcon } from '../../components/AdminIcons';

function StatCard({ label, value, icon: Icon, color, link }) {
  return (
    <Link to={link} className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-icon" style={{ background: color }}>
        {Icon && <Icon size={24} />}
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </Link>
  );
}

function RecentOrders({ orders }) {
  if (!orders || orders.length === 0) {
    return <div className="empty-state">No recent orders</div>;
  }

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order._id || order.id}>
              <td>
                <Link to={`/admin/orders/${order._id || order.id}`} className="order-id">
                  {String(order._id || order.id).slice(-8).toUpperCase()}
                </Link>
              </td>
              <td>{order.userId?.name || 'Guest'}</td>
              <td>{fmt(order.total)}</td>
              <td>
                <span className={`badge ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </td>
              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LowStockAlert({ products }) {
  if (!products || products.length === 0) {
    return <div className="empty-state">All products well stocked</div>;
  }

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Stock</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product._id}>
              <td>{product.name}</td>
              <td>
                <span className="badge badge-error">{product.stock} left</span>
              </td>
              <td>{fmt(product.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getStatusClass(status) {
  const classes = {
    placed: 'badge-gold',
    processing: 'badge-gold',
    shipped: 'badge-muted',
    delivered: 'badge-muted',
    cancelled: 'badge-error',
  };
  return classes[status] || 'badge-muted';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, ordersRes, usersRes, lowStockRes] = await Promise.all([
          adminApi.getStats(),
          adminApi.getOrders({ limit: 5, sort: '-createdAt' }),
          adminApi.getUsers({ limit: 5, sort: '-createdAt' }),
          adminApi.getLowStock(10),
        ]);
        
        setStats(statsRes.stats);
        setRecentOrders(ordersRes.orders || []);
        setRecentUsers(usersRes.users || []);
        setLowStock(lowStockRes.products || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="text-muted">Welcome back! Here's what's happening with your store.</p>
      </div>

      <div className="stats-grid">
        <StatCard 
          label="Total Users" 
          value={stats?.totalUsers || 0} 
          icon={UsersIcon} 
          color="#3b82f6" 
          link="/admin/users" 
        />
        <StatCard 
          label="Total Orders" 
          value={stats?.totalOrders || 0} 
          icon={ShoppingCartIcon} 
          color="#8b5cf6" 
          link="/admin/orders" 
        />
        <StatCard 
          label="Total Products" 
          value={stats?.totalProducts || 0} 
          icon={PackageIcon} 
          color="#10b981" 
          link="/admin/products" 
        />
        <StatCard 
          label="Pending Orders" 
          value={stats?.pendingOrders || 0} 
          icon={TruckIcon} 
          color="#f59e0b" 
          link="/admin/orders?status=processing" 
        />
        <StatCard 
          label="Total Revenue" 
          value={fmt(stats?.totalRevenue || 0)} 
          icon={ChartBarIcon} 
          color="#ef4444" 
        />
        <StatCard 
          label="Low Stock Items" 
          value={stats?.lowStockCount || 0} 
          icon={PackageIcon} 
          color="#f97316" 
          link="/admin/products?lowStock=true" 
        />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <Link to="/admin/orders" className="view-all">View All</Link>
          </div>
          <RecentOrders orders={recentOrders} />
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Recent Users</h2>
            <Link to="/admin/users" className="view-all">View All</Link>
          </div>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Orders</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td><span className={`badge ${user.role === 'admin' ? 'badge-gold' : 'badge-muted'}`}>{user.role}</span></td>
                    <td>{user.orderCount || 0}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Low Stock Alert</h2>
            <Link to="/admin/products?lowStock=true" className="view-all">View All</Link>
          </div>
          <LowStockAlert products={lowStock} />
        </section>
      </div>
    </div>
  );
}