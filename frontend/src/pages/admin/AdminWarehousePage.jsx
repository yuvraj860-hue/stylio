import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { fmt } from '../../utils/format';
import { PackageIcon, AlertTriangleIcon, AlertCircleIcon, TrendingUpIcon, MinusCircleIcon, PlusCircleIcon, BoxIcon } from '../../components/AdminIcons';

export default function AdminWarehousePage() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', lowStock: true });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAdjustment, setStockAdjustment] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, productsRes] = await Promise.all([
        adminApi.getWarehouseStats(),
        adminApi.getProducts({ limit: 50, lowStock: true, sort: '-stock' }),
      ]);
      setStats(statsRes.stats);
      setProducts(productsRes.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStockAdjustment = async (productId, quantity) => {
    try {
      await adminApi.updateStock(productId, undefined, parseInt(quantity));
      fetchData();
      setSelectedProduct(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && !stats) {
    return <div className='dashboard-loading'><div className='spinner' /></div>;
  }

  return (
    <div className='admin-page'>
      <div className='page-header'>
        <div>
          <h1>Warehouse</h1>
          <p className='text-muted'>Manage inventory and stock levels</p>
        </div>
      </div>

      <div className='stats-grid warehouse-stats'>
        <StatCard label='Total Products' value={stats?.totalProducts || 0} icon={PackageIcon} color='#3b82f6' />
        <StatCard label='Active Products' value={stats?.activeProducts || 0} icon={PackageIcon} color='#10b981' />
        <StatCard label='Low Stock' value={stats?.lowStockProducts || 0} icon={AlertTriangleIcon} color='#f59e0b' />
        <StatCard label='Out of Stock' value={stats?.outOfStockProducts || 0} icon={AlertCircleIcon} color='#ef4444' />
        <StatCard label='Stock Value' value={fmt(stats?.totalStockValue || 0)} icon={TrendingUpIcon} color='#8b5cf6' />
      </div>

      <div className='dashboard-grid'>
        <section className='dashboard-section full-width'>
          <div className='section-header'>
            <h2>Low Stock Alert</h2>
            <label className='checkbox-filter'>
              <input
                type='checkbox'
                checked={filters.lowStock}
                onChange={e => setFilters(prev => ({ ...prev, lowStock: e.target.checked }))}
              />
              <span>Show Low Stock Only</span>
            </label>
          </div>
          <div className='data-table'>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Price</th>
                  <th>Stock Value</th>
                  <th>Status</th>
                  <th>Adjust</th>
                </tr>
              </thead>
              <tbody>
                {products
                  .filter(p => !filters.lowStock || p.stock < 10)
                  .map(product => (
                    <tr key={product._id}>
                      <td>
                        <Link to={'/admin/products/' + product._id} className='product-name-link'>
                          {product.name}
                        </Link>
                      </td>
                      <td>{product.category}</td>
                      <td>
                        <span className={`stock-badge ${product.stock < 10 ? 'low' : ''} ${product.stock === 0 ? 'zero' : ''}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td>{fmt(product.price)}</td>
                      <td>{fmt(product.price * product.stock)}</td>
                      <td>
                        <span className={`badge ${product.stock === 0 ? 'badge-error' : product.stock < 10 ? 'badge-error' : 'badge-muted'}`}>
                          {product.stock === 0 ? 'Out of Stock' : product.stock < 10 ? 'Low Stock' : 'OK'}
                        </span>
                      </td>
                      <td>
                        <div className='stock-adjust'>
                          <input
                            type='number'
                            placeholder='Qty (+/-)'
                            value={stockAdjustment}
                            onChange={e => setStockAdjustment(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleStockAdjustment(product._id, stockAdjustment)}
                            style={{ width: 100 }}
                          />
                          <button 
                            className='btn btn-sm btn-dark' 
                            onClick={() => handleStockAdjustment(product._id, stockAdjustment)}
                            disabled={!stockAdjustment}
                          >
                            Apply
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className='dashboard-section'>
            <div className='section-header'>
              <h2>Category Breakdown</h2>
            </div>
            <div className='data-table'>
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Products</th>
                    <th>Total Stock</th>
                    <th>Stock Value</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.categoryStats?.map(cat => (
                    <tr key={cat._id}>
                      <td>{cat._id}</td>
                      <td>{cat.count}</td>
                      <td>{cat.totalStock}</td>
                      <td>{fmt(cat.totalStock * 1000)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className='stat-card' style={{ '--stat-color': color }}>
      <div className='stat-icon' style={{ background: color }}>
        <icon size={24} />
      </div>
      <div className='stat-content'>
        <div className='stat-label'>{label}</div>
        <div className='stat-value'>{value}</div>
      </div>
    </div>
  );
}
