import { useState } from 'react';
import { UserProfile, useUser } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const [localUser, setLocalUser] = useState(() => {
    try {
      const saved = localStorage.getItem('stylio_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('stylio_user');
    localStorage.removeItem('stylio_auth_token');
    window.dispatchEvent(new CustomEvent('stylio:auth-change', { detail: { user: null } }));
    setLocalUser(null);
    navigate('/');
  };

  return (
    <section className="section">
      <div className="container">
        <div className="section-head" style={{ marginBottom: 'var(--space-4)' }}>
          <div>
            <div className="eyebrow">Account</div>
            <h2>My Profile &amp; Account <span className="logo-version-badge">v1.1.0</span></h2>
          </div>
        </div>

        {/* Account Quick Navigation */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          <span className="btn btn-dark" style={{ fontSize: '0.84rem', padding: '8px 18px', cursor: 'default' }}>
            👤 Profile Settings
          </span>
          <Link to="/orders" className="btn btn-outline" style={{ fontSize: '0.84rem', padding: '8px 18px' }}>
            📦 My Orders & Invoices
          </Link>
          <Link to="/wishlist" className="btn btn-outline" style={{ fontSize: '0.84rem', padding: '8px 18px' }}>
            ❤️ My Wishlist
          </Link>
          <Link to="/shop" className="btn btn-outline" style={{ fontSize: '0.84rem', padding: '8px 18px' }}>
            🛍️ Browse Collection
          </Link>
        </div>

        {!isSignedIn && localUser ? (
          <div className="account-card" style={{ background: '#ffffff', borderRadius: 12, padding: 32, maxWidth: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-ink, #111)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 600 }}>
                {(localUser.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{localUser.name}</h3>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>VIP Member • Verified Mobile</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
              <div>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>Mobile Number</div>
                <div style={{ fontSize: '1rem', fontWeight: 500, color: '#111', marginTop: 2 }}>+91 {localUser.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>Account ID</div>
                <div style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: 2 }}>{localUser.id || `user_${localUser.phone}`}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>Account Status</div>
                <div style={{ fontSize: '0.9rem', color: '#16a34a', fontWeight: 600, marginTop: 2 }}>✓ Active & Verified</div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline btn-block"
              style={{ marginTop: 28 }}
              onClick={handleLogout}
            >
              Sign Out from Stylio
            </button>
          </div>
        ) : (
          <UserProfile
            appearance={{
              layout: {
                socialButtonsVariant: 'iconButton',
                socialButtonsPlacement: 'bottom',
              },
              elements: {
                card: 'user-profile-card',
              },
              variables: {
                colorPrimary: '#111111',
                colorBackground: '#ffffff',
                colorInputBackground: '#ffffff',
                colorInputText: '#111111',
                colorText: '#111111',
                colorTextSecondary: '#666666',
                colorDanger: '#dc2626',
              },
            }}
          />
        )}
      </div>
    </section>
  );
}