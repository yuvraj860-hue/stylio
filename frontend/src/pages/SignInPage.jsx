import { useState } from 'react';
import { SignIn } from '@clerk/clerk-react';
import PhoneOtpLogin from '../components/PhoneOtpLogin.jsx';

const SIDE_IMAGE =
  'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1000&q=80';

export default function SignInPage() {
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'clerk'

  return (
    <div className="auth-layout">
      <div className="auth-side">
        <img src={SIDE_IMAGE} alt="Minimal fashion editorial" />
      </div>
      <div className="auth-form-wrap">
        <div style={{ width: '100%', maxWidth: '400px' }}>
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