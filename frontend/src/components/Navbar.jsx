import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useUser, UserButton, SignInButton, SignOutButton } from '@clerk/clerk-react';
import { useCart } from '../context/CartContext';
import SearchBar from './SearchBar';
import { CartIcon, UserIcon, MenuIcon, CloseIcon } from './icons';

export default function Navbar() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { count, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState('');

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'nav-link-active' : ''}`;

  return (
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
        </nav>

        <div className="navbar__search">
          <SearchBar />
        </div>

        <div className="navbar__actions">
          <button
            className="icon-btn"
            onClick={openCart}
            aria-label={`Open cart, ${count} items`}
          >
            <CartIcon />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>

          {isSignedIn && user ? (
            <Link
              to="/account"
              className="icon-btn navbar__avatar"
              style={{ fontFamily: 'var(--font-display)' }}
              title={user.fullName || user.firstName || 'Account'}
            >
              {(user.firstName || user.fullName || 'U').charAt(0).toUpperCase()}
            </Link>
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
        {isSignedIn ? (
          <>
            <Link to="/account" onClick={() => setMobileOpen(false)}>
              My Account
            </Link>
            <SignOutButton
              mode="redirect"
              signOutUrl="/"
              afterSignOutUrl="/"
            >
              <Link
                to="/"
                className="btn btn-ghost btn-block"
                style={{ marginTop: 8, textAlign: 'left' }}
              >
                Sign Out
              </Link>
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
  );
}