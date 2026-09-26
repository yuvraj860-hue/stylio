import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthGuard, GuestGuard } from './components/AuthGuard';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import StylistBot from './components/StylistBot';
import Toast from './components/Toast';
import CustomerCareModal from './components/CustomerCareModal';
import AdminLayout from './components/AdminLayout';
import DeliveryLayout from './components/DeliveryLayout';
import HomePage from './pages/HomePage';
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
          <Route path="/profile" element={<Navigate to="/account" replace />} />
          <Route
            path="/orders"
            element={
              <AuthGuard>
                <OrdersPage />
              </AuthGuard>
            }
          />
          <Route path="/wishlist" element={<WishlistPage />} />
          
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
      <Footer />
      <CartDrawer />
      <StylistBot />
      <ToastHost />
    </div>
  );
}