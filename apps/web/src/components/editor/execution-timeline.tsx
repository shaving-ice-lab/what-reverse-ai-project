'use client'

/**
 * Time-travel Debug - Execution Timeline Component
 *
 * Features:
 * - Display each step of workflow execution
 * - Display node status icons and execution time
 * - Support step click interaction, backtrack to execution point
 * - Highlight currently selected step
 */

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Square,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Clock,
  ChevronRight,
  RotateCcw,
  Brain,
  Globe,
  FileText,
  GitBranch,
  Repeat,
  Variable,
  Code,
  Timer,
  Webhook,
  Zap,
  ArrowRight,
  Filter,
  Merge,
  SplitSquareHorizontal,
  Flag,
  Box,
} from 'lucide-react'
import type {
  TimelineView,
  TimelineStep,
  NodeStatus,
  ExecutionSnapshot,
  NodeSnapshot,
} from '@/types/time-travel'
import type { ExecutionStatus } from '@/types/execution'

// ===== Type Definitions =====

interface ExecutionTimelineProps {
  /** Execution Snapshot (if available) */
  snapshot?: ExecutionSnapshot | null
  /** Timeline View Data (if available) */
  timelineView?: TimelineView | null
  /** Currently selected step index */
  selectedStepIndex?: number
  /** Step Click Callback */
  onStepClick?: (step: TimelineStep, index: number) => void
  /** Rerun Node Callback */
  onRerunNode?: (nodeId: string) => void
  /** Whether loading */
  isLoading?: boolean
  /** Whether collapsed */
  collapsed?: boolean
  /** Collapse Toggle Callback */
  onToggleCollapse?: () => void
  /** Custom Class Name */
  className?: string
}

// ===== Node Icon Mapping =====

const nodeIconMap: Record<string, React.ElementType> = {
  start: Play,
  end: Flag,
  llm: Brain,
  http: Globe,
  template: FileText,
  condition: GitBranch,
  loop: Repeat,
  variable: Variable,
  code: Code,
  delay: Timer,
  webhook: Webhook,
  expression: Zap,
  filter: Filter,
  merge: Merge,
  parallel: SplitSquareHorizontal,
  transform: ArrowRight,
  default: Box,
}

// ===== Status Color Config =====

const statusConfig: Record<
  NodeStatus,
  {
    color: string
    bgColor: string
    borderColor: string
    textColor: string
    icon: React.ElementType
  }
> = {
  pending: {
    color: 'text-foreground-muted',
    bgColor: 'bg-surface-200',
    borderColor: 'border-border',
    textColor: 'text-foreground-muted',
    icon: Clock,
  },
  running: {
    color: 'text-brand-500',
    bgColor: 'bg-brand-200/40',
    borderColor: 'border-brand-500/30',
    textColor: 'text-brand-500',
    icon: Loader2,
  },
  completed: {
    color: 'text-brand-500',
    bgColor: 'bg-brand-200/60',
    borderColor: 'border-brand-500/30',
    textColor: 'text-brand-500',
    icon: CheckCircle2,
  },
  failed: {
    color: 'text-destructive',
    bgColor: 'bg-destructive-200',
    borderColor: 'border-destructive/30',
    textColor: 'text-destructive',
    icon: XCircle,
  },
  skipped: {
    color: 'text-warning',
    bgColor: 'bg-warning-200',
    borderColor: 'border-warning/30',
    textColor: 'text-warning',
    icon: AlertCircle,
  },
  paused: {
    color: 'text-brand-500',
    bgColor: 'bg-brand-200/40',
    borderColor: 'border-brand-500/30',
    textColor: 'text-brand-500',
    icon: Square,
  },
}

// ===== Helper Functions =====

/**
 * Format execution duration
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`
  }
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(1)
  return `${minutes}m ${seconds}s`
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return timestamp
  }
}

/**
 * Get node icon
 */
function getNodeIcon(nodeType: string): React.ElementType {
  return nodeIconMap[nodeType] || nodeIconMap.default
}

// ===== Timeline Step Component =====

interface TimelineStepItemProps {
  step: TimelineStep
  index: number
  isSelected: boolean
  isLast: boolean
  onClick: () => void
  onRerun?: () => void
}

function TimelineStepItem({
  step,
  index,
  isSelected,
  isLast,
  onClick,
  onRerun,
}: TimelineStepItemProps) {
  const config = statusConfig[step.status]
  const StatusIcon = config.icon
  const NodeIcon = getNodeIcon(step.nodeType)
  const isRunning = step.status === 'running'

  return (
    <div
      className={cn(
        'relative flex gap-3 cursor-pointer group transition-all duration-200',
        'hover:bg-surface-200/60 rounded-lg p-2 -mx-2',
        isSelected && 'bg-surface-100 ring-1 ring-brand-500/30'
      )}
      onClick={onClick}
    >
      {/* Connecting line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-[19px] top-10 w-0.5 h-[calc(100%-24px)]',
            step.status === 'completed' ? 'bg-brand-200/60' : 'bg-border'
          )}
        />
      )}

      {/* Status Icon */}
      <div
        className={cn(
          'relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          'ring-2 ring-background transition-all duration-200',
          config.bgColor,
          config.borderColor,
          'border',
          isSelected && 'ring-brand-500/50 scale-110'
        )}
      >
        <StatusIcon className={cn('w-4 h-4', config.color, isRunning && 'animate-spin')} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {/* Title row */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <NodeIcon className="w-3.5 h-3.5 text-foreground-muted" />
            <span
              className={cn(
                'text-sm font-medium truncate',
                isSelected ? 'text-foreground' : 'text-foreground/90'
              )}
            >
              {step.nodeName}
            </span>
          </div>

          {/* Step Index */}
          <Badge
            variant="outline"
            className={cn('text-[10px] px-1.5 py-0 h-4', config.bgColor, config.textColor)}
          >
            #{index + 1}
          </Badge>
        </div>

        {/* Time and Description */}
        <div className="flex items-center gap-2 mt-1 text-xs">
          <span className="text-foreground-muted tabular-nums">
            {formatTimestamp(step.startedAt)}
          </span>

          {step.durationMs > 0 && (
            <>
              <span className="text-foreground-muted/50">•</span>
              <span
                className={cn(
                  'tabular-nums',
                  step.durationMs > 5000 ? 'text-warning' : 'text-foreground-muted'
                )}
              >
                {formatDuration(step.durationMs)}
              </span>
            </>
          )}

          {step.description && (
            <>
              <span className="text-foreground-muted/50">•</span>
              <span className="text-foreground-muted truncate">{step.description}</span>
            </>
          )}
        </div>

        {/* Error Tip */}
        {step.hasError && (
          <div className="mt-1.5 text-xs text-destructive bg-destructive-200 rounded px-2 py-1">
            Execution failed. Click to view details.
          </div>
        )}
      </div>

      {/* Action Button */}
      <div
        className={cn(
          'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isSelected && 'opacity-100'
        )}
      >
        {onRerun && step.status !== 'running' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onRerun()
            }}
            className="h-6 w-6 p-0 text-foreground-muted hover:text-brand-500 hover:bg-brand-200/60"
            title="Rerun this node"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        )}
        <ChevronRight
          className={cn(
            'w-4 h-4 text-foreground-muted transition-transform',
            isSelected && 'text-brand-500 rotate-90'
          )}
        />
      </div>
    </div>
  )
}

// ===== Main Component =====

export function ExecutionTimeline({
  snapshot,
  timelineView,
  selectedStepIndex,
  onStepClick,
  onRerunNode,
  isLoading = false,
  collapsed = false,
  onToggleCollapse,
  className,
}: ExecutionTimelineProps) {
  const [localSelectedIndex, setLocalSelectedIndex] = useState<number | undefined>(
    selectedStepIndex
  )

  // Get steps from Snapshot or TimelineView
  const steps = useMemo(() => {
    if (timelineView?.steps) {
      return timelineView.steps
    }

    if (snapshot) {
      // Create steps from Snapshot
      return snapshot.executionOrder
        .map((nodeId, index) => {
          const nodeSnapshot = snapshot.nodeSnapshots[nodeId]
          if (!nodeSnapshot) return null

          return {
            index,
            nodeId,
            nodeName: nodeSnapshot.nodeName,
            nodeType: nodeSnapshot.nodeType,
            nodeIcon: undefined,
            status: nodeSnapshot.status,
            startedAt: nodeSnapshot.startedAt,
            completedAt: nodeSnapshot.completedAt,
            durationMs: nodeSnapshot.durationMs,
            description: getStepDescription(nodeSnapshot),
            isSelected: index === localSelectedIndex,
            hasError: !!nodeSnapshot.error,
          } as TimelineStep
        })
        .filter(Boolean) as TimelineStep[]
    }

    return []
  }, [snapshot, timelineView, localSelectedIndex])

  // Get step description
  function getStepDescription(nodeSnapshot: NodeSnapshot): string | undefined {
    const { nodeType, metadata, status, error } = nodeSnapshot

    if (status === 'failed' && error) {
      return error.message
    }

    switch (nodeType) {
      case 'llm':
        return metadata?.model
          ? `${metadata.model} • ${metadata.tokensUsed || 0} tokens`
          : undefined
      case 'http':
        return metadata?.httpStatusCode
          ? `${metadata.httpMethod || 'GET'} ${metadata.httpStatusCode}`
          : undefined
      case 'condition':
        return metadata?.conditionBranch ? `Branch: ${metadata.conditionBranch}` : undefined
      default:
        return undefined
    }
  }

  // Handle step click
  const handleStepClick = useCallback(
    (step: TimelineStep, index: number) => {
      setLocalSelectedIndex(index)
      onStepClick?.(step, index)
    },
    [onStepClick]
  )

  // Handle rerun
  const handleRerun = useCallback(
    (nodeId: string) => {
      onRerunNode?.(nodeId)
    },
    [onRerunNode]
  )

  // Execution status
  const executionStatus = timelineView?.status || snapshot?.status || 'pending'
  const totalDuration = timelineView?.durationMs || snapshot?.durationMs

  // If collapsed, show streamlined view
  if (collapsed) {
    return (
      <div
        className={cn(
          'bg-surface-100/90 border-l border-border w-12 flex flex-col items-center py-4',
          className
        )}
        onClick={onToggleCollapse}
      >
        <Button
          size="sm"
          variant="ghost"
          className="w-8 h-8 p-0 text-foreground-muted hover:text-foreground"
        >
          <Clock className="w-4 h-4" />
        </Button>
        <div className="mt-2 text-xs text-foreground-muted writing-mode-vertical">Timeline</div>
      </div>
    )
  }

  return (
    <div className={cn('bg-surface-100 flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-75/80">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-foreground-muted" />
          <h3 className="text-sm font-medium text-foreground">Execution Timeline</h3>
          {steps.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {steps.length} Steps
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Total Duration */}
          {totalDuration && (
            <span className="text-xs text-foreground-muted tabular-nums">
              Total: {formatDuration(totalDuration)}
            </span>
          )}

          {/* Execution Status */}
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              statusConfig[executionStatus as NodeStatus]?.bgColor,
              statusConfig[executionStatus as NodeStatus]?.textColor
            )}
          >
            {executionStatus === 'completed' && 'Done'}
            {executionStatus === 'running' && 'Running'}
            {executionStatus === 'failed' && 'Failed'}
            {executionStatus === 'pending' && 'Pending'}
            {executionStatus === 'cancelled' && 'Cancelled'}
          </Badge>

          {/* Collapse Button */}
          {onToggleCollapse && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleCollapse}
              className="h-6 w-6 p-0 text-foreground-muted hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Timeline List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {isLoading ? (
            // Loading state
            <div className="flex flex-col items-center justify-center py-12 text-foreground-muted">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : steps.length > 0 ? (
            // Step list
            steps.map((step, index) => (
              <TimelineStepItem
                key={step.nodeId}
                step={step}
                index={index}
                isSelected={index === localSelectedIndex}
                isLast={index === steps.length - 1}
                onClick={() => handleStepClick(step, index)}
                onRerun={onRerunNode ? () => handleRerun(step.nodeId) : undefined}
              />
            ))
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-foreground-muted/50" />
              </div>
              <p className="text-sm font-medium text-foreground-muted">No Execution Records</p>
              <p className="text-xs text-foreground-muted/70 mt-1">
                Run a workflow to see execution steps here
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Summary */}
      {steps.length > 0 && snapshot?.summary && (
        <div className="px-4 py-3 border-t border-border bg-surface-75/80">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="text-foreground-muted">
                Done: <span className="text-brand-500">{snapshot.summary.completedNodes}</span>
              </span>
              <span className="text-foreground-muted">
                Failed: <span className="text-destructive">{snapshot.summary.failedNodes}</span>
              </span>
              <span className="text-foreground-muted">
                Skipped: <span className="text-warning">{snapshot.summary.skippedNodes}</span>
              </span>
            </div>
            {snapshot.summary.totalTokensUsed && snapshot.summary.totalTokensUsed > 0 && (
              <span className="text-foreground-muted">
                Tokens:{' '}
                <span className="text-foreground">
                  {snapshot.summary.totalTokensUsed.toLocaleString()}
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExecutionTimeline
