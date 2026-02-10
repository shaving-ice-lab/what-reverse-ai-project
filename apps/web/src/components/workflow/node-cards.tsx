'use client'

/**
 * Workflow Node Card Component
 * Used for showcasing and selecting workflow node types
 */

import { ReactNode } from 'react'
import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BUILTIN_WORKFLOW_NODES,
  WORKFLOW_NODE_CATEGORIES,
  type WorkflowNodeCatalogEntry,
} from '@/lib/nodes/catalog'

// ============================================
// Node Type Definition
// ============================================

export type NodeType = WorkflowNodeCatalogEntry

// Define Node Types
export const nodeTypes: NodeType[] = BUILTIN_WORKFLOW_NODES

// Node Categories
export const nodeCategories = WORKFLOW_NODE_CATEGORIES

// ============================================
// Node Select Card
// ============================================

interface NodeSelectCardProps {
  node: NodeType
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function NodeSelectCard({ node, selected, onClick, className }: NodeSelectCardProps) {
  const Icon = node.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
        'hover:shadow-md',
        selected
          ? cn('border-primary bg-primary/5', node.borderColor)
          : 'border-border bg-card hover:border-primary/30',
        className
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          node.bgColor
        )}
      >
        {node.iconGlyph ? (
          <span className="text-lg">{node.iconGlyph}</span>
        ) : (
          <Icon className={cn('w-5 h-5', node.color)} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground">{node.name}</h4>
        <p className="text-sm text-foreground-light mt-0.5 line-clamp-2">{node.description}</p>
        {node.compatibility && !node.compatibility.compatible && (
          <p className="text-xs text-red-500 mt-2">Version Not Compatible</p>
        )}
      </div>
    </button>
  )
}

// ============================================
// Mini Node Card
// ============================================

interface MiniNodeCardProps {
  node: NodeType
  status?: 'idle' | 'running' | 'success' | 'error'
  onClick?: () => void
  className?: string
}

export function MiniNodeCard({ node, status = 'idle', onClick, className }: MiniNodeCardProps) {
  const Icon = node.icon

  const getStatusIndicator = () => {
    switch (status) {
      case 'running':
        return <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      case 'success':
        return <CheckCircle className="w-3 h-3 text-emerald-500" />
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer',
        'hover:shadow-sm hover:border-primary/30',
        status === 'error' && 'border-red-500/30 bg-red-500/5',
        status === 'success' && 'border-emerald-500/30 bg-emerald-500/5',
        className
      )}
    >
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', node.bgColor)}>
        {node.iconGlyph ? (
          <span className="text-base">{node.iconGlyph}</span>
        ) : (
          <Icon className={cn('w-4 h-4', node.color)} />
        )}
      </div>
      <span className="flex-1 text-sm font-medium text-foreground truncate">{node.name}</span>
      {getStatusIndicator()}
    </div>
  )
}

// ============================================
// Node Connector
// ============================================

interface NodeConnectorProps {
  direction?: 'horizontal' | 'vertical'
  animated?: boolean
  className?: string
}

export function NodeConnector({
  direction = 'horizontal',
  animated = false,
  className,
}: NodeConnectorProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        direction === 'horizontal' ? 'w-12 h-8' : 'w-8 h-12',
        className
      )}
    >
      {direction === 'horizontal' ? (
        <div className="flex items-center">
          <div
            className={cn(
              'w-8 h-0.5 bg-border',
              animated && 'bg-gradient-to-r from-border via-primary to-border animate-pulse'
            )}
          />
          <ArrowRight className="w-4 h-4 text-foreground-light -ml-1" />
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'w-0.5 h-8 bg-border',
              animated && 'bg-gradient-to-b from-border via-primary to-border animate-pulse'
            )}
          />
        </div>
      )}
    </div>
  )
}

// ============================================
// Node Execution Status Card
// ============================================

interface NodeExecutionCardProps {
  node: NodeType
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped'
  duration?: number
  error?: string
  className?: string
}

export function NodeExecutionCard({
  node,
  status,
  duration,
  error,
  className,
}: NodeExecutionCardProps) {
  const Icon = node.icon

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return { color: 'text-foreground-light', bg: 'bg-surface-200', label: 'Pending' }
      case 'running':
        return { color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Execute' }
      case 'success':
        return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Success' }
      case 'error':
        return { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Failed' }
      case 'skipped':
        return { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Skip' }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <div
      className={cn(
        'p-4 rounded-xl border',
        status === 'error' ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-card',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', node.bgColor)}>
          {node.iconGlyph ? (
            <span className="text-lg">{node.iconGlyph}</span>
          ) : (
            <Icon className={cn('w-5 h-5', node.color)} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-foreground">{node.name}</h4>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                statusConfig.bg,
                statusConfig.color
              )}
            >
              {statusConfig.label}
            </span>
          </div>

          {duration !== undefined && status !== 'pending' && status !== 'running' && (
            <p className="text-xs text-foreground-light mt-1">Duration: {duration}ms</p>
          )}

          {error && <p className="text-xs text-red-500 mt-2 p-2 rounded bg-red-500/10">{error}</p>}
        </div>
      </div>
    </div>
  )
}
