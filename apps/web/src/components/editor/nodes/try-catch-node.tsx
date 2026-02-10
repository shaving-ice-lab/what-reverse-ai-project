'use client'

/**
 * ErrorProcessNode - Minimalist Style
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ShieldAlert, RotateCcw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowNodeData } from '@/types/workflow'

export interface TryCatchNodeProps extends NodeProps {
  data: WorkflowNodeData
  isConnectable?: boolean
}

export const TryCatchNode = memo(function TryCatchNode({
  data,
  selected,
  isConnectable = true,
}: TryCatchNodeProps) {
  const config = data.config as {
    retryCount?: number
    retryDelay?: number
    fallbackValue?: string
    errorVariable?: string
    continueOnError?: boolean
  }

  const retryCount = config.retryCount || 0
  const retryDelay = config.retryDelay || 1000

  return (
    <div
      className={cn(
        'min-w-[220px] rounded-lg border bg-surface-100 transition-all',
        selected
          ? 'border-destructive shadow-md shadow-destructive/10'
          : 'border-border hover:border-destructive/40'
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
      <div className="flex items-center gap-2.5 border-b border-border/70 px-3 py-2.5 bg-destructive-200/40">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive text-background">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{data.label || 'Error Handling'}</h3>
          <p className="text-xs text-foreground-muted">Try / Catch</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5 space-y-2 text-xs">
        {retryCount > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-surface-200">
            <RotateCcw className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
            <span className="text-foreground-muted">Retry:</span>
            <span className="font-mono px-1.5 py-0.5 rounded bg-destructive-200 text-destructive font-medium">
              {retryCount} times
            </span>
            <span className="text-foreground-muted">Latency:</span>
            <span className="font-mono">{retryDelay}ms</span>
          </div>
        )}
        {config.errorVariable && (
          <div className="flex items-center gap-2">
            <span className="text-foreground-muted">Error Variable:</span>
            <span className="font-mono px-1.5 py-0.5 rounded bg-surface-200">
              ${config.errorVariable}
            </span>
          </div>
        )}
        {config.continueOnError && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-warning-200 text-warning">
            <AlertTriangle className="h-3 w-3" />
            Continue on Error
          </span>
        )}
      </div>

      {/* OutputPortRegion */}
      <div className="px-3 py-2.5 border-t border-border bg-surface-200 space-y-1.5">
        {/* SuccessBranch */}
        <div className="flex items-center justify-end gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-brand-200 text-xs">
            <CheckCircle className="h-3 w-3 text-brand-500" />
            <span className="text-brand-500">Success</span>
          </div>
          <Handle
            id="success"
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            className="relative! transform-none! w-3! h-3! border-2! border-background! rounded-full! bg-brand-500!"
          />
        </div>

        {/* FailedBranch */}
        <div className="flex items-center justify-end gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-destructive-200 text-xs">
            <XCircle className="h-3 w-3 text-destructive" />
            <span className="text-destructive">Failed</span>
          </div>
          <Handle
            id="error"
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            className="relative! transform-none! w-3! h-3! border-2! border-background! rounded-full! bg-destructive!"
          />
        </div>
      </div>
    </div>
  )
})
