import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { api, clearSession, getStoredUser, getToken, storeSession } from "./api"
import type { User } from "./types"

type AuthValue = {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Seed from localStorage so a refresh doesn't bounce you to /login.
  const [user, setUser] = useState<User | null>(() =>
    getToken() ? getStoredUser() : null
  )

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password })
    storeSession(res.token, res.user)
    setUser(res.user)
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      // The register endpoint returns the user but no token,
      // so log in straight afterwards to get one.
      await api.register({ name, email, password })
      const res = await api.login({ email, password })
      storeSession(res.token, res.user)
      setUser(res.user)
    },
    []
  )

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    )
  }

  return <>{children}</>
}
