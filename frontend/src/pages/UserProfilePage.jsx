import { UserProfile } from '@clerk/clerk-react';

export default function UserProfilePage() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="eyebrow">Account</div>
            <h2>My Profile</h2>
          </div>
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