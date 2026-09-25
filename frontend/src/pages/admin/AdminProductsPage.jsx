import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { fmt } from '../../utils/format';
import { SearchIcon, FilterIcon, ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, EditIcon, Trash2Icon, AlertTriangleIcon, PackageIcon, AlertCircleIcon } from '../../components/AdminIcons';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', category: '', active: '', lowStock: false });
  const [sort, setSort] = useState({ field: 'createdAt', order: 'desc' });
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    size: '',
    color: '',
    imageUrl: '',
    active: true,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        category: filters.category,
        active: filters.active,
        lowStock: filters.lowStock,
        sort: `${sort.order === 'desc' ? '-' : ''}${sort.field}`,
      });
      setProducts(res.products || []);
      setPagination(prev => ({ ...prev, total: res.total, pages: res.pages }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, filters, sort]);

  const handleSort = (field) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc',
    }));
    setSortMenuOpen(false);
  };

  const handleCreate = async () => {
    try {
      await adminApi.createProduct(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', price: '', category: '', stock: '', size: '', color: '', imageUrl: '', active: true });
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;
    try {
      await adminApi.updateProduct(editingProduct._id, formData);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', category: '', stock: '', size: '', color: '', imageUrl: '', active: true });
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category || '',
      stock: product.stock,
      size: product.size || '',
      color: product.color || '',
      imageUrl: product.imageUrl || '',
      active: product.active,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await adminApi.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStockUpdate = async (id, stock) => {
    try {
      await adminApi.updateStock(id, stock);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && products.length === 0) {
    return <div className="dashboard-loading"><div className="spinner" /></div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="text-muted">Manage product catalog and inventory</p>
        </div>
        <button className="btn btn-dark" onClick={() => { setEditingProduct(null); setFormData({ name: '', description: '', price: '', category: '', stock: '', size: '', color: '', imageUrl: '', active: true }); setShowCreateModal(true); }}>
          <PlusIcon size={18} /> Add Product
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <SearchIcon size={18} />
          <input
            type="text"
            placeholder="Search by name, SKU..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            onKeyDown={e => e.key === 'Enter' && fetchProducts()}
          />
        </div>

        <div className="filter-group">
          <select
            value={filters.category}
            onChange={e => setFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="Dresses">Dresses</option>
            <option value="Sneakers">Sneakers</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.active}
            onChange={e => setFilters(prev => ({ ...prev, active: e.target.value, page: 1 }))}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <label className="checkbox-filter">
          <input
            type="checkbox"
            checked={filters.lowStock}
            onChange={e => setFilters(prev => ({ ...prev, lowStock: e.target.checked, page: 1 }))}
          />
          <span>Low Stock Only</span>
          <AlertTriangleIcon size={14} />
        </label>

        <div className="sort-dropdown">
          <button className="sort-btn" onClick={() => setSortMenuOpen(!sortMenuOpen)}>
            <span>Sort: {sort.field} ({sort.order === 'desc' ? '↓' : '↑'})</span>
            <ChevronDownIcon size={16} />
          </button>
          {sortMenuOpen && (
            <div className="sort-menu">
              {['name', 'price', 'stock', 'category', 'createdAt'].map(field => (
                <button
                  key={field}
                  className={`sort-option ${sort.field === field ? 'active' : ''}`}
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
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id}>
                <td>
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="product-thumb" />
                  )}
                </td>
                <td>
                  <Link to={`/admin/products/${product._id}`} className="product-name-link">
                    {product.name}
                  </Link>
                  {product.description && <div className="text-muted small">{product.description.slice(0, 50)}...</div>}
                </td>
                <td>{product.category}</td>
                <td>{fmt(product.price)}</td>
                <td>
                  <div className="stock-cell">
                    <span className={`stock-badge ${product.stock < 10 ? 'low' : ''}`}>
                      {product.stock}
                    </span>
                    {product.stock < 10 && <AlertCircleIcon size={14} className="low-stock-alert" />}
                  </div>
                </td>
                <td>
                  <span className={`badge ${product.active ? 'badge-muted' : 'badge-error'}`}>
                    {product.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="actions-cell">
                    <button className="action-btn edit" onClick={() => handleEdit(product)} title="Edit">
                      <EditIcon size={16} />
                    </button>
                    <button className="action-btn stock" onClick={() => {
                      const newStock = prompt('Enter new stock quantity:', product.stock);
                      if (newStock !== null) handleStockUpdate(product._id, parseInt(newStock));
                    }} title="Update Stock">
                      <PackageIcon size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(product._id)} title="Delete">
                      <Trash2Icon size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          disabled={pagination.page <= 1}
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {pagination.page} of {pagination.pages} ({pagination.total} total)
        </span>
        <button
          className="pagination-btn"
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          disabled={pagination.page >= pagination.pages}
        >
          Next
        </button>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingProduct) && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingProduct(null); }}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Create Product'}</h3>
              <button onClick={() => { setShowCreateModal(false); setEditingProduct(null); }} className="modal-close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => { e.preventDefault(); editingProduct ? handleUpdate() : handleCreate(); }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} required>
                      <option value="">Select Category</option>
                      <option value="Dresses">Dresses</option>
                      <option value="Sneakers">Sneakers</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Price *</label>
                  <input type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Stock *</label>
                    <input type="number" min="0" value={formData.stock} onChange={e => setFormData(prev => ({ ...prev, stock: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Size</label>
                    <input type="text" value={formData.size} onChange={e => setFormData(prev => ({ ...prev, size: e.target.value }))} placeholder="e.g., M, L, XL" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Color</label>
                    <input type="text" value={formData.color} onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))} placeholder="e.g., Red, Blue" />
                  </div>
                  <div className="form-group">
                    <label>Image URL</label>
                    <input type="url" value={formData.imageUrl} onChange={e => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))} placeholder="https://..." />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={3} placeholder="Product description..." />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input type="checkbox" checked={formData.active} onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))} />
                    <span>Active</span>
                  </label>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowCreateModal(false); setEditingProduct(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-dark">{editingProduct ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}