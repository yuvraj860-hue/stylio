import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { setUnauthorizedHandler } from './services/api'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import CartDrawer from './components/CartDrawer'
import StylistBot from './components/StylistBot'
import Toast from './components/Toast'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AccountPage from './pages/AccountPage'

function ToastHost() {
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let timeout = null
    const onToast = (e) => {
      const msg = e && e.detail && e.detail.message
      if (!msg) return
      setMessage(msg)
      clearTimeout(timeout)
      timeout = setTimeout(() => setMessage(null), 3200)
    }
    window.addEventListener('stylio:toast', onToast)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('stylio:toast', onToast)
    }
  }, [])

  if (!message) return null
  return <Toast message={message} />
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
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/account" replace />
  return children
}

export default function App() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    setUnauthorizedHandler(() => {
      window.dispatchEvent(
        new CustomEvent('stylio:toast', {
          detail: { message: 'Your session has expired. Please sign in again.' },
        })
      )
    })
  }, [])

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
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <StylistBot />
      <ToastHost />
    </div>
  )
}