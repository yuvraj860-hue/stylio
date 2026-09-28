import { useState, useEffect } from 'react';
import { SignIn } from '@clerk/clerk-react';
import PhoneOtpLogin from '../components/PhoneOtpLogin.jsx';

const SIDE_IMAGE =
  'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1000&q=80';

export default function SignInPage() {
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'clerk'
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 820);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 820);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="auth-layout"
      style={{
        display: isMobile ? 'block' : 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100%',
        minHeight: isMobile ? 'auto' : 'calc(100vh - 72px)',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {!isMobile && (
        <div className="auth-side" style={{ flex: '1 1 50%', width: '50%', minHeight: '100%' }}>
          <img src={SIDE_IMAGE} alt="Minimal fashion editorial" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div
        className="auth-form-wrap"
        style={{
          flex: isMobile ? 'none' : '1 1 50%',
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '16px 12px' : '40px 24px',
          boxSizing: 'border-box',
          margin: '0 auto',
        }}
      >
        <div
          className="auth-form-container"
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : '400px',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          <div className="auth-method-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === 'phone'}
              className={`auth-method-tab ${authMethod === 'phone' ? 'auth-method-tab--active' : ''}`}
              onClick={() => setAuthMethod('phone')}
            >
              <span>📱</span> Mobile OTP
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === 'clerk'}
              className={`auth-method-tab ${authMethod === 'clerk' ? 'auth-method-tab--active' : ''}`}
              onClick={() => setAuthMethod('clerk')}
            >
              <span>✉️</span> Email / Google
            </button>
          </div>

          {authMethod === 'phone' ? (
            <PhoneOtpLogin />
          ) : (
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              appearance={{
                layout: {
                  socialButtonsPlacement: 'bottom',
                  socialButtonsVariant: 'blockButton',
                },
                options: {
                  socialButtonsPlacement: 'bottom',
                  socialButtonsVariant: 'blockButton',
                },
                elements: {
                  formButtonPrimary: 'btn btn-dark btn-block',
                  card: 'auth-form',
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
      </div>
    </div>
  );
}