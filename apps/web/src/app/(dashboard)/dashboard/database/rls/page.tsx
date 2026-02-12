'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Shield, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/hooks/useWorkspace'
import { workspaceRLSApi, type RLSPolicy } from '@/lib/api/workspace-rls'

export default function RLSPage() {
  const { workspaceId } = useWorkspace()
  const [policies, setPolicies] = useState<RLSPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    table_name: '',
    column: '',
    match_field: 'app_user_id',
    operation: 'all',
    description: '',
  })
  const [creating, setCreating] = useState(false)

  const loadPolicies = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      const result = await workspaceRLSApi.listPolicies(workspaceId)
      setPolicies(result)
    } catch {
      setPolicies([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadPolicies()
  }, [loadPolicies])

  const handleCreate = async () => {
    if (!workspaceId || !createForm.table_name || !createForm.column) return
    setCreating(true)
    try {
      await workspaceRLSApi.createPolicy(workspaceId, createForm)
      setCreateForm({
        table_name: '',
        column: '',
        match_field: 'app_user_id',
        operation: 'all',
        description: '',
      })
      setShowCreate(false)
      await loadPolicies()
    } catch (err: any) {
      alert(err?.message || 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (policy: RLSPolicy) => {
    if (!workspaceId) return
    try {
      await workspaceRLSApi.updatePolicy(workspaceId, policy.id, { enabled: !policy.enabled })
      await loadPolicies()
    } catch (err: any) {
      alert(err?.message || 'Update failed')
    }
  }

  const handleDelete = async (policy: RLSPolicy) => {
    if (!workspaceId) return
    if (!window.confirm(`Delete RLS policy for "${policy.table_name}.${policy.column}"?`)) return
    try {
      await workspaceRLSApi.deletePolicy(workspaceId, policy.id)
      await loadPolicies()
    } catch (err: any) {
      alert(err?.message || 'Delete failed')
    }
  }

  if (!workspaceId) {
    return <div className="p-6 text-sm text-foreground-muted">Select a workspace first</div>
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Row Level Security</h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            Control which rows app users can access based on their identity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5"
            onClick={loadPolicies}
            disabled={loading}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>
          <Button size="sm" className="h-8 gap-1.5" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-3.5 h-3.5" />
            Add Policy
          </Button>
        </div>
      </div>

      {showCreate && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-surface-200/20">
          <h3 className="text-sm font-medium text-foreground">New RLS Policy</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground-light mb-1 block">
                Table Name
              </label>
              <Input
                value={createForm.table_name}
                onChange={(e) => setCreateForm((f) => ({ ...f, table_name: e.target.value }))}
                placeholder="e.g. orders"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground-light mb-1 block">Column</label>
              <Input
                value={createForm.column}
                onChange={(e) => setCreateForm((f) => ({ ...f, column: e.target.value }))}
                placeholder="e.g. user_id"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground-light mb-1 block">
                Match Field
              </label>
              <select
                value={createForm.match_field}
                onChange={(e) => setCreateForm((f) => ({ ...f, match_field: e.target.value }))}
                className="w-full h-8 rounded border border-border bg-background px-2 text-sm"
              >
                <option value="app_user_id">App User ID</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground-light mb-1 block">
                Operation
              </label>
              <select
                value={createForm.operation}
                onChange={(e) => setCreateForm((f) => ({ ...f, operation: e.target.value }))}
                className="w-full h-8 rounded border border-border bg-background px-2 text-sm"
              >
                <option value="all">All (SELECT/INSERT/UPDATE/DELETE)</option>
                <option value="select">SELECT only</option>
                <option value="insert">INSERT only</option>
                <option value="update">UPDATE only</option>
                <option value="delete">DELETE only</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground-light mb-1 block">
              Description (optional)
            </label>
            <Input
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Users can only see their own orders"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-8"
              onClick={handleCreate}
              disabled={creating || !createForm.table_name || !createForm.column}
            >
              {creating ? 'Creating...' : 'Create Policy'}
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border border-border rounded-lg p-3 animate-pulse">
              <div className="h-4 w-48 bg-foreground/10 rounded" />
              <div className="h-3 w-32 bg-foreground/10 rounded mt-2" />
            </div>
          ))}
        </div>
      ) : policies.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <Shield className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
          <p className="text-sm text-foreground-muted">No RLS policies configured</p>
          <p className="text-xs text-foreground-muted mt-1">
            Add a policy to restrict row-level access based on the logged-in app user
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="flex items-center gap-3 p-3 hover:bg-surface-200/20 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      policy.enabled ? 'text-foreground' : 'text-foreground-muted line-through'
                    )}
                  >
                    {policy.table_name}.{policy.column}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-600">
                    {policy.match_field}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-600">
                    {policy.operation}
                  </span>
                </div>
                {policy.description && (
                  <div className="text-xs text-foreground-muted mt-0.5">{policy.description}</div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggle(policy)}
                  className="p-1 rounded hover:bg-surface-200/50"
                  title={policy.enabled ? 'Disable' : 'Enable'}
                >
                  {policy.enabled ? (
                    <ToggleRight className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-foreground-muted" />
                  )}
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive"
                  onClick={() => handleDelete(policy)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border border-border rounded-lg p-4 bg-surface-200/10">
        <h3 className="text-xs font-semibold text-foreground mb-2">How RLS Works</h3>
        <ul className="text-xs text-foreground-muted space-y-1">
          <li>
            • When an app user queries a table with an RLS policy, a filter is automatically
            injected
          </li>
          <li>
            • The filter matches the specified <strong>column</strong> against the user&apos;s{' '}
            <strong>match field</strong> (ID or email)
          </li>
          <li>• Users without a valid app session token will see no rows on protected tables</li>
          <li>
            • Dashboard access (workspace owners) bypasses RLS — policies only apply to runtime API
          </li>
        </ul>
      </div>
    </div>
  )
}
