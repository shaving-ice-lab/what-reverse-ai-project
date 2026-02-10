'use client'

/**
 * Data Convert Node - Minimalist Style
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Shuffle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowNodeData } from '@/types/workflow'

export interface TransformNodeProps extends NodeProps {
  data: WorkflowNodeData
  isConnectable?: boolean
}

const transformTypeLabels: Record<string, string> = {
  jsonParse: 'JSON Parse',
  jsonStringify: 'JSON Stringify',
  toArray: 'To Array',
  toObject: 'To Object',
  toString: 'To String',
  toNumber: 'To Number',
  toBoolean: 'To Boolean',
  flatten: 'Flatten',
  pick: 'Pick Fields',
  omit: 'Omit Fields',
  map: 'Map Transform',
  filter: 'Filter',
  sort: 'Sort',
  reverse: 'Reverse',
  unique: 'Remove Duplicates',
  groupBy: 'Group By',
}

export const TransformNode = memo(function TransformNode({
  data,
  selected,
  isConnectable = true,
}: TransformNodeProps) {
  const config = data.config as {
    transformType?: string
    expression?: string
    fields?: string[]
    sortKey?: string
    sortOrder?: 'asc' | 'desc'
    groupKey?: string
  }

  const transformType = config.transformType || 'jsonParse'

  return (
    <div
      className={cn(
        'min-w-[200px] rounded-lg border bg-surface-100 transition-all',
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
          <Shuffle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{data.label || 'Data Convert'}</h3>
          <p className="text-xs text-foreground-muted">
            {transformTypeLabels[transformType] || transformType}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5 space-y-2 text-xs">
        <div className="flex items-center justify-center gap-2 p-2 rounded-md bg-surface-200">
          <span className="px-1.5 py-0.5 rounded bg-surface-100 text-foreground-muted">Input</span>
          <ArrowRight className="h-3 w-3 text-brand-500" />
          <span className="px-1.5 py-0.5 rounded bg-brand-200/60 text-brand-500">
            {transformTypeLabels[transformType]?.split('')[0] || 'Convert'}
          </span>
        </div>
        {config.fields && config.fields.length > 0 && (
          <div className="text-foreground-muted">
            Field: <span className="font-mono">{config.fields.join(', ')}</span>
          </div>
        )}
        {config.sortKey && (
          <div className="text-foreground-muted">
            Sort: <span className="font-mono">{config.sortKey}</span>
            <span
              className={cn(
                'ml-1.5 px-1 py-0.5 rounded text-[10px] uppercase',
                config.sortOrder === 'desc'
                  ? 'bg-destructive-200 text-destructive'
                  : 'bg-brand-200 text-brand-500'
              )}
            >
              {config.sortOrder || 'asc'}
            </span>
          </div>
        )}
        {config.expression && (
          <div className="font-mono text-foreground-muted p-2 rounded-md bg-surface-200 truncate">
            {config.expression}
          </div>
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
