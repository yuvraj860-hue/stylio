import { UserProfile } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export default function UserProfilePage() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head" style={{ marginBottom: 'var(--space-4)' }}>
          <div>
            <div className="eyebrow">Account</div>
            <h2>My Profile & Account</h2>
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
      </div>
    </section>
  );
}