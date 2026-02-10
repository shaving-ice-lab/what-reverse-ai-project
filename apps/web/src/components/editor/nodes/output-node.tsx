'use client'

/**
 * Output Showcase Node - Minimalist Style
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { FileOutput, Type, Code, Table, Image, FileText, Clock, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowNodeData } from '@/types/workflow'

export interface OutputNodeProps extends NodeProps {
  data: WorkflowNodeData
  isConnectable?: boolean
}

const outputTypeIcons: Record<string, React.ReactNode> = {
  text: <Type className="h-3.5 w-3.5" />,
  json: <Code className="h-3.5 w-3.5" />,
  table: <Table className="h-3.5 w-3.5" />,
  image: <Image className="h-3.5 w-3.5" />,
  markdown: <FileText className="h-3.5 w-3.5" />,
}

const outputTypeLabels: Record<string, string> = {
  text: 'Text',
  json: 'JSON',
  table: 'Table',
  image: 'Image',
  markdown: 'Markdown',
  html: 'HTML',
  file: 'File',
}

export const OutputNode = memo(function OutputNode({
  data,
  selected,
  isConnectable = true,
}: OutputNodeProps) {
  const config = data.config as {
    outputType?: string
    title?: string
    format?: string
    showTimestamp?: boolean
    maxLength?: number
    template?: string
  }

  const outputType = config.outputType || 'text'
  const title = config.title || 'Output result'

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
          <FileOutput className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{data.label || 'Output'}</h3>
          <p className="text-xs text-foreground-muted flex items-center gap-1">
            <Monitor className="h-3 w-3" />
            Result Preview
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-foreground-muted">Title:</span>
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-md bg-surface-200">
          <span className="flex items-center justify-center w-6 h-6 rounded bg-brand-200/60 text-brand-500">
            {outputTypeIcons[outputType]}
          </span>
          <span className="font-medium">{outputTypeLabels[outputType] || outputType}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {config.showTimestamp && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-200 text-foreground-light">
              <Clock className="h-3 w-3" />
              Time
            </span>
          )}
          {config.maxLength && (
            <span className="inline-flex px-1.5 py-0.5 rounded bg-warning-200 text-warning">
              Maximum: {config.maxLength}
            </span>
          )}
        </div>
      </div>

      {/* Preview Region */}
      <div className="mx-3 mb-2.5 p-2.5 rounded-md border border-dashed border-border bg-surface-200">
        <div className="text-xs text-foreground-muted text-center flex items-center justify-center gap-1.5">
          <Monitor className="h-3.5 w-3.5 opacity-50" />
          Results will be displayed here
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-start px-3 py-2 border-t border-border text-xs text-foreground-muted bg-surface-200">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
          Input
        </span>
      </div>
    </div>
  )
})
