import { useState } from 'react';
import { UserProfile, useUser } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();
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

  if (!isLoaded && !localUser) {
    return (
      <section className="section">
        <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>Loading Atelier Concierge...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-head" style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>Client Concierge</span>
              <span className="version-pill-lux">
                <span className="version-pill-lux__dot" />
                STYLIO v1.1.0 ATELIER
              </span>
            </div>
            <h2 style={{ margin: '6px 0 0' }}>My Profile &amp; Account</h2>
          </div>
          <div className="version-meta-tag">
            <span className="version-meta-tag__glow">✦ Edition 1.1.0 Live</span>
            <span className="version-meta-tag__sub">Official Production Release</span>
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

        {/* VIP Atelier Client Status Ribbon */}
        <div className="member-vip-banner">
          <div className="member-vip-info">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={user.fullName || 'User'} className="member-vip-avatar" />
            ) : (
              <div className="member-vip-avatar-fallback">
                {(user?.firstName || user?.fullName || localUser?.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="eyebrow" style={{ color: 'var(--color-gold-light)', margin: 0 }}>
                  👑 Atelier Elite Client
                </span>
                <span style={{ fontSize: '0.68rem', background: 'rgba(197, 160, 89, 0.25)', color: '#e4c88a', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                  VIP GOLD
                </span>
              </div>
              <h3 style={{ margin: '4px 0 2px', fontSize: '1.35rem', color: '#ffffff' }}>
                {user?.fullName || user?.firstName || localUser?.name || 'Valued Client'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                {user?.primaryEmailAddress?.emailAddress || localUser?.phone || 'Private Stylio Atelier Member'}
              </p>
            </div>
          </div>

          <div className="member-vip-perks">
            <div className="member-perk-pill">
              <span>💎</span>
              <span><strong>500</strong> Crown Pts</span>
            </div>
            <div className="member-perk-pill">
              <span>🚚</span>
              <span><strong>Free</strong> Express Delivery</span>
            </div>
            <div className="member-perk-pill">
              <span>🏷️</span>
              <span><strong>10%</strong> Seasonal Privilege</span>
            </div>
          </div>
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
              variables: {
                colorPrimary: '#c5a059',
                colorBackground: '#ffffff',
                colorInputBackground: '#fdfbf7',
                colorInputText: '#111111',
                colorText: '#111111',
                colorTextSecondary: '#71717a',
                borderRadius: '12px',
              },
              elements: {
                rootBox: 'stylio-profile-root',
                card: 'stylio-profile-card',
                navbar: 'stylio-profile-nav',
                navbarButton: 'stylio-profile-nav-btn',
                headerTitle: 'stylio-profile-title',
                profileSection: 'stylio-profile-section',
                profileSectionTitleText: 'stylio-profile-section-title',
                profileSectionPrimaryButton: 'stylio-profile-action-btn',
                badge: 'stylio-profile-badge',
                userPreviewAvatarImage: 'stylio-profile-avatar',
              },
            }}
          />
        )}
      </div>
    </section>
  );
}