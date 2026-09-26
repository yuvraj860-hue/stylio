import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useUser, UserButton, SignInButton, SignOutButton } from '@clerk/clerk-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import SearchBar from './SearchBar';
import { CartIcon, UserIcon, MenuIcon, CloseIcon, LogOutIcon, HeartIcon } from './icons';

export default function Navbar() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { count, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState('');

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
          <NavLink to="/shop" className={linkClass}>
            Shop
          </NavLink>
          <NavLink to="/shop?sort=new" className={linkClass}>
            New In
          </NavLink>
          <NavLink to="/wishlist" className={linkClass}>
            Wishlist
          </NavLink>
          {isSignedIn && (
            <NavLink to="/orders" className={linkClass}>
              My Orders
            </NavLink>
          )}
          {isSignedIn && ['admin', 'warehouse'].includes(user?.publicMetadata?.role) && (
            <NavLink to="/admin" className={linkClass} style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
              Admin Panel
            </NavLink>
          )}
          {isSignedIn && ['admin', 'delivery'].includes(user?.publicMetadata?.role) && (
            <NavLink to="/delivery" className={linkClass} style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
              Delivery Portal
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
          >
            <CartIcon />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>

          {isSignedIn && user ? (
            <>
              <Link
                to="/account"
                className="icon-btn navbar__avatar"
                style={{ fontFamily: 'var(--font-display)' }}
                title={`${user.fullName || user.firstName || 'Account'} - Profile`}
              >
                {(user.firstName || user.fullName || 'U').charAt(0).toUpperCase()}
              </Link>
              <SignOutButton signOutUrl="/" afterSignOutUrl="/">
                <button
                  type="button"
                  className="navbar__logout-btn"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOutIcon size={15} />
                  <span>Logout</span>
                </button>
              </SignOutButton>
            </>
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
            {['admin', 'delivery'].includes(user?.publicMetadata?.role) && (
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
              window.location.href = `/shop?search=${encodeURIComponent(mobileQuery.trim())}`;
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