import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SIDE_IMAGE =
  'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1000&q=80'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    const res = await login(email.trim(), password)
    if (res.ok) {
      navigate('/account', { replace: true })
    } else {
      setError(res.error || 'Sign in failed. Please try again.')
    }
  }

  const handleGoogle = async () => {
    setError(null)
    const res = await loginWithGoogle()
    if (!res.ok) {
      setError(res.error || 'Google sign-in failed.')
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-side">
        <img src={SIDE_IMAGE} alt="Minimal fashion editorial" />
      </div>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="eyebrow">Welcome back</div>
          <h1>Sign In</h1>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            className="btn btn-outline btn-block"
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button className="btn btn-dark btn-block" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="auth-switch">
            New to Stylio? <Link to="/register">Create an account</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
