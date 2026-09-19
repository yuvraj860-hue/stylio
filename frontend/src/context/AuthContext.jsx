import { useCallback, useEffect, useState } from 'react'
import { useUser, useSignIn, useSignUp, useClerk } from '@clerk/clerk-react'

export function AuthProvider({ children }) {
  const { isLoaded, isSigningIn } = useUser()

  if (!isLoaded) {
    return <>{children}</>
  }

  if (isSigningIn) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <span>Signing in...</span>
      </div>
    )
  }

  return <>{children}</>
}

export function useAuth() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser()
  const { signIn, setActive: setActiveSignIn } = useSignIn()
  const { signUp, setActive: setActiveSignUp } = useSignUp()
  const clerk = useClerk()

  const [localUser, setLocalUser] = useState(null)
  const [requestLoading, setRequestLoading] = useState(false)

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('stylio_clerk_user') : null
      if (stored) {
        setLocalUser(JSON.parse(stored))
      }
    } catch (e) {
      console.warn('Clerk auth: could not parse stored user', e)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    if (!signIn) {
      return { ok: false, error: 'Authentication not ready. Please try again.' }
    }
    setRequestLoading(true)
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })
      if (result.status === 'complete') {
        if (setActiveSignIn) {
          await setActiveSignIn({ session: result.createdSessionId })
        }
        return { ok: true }
      }
      return { ok: false, error: 'Additional verification required.' }
    } catch (err) {
      return {
        ok: false,
        error: (err.errors && err.errors[0] && err.errors[0].message) || err.message || 'Sign in failed.',
      }
    } finally {
      setRequestLoading(false)
    }
  }, [signIn, setActiveSignIn])

  const register = useCallback(async (name, email, password) => {
    if (!signUp) {
      return { ok: false, error: 'Authentication not ready. Please try again.' }
    }
    setRequestLoading(true)
    try {
      const parts = name.trim().split(' ')
      const firstName = parts[0] || name
      const lastName = parts.slice(1).join(' ') || undefined
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      })
      if (result.status === 'complete') {
        if (setActiveSignUp) {
          await setActiveSignUp({ session: result.createdSessionId })
        }
        return { ok: true }
      }
      if (result.status === 'missing_requirements') {
        return { ok: false, error: 'Please verify your email to complete registration.' }
      }
      return { ok: false, error: 'Registration requires additional steps.' }
    } catch (err) {
      return {
        ok: false,
        error: (err.errors && err.errors[0] && err.errors[0].message) || err.message || 'Registration failed.',
      }
    } finally {
      setRequestLoading(false)
    }
  }, [signUp, setActiveSignUp])

  const logout = useCallback(async () => {
    setRequestLoading(true)
    try {
      await clerk.signOut()
      localStorage.removeItem('stylio_clerk_user')
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message || 'Sign out failed.' }
    } finally {
      setRequestLoading(false)
    }
  }, [clerk])

  const effectiveUser = clerkUser
    ? {
        name: clerkUser.fullName || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'Member',
        email: (clerkUser.emailAddresses && clerkUser.emailAddresses[0] && clerkUser.emailAddresses[0].emailAddress) || '',
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        id: clerkUser.id,
      }
    : localUser

  return {
    user: effectiveUser,
    isAuthenticated: isSignedIn || !!localUser,
    login,
    register,
    logout,
    loading: !isLoaded || requestLoading,
  }
}
