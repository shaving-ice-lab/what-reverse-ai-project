'use client'

import React, { useState, useEffect } from 'react'
import {
  Key,
  Link2,
  Hash,
  Loader2,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { workspaceDatabaseApi } from '@/lib/api/workspace-database'
import type { TableSchema, TableColumn, TableIndex, ForeignKey } from '@/lib/api/workspace-database'
import { cn } from '@/lib/utils'

interface TableSchemaPanelProps {
  workspaceId: string
  tableName: string
  className?: string
}

export function TableSchemaPanel({ workspaceId, tableName, className }: TableSchemaPanelProps) {
  const [schema, setSchema] = useState<TableSchema | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedDDL, setCopiedDDL] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const data = await workspaceDatabaseApi.getTableSchema(workspaceId, tableName)
        if (!cancelled) setSchema(data)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load schema')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [workspaceId, tableName])

  const copyDDL = async () => {
    if (!schema?.ddl) return
    await navigator.clipboard.writeText(schema.ddl)
    setCopiedDDL(true)
    setTimeout(() => setCopiedDDL(false), 2000)
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
      </div>
    )
  }

  if (error || !schema) {
    return (
      <div className={cn('flex items-center justify-center py-12 text-sm text-destructive gap-2', className)}>
        <AlertCircle className="w-4 h-4" />
        {error || 'Schema not found'}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <Tabs defaultValue="columns">
        <TabsList variant="underline" className="px-4">
          <TabsTrigger value="columns">
            Columns ({schema.columns.length})
          </TabsTrigger>
          <TabsTrigger value="indexes">
            Indexes ({schema.indexes.length})
          </TabsTrigger>
          <TabsTrigger value="fkeys">
            Foreign Keys ({schema.foreign_keys?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="ddl">DDL</TabsTrigger>
        </TabsList>

        {/* Columns Tab */}
        <TabsContent value="columns" className="p-4">
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-75 border-b border-border">
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-foreground-muted">#</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-foreground-muted">Name</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-foreground-muted">Type</th>
                  <th className="text-center px-3 py-2 text-[11px] font-medium text-foreground-muted">Nullable</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-foreground-muted">Default</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-foreground-muted">Constraints</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-foreground-muted">Extra</th>
                </tr>
              </thead>
              <tbody>
                {schema.columns.map((col) => (
                  <tr key={col.name} className="border-b border-border last:border-b-0 hover:bg-surface-200/30">
                    <td className="px-3 py-2 text-xs text-foreground-muted tabular-nums">
                      {col.ordinal_position}
                    </td>
                    <td className="px-3 py-2 text-xs font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        {col.name}
                        {col.is_primary_key && (
                          <span title="Primary Key"><Key className="w-3 h-3 text-amber-500" /></span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-200 text-foreground-light">
                        {col.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded',
                        col.nullable
                          ? 'bg-surface-200 text-foreground-muted'
                          : 'bg-amber-500/10 text-amber-600'
                      )}>
                        {col.nullable ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-foreground-light font-mono">
                      {col.default_value ?? <span className="text-foreground-muted italic">none</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {col.is_primary_key && (
                          <span className="text-[9px] font-bold bg-amber-500/10 text-amber-600 px-1 rounded">PK</span>
                        )}
                        {col.is_unique && !col.is_primary_key && (
                          <span className="text-[9px] font-bold bg-blue-500/10 text-blue-500 px-1 rounded">UNI</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-foreground-muted">
                      {col.extra || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Indexes Tab */}
        <TabsContent value="indexes" className="p-4">
          {schema.indexes.length === 0 ? (
            <div className="text-center py-8 text-sm text-foreground-muted">No indexes</div>
          ) : (
            <div className="border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-75 border-b border-border">
                    <th className="text-left px-3 py-2 text-[11px] font-medium text-foreground-muted">Name</th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium text-foreground-muted">Columns</th>
                    <th className="text-center px-3 py-2 text-[11px] font-medium text-foreground-muted">Type</th>
                    <th className="text-center px-3 py-2 text-[11px] font-medium text-foreground-muted">Unique</th>
                  </tr>
                </thead>
                <tbody>
                  {schema.indexes.map((idx) => (
                    <tr key={idx.name} className="border-b border-border last:border-b-0 hover:bg-surface-200/30">
                      <td className="px-3 py-2 text-xs font-medium text-foreground">
                        <div className="flex items-center gap-1.5">
                          {idx.is_primary ? (
                            <span title="Primary"><Key className="w-3 h-3 text-amber-500" /></span>
                          ) : (
                            <span title="Index"><Hash className="w-3 h-3 text-foreground-muted" /></span>
                          )}
                          {idx.name}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground-light">
                        <div className="flex flex-wrap gap-1">
                          {idx.columns.map((c) => (
                            <span key={c} className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-200">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-foreground-muted">
                        {idx.type}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {idx.is_unique ? (
                          <span className="text-[10px] font-medium bg-brand-500/10 text-brand-500 px-1.5 py-0.5 rounded">YES</span>
                        ) : (
                          <span className="text-[10px] text-foreground-muted">NO</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Foreign Keys Tab */}
        <TabsContent value="fkeys" className="p-4">
          {(!schema.foreign_keys || schema.foreign_keys.length === 0) ? (
            <div className="text-center py-8 text-sm text-foreground-muted">No foreign keys</div>
          ) : (
            <div className="border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-75 border-b border-border">
                    <th className="text-left px-3 py-2 text-[11px] font-medium text-foreground-muted">Constraint</th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium text-foreground-muted">Column</th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium text-foreground-muted">References</th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium text-foreground-muted">On Update</th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium text-foreground-muted">On Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {schema.foreign_keys.map((fk) => (
                    <tr key={fk.name} className="border-b border-border last:border-b-0 hover:bg-surface-200/30">
                      <td className="px-3 py-2 text-xs font-medium text-foreground">
                        <div className="flex items-center gap-1.5">
                          <span title="Foreign Key"><Link2 className="w-3 h-3 text-blue-500" /></span>
                          {fk.name}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono text-foreground-light">{fk.column}</td>
                      <td className="px-3 py-2 text-xs font-mono text-foreground-light">
                        {fk.referenced_table}.{fk.referenced_column}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground-muted">{fk.on_update}</td>
                      <td className="px-3 py-2 text-xs text-foreground-muted">{fk.on_delete}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* DDL Tab */}
        <TabsContent value="ddl" className="p-4">
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 h-7 text-xs z-10"
              onClick={copyDDL}
            >
              {copiedDDL ? (
                <Check className="w-3.5 h-3.5 mr-1 text-brand-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 mr-1" />
              )}
              {copiedDDL ? 'Copied' : 'Copy'}
            </Button>
            <pre className="bg-surface-200/50 border border-border rounded-md p-4 text-xs font-mono text-foreground whitespace-pre-wrap overflow-auto max-h-[400px]">
              {schema.ddl || '-- DDL not available'}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
