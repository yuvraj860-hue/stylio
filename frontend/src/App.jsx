import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthGuard, GuestGuard } from './components/AuthGuard';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import StylistBot from './components/StylistBot';
import Toast from './components/Toast';
import CustomerCareModal from './components/CustomerCareModal';
import AdminLayout from './components/AdminLayout';
import DeliveryLayout from './components/DeliveryLayout';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import UserProfilePage from './pages/UserProfilePage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';
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
  const [careModalTab, setCareModalTab] = useState(null);

  return (
    <>
      <footer className="footer">
        <div className="footer__inner">
          <div style={{ maxWidth: 300 }}>
            <h4>STYLIO</h4>
            <p style={{ marginTop: 8, fontSize: '0.84rem', lineHeight: 1.6 }}>
              Considered clothing and modern luxury fashion. Curated silhouettes, honest fabrics, and AI-powered personal styling.
            </p>
            <div style={{ marginTop: 14, fontSize: '0.8rem', color: 'rgba(245, 241, 234, 0.55)' }}>
              Concierge: <a href="mailto:concierge@stylio.luxury" style={{ color: 'var(--color-gold-light)', display: 'inline' }}>concierge@stylio.luxury</a>
            </div>
          </div>

          <div className="footer__col">
            <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--color-gold-light)' }}>Collections</div>
            <Link to="/shop">All Pieces</Link>
            <Link to="/lookbook">Editorial Lookbook</Link>
            <Link to="/shop?category=Dresses">Designer Dresses</Link>
            <Link to="/shop?category=Sneakers">Luxury Sneakers</Link>
            <Link to="/shop?category=Accessories">Artisanal Accessories</Link>
            <Link to="/shop?sort=new">New Arrivals</Link>
          </div>

          <div className="footer__col">
            <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--color-gold-light)' }}>Client Care</div>
            <Link to="/orders">Track My Orders</Link>
            <Link to="/account">My Account & Profile</Link>
            <Link to="/wishlist">Saved Wishlist</Link>
            <button type="button" onClick={() => setCareModalTab('shipping')}>
              Shipping & Delivery
            </button>
            <button type="button" onClick={() => setCareModalTab('returns')}>
              7-Day Doorstep Returns
            </button>
          </div>

          <div className="footer__col">
            <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--color-gold-light)' }}>Atelier Promise</div>
            <button type="button" onClick={() => setCareModalTab('authenticity')}>
              100% Authentic Guarantee
            </button>
            <p style={{ margin: '4px 0', fontSize: '0.82rem', color: 'rgba(245, 241, 234, 0.6)' }}>
              Free Express on ₹1,500+
            </p>
            <p style={{ margin: '4px 0', fontSize: '0.82rem', color: 'rgba(245, 241, 234, 0.6)' }}>
              Secure Dynamic OTP Handover
            </p>
            <button type="button" onClick={() => setCareModalTab('contact')} style={{ color: 'var(--color-gold-light)', fontWeight: 500 }}>
              Speak with Concierge →
            </button>
          </div>

          {/* Contact Us Column */}
          <div className="footer__col footer__contact">
            <div className="footer__contact-head">
              <h4 className="footer__contact-title">Contact Us</h4>
              <div className="footer__contact-line" />
            </div>

            <div className="footer__contact-list">
              <div className="footer__contact-item">
                <span className="footer__contact-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" fill="#ec4899"/>
                    <circle cx="12" cy="9.5" r="2.5" fill="#ffffff"/>
                  </svg>
                </span>
                <span className="footer__contact-text">Sitapura, Jaipur, Rajasthan</span>
              </div>

              <a href="mailto:urbanshiftt@gmail.com" className="footer__contact-item footer__contact-link">
                <span className="footer__contact-icon">
                  <svg width="20" height="15" viewBox="0 0 24 18" fill="none" aria-hidden="true">
                    <rect width="24" height="18" rx="3" fill="#e0e7ff"/>
                    <circle cx="12" cy="9" r="6" fill="#3b82f6"/>
                    <text x="12" y="12" fontSize="9" fill="#ffffff" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">@</text>
                  </svg>
                </span>
                <span className="footer__contact-text">urbanshiftt@gmail.com</span>
              </a>

              <a href="tel:+919876543210" className="footer__contact-item footer__contact-link">
                <span className="footer__contact-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ec4899" aria-hidden="true">
                    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                  </svg>
                </span>
                <span className="footer__contact-text">+91 98765 43210</span>
              </a>
            </div>

            <div className="footer__contact-socials">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer__social-btn" aria-label="Facebook">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer__social-btn" aria-label="Instagram">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer__social-btn" aria-label="Twitter">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer__social-btn" aria-label="LinkedIn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <div>© 2026 STYLIO Luxury Atelier. All rights reserved.</div>
          <div className="footer__payment-badges">
            <span className="footer__badge-pill">UPI</span>
            <span className="footer__badge-pill">VISA</span>
            <span className="footer__badge-pill">MASTERCARD</span>
            <span className="footer__badge-pill">COD</span>
            <span className="footer__badge-pill">100% SECURE</span>
          </div>
        </div>
      </footer>

      {careModalTab && (
        <CustomerCareModal
          isOpen={Boolean(careModalTab)}
          initialTab={careModalTab}
          onClose={() => setCareModalTab(null)}
        />
      )}
    </>
  );
}

export default function App() {
  const location = useLocation();
  const isPortal = location.pathname.startsWith('/admin') || location.pathname.startsWith('/delivery');

  return (
    <div className={`app ${isPortal ? 'app--portal' : ''}`}>
      {!isPortal && <Navbar />}
      <main className={isPortal ? 'main--portal' : ''}>
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
          <Route path="/profile" element={<Navigate to="/account" replace />} />
          <Route path="/orders" element={<AuthGuard><OrdersPage /></AuthGuard>} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/lookbook" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AuthGuard>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AuthGuard>
                <AdminLayout>
                  <AdminUsersPage />
                </AdminLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AuthGuard>
                <AdminLayout>
                  <AdminOrdersPage />
                </AdminLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/admin/orders/:id"
            element={
              <AuthGuard>
                <AdminLayout>
                  <AdminOrdersPage />
                </AdminLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AuthGuard>
                <AdminLayout>
                  <AdminProductsPage />
                </AdminLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/admin/warehouse"
            element={
              <AuthGuard>
                <AdminLayout>
                  <AdminWarehousePage />
                </AdminLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/admin/activity"
            element={
              <AuthGuard>
                <AdminLayout>
                  <div className="admin-page"><h1>Activity Logs</h1></div>
                </AdminLayout>
              </AuthGuard>
            }
          />
          
          {/* Delivery Partner Routes */}
          <Route
            path="/delivery"
            element={
              <AuthGuard>
                <DeliveryLayout>
                  <DeliveryDashboardPage />
                </DeliveryLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/delivery/orders"
            element={
              <AuthGuard>
                <DeliveryLayout>
                  <DeliveryHistoryPage />
                </DeliveryLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/delivery/orders/live"
            element={
              <AuthGuard>
                <DeliveryLayout>
                  <DeliveryLiveOrdersPage />
                </DeliveryLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/delivery/history"
            element={
              <AuthGuard>
                <DeliveryLayout>
                  <DeliveryHistoryPage />
                </DeliveryLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/delivery/stats"
            element={
              <AuthGuard>
                <DeliveryLayout>
                  <DeliveryDashboardPage />
                </DeliveryLayout>
              </AuthGuard>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isPortal && <Footer />}
      {!isPortal && <CartDrawer />}
      {!isPortal && <StylistBot />}
      <ToastHost />
    </div>
  );
}