import { SignUp } from '@clerk/clerk-react';

const SIDE_IMAGE =
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=80';

export default function SignUpPage() {
  return (
    <div className="auth-layout">
      <div className="auth-side">
        <img src={SIDE_IMAGE} alt="Fashion editorial" />
      </div>
      <div className="auth-form-wrap">
        <SignUp
          routing="path"
          signInUrl="/sign-in"
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