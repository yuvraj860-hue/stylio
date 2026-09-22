import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CurrencyProvider } from './context/CurrencyContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './styles/global.css';
import { ClerkProvider, useClerk } from '@clerk/clerk-react';
import { setClerkTokenGetter } from './services/api';

function ClerkTokenProvider({ children }) {
  const clerk = useClerk();
  React.useEffect(() => {
    if (!clerk) return;
    setClerkTokenGetter(async () => {
      try {
        const session = clerk.session;
        if (session && typeof session.getToken === 'function') {
          return await session.getToken();
        }
      } catch (e) {
        console.warn('Clerk token fetch failed:', e);
      }
      return null;
    });
    return () => setClerkTokenGetter(null);
  }, [clerk]);
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ClerkProvider
          publishableKey={import.meta.env.VITE_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          <ClerkTokenProvider>
            <CurrencyProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </CurrencyProvider>
          </ClerkTokenProvider>
        </ClerkProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// ── Service Worker (PWA) ──────────────────────────────────────────────
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(
                new CustomEvent('stylio:toast', {
                  detail: { message: 'New version available — reload to update' },
                })
              );
            }
          };
        };
      })
      .catch((err) => console.error('SW registration failed: ', err));
  });
}