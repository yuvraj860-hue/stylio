import { createContext, useContext, useEffect, useState } from 'react'
import { apiGet, apiPost } from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'stylio_token'
const USER_KEY = 'stylio_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  }, [token, user])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const data = await apiPost('/auth/login', { email, password })
      if (!data.token || !data.user) throw new Error('Invalid response from server')
      setToken(data.token)
      setUser(data.user)
      return { ok: true, user: data.user }
    } catch (err) {
      return { ok: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password, confirmPassword) => {
    setLoading(true)
    try {
      const data = await apiPost('/auth/register', { name, email, password, confirmPassword })
      if (!data.token || !data.user) throw new Error('Invalid response from server')
      setToken(data.token)
      setUser(data.user)
      return { ok: true, user: data.user }
    } catch (err) {
      return { ok: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}