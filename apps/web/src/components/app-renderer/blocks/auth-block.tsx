'use client'

import React, { useState } from 'react'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAppAuth } from '../app-auth-provider'
import type { AuthBlockConfig } from '../types'

interface AuthBlockProps {
  config: AuthBlockConfig
}

export function AuthBlock({ config }: AuthBlockProps) {
  const { user, isAuthenticated, loading, login, register, logout } = useAppAuth()
  const mode = config.mode || 'login_register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    mode === 'register' ? 'register' : 'login'
  )

  if (loading) {
    return (
      <div className="border border-border rounded-lg p-6 animate-pulse">
        <div className="h-4 w-32 bg-foreground/10 rounded mx-auto" />
      </div>
    )
  }

  // Show user info when authenticated
  if (isAuthenticated && user) {
    return (
      <div className="border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">
                {user.display_name || user.email}
              </div>
              {user.display_name && (
                <div className="text-xs text-foreground-muted">{user.email}</div>
              )}
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={logout}>
            <LogOut className="w-3.5 h-3.5" />
            {config.logout_label || 'Sign Out'}
          </Button>
        </div>
      </div>
    )
  }

  // Show login/register forms
  const showTabs = mode === 'login_register'

  return (
    <div className="border border-border rounded-lg p-6 max-w-sm mx-auto">
      {config.title && (
        <h3 className="text-base font-semibold text-foreground text-center mb-1">{config.title}</h3>
      )}
      {config.description && (
        <p className="text-xs text-foreground-muted text-center mb-4">{config.description}</p>
      )}

      {showTabs && (
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setActiveTab('login')}
            className={cn(
              'flex-1 pb-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'login'
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-foreground-muted hover:text-foreground'
            )}
          >
            {config.login_label || 'Sign In'}
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={cn(
              'flex-1 pb-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'register'
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-foreground-muted hover:text-foreground'
            )}
          >
            {config.register_label || 'Sign Up'}
          </button>
        </div>
      )}

      {(activeTab === 'login' || mode === 'login') && (
        <LoginForm login={login} submitLabel={config.login_label || 'Sign In'} />
      )}

      {(activeTab === 'register' || mode === 'register') && (
        <RegisterForm
          register={register}
          login={login}
          autoLoginAfterRegister={config.auto_login_after_register !== false}
          submitLabel={config.register_label || 'Sign Up'}
        />
      )}
    </div>
  )
}

function LoginForm({
  login,
  submitLabel,
}: {
  login: (email: string, password: string) => Promise<void>
  submitLabel: string
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Email and password are required')
      return
    }
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-foreground-light mb-1 block">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-9 text-sm"
          autoComplete="email"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-light mb-1 block">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="h-9 text-sm"
          autoComplete="current-password"
        />
      </div>
      {error && <div className="text-xs text-destructive">{error}</div>}
      <Button type="submit" size="sm" disabled={submitting} className="w-full h-9">
        {submitting ? 'Signing in...' : submitLabel}
      </Button>
    </form>
  )
}

function RegisterForm({
  register,
  login,
  autoLoginAfterRegister,
  submitLabel,
}: {
  register: (email: string, password: string, displayName?: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  autoLoginAfterRegister: boolean
  submitLabel: string
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (!email || !password) {
      setError('Email and password are required')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setSubmitting(true)
    try {
      await register(email, password, displayName || undefined)
      if (autoLoginAfterRegister) {
        await login(email, password)
      } else {
        setSuccess(true)
        setEmail('')
        setPassword('')
        setDisplayName('')
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-foreground-light mb-1 block">Display Name</label>
        <Input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name (optional)"
          className="h-9 text-sm"
          autoComplete="name"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-light mb-1 block">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-9 text-sm"
          autoComplete="email"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground-light mb-1 block">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          className="h-9 text-sm"
          autoComplete="new-password"
        />
      </div>
      {error && <div className="text-xs text-destructive">{error}</div>}
      {success && (
        <div className="text-xs text-emerald-600">Account created! You can now sign in.</div>
      )}
      <Button type="submit" size="sm" disabled={submitting} className="w-full h-9">
        {submitting ? 'Creating account...' : submitLabel}
      </Button>
    </form>
  )
}
