import { useEffect, useState } from 'react'
import { useUser, SignInButton, SignOutButton } from '@clerk/clerk-react'

export function AuthProvider({ children }) {
  const { user, isLoaded, isSigningIn } = useUser()
  const [isClerkReady, setIsClerkReady] = useState(false)

  useEffect(() => {
    setIsClerkReady(isLoaded)
  }, [isLoaded])

  if (!isClerkReady) {
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

  return (
    <div>
      {user ? (
        <SignOutButton className="btn" onClick={() => {}}>
          Sign out
        </SignOutButton>
      ) : (
        <SignInButton className="btn" onClick={() => {}}>
          Sign in
        </SignInButton>
      )}
    </div>
  )
}

// Compatibility hook — reads user from Clerk context.
// Prefer using Clerk's useUser() directly in new code.
export function useAuth() {
  const { user: clerkUser, isLoaded } = useUser()
  const isAuthenticated = !isLoaded || !!clerkUser

  // Fallback to localStorage for any pre-existing JWT users
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

  // Prefer Clerk user over localStorage fallback
  const effectiveUser = clerkUser != null ? clerkUser : localUser

  return {
    user: effectiveUser,
    isAuthenticated,
    login: () => {},
    register: () => {},
    logout: () => {},
    loading: isLoaded === false,
  }
}