import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard, GuestGuard } from './components/AuthGuard';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import StylistBot from './components/StylistBot';
import Toast from './components/Toast';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminWarehousePage from './pages/admin/AdminWarehousePage';
import DeliveryDashboardPage from './pages/delivery/DeliveryDashboardPage';
import DeliveryHistoryPage from './pages/delivery/DeliveryHistoryPage';
import DeliveryLiveOrdersPage from './pages/delivery/DeliveryLiveOrdersPage';

function ToastHost() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let timeout = null;
    const onToast = (e) => {
      const msg = e && e.detail && e.detail.message;
      if (!msg) return;
      setMessage(msg);
      clearTimeout(timeout);
      timeout = setTimeout(() => setMessage(null), 3200);
    };
    window.addEventListener('stylio:toast', onToast);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('stylio:toast', onToast);
    };
  }, []);

  if (!message) return null;
  return <Toast message={message} />;
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div>
          <h4>STYLIO</h4>
          <p style={{ marginTop: 8, fontSize: '0.82rem' }}>
            Considered clothing. Curated for you.
          </p>
        </div>
        <div className="footer__col">
          <div className="eyebrow" style={{ marginBottom: 8 }}>Shop</div>
          <a href="/shop">All Pieces</a>
          <a href="/shop?category=Dresses">Dresses</a>
          <a href="/shop?category=Sneakers">Sneakers</a>
          <a href="/shop?category=Accessories">Accessories</a>
        </div>
        <div className="footer__col">
          <div className="eyebrow" style={{ marginBottom: 8 }}>Care</div>
          <a href="/account">My Account</a>
          <a href="/shop?sort=new">New In</a>
        </div>
      </div>
      <div className="footer__bottom">© 2026 STYLIO. All rights reserved.</div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route
            path="/checkout"
            element={
              <AuthGuard>
                <CheckoutPage />
              </AuthGuard>
            }
          />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route
            path="/account"
            element={
              <AuthGuard>
                <UserProfilePage />
              </AuthGuard>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <AuthGuard>
                <AdminLayout />
              </AuthGuard>
            }
          />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrdersPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/warehouse" element={<AdminWarehousePage />} />
          <Route path="/admin/activity" element={<div className="admin-page"><h1>Activity Logs</h1></div>} />
          
          {/* Delivery Partner Routes */}
          <Route
            path="/delivery/*"
            element={
              <AuthGuard>
                <DeliveryLayout />
              </AuthGuard>
            }
          />
          <Route path="/delivery" element={<DeliveryDashboardPage />} />
          <Route path="/delivery/orders" element={<DeliveryHistoryPage />} />
          <Route path="/delivery/orders/live" element={<DeliveryLiveOrdersPage />} />
          <Route path="/delivery/history" element={<DeliveryHistoryPage />} />
          <Route path="/delivery/stats" element={<DeliveryDashboardPage />} />
          
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <StylistBot />
      <ToastHost />
    </div>
  );
}

function AdminLayout({ children }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isLoaded || !isSignedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: HomeIcon, roles: ['admin'] },
    { path: '/admin/users', label: 'Users', icon: UsersIcon, roles: ['admin'] },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingCartIcon, roles: ['admin'] },
    { path: '/admin/products', label: 'Products', icon: PackageIcon, roles: ['admin', 'warehouse'] },
    { path: '/admin/warehouse', label: 'Warehouse', icon: WarehouseIcon, roles: ['admin', 'warehouse'] },
    { path: '/delivery', label: 'Delivery', icon: TruckIcon, roles: ['admin', 'delivery'] },
    { path: '/admin/activity', label: 'Activity Logs', icon: ChartBarIcon, roles: ['admin'] },
  ];

  const userRole = user?.publicMetadata?.role || 'user';

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(userRole) || userRole === 'admin'
  );

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/admin" className="sidebar-logo">
            <span className="logo-text">STYLIO</span>
            <span className="logo-sub">Admin</span>
          </Link>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <CloseIcon size={24} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Admin navigation">
          <ul>
            {filteredNavItems.map(item => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <Link to="/admin/settings" className="nav-item">
            <SettingsIcon size={20} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
          </button>
          
          <div className="header-actions">
            <Link to="/" className="view-site-btn" target="_blank" rel="noopener noreferrer">
              <MenuAlt2Icon size={20} />
              <span>View Site</span>
            </Link>
            <div className="user-menu">
              <span className="user-name">{user?.fullName || user?.firstName || 'Admin'}</span>
              <span className="user-role">{user?.publicMetadata?.role || 'admin'}</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>

      {mobileMenuOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function DeliveryLayout({ children }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isLoaded || !isSignedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const navItems = [
    { path: '/delivery', label: 'Dashboard', icon: HomeIcon, roles: ['admin', 'delivery'] },
    { path: '/delivery/orders', label: 'My Orders', icon: PackageIcon, roles: ['admin', 'delivery'] },
    { path: '/delivery/orders/live', label: 'Live Orders', icon: PackageIcon, roles: ['admin', 'delivery'] },
    { path: '/delivery/history', label: 'History', icon: ClockIcon, roles: ['admin', 'delivery'] },
  ];

  const userRole = user?.publicMetadata?.role || 'user';

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(userRole) || userRole === 'admin'
  );

  return (
    <div className="admin-layout delivery-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/delivery" className="sidebar-logo">
            <span className="logo-text">STYLIO</span>
            <span className="logo-sub">Delivery</span>
          </Link>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <CloseIcon size={24} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Delivery navigation">
          <ul>
            {filteredNavItems.map(item => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <Link to="/delivery/settings" className="nav-item">
            <SettingsIcon size={20} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
          </button>
          
          <div className="header-actions">
            <Link to="/" className="view-site-btn" target="_blank" rel="noopener noreferrer">
              <MenuAlt2Icon size={20} />
              <span>View Site</span>
            </Link>
            <div className="user-menu">
              <span className="user-name">{user?.fullName || user?.firstName || 'Delivery'}</span>
              <span className="user-role">{user?.publicMetadata?.role || 'delivery'}</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>

      {mobileMenuOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}