'use client'

/**
 * DatabaseNode - Minimalist Style
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowNodeData } from '@/types/workflow'

export interface DatabaseNodeProps extends NodeProps {
  data: WorkflowNodeData
  isConnectable?: boolean
}

const operationStyles: Record<string, { label: string; badge: string; hint: string }> = {
  select: {
    label: 'SELECT',
    badge: 'bg-brand-200/70 text-brand-500',
    hint: 'Read Data',
  },
  insert: {
    label: 'INSERT',
    badge: 'bg-emerald-200/70 text-emerald-600',
    hint: 'Add Data',
  },
  update: {
    label: 'UPDATE',
    badge: 'bg-warning-200/70 text-warning',
    hint: 'Update Data',
  },
  delete: {
    label: 'DELETE',
    badge: 'bg-destructive-200/70 text-destructive',
    hint: 'Delete Data',
  },
  migrate: {
    label: 'MIGRATE',
    badge: 'bg-surface-200 text-foreground-muted',
    hint: 'Structure Migration',
  },
}

function resolveOperation(config: { operation?: string }, fallback = 'select') {
  const op = (config.operation || fallback).toLowerCase()
  return operationStyles[op] ? op : fallback
}

function formatValuePreview(value: unknown) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export const DatabaseNode = memo(function DatabaseNode({
  data,
  selected,
  isConnectable = true,
}: DatabaseNodeProps) {
  const config = data.config as {
    operation?: string
    table?: string
    where?: string
    values?: unknown
    limit?: number
    sql?: string
  }

  const operationKey = resolveOperation(config)
  const operation = operationStyles[operationKey]
  const table = config.table || 'table_name'
  const where = config.where || ''
  const valuesPreview = formatValuePreview(config.values)
  const sqlPreview = (config.sql || '').split('\n')[0] || '/* migration sql */'

  return (
    <div
      className={cn(
        'min-w-[220px] rounded-lg border bg-surface-100 transition-all',
        selected
          ? 'border-brand-500 shadow-md shadow-brand-500/10'
          : 'border-border hover:border-brand-500/40'
      )}
    >
      {/* Input Port */}
      <Handle
        id="input"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3! h-3! border-2! border-background! rounded-full! top-[38px]! -left-1.5! bg-foreground-muted!"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border/70 px-3 py-2.5 bg-brand-200/30">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-background">
          <Database className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{data.label || 'Database Action'}</h3>
          <p className="text-xs text-foreground-muted">{operation.hint}</p>
        </div>
        <span
          className={cn('px-2 py-0.5 rounded text-[10px] font-mono font-semibold', operation.badge)}
        >
          {operation.label}
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5 space-y-2 text-xs">
        {operationKey === 'migrate' ? (
          <div className="text-foreground-muted">
            SQL: <span className="font-mono">{sqlPreview}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-surface-200 text-foreground-muted"></span>
              <span className="font-mono truncate bg-surface-200 px-1.5 py-0.5 rounded flex-1">
                {table}
              </span>
            </div>
            {where && (
              <div className="text-foreground-muted truncate">
                Condition: <span className="font-mono">{where}</span>
              </div>
            )}
            {typeof config.limit === 'number' && operationKey === 'select' && (
              <div className="text-foreground-muted">
                Limit: <span className="font-mono">{config.limit}</span>
              </div>
            )}
            {valuesPreview && operationKey !== 'select' && (
              <div className="text-foreground-muted truncate">
                values: <span className="font-mono">{valuesPreview}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between px-3 py-2 border-t border-border text-xs text-foreground-muted bg-surface-200">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
          Input
        </span>
        <span className="flex items-center gap-1">
          Output
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
        </span>
      </div>

      {/* OutputPort */}
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3! h-3! border-2! border-background! rounded-full! top-[38px]! -right-1.5! bg-brand-500!"
      />
    </div>
  )
})
