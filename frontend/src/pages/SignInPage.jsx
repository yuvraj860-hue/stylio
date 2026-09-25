import { SignIn } from '@clerk/clerk-react';

const SIDE_IMAGE =
  'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1000&q=80';

export default function SignInPage() {
  return (
    <div className="auth-layout">
      <div className="auth-side">
        <img src={SIDE_IMAGE} alt="Minimal fashion editorial" />
      </div>
      <div className="auth-form-wrap">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          appearance={{
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
      </div>
    </div>
  );
}