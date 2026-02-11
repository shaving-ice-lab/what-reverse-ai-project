'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  FunctionSquare,
  RefreshCw,
  Plus,
  Loader2,
  Code,
  Clock,
  ChevronDown,
  ChevronRight,
  Trash2,
  Play,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/page-layout'
import { workspaceDatabaseApi } from '@/lib/api/workspace-database'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/hooks/useWorkspace'

interface DatabaseRoutine {
  name: string
  type: 'FUNCTION' | 'PROCEDURE'
  definer: string
  created: string
  modified: string
  data_type?: string
  body?: string
  param_list?: string
  comment?: string
}

export default function DatabaseFunctionsPage() {
  const { workspaceId } = useWorkspace()
  const [routines, setRoutines] = useState<DatabaseRoutine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedName, setExpandedName] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadRoutines = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const result = await workspaceDatabaseApi.executeSQL(
        workspaceId,
        `SELECT ROUTINE_NAME, ROUTINE_TYPE, DEFINER, CREATED, LAST_ALTERED, DTD_IDENTIFIER, ROUTINE_COMMENT
         FROM INFORMATION_SCHEMA.ROUTINES
         WHERE ROUTINE_SCHEMA = DATABASE()
         ORDER BY ROUTINE_TYPE, ROUTINE_NAME`
      )
      const items: DatabaseRoutine[] = (result.rows || []).map((row: any) => ({
        name: row.ROUTINE_NAME || row.routine_name || '',
        type: (row.ROUTINE_TYPE || row.routine_type || 'FUNCTION') as 'FUNCTION' | 'PROCEDURE',
        definer: row.DEFINER || row.definer || '',
        created: row.CREATED || row.created || '',
        modified: row.LAST_ALTERED || row.last_altered || '',
        data_type: row.DTD_IDENTIFIER || row.dtd_identifier || '',
        comment: row.ROUTINE_COMMENT || row.routine_comment || '',
      }))
      setRoutines(items)
    } catch (err: any) {
      setError(err?.message || 'Failed to load routines')
      setRoutines([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadRoutines()
  }, [loadRoutines])

  const loadRoutineBody = useCallback(async (name: string, type: string) => {
    if (!workspaceId) return
    try {
      const result = await workspaceDatabaseApi.executeSQL(
        workspaceId,
        `SHOW CREATE ${type} \`${name}\``
      )
      if (result.rows?.[0]) {
        const row = result.rows[0] as any
        const body = row['Create Function'] || row['Create Procedure'] || row['create function'] || row['create procedure'] || ''
        setRoutines((prev) =>
          prev.map((r) => (r.name === name ? { ...r, body } : r))
        )
      }
    } catch {
      // ignore
    }
  }, [workspaceId])

  const handleExpand = (name: string, type: string) => {
    if (expandedName === name) {
      setExpandedName(null)
    } else {
      setExpandedName(name)
      const routine = routines.find((r) => r.name === name)
      if (!routine?.body) {
        loadRoutineBody(name, type)
      }
    }
  }

  const handleDrop = async (name: string, type: string) => {
    if (!workspaceId) return
    if (!confirm(`Drop ${type.toLowerCase()} "${name}"? This cannot be undone.`)) return
    setDeleting(name)
    try {
      await workspaceDatabaseApi.executeSQL(workspaceId, `DROP ${type} IF EXISTS \`${name}\``)
      setRoutines((prev) => prev.filter((r) => r.name !== name))
      if (expandedName === name) setExpandedName(null)
    } catch (err: any) {
      setError(err?.message || `Failed to drop ${type.toLowerCase()}`)
    } finally {
      setDeleting(null)
    }
  }

  const handleCreate = async (sql: string) => {
    if (!workspaceId || !sql.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      await workspaceDatabaseApi.executeSQL(workspaceId, sql)
      setShowCreateDialog(false)
      await loadRoutines()
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create routine')
    } finally {
      setCreating(false)
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
        <p className="text-sm text-foreground-muted">Select a workspace to manage database functions.</p>
      </div>
    )
  }

  const functions = routines.filter((r) => r.type === 'FUNCTION')
  const procedures = routines.filter((r) => r.type === 'PROCEDURE')

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Functions & Procedures"
          description="Manage stored functions and procedures in your workspace database."
        />
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={loadRoutines}>
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={() => { setShowCreateDialog(true); setCreateError(null) }}>
            <Plus className="w-3 h-3 mr-1" /> Create
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
        </div>
      ) : routines.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-12 text-center">
          <FunctionSquare className="w-8 h-8 text-foreground-muted/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No functions or procedures</p>
          <p className="text-xs text-foreground-muted mt-1 max-w-sm mx-auto">
            Create stored functions and procedures to encapsulate reusable database logic.
          </p>
          <Button size="sm" className="mt-4 h-8 text-xs" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-3 h-3 mr-1" /> Create First Function
          </Button>
        </div>
      ) : (
        <>
          {/* Functions */}
          {functions.length > 0 && (
            <RoutineSection
              title="Functions"
              count={functions.length}
              routines={functions}
              expandedName={expandedName}
              deleting={deleting}
              copiedId={copiedId}
              onExpand={handleExpand}
              onDrop={handleDrop}
              onCopy={copyToClipboard}
            />
          )}

          {/* Procedures */}
          {procedures.length > 0 && (
            <RoutineSection
              title="Stored Procedures"
              count={procedures.length}
              routines={procedures}
              expandedName={expandedName}
              deleting={deleting}
              copiedId={copiedId}
              onExpand={handleExpand}
              onDrop={handleDrop}
              onCopy={copyToClipboard}
            />
          )}
        </>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <CreateRoutineDialog
          creating={creating}
          error={createError}
          onSubmit={handleCreate}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  )
}

function RoutineSection({
  title,
  count,
  routines,
  expandedName,
  deleting,
  copiedId,
  onExpand,
  onDrop,
  onCopy,
}: {
  title: string
  count: number
  routines: DatabaseRoutine[]
  expandedName: string | null
  deleting: string | null
  copiedId: string | null
  onExpand: (name: string, type: string) => void
  onDrop: (name: string, type: string) => void
  onCopy: (text: string, id: string) => void
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
        {title}
        <Badge variant="secondary" className="text-[10px]">{count}</Badge>
      </h3>
      <div className="border border-border rounded-lg divide-y divide-border">
        {routines.map((routine) => {
          const isExpanded = expandedName === routine.name
          return (
            <div key={routine.name}>
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => onExpand(routine.name, routine.type)}
                  className="text-foreground-muted hover:text-foreground transition-colors shrink-0"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                  <FunctionSquare className="w-4 h-4 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground font-mono">{routine.name}</span>
                    {routine.data_type && routine.type === 'FUNCTION' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-200/50 text-foreground-muted font-mono">
                        → {routine.data_type}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-foreground-muted flex items-center gap-3 mt-0.5">
                    {routine.created && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(routine.created).toLocaleDateString()}
                      </span>
                    )}
                    {routine.comment && <span>{routine.comment}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    disabled={deleting === routine.name}
                    onClick={() => onDrop(routine.name, routine.type)}
                    title={`Drop ${routine.type.toLowerCase()}`}
                  >
                    {deleting === routine.name ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded body */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/50">
                  <div className="mt-3">
                    {routine.body ? (
                      <div className="relative">
                        <pre className="text-xs font-mono text-foreground-light bg-surface-200/30 rounded-lg p-3 overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                          {routine.body}
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 h-7 text-xs"
                          onClick={() => onCopy(routine.body || '', `body-${routine.name}`)}
                        >
                          {copiedId === `body-${routine.name}` ? (
                            <Check className="w-3 h-3 text-brand-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CreateRoutineDialog({
  creating,
  error,
  onSubmit,
  onClose,
}: {
  creating: boolean
  error: string | null
  onSubmit: (sql: string) => void
  onClose: () => void
}) {
  const [sql, setSql] = useState(
`CREATE FUNCTION my_function(param1 INT)
RETURNS INT
DETERMINISTIC
BEGIN
  RETURN param1 * 2;
END`
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background border border-border rounded-xl shadow-lg w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Create Function / Procedure</h3>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground-light mb-1 block">SQL Definition</label>
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={12}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm resize-y min-h-[200px] font-mono"
              placeholder="CREATE FUNCTION or CREATE PROCEDURE ..."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded bg-destructive/5 border border-destructive/20 text-destructive text-xs">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={creating || !sql.trim()}
              onClick={() => onSubmit(sql)}
              className="h-8 text-xs"
            >
              {creating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
              Execute
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
