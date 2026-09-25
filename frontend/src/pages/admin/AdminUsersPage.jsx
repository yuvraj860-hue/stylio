import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { fmt } from '../../utils/format';
import { SearchIcon, FilterIcon, ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/AdminIcons';

const roleColors = {
  admin: 'badge-gold',
  delivery: 'badge-muted',
  warehouse: 'badge-muted',
  user: 'badge-muted',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', role: '' });
  const [sort, setSort] = useState({ field: 'createdAt', order: 'desc' });
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        role: filters.role,
        sort: `${sort.order === 'desc' ? '-' : ''}${sort.field}`,
      });
      setUsers(res.users || []);
      setPagination(prev => ({ ...prev, total: res.total, pages: res.pages }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters, sort]);

  const updateUserRole = async (userId, newRole) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSort = (field) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc',
    }));
    setSortMenuOpen(false);
  };

  if (loading && users.length === 0) {
    return <div className="dashboard-loading"><div className="spinner" /></div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="text-muted">Manage user accounts and roles</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <SearchIcon size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            onKeyDown={e => e.key === 'Enter' && fetchUsers()}
          />
        </div>

        <div className="filter-group">
          <select
            value={filters.role}
            onChange={e => setFilters(prev => ({ ...prev, role: e.target.value, page: 1 }))}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="delivery">Delivery</option>
            <option value="warehouse">Warehouse</option>
            <option value="user">User</option>
          </select>
        </div>

        <div className="sort-dropdown">
          <button className="sort-btn" onClick={() => setSortMenuOpen(!sortMenuOpen)}>
            <span>Sort: {sort.field} ({sort.order === 'desc' ? '↓' : '↑'})</span>
            <ChevronDownIcon size={16} />
          </button>
          {sortMenuOpen && (
            <div className="sort-menu">
              {['name', 'email', 'role', 'createdAt'].map(field => (
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
              <th>Avatar</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="avatar-cell">
                    <div className="avatar-sm">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    <Link to={`/admin/users/${user._id}`} className="user-name-link">
                      {user.name}
                    </Link>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${roleColors[user.role] || 'badge-muted'}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.orderCount || 0}</td>
                <td>{user.totalSpent ? fmt(user.totalSpent) : '—'}</td>
                <td>
                  <span className="badge badge-muted">Active</span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="actions-cell">
                    <Link to={`/admin/users/${user._id}`} className="action-btn view" title="View">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </Link>
                    {user.role !== 'admin' && (
                      <select
                        className="role-select"
                        value={user.role}
                        onChange={e => updateUserRole(user._id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="delivery">Delivery</option>
                        <option value="warehouse">Warehouse</option>
                      </select>
                    )}
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
    </div>
  );
}