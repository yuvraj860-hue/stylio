import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'

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

  const [localUser, setLocalUser] = useState(null)
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

  const effectiveUser = clerkUser != null ? clerkUser : localUser

  return {
    user: effectiveUser,
    isAuthenticated: isSignedIn || !!effectiveUser,
    login: () => {},
    register: () => {},
    logout: () => {},
    loading: !isLoaded,
  }
}
