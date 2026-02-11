'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  Plus,
  RefreshCw,
  Key,
  Copy,
  Check,
  XCircle,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  RotateCw,
  Ban,
  Clock,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/page-layout'
import { workspaceDatabaseApi, type DatabaseRole } from '@/lib/api/workspace-database'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/hooks/useWorkspace'

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

const roleTypeConfig: Record<string, { label: string; color: string; description: string }> = {
  read: {
    label: 'Read Only',
    color: 'bg-blue-500/10 text-blue-600',
    description: 'SELECT access to all tables in the workspace database',
  },
  write: {
    label: 'Read/Write',
    color: 'bg-amber-500/10 text-amber-600',
    description: 'SELECT, INSERT, UPDATE, DELETE access to all tables',
  },
  admin: {
    label: 'Admin',
    color: 'bg-red-500/10 text-red-600',
    description: 'Full access including CREATE, ALTER, DROP tables',
  },
}

export default function DatabaseRolesPage() {
  const { workspaceId } = useWorkspace()
  const [roles, setRoles] = useState<DatabaseRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState<{ roleId: string; password: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rotating, setRotating] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  const loadRoles = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const data = await workspaceDatabaseApi.listRoles(workspaceId)
      setRoles(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load roles')
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  const handleCreateRole = async (roleType: 'read' | 'write' | 'admin') => {
    if (!workspaceId || creating) return
    setCreating(roleType)
    setError(null)
    try {
      const result = await workspaceDatabaseApi.createRole(workspaceId, roleType)
      setNewPassword({ roleId: result.role.id, password: result.password })
      await loadRoles()
    } catch (err: any) {
      setError(err?.message || 'Failed to create role')
    } finally {
      setCreating(null)
    }
  }

  const handleRotate = async (roleId: string) => {
    if (!workspaceId || rotating) return
    setRotating(roleId)
    setError(null)
    try {
      const result = await workspaceDatabaseApi.rotateRole(workspaceId, roleId)
      setNewPassword({ roleId: result.role.id, password: result.password })
      await loadRoles()
    } catch (err: any) {
      setError(err?.message || 'Failed to rotate password')
    } finally {
      setRotating(null)
    }
  }

  const handleRevoke = async (roleId: string) => {
    if (!workspaceId || revoking) return
    if (!confirm('Are you sure you want to revoke this role? This cannot be undone.')) return
    setRevoking(roleId)
    setError(null)
    try {
      await workspaceDatabaseApi.revokeRole(workspaceId, roleId, 'Revoked by user')
      if (newPassword?.roleId === roleId) setNewPassword(null)
      await loadRoles()
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke role')
    } finally {
      setRevoking(null)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  if (!workspaceId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-foreground-muted">Select a workspace to manage database roles.</p>
      </div>
    )
  }

  const activeRoles = roles.filter((r) => r.status === 'active')
  const inactiveRoles = roles.filter((r) => r.status !== 'active')

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Database Roles"
        description="Manage access credentials for your workspace database. Each role provides scoped access to your data."
      />

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* New Password Banner */}
      {newPassword && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">New Password Generated</span>
          </div>
          <p className="text-xs text-foreground-muted mb-3">
            Copy this password now. It will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-surface-200/50 rounded text-sm font-mono text-foreground select-all">
              {showPassword ? newPassword.password : '••••••••••••••••••••'}
            </code>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() => copyToClipboard(newPassword.password, 'new-pw')}
            >
              {copiedId === 'new-pw' ? <Check className="w-3.5 h-3.5 text-brand-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2 text-xs"
            onClick={() => setNewPassword(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Create Role Cards */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Create Role</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['read', 'write', 'admin'] as const).map((type) => {
            const config = roleTypeConfig[type]
            const exists = activeRoles.some((r) => r.role_type === type)
            return (
              <div
                key={type}
                className="border border-border rounded-lg p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <Badge className={cn('text-[10px]', config.color)}>
                    {config.label}
                  </Badge>
                  {exists && (
                    <span className="text-[10px] text-foreground-muted">Active</span>
                  )}
                </div>
                <p className="text-xs text-foreground-muted flex-1">
                  {config.description}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs w-full mt-1"
                  disabled={exists || creating === type}
                  onClick={() => handleCreateRole(type)}
                >
                  {creating === type ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Plus className="w-3 h-3 mr-1" />
                  )}
                  {exists ? 'Already Exists' : 'Create'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Roles */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
        </div>
      ) : (
        <>
          {activeRoles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">Active Roles</h3>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={loadRoles}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                </Button>
              </div>
              <div className="border border-border rounded-lg divide-y divide-border">
                {activeRoles.map((role) => {
                  const config = roleTypeConfig[role.role_type] || roleTypeConfig.read
                  return (
                    <div key={role.id} className="p-4 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-surface-200/50 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-foreground-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{role.db_username}</span>
                          <Badge className={cn('text-[10px]', config.color)}>{config.label}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1.5"
                            onClick={() => copyToClipboard(role.db_username, `user-${role.id}`)}
                          >
                            {copiedId === `user-${role.id}` ? (
                              <Check className="w-3 h-3 text-brand-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        <div className="text-[11px] text-foreground-muted flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Created {formatTimeAgo(role.created_at)}
                          </span>
                          {role.expires_at && (
                            <span className="text-amber-500">
                              Expires {formatTimeAgo(role.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs"
                          disabled={rotating === role.id}
                          onClick={() => handleRotate(role.id)}
                          title="Rotate password"
                        >
                          {rotating === role.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCw className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          disabled={revoking === role.id}
                          onClick={() => handleRevoke(role.id)}
                          title="Revoke role"
                        >
                          {revoking === role.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Ban className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Revoked/Expired Roles */}
          {inactiveRoles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground-muted mb-3">
                Revoked / Expired ({inactiveRoles.length})
              </h3>
              <div className="border border-border rounded-lg divide-y divide-border opacity-60">
                {inactiveRoles.map((role) => {
                  const config = roleTypeConfig[role.role_type] || roleTypeConfig.read
                  return (
                    <div key={role.id} className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-200/30 flex items-center justify-center shrink-0">
                        <XCircle className="w-3.5 h-3.5 text-foreground-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground-muted line-through">{role.db_username}</span>
                          <Badge className="text-[10px] bg-surface-200/50 text-foreground-muted">{config.label}</Badge>
                          <Badge className="text-[10px] bg-surface-200/50 text-foreground-muted capitalize">{role.status}</Badge>
                        </div>
                        <div className="text-[10px] text-foreground-muted mt-0.5">
                          {role.revoked_reason && <span>{role.revoked_reason} · </span>}
                          {role.revoked_at ? `Revoked ${formatTimeAgo(role.revoked_at)}` : `Created ${formatTimeAgo(role.created_at)}`}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {roles.length === 0 && !error && (
            <div className="border border-dashed border-border rounded-lg py-12 text-center">
              <Shield className="w-8 h-8 text-foreground-muted/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No database roles</p>
              <p className="text-xs text-foreground-muted mt-1 max-w-sm mx-auto">
                Create a role to get scoped database credentials for external access or integrations.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
