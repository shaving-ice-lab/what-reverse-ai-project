'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getRuntimeBaseUrl } from '@/lib/env'

export interface AppUser {
  id: string
  email: string
  display_name?: string | null
  role: string
  status: string
}

export interface AppAuthContextValue {
  user: AppUser | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => void
}

const AppAuthContext = createContext<AppAuthContextValue>({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
})

export function useAppAuth() {
  return useContext(AppAuthContext)
}

function getStorageKey(workspaceSlug: string) {
  return `app_auth_${workspaceSlug}`
}

function buildRuntimeUrl(path: string): string {
  const base = getRuntimeBaseUrl().replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (base) return `${base}${normalized}`
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalized}`
  }
  return normalized
}

interface AppAuthProviderProps {
  workspaceSlug: string
  children: React.ReactNode
}

export function AppAuthProvider({ workspaceSlug, children }: AppAuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(workspaceSlug))
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.token && parsed.user) {
          setToken(parsed.token)
          setUser(parsed.user)
        }
      } catch {
        /* ignore */
      }
    }
    setLoading(false)
  }, [workspaceSlug])

  const persistSession = useCallback(
    (t: string, u: AppUser) => {
      localStorage.setItem(getStorageKey(workspaceSlug), JSON.stringify({ token: t, user: u }))
    },
    [workspaceSlug]
  )

  const clearSession = useCallback(() => {
    localStorage.removeItem(getStorageKey(workspaceSlug))
    setToken(null)
    setUser(null)
  }, [workspaceSlug])

  const login = useCallback(
    async (email: string, password: string) => {
      const url = buildRuntimeUrl(`/runtime/${encodeURIComponent(workspaceSlug)}/auth/login`)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((payload as any)?.error || (payload as any)?.message || 'Login failed')
      }
      const data = (payload as any)?.data
      if (!data?.token || !data?.user) {
        throw new Error('Invalid login response')
      }
      setToken(data.token)
      setUser(data.user)
      persistSession(data.token, data.user)
    },
    [workspaceSlug, persistSession]
  )

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const url = buildRuntimeUrl(`/runtime/${encodeURIComponent(workspaceSlug)}/auth/register`)
      const body: Record<string, string> = { email, password }
      if (displayName) body.display_name = displayName
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(
          (payload as any)?.error || (payload as any)?.message || 'Registration failed'
        )
      }
    },
    [workspaceSlug]
  )

  const logout = useCallback(() => {
    if (token) {
      const url = buildRuntimeUrl(`/runtime/${encodeURIComponent(workspaceSlug)}/auth/logout`)
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Token': token },
      }).catch(() => {})
    }
    clearSession()
  }, [workspaceSlug, token, clearSession])

  const contextValue = useMemo<AppAuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      loading,
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout]
  )

  return <AppAuthContext.Provider value={contextValue}>{children}</AppAuthContext.Provider>
}
