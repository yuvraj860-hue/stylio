import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useCart } from '../context/CartContext'
import SearchBar from './SearchBar'
import { CartIcon, UserIcon, MenuIcon, CloseIcon } from './icons'

export default function Navbar() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { count, openCart } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileQuery, setMobileQuery] = useState('')

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'nav-link-active' : ''}`

  // Wait for Clerk to load before rendering auth-dependent UI
  useEffect(() => {
    // Clerk is loaded when isLoaded becomes true
  }, [isLoaded])

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo" aria-label="STYLIO home">
          STYL<span>IO</span>
        </Link>

        <nav className="navbar__links" aria-label="Primary">
          <NavLink to="/shop" exact className={linkClass}>
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
              title={user.name}
            >
              {(user.name || 'U').charAt(0).toUpperCase()}
            </Link>
          ) : (
            <Link
              to="/login"
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
        <Link to="/shop" onClick={() => setMobileOpen(false)}>
          Shop
        </Link>
        <Link to="/shop?sort=new" onClick={() => setMobileOpen(false)}>
          New In
        </Link>
        {isSignedIn ? (
          <Link to="/account" onClick={() => setMobileOpen(false)}>
            My Account
          </Link>
        ) : (
          <Link to="/login" onClick={() => setMobileOpen(false)}>
            Sign In
          </Link>
        )}
        <form
          className="search-bar"
          style={{ marginTop: 6 }}
          onSubmit={(e) => {
            e.preventDefault()
            setMobileOpen(false)
            if (mobileQuery.trim()) {
              window.location.href = `/shop?search=${encodeURIComponent(mobileQuery.trim())}`
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
  )
}