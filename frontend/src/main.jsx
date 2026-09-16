import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { CurrencyProvider } from './context/CurrencyContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)

// ── Service Worker (PWA) ──────────────────────────────────────────────
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show toast
              window.dispatchEvent(
                new CustomEvent('stylio:toast', {
                  detail: { message: 'New version available — reload to update' },
                })
              )
            }
          }
        }
      })
      .catch((err) => console.error('SW registration failed: ', err))
  })
}