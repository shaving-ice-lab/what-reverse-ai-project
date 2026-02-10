'use client'

/**
 * VariableNode - Minimalist Style
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Variable, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowNodeData } from '@/types/workflow'

export interface VariableNodeProps extends NodeProps {
  data: WorkflowNodeData
  isConnectable?: boolean
}

const typeIcons: Record<string, string> = {
  string: 'Aa',
  number: '#',
  boolean: '?',
  object: '{}',
  array: '[]',
  any: '*',
}

export const VariableNode = memo(function VariableNode({
  data,
  selected,
  isConnectable = true,
}: VariableNodeProps) {
  const config = data.config as {
    variableName?: string
    valueType?: string
    value?: unknown
  }

  const valueType = config.valueType || 'string'
  const typeIcon = typeIcons[valueType] || typeIcons.any

  return (
    <div
      className={cn(
        'min-w-[180px] rounded-lg border bg-surface-100 transition-all',
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
          <Variable className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{data.label || 'Variable'}</h3>
          <p className="text-xs text-foreground-muted flex items-center gap-1">
            <Database className="h-3 w-3" />
            DataStorage
          </p>
        </div>
      </div>

      {/* VariableInfo */}
      <div className="px-3 py-2.5 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-brand-200/60 font-mono font-medium text-brand-500">
            {typeIcon}
          </span>
          <span className="font-mono truncate bg-surface-200 px-1.5 py-0.5 rounded flex-1">
            {config.variableName || 'variable'}
          </span>
        </div>
        {config.value !== undefined && (
          <p className="text-foreground-muted truncate p-1.5 rounded bg-surface-200">
            = {JSON.stringify(config.value)}
          </p>
        )}
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
