import { useState } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { HomeIcon, PackageIcon, ClockIcon, CloseIcon, MenuIcon, SettingsIcon, MenuAlt2Icon, LogOutIcon } from './AdminIcons';

export default function DeliveryLayout({ children }) {
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
            onClick={() => { setSidebarOpen(false); setMobileMenuOpen(false); }}
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
                  end={item.path === '/delivery'}
                  className={({ isActive }) => 
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
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
          <SignOutButton signOutUrl="/" afterSignOutUrl="/">
            <button
              type="button"
              className="nav-item"
              style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
            >
              <LogOutIcon size={20} />
              <span>Log Out</span>
            </button>
          </SignOutButton>
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
            <SignOutButton signOutUrl="/" afterSignOutUrl="/">
              <button
                type="button"
                className="view-site-btn"
                style={{ cursor: 'pointer', background: 'transparent', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                title="Log Out"
              >
                <LogOutIcon size={18} />
                <span>Log Out</span>
              </button>
            </SignOutButton>
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
