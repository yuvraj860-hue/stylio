import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUser, UserButton, SignInButton, SignOutButton } from '@clerk/clerk-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import SearchBar from './SearchBar';
import { CartIcon, UserIcon, MenuIcon, CloseIcon, LogOutIcon, HeartIcon, OrdersIcon } from './icons';
import StylioLogo from './StylioLogo.jsx';

export default function Navbar() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [localUser, setLocalUser] = useState(() => {
    try {
      const saved = localStorage.getItem('stylio_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const handleAuthChange = (e) => {
      setLocalUser(e.detail?.user || null);
    };
    window.addEventListener('stylio:auth-change', handleAuthChange);
    return () => window.removeEventListener('stylio:auth-change', handleAuthChange);
  }, []);

  const { count, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const userMenuRef = useRef(null);
  const exploreRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (exploreRef.current && !exploreRef.current.contains(e.target)) {
        setExploreOpen(false);
      }
    };
    if (userMenuOpen || exploreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen, exploreOpen]);

  useEffect(() => {
    setExploreOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname, location.search]);

  const searchLower = location.search.toLowerCase();
  const isMenActive = location.pathname === '/shop' && searchLower.includes('gender=men');
  const isWomenActive = location.pathname === '/shop' && searchLower.includes('gender=women');
  const isShoesActive = location.pathname === '/shop' && (searchLower.includes('category=shoes') || searchLower.includes('category=sneakers'));
  const isBeautyActive = location.pathname === '/shop' && searchLower.includes('category=beauty');
  const isNewInActive = location.pathname === '/shop' && location.search.includes('sort=new') && !isBeautyActive;
  const isShopActive = location.pathname === '/shop' && !isMenActive && !isWomenActive && !isShoesActive && !isBeautyActive && !isNewInActive;

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
          <Link to="/" className="navbar__logo" aria-label="STYLIO home" style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <StylioLogo size={24} />
            <span>STYL<span>IO</span></span>
          </Link>

          <nav className="navbar__links" aria-label="Primary">
            <Link
              to="/shop"
              className={`nav-link ${isShopActive ? 'nav-link-active' : ''}`}
            >
              Shop
            </Link>
            <Link
              to="/shop?gender=men"
              className={`nav-link ${isMenActive ? 'nav-link-active' : ''}`}
            >
              Men
            </Link>
            <Link
              to="/shop?gender=women"
              className={`nav-link ${isWomenActive ? 'nav-link-active' : ''}`}
            >
              Women
            </Link>
            <Link
              to="/shop?sort=new"
              className={`nav-link ${isNewInActive ? 'nav-link-active' : ''}`}
            >
              New In
            </Link>
            <NavLink to="/studio" className={linkClass}>
              AI Studio
            </NavLink>

            <div
              className="nav-dropdown-wrapper"
              ref={exploreRef}
              onMouseEnter={() => setExploreOpen(true)}
              onMouseLeave={() => setExploreOpen(false)}
            >
              <button
                type="button"
                className={`nav-link nav-dropdown-trigger ${isShoesActive || isBeautyActive || location.pathname === '/lookbook' ? 'nav-link-active' : ''}`}
                onClick={() => setExploreOpen((v) => !v)}
                aria-expanded={exploreOpen}
                aria-label="Explore collections"
              >
                <span>Explore</span>
                <svg
                  className={`nav-dropdown-chevron ${exploreOpen ? 'open' : ''}`}
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                >
                  <path
                    d="M1 1L5 5L9 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {exploreOpen && (
                <div className="nav-dropdown-menu">
                  <Link
                    to="/shop?category=Shoes"
                    className={`nav-dropdown-item ${isShoesActive ? 'active' : ''}`}
                    onClick={() => setExploreOpen(false)}
                  >
                    <span className="nav-dropdown-item-title">Shoes &amp; Footwear</span>
                    <span className="nav-dropdown-item-desc">Luxury sneakers, loafers &amp; boots</span>
                  </Link>
                  <Link
                    to="/shop?category=Beauty"
                    className={`nav-dropdown-item ${isBeautyActive ? 'active' : ''}`}
                    onClick={() => setExploreOpen(false)}
                  >
                    <span className="nav-dropdown-item-title">Beauty &amp; Fragrances</span>
                    <span className="nav-dropdown-item-desc">Cosmetics, skincare &amp; wellness</span>
                  </Link>
                  <div className="nav-dropdown-divider" />
                  <Link
                    to="/lookbook"
                    className={`nav-dropdown-item ${location.pathname === '/lookbook' ? 'active' : ''}`}
                    onClick={() => setExploreOpen(false)}
                  >
                    <span className="nav-dropdown-item-title">Editorial Lookbook</span>
                    <span className="nav-dropdown-item-desc">Seasonal curation &amp; styling</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <div className="navbar__search">
            <SearchBar />
          </div>

          <div className="navbar__actions">
            {((isSignedIn && ['admin', 'warehouse'].includes(user?.publicMetadata?.role)) || ['admin', 'warehouse'].includes(localUser?.role)) && (
              <NavLink to="/admin" className="nav-action-admin-btn" title="Access Admin Panel">
                <span>Admin</span>
                <span style={{ fontSize: '0.68rem' }}>↗</span>
              </NavLink>
            )}
            {((isSignedIn && user?.publicMetadata?.role === 'delivery') || localUser?.role === 'delivery') && (
              <NavLink to="/delivery" className="nav-action-admin-btn" title="Access Delivery Portal">
                <span>Delivery</span>
                <span style={{ fontSize: '0.68rem' }}>↗</span>
              </NavLink>
            )}
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

          {((isSignedIn && user) || localUser) ? (
            <div className="navbar__user-group" ref={userMenuRef}>
              <button
                type="button"
                className="navbar__avatar-btn"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
                aria-label="User account menu"
                title={`${(user?.fullName || user?.firstName || localUser?.name || 'Account')} - Profile`}
              >
                <span className="navbar__avatar">
                  {(user?.firstName || user?.fullName || localUser?.name || 'U').charAt(0).toUpperCase()}
                </span>
              </button>

              {userMenuOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">{user?.fullName || user?.firstName || localUser?.name || 'Account'}</div>
                    <div className="user-dropdown-email">
                      {user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || (localUser?.phone ? `+91 ${localUser.phone}` : localUser?.email || '')}
                    </div>
                    {(user?.publicMetadata?.role || localUser?.role) && (
                      <span className="user-dropdown-role">
                        {(user?.publicMetadata?.role || localUser?.role) === 'admin' ? '🛡️ Administrator' : (user?.publicMetadata?.role || localUser?.role) === 'delivery' ? '🚚 Delivery Partner' : 'VIP Member'}
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

                  {['admin', 'warehouse'].includes(user?.publicMetadata?.role || localUser?.role) && (
                    <Link
                      to="/admin"
                      className="user-dropdown-item user-dropdown-item--gold"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span>Admin Operations ↗</span>
                    </Link>
                  )}

                  {(user?.publicMetadata?.role || localUser?.role) === 'delivery' && (
                    <Link
                      to="/delivery"
                      className="user-dropdown-item user-dropdown-item--gold"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span>Delivery Portal ↗</span>
                    </Link>
                  )}

                  <div className="user-dropdown-divider" />

                  {isSignedIn ? (
                    <SignOutButton signOutUrl="/" afterSignOutUrl="/">
                      <button
                        type="button"
                        className="user-dropdown-item user-dropdown-item--logout"
                        onClick={() => {
                          localStorage.removeItem('stylio_user');
                          localStorage.removeItem('stylio_auth_token');
                          setLocalUser(null);
                          setUserMenuOpen(false);
                        }}
                      >
                        <LogOutIcon size={16} />
                        <span>Log Out</span>
                      </button>
                    </SignOutButton>
                  ) : (
                    <button
                      type="button"
                      className="user-dropdown-item user-dropdown-item--logout"
                      onClick={() => {
                        localStorage.removeItem('stylio_user');
                        localStorage.removeItem('stylio_auth_token');
                        setLocalUser(null);
                        setUserMenuOpen(false);
                        navigate('/');
                      }}
                    >
                      <LogOutIcon size={16} />
                      <span>Log Out</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/sign-in"
              className="icon-btn"
              aria-label="Sign in"
            >
              <UserIcon />
            </Link>
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
        <Link
          to="/shop"
          onClick={() => setMobileOpen(false)}
          style={{ fontWeight: isShopActive ? 700 : 500, color: isShopActive ? 'var(--color-gold)' : undefined }}
        >
          All Shop
        </Link>
        <Link
          to="/shop?gender=men"
          onClick={() => setMobileOpen(false)}
          style={{ fontWeight: isMenActive ? 700 : 500, color: isMenActive ? 'var(--color-gold)' : undefined }}
        >
          Men's Fashion 👔
        </Link>
        <Link
          to="/shop?gender=women"
          onClick={() => setMobileOpen(false)}
          style={{ fontWeight: isWomenActive ? 700 : 500, color: isWomenActive ? 'var(--color-gold)' : undefined }}
        >
          Women's Fashion 👗
        </Link>
        <Link
          to="/shop?category=Shoes"
          onClick={() => setMobileOpen(false)}
          style={{ fontWeight: isShoesActive ? 700 : 500, color: isShoesActive ? 'var(--color-gold)' : undefined }}
        >
          Shoes &amp; Sneakers 👟
        </Link>
        <Link
          to="/shop?sort=new"
          onClick={() => setMobileOpen(false)}
          style={{ fontWeight: isNewInActive ? 700 : 500, color: isNewInActive ? 'var(--color-gold)' : undefined }}
        >
          New In (Apparel)
        </Link>
        <Link
          to="/shop?category=Beauty"
          onClick={() => setMobileOpen(false)}
          style={{ color: 'var(--color-gold)', fontWeight: isBeautyActive ? 800 : 600, background: isBeautyActive ? 'rgba(197,160,89,0.1)' : undefined, borderRadius: 6, padding: '4px 8px' }}
        >
          Beauty &amp; Cosmetics 💄
        </Link>
        <Link to="/lookbook" onClick={() => setMobileOpen(false)}>
          Editorial Lookbook
        </Link>
        <Link to="/studio" onClick={() => setMobileOpen(false)} style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
          AI Outfit Studio ✨
        </Link>
        <Link to="/wishlist" onClick={() => setMobileOpen(false)}>
          Wishlist ({wishlistCount})
        </Link>
        {((isSignedIn && user) || localUser) ? (
          <>
            {['admin', 'warehouse'].includes(user?.publicMetadata?.role || localUser?.role) && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                Admin Panel
              </Link>
            )}
            {(user?.publicMetadata?.role || localUser?.role) === 'delivery' && (
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
            {isSignedIn ? (
              <SignOutButton
                signOutUrl="/"
                afterSignOutUrl="/"
              >
                <button
                  type="button"
                  className="btn btn-outline btn-block"
                  style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={() => {
                    localStorage.removeItem('stylio_user');
                    localStorage.removeItem('stylio_auth_token');
                    setLocalUser(null);
                    setMobileOpen(false);
                  }}
                >
                  <LogOutIcon size={16} />
                  <span>Log Out</span>
                </button>
              </SignOutButton>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-block"
                style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={() => {
                  localStorage.removeItem('stylio_user');
                  localStorage.removeItem('stylio_auth_token');
                  setLocalUser(null);
                  setMobileOpen(false);
                  navigate('/');
                }}
              >
                <LogOutIcon size={16} />
                <span>Log Out</span>
              </button>
            )}
          </>
        ) : (
          <>
            <Link
              to="/sign-in"
              className="btn btn-outline btn-block"
              style={{ marginTop: 8, textAlign: 'left' }}
              onClick={() => setMobileOpen(false)}
            >
              Sign In
            </Link>
            <Link to="/sign-up" className="btn btn-dark btn-block" style={{ marginTop: 8, textAlign: 'left' }} onClick={() => setMobileOpen(false)}>
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