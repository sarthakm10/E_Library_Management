import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, setUnauthorizedHandler, tokenStore } from '@/lib/api'
import type { SessionUser } from '@/lib/types'

interface LoginResponse {
  token: string
  user: SessionUser
}

interface AuthState {
  user: SessionUser | null
  /** True until the stored token has been checked on startup. */
  loading: boolean
  loginMember: (id: string, password: string) => Promise<SessionUser>
  loginAdmin: (id: string, password: string) => Promise<SessionUser>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(() => tokenStore.get() !== null)

  const logout = useCallback(() => {
    tokenStore.set(null)
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return
    try {
      setUser(await api.get<SessionUser>('/api/auth/me'))
    } catch {
      tokenStore.set(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const finishLogin = useCallback((res: LoginResponse) => {
    tokenStore.set(res.token)
    queryClient.clear()
    setUser(res.user)
    return res.user
  }, [queryClient])

  const value = useMemo<AuthState>(() => ({
    user,
    loading,
    loginMember: async (id, password) => finishLogin(await api.post<LoginResponse>('/api/auth/login', { id, password })),
    loginAdmin: async (id, password) => finishLogin(await api.post<LoginResponse>('/api/auth/admin/login', { id, password })),
    logout,
    refresh,
  }), [user, loading, finishLogin, logout, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
