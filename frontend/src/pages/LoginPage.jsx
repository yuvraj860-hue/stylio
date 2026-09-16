import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SIDE_IMAGE =
  'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1000&q=80'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()
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