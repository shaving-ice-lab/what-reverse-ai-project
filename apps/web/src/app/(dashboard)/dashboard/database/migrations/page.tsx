'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  GitBranch,
  Plus,
  Eye,
  Check,
  X,
  Play,
  Loader2,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-layout'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { request } from '@/lib/api/shared'
import { cn } from '@/lib/utils'

function useActiveWorkspaceId(): string | null {
  const [id, setId] = useState<string | null>(null)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('activeWorkspaceId')
      if (stored) setId(stored)
    } catch {}
  }, [])
  return id
}

interface Migration {
  id: string
  version?: string
  description?: string
  status: string
  sql_up?: string
  sql_down?: string
  submitted_by?: string
  reviewed_by?: string
  executed_at?: string
  created_at: string
  updated_at?: string
}

interface MigrationPlan {
  sql: string
  description?: string
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-amber-500 bg-amber-500/10', label: 'Pending' },
  approved: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-blue-500 bg-blue-500/10', label: 'Approved' },
  executed: { icon: <Check className="w-3.5 h-3.5" />, color: 'text-brand-500 bg-brand-500/10', label: 'Executed' },
  rejected: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-destructive bg-destructive/10', label: 'Rejected' },
  failed: { icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-destructive bg-destructive/10', label: 'Failed' },
}

export default function MigrationsPage() {
  const workspaceId = useActiveWorkspaceId()
  const [migrations, setMigrations] = useState<Migration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewPlan, setPreviewPlan] = useState<MigrationPlan | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Submit dialog
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitDesc, setSubmitDesc] = useState('')
  const [submitSQL, setSubmitSQL] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Selected migration detail
  const [selectedMigration, setSelectedMigration] = useState<Migration | null>(null)

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadMigrations = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      // Use existing migration plan endpoint to check status
      // Note: There's no explicit list migrations endpoint, so we use plan preview
      const res = await request<any>(`/workspaces/${workspaceId}/database/migrations/plan`)
      const data = res?.data
      if (data?.migrations) {
        setMigrations(data.migrations)
      } else if (Array.isArray(data)) {
        setMigrations(data)
      } else {
        setMigrations([])
      }
    } catch {
      setMigrations([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadMigrations()
  }, [loadMigrations])

  const handlePreview = async () => {
    if (!workspaceId) return
    setPreviewLoading(true)
    setPreviewOpen(true)
    try {
      const res = await request<any>(`/workspaces/${workspaceId}/database/migrations/plan`)
      setPreviewPlan(res?.data || { sql: 'No pending changes' })
    } catch (err: any) {
      setPreviewPlan({ sql: `Error: ${err?.message || 'Failed to load plan'}` })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!workspaceId || !submitSQL.trim()) return
    setSubmitting(true)
    try {
      await request(`/workspaces/${workspaceId}/database/migrations`, {
        method: 'POST',
        body: JSON.stringify({
          description: submitDesc,
          sql_up: submitSQL,
        }),
      })
      setSubmitOpen(false)
      setSubmitDesc('')
      setSubmitSQL('')
      loadMigrations()
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  const handleAction = async (migrationId: string, action: 'approve' | 'reject' | 'execute') => {
    if (!workspaceId) return
    setActionLoading(`${migrationId}_${action}`)
    try {
      await request(`/workspaces/${workspaceId}/database/migrations/${migrationId}/${action}`, {
        method: 'POST',
      })
      loadMigrations()
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground-light text-sm">
        Please select a workspace first.
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Migrations"
        description="Manage database schema migrations with version control and approval workflow."
        icon={<GitBranch className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={loadMigrations} disabled={loading}>
              <RefreshCw className={cn('w-4 h-4 mr-1.5', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button size="sm" variant="ghost" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-1.5" />
              Preview Plan
            </Button>
            <Button size="sm" onClick={() => setSubmitOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Submit Migration
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
        </div>
      ) : migrations.length === 0 ? (
        <div className="bg-surface-100 border border-border rounded-lg p-12 text-center">
          <GitBranch className="w-8 h-8 text-foreground-muted mx-auto mb-3" />
          <p className="text-sm text-foreground-light mb-1">No migrations yet</p>
          <p className="text-xs text-foreground-muted mb-4">
            Submit your first migration to track schema changes.
          </p>
          <Button size="sm" onClick={() => setSubmitOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Submit Migration
          </Button>
        </div>
      ) : (
        <div className="bg-surface-100 border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-75/60">
                <th className="text-left px-4 py-2.5 text-[12px] font-medium text-foreground-light">Version</th>
                <th className="text-left px-4 py-2.5 text-[12px] font-medium text-foreground-light">Description</th>
                <th className="text-center px-4 py-2.5 text-[12px] font-medium text-foreground-light">Status</th>
                <th className="text-right px-4 py-2.5 text-[12px] font-medium text-foreground-light">Created</th>
                <th className="text-right px-4 py-2.5 text-[12px] font-medium text-foreground-light">Actions</th>
              </tr>
            </thead>
            <tbody>
              {migrations.map((m) => {
                const status = statusConfig[m.status] || statusConfig.pending
                return (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-b-0 hover:bg-surface-200/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedMigration(m)}
                  >
                    <td className="px-4 py-2.5 text-xs font-mono text-foreground">
                      {m.version || m.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-foreground-light max-w-[300px] truncate">
                      {m.description || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium', status.color)}>
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-foreground-muted">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {m.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-brand-500"
                              onClick={() => handleAction(m.id, 'approve')}
                              disabled={actionLoading === `${m.id}_approve`}
                            >
                              {actionLoading === `${m.id}_approve` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3 mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-destructive"
                              onClick={() => handleAction(m.id, 'reject')}
                              disabled={actionLoading === `${m.id}_reject`}
                            >
                              {actionLoading === `${m.id}_reject` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <X className="w-3 h-3 mr-1" />
                              )}
                              Reject
                            </Button>
                          </>
                        )}
                        {m.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-brand-500"
                            onClick={() => handleAction(m.id, 'execute')}
                            disabled={actionLoading === `${m.id}_execute`}
                          >
                            {actionLoading === `${m.id}_execute` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3 mr-1" />
                            )}
                            Execute
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Migration detail dialog */}
      {selectedMigration && (
        <Dialog open={!!selectedMigration} onOpenChange={() => setSelectedMigration(null)}>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>Migration: {selectedMigration.version || selectedMigration.id.slice(0, 8)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-foreground-muted">Status:</span>
                  <span className={cn('ml-2 px-2 py-0.5 rounded font-medium',
                    (statusConfig[selectedMigration.status] || statusConfig.pending).color
                  )}>
                    {(statusConfig[selectedMigration.status] || statusConfig.pending).label}
                  </span>
                </div>
                <div>
                  <span className="text-foreground-muted">Created:</span>
                  <span className="ml-2 text-foreground">{new Date(selectedMigration.created_at).toLocaleString()}</span>
                </div>
              </div>
              {selectedMigration.description && (
                <div>
                  <label className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">Description</label>
                  <p className="text-sm text-foreground mt-1">{selectedMigration.description}</p>
                </div>
              )}
              {selectedMigration.sql_up && (
                <div>
                  <label className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">SQL (Up)</label>
                  <pre className="mt-1 bg-surface-200/50 border border-border rounded p-3 text-xs font-mono text-foreground whitespace-pre-wrap max-h-[200px] overflow-auto">
                    {selectedMigration.sql_up}
                  </pre>
                </div>
              )}
              {selectedMigration.sql_down && (
                <div>
                  <label className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">SQL (Down / Rollback)</label>
                  <pre className="mt-1 bg-surface-200/50 border border-border rounded p-3 text-xs font-mono text-foreground whitespace-pre-wrap max-h-[200px] overflow-auto">
                    {selectedMigration.sql_down}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Preview plan dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Migration Plan Preview</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {previewLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
              </div>
            ) : (
              <pre className="bg-surface-200/50 border border-border rounded p-4 text-xs font-mono text-foreground whitespace-pre-wrap max-h-[400px] overflow-auto">
                {previewPlan?.sql || 'No pending changes'}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit migration dialog */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Submit Migration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[12px] font-medium text-foreground mb-1.5 block">
                Description
              </label>
              <Input
                placeholder="e.g. Add users table, alter orders schema"
                value={submitDesc}
                onChange={(e) => setSubmitDesc(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground mb-1.5 block">
                SQL (Up)
              </label>
              <Textarea
                placeholder="ALTER TABLE users ADD COLUMN email VARCHAR(255) NOT NULL;"
                value={submitSQL}
                onChange={(e) => setSubmitSQL(e.target.value)}
                className="font-mono text-xs min-h-[150px]"
                spellCheck={false}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setSubmitOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!submitSQL.trim() || submitting} className="text-xs">
              {submitting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
