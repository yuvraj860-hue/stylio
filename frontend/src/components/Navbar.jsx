import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUser, UserButton, SignInButton, SignOutButton } from '@clerk/clerk-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import SearchBar from './SearchBar';
import { CartIcon, UserIcon, MenuIcon, CloseIcon, LogOutIcon, HeartIcon, OrdersIcon } from './icons';

export default function Navbar() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { count, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const isShopActive = location.pathname === '/shop' && !location.search.includes('sort=new');
  const isNewInActive = location.pathname === '/shop' && location.search.includes('sort=new');

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'nav-link-active' : ''}`;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText('STYLIO10');
    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('stylio:toast', {
          detail: { message: 'Coupon code STYLIO10 copied to clipboard! ✂️' },
        })
      );
    }
  };

  return (
    <>
      <div className="announcement-bar">
        <div className="announcement-bar__text">
          <span>✨ <strong>Spring Exclusive:</strong> Flat 10% OFF with code</span>
          <button
            type="button"
            className="announcement-bar__code"
            onClick={handleCopyCode}
            title="Click to copy code"
          >
            STYLIO10
          </button>
          <span>&bull; Free Express Delivery on orders over ₹1,500</span>
        </div>
      </div>

      <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo" aria-label="STYLIO home">
          STYL<span>IO</span>
        </Link>

        <nav className="navbar__links" aria-label="Primary">
          <Link
            to="/shop"
            className={`nav-link ${isShopActive ? 'nav-link-active' : ''}`}
          >
            Shop
          </Link>
          <Link
            to="/shop?sort=new"
            className={`nav-link ${isNewInActive ? 'nav-link-active' : ''}`}
          >
            New In
          </Link>
          <NavLink to="/lookbook" end className={linkClass}>
            Lookbook
          </NavLink>
          {isSignedIn && ['admin', 'warehouse'].includes(user?.publicMetadata?.role) && (
            <NavLink to="/admin" className="nav-portal-badge" title="Access Admin Panel">
              Admin ↗
            </NavLink>
          )}
          {isSignedIn && user?.publicMetadata?.role === 'delivery' && (
            <NavLink to="/delivery" className="nav-portal-badge" title="Access Delivery Portal">
              Delivery ↗
            </NavLink>
          )}
        </nav>

        <div className="navbar__search">
          <SearchBar />
        </div>

        <div className="navbar__actions">
          <Link
            to="/wishlist"
            className="icon-btn"
            aria-label={`Open wishlist, ${wishlistCount} items`}
            title="Wishlist"
          >
            <HeartIcon size={20} />
            {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
          </Link>

          <button
            className="icon-btn"
            onClick={openCart}
            aria-label={`Open cart, ${count} items`}
            title="Shopping Cart"
          >
            <CartIcon />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>

          {isSignedIn && user ? (
            <div className="navbar__user-group" ref={userMenuRef}>
              <button
                type="button"
                className="navbar__avatar-btn"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
                aria-label="User account menu"
                title={`${user.fullName || user.firstName || 'Account'} - Profile`}
              >
                <span className="navbar__avatar">
                  {(user.firstName || user.fullName || 'U').charAt(0).toUpperCase()}
                </span>
              </button>

              {userMenuOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">{user.fullName || user.firstName || 'Account'}</div>
                    <div className="user-dropdown-email">
                      {user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || ''}
                    </div>
                    {user.publicMetadata?.role && (
                      <span className="user-dropdown-role">
                        {user.publicMetadata.role === 'admin' ? '🛡️ Administrator' : user.publicMetadata.role === 'delivery' ? '🚚 Delivery Partner' : 'VIP Member'}
                      </span>
                    )}
                  </div>

                  <div className="user-dropdown-divider" />

                  <Link
                    to="/orders"
                    className="user-dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <OrdersIcon size={16} />
                    <span>My Orders</span>
                  </Link>

                  <Link
                    to="/account"
                    className="user-dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <UserIcon size={16} />
                    <span>My Account</span>
                  </Link>

                  <Link
                    to="/wishlist"
                    className="user-dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <HeartIcon size={16} />
                    <span>Wishlist ({wishlistCount})</span>
                  </Link>

                  {['admin', 'warehouse'].includes(user?.publicMetadata?.role) && (
                    <Link
                      to="/admin"
                      className="user-dropdown-item user-dropdown-item--gold"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span>Admin Operations ↗</span>
                    </Link>
                  )}

                  {user?.publicMetadata?.role === 'delivery' && (
                    <Link
                      to="/delivery"
                      className="user-dropdown-item user-dropdown-item--gold"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span>Delivery Portal ↗</span>
                    </Link>
                  )}

                  <div className="user-dropdown-divider" />

                  <SignOutButton signOutUrl="/" afterSignOutUrl="/">
                    <button
                      type="button"
                      className="user-dropdown-item user-dropdown-item--logout"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LogOutIcon size={16} />
                      <span>Log Out</span>
                    </button>
                  </SignOutButton>
                </div>
              )}
            </div>
          ) : (
            <SignInButton
              mode="redirect"
              signInUrl="/sign-in"
              afterSignInUrl="/account"
            >
              <Link
                to="/sign-in"
                className="icon-btn"
                aria-label="Sign in"
              >
                <UserIcon />
              </Link>
            </SignInButton>
          )}

          <button
            className="icon-btn navbar__burger"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`navbar__mobile-menu ${mobileOpen ? 'open' : ''}`}
      >
        <Link to="/shop" onClick={() => setMobileOpen(false)}>
          Shop
        </Link>
        <Link to="/shop?sort=new" onClick={() => setMobileOpen(false)}>
          New In
        </Link>
        <Link to="/lookbook" onClick={() => setMobileOpen(false)}>
          Editorial Lookbook
        </Link>
        <Link to="/wishlist" onClick={() => setMobileOpen(false)}>
          Wishlist ({wishlistCount})
        </Link>
        {isSignedIn ? (
          <>
            {['admin', 'warehouse'].includes(user?.publicMetadata?.role) && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                Admin Panel
              </Link>
            )}
            {user?.publicMetadata?.role === 'delivery' && (
              <Link to="/delivery" onClick={() => setMobileOpen(false)} style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                Delivery Portal
              </Link>
            )}
            <Link to="/orders" onClick={() => setMobileOpen(false)}>
              My Orders
            </Link>
            <Link to="/account" onClick={() => setMobileOpen(false)}>
              My Account
            </Link>
            <SignOutButton
              signOutUrl="/"
              afterSignOutUrl="/"
            >
              <button
                type="button"
                className="btn btn-outline btn-block"
                style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={() => setMobileOpen(false)}
              >
                <LogOutIcon size={16} />
                <span>Log Out</span>
              </button>
            </SignOutButton>
          </>
        ) : (
          <>
            <SignInButton
              mode="redirect"
              signInUrl="/sign-in"
              afterSignInUrl="/account"
            >
              <Link
                to="/sign-in"
                className="btn btn-outline btn-block"
                style={{ marginTop: 8, textAlign: 'left' }}
              >
                Sign In
              </Link>
            </SignInButton>
            <Link to="/sign-up" className="btn btn-dark btn-block" style={{ marginTop: 8, textAlign: 'left' }}>
              Create Account
            </Link>
          </>
        )}
        <form
          className="search-bar"
          style={{ marginTop: 6 }}
          onSubmit={(e) => {
            e.preventDefault();
            setMobileOpen(false);
            if (mobileQuery.trim()) {
              navigate(`/shop?search=${encodeURIComponent(mobileQuery.trim())}`);
            }
          }}
        >
          <input
            type="text"
            placeholder="Search…"
            value={mobileQuery}
            onChange={(e) => setMobileQuery(e.target.value)}
          />
          <button type="submit" className="upload-btn">
            Search
          </button>
        </form>
      </div>
    </header>
    </>
  );
}