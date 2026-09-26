import { useState } from 'react';
import { CloseIcon } from './icons';

export default function CustomerCareModal({ isOpen, onClose, initialTab = 'shipping' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          maxWidth: 680,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-paper-light, #faf9f5)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--color-gold, #c5a059)',
                fontWeight: 600,
                marginBottom: 2,
              }}
            >
              Client Concierge
            </div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: '#0f172a' }}>
              STYLIO Care & Policies
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 6,
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close modal"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            padding: '0 16px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'shipping', label: '🚚 Shipping & Delivery' },
            { id: 'returns', label: '🔄 7-Day Returns' },
            { id: 'authenticity', label: '✨ Authenticity' },
            { id: 'contact', label: '💬 Concierge Desk' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 18px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#0f172a' : '#64748b',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-ink, #0f172a)' : '2px solid transparent',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px', overflowY: 'auto', fontSize: '0.9rem', lineHeight: 1.6, color: '#334155' }}>
          {activeTab === 'shipping' && (
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '1.05rem', color: '#0f172a' }}>
                Complimentary Express Shipping
              </h4>
              <p>
                Every Stylio garment is hand-inspected, packed in luxury dust bags, and dispatched with tamper-evident seals.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, margin: '18px 0' }}>
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Standard Express</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>2 - 4 Business Days nationwide. Free on all orders ₹1,500+. (₹99 for orders below ₹1,500).</div>
                </div>
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Secure OTP Verification</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Every parcel requires a dynamic 4-digit OTP provided at delivery for verified handover.</div>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                Orders placed before 2:00 PM IST Monday through Saturday are dispatched the same day from our Delhi & Mumbai luxury hubs.
              </p>
            </div>
          )}

          {activeTab === 'returns' && (
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '1.05rem', color: '#0f172a' }}>
                Hassle-Free 7-Day Doorstep Returns & Exchanges
              </h4>
              <p>
                We want you to be completely enamored with your fit. If a piece doesn't meet your expectations, return or exchange it effortlessly within 7 days of delivery.
              </p>
              <ul style={{ paddingLeft: 20, margin: '14px 0', fontSize: '0.88rem' }}>
                <li style={{ marginBottom: 8 }}><strong>Free Doorstep Pickup:</strong> Our delivery partner collects the package directly from your address.</li>
                <li style={{ marginBottom: 8 }}><strong>Condition:</strong> Garments must be unworn, unwashed, and in original packaging with brand tags intact.</li>
                <li style={{ marginBottom: 8 }}><strong>Instant Refunds:</strong> Once picked up and verified, refunds are credited back to your original payment method or instant wallet within 24-48 hours.</li>
                <li><strong>One-Click Request:</strong> Simply visit your <em>My Orders</em> section and click "Request Return / Exchange".</li>
              </ul>
            </div>
          )}

          {activeTab === 'authenticity' && (
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '1.05rem', color: '#0f172a' }}>
                100% Guaranteed Authentic & Considered
              </h4>
              <p>
                At STYLIO, luxury is measured by provenance, finish, and longevity.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem' }}>🧵</span>
                  <div>
                    <strong style={{ color: '#0f172a' }}>Direct Designer Partnerships</strong>
                    <div style={{ fontSize: '0.84rem', color: '#64748b' }}>Every collection is sourced directly from recognized master ateliers and verified artisan workshops.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem' }}>🌿</span>
                  <div>
                    <strong style={{ color: '#0f172a' }}>Sustainable Craft</strong>
                    <div style={{ fontSize: '0.84rem', color: '#64748b' }}>We prioritize eco-conscious dyeing, high thread count organic cottons, and ethical hand stitching.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem' }}>🔍</span>
                  <div>
                    <strong style={{ color: '#0f172a' }}>Strict Quality Audit</strong>
                    <div style={{ fontSize: '0.84rem', color: '#64748b' }}>Zero factory seconds or grey market goods. Each item undergoes an 8-point pre-dispatch audit.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '1.05rem', color: '#0f172a' }}>
                Private Concierge Desk
              </h4>
              <p>
                Have questions about fit, fabric care, or special styling for an upcoming occasion? Our dedicated concierge team is at your disposal.
              </p>
              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Email Concierge</span>
                  <a href="mailto:concierge@stylio.luxury" style={{ color: 'var(--color-ink)', fontWeight: 600, textDecoration: 'none' }}>
                    concierge@stylio.luxury
                  </a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Concierge Hours</span>
                  <span style={{ color: '#0f172a', fontWeight: 500 }}>Mon - Sat: 9:00 AM - 9:00 PM IST</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: '#64748b' }}>AI Stylist</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>Available 24/7 (Bottom Right Icon)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--color-paper-light, #faf9f5)',
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '8px 22px', fontSize: '0.84rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
