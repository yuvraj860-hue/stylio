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