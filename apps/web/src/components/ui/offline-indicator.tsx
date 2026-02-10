/**
 * OfflineStatusIndicatorComponent - Minimalist Style
 */

'use client'

import { useState } from 'react'
import {
  Wifi,
  WifiOff,
  Signal,
  RefreshCw,
  CloudOff,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Clock,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useOfflineStatus } from '@/hooks/useOfflineStatus'
import type { NetworkStatus, OfflineQueueState } from '@/lib/offline'

const statusIcons: Record<NetworkStatus, typeof Wifi> = {
  online: Wifi,
  offline: WifiOff,
  slow: Signal,
}

const statusColors: Record<NetworkStatus, string> = {
  online: 'text-[var(--color-success)]',
  offline: 'text-[var(--color-destructive)]',
  slow: 'text-[var(--color-warning)]',
}

const statusText: Record<NetworkStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  slow: 'Network',
}

interface OfflineIndicatorProps {
  showDetails?: boolean
  expandable?: boolean
  className?: string
  position?: 'top' | 'bottom'
}

export function OfflineIndicator({
  showDetails = true,
  expandable = true,
  className,
  position = 'bottom',
}: OfflineIndicatorProps) {
  const { isOnline, status, queueState, processQueue, retryFailed, clearQueue } = useOfflineStatus()

  const [isExpanded, setIsExpanded] = useState(false)

  const StatusIcon = statusIcons[status]
  const hasPendingOperations = queueState.pendingCount > 0
  const hasFailedOperations = queueState.failedCount > 0

  if (isOnline && !hasPendingOperations && !hasFailedOperations && !showDetails) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed left-4 right-4 z-50 max-w-md mx-auto',
        position === 'top' ? 'top-4' : 'bottom-4',
        className
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div
          className={cn(
            'rounded-lg border shadow-lg',
            status === 'offline'
              ? 'bg-[var(--color-destructive-muted)] border-[var(--color-destructive)]/30'
              : status === 'slow'
                ? 'bg-[var(--color-warning-muted)] border-[var(--color-warning)]/30'
                : 'bg-[var(--color-card)] border-[var(--color-border)]'
          )}
        >
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md',
                  status === 'offline'
                    ? 'bg-[var(--color-destructive)]/10'
                    : status === 'slow'
                      ? 'bg-[var(--color-warning)]/10'
                      : 'bg-[var(--color-success)]/10'
                )}
              >
                <StatusIcon className={cn('h-4 w-4', statusColors[status])} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{statusText[status]}</span>
                  {hasPendingOperations && (
                    <Badge variant="secondary" className="text-xs">
                      {queueState.pendingCount} Pending Sync
                    </Badge>
                  )}
                  {hasFailedOperations && (
                    <Badge variant="destructive" className="text-xs">
                      {queueState.failedCount} Failed
                    </Badge>
                  )}
                </div>
                {status === 'offline' && (
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Changes will be synced when the network is restored
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isOnline && hasPendingOperations && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => processQueue()}
                        disabled={queueState.isSyncing}
                      >
                        <RefreshCw
                          className={cn('h-4 w-4', queueState.isSyncing && 'animate-spin')}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Sync Now</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {expandable && (hasPendingOperations || hasFailedOperations) && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>
          </div>

          <CollapsibleContent>
            <div className="border-t border-[var(--color-border)] p-3 space-y-3">
              <QueueStatus queueState={queueState} />

              <div className="flex items-center gap-2">
                {hasFailedOperations && (
                  <Button variant="outline" size="sm" onClick={retryFailed} className="text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
                {(hasPendingOperations || hasFailedOperations) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearQueue}
                    className="text-xs text-[var(--color-destructive)]"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  )
}

function QueueStatus({ queueState }: { queueState: OfflineQueueState }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="p-2 rounded-md bg-[var(--color-muted)]">
        <Clock className="h-4 w-4 mx-auto mb-1 text-[var(--color-warning)]" />
        <div className="text-lg font-semibold">{queueState.pendingCount}</div>
        <div className="text-xs text-[var(--color-muted-foreground)]">Pending</div>
      </div>
      <div className="p-2 rounded-md bg-[var(--color-muted)]">
        <RefreshCw className={cn('h-4 w-4 mx-auto mb-1', queueState.isSyncing && 'animate-spin')} />
        <div className="text-lg font-semibold">{queueState.processingCount}</div>
        <div className="text-xs text-[var(--color-muted-foreground)]">Processing</div>
      </div>
      <div className="p-2 rounded-md bg-[var(--color-muted)]">
        <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-[var(--color-destructive)]" />
        <div className="text-lg font-semibold">{queueState.failedCount}</div>
        <div className="text-xs text-[var(--color-muted-foreground)]">Failed</div>
      </div>
    </div>
  )
}

export function OfflineBanner({ className }: { className?: string }) {
  const { isOnline } = useOfflineStatus()

  if (isOnline) return null

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium',
        'bg-[var(--color-destructive)] text-white',
        className
      )}
    >
      <CloudOff className="h-4 w-4" />
      <span>You are currently offline</span>
    </div>
  )
}

export function OnlineStatusBadge({ className }: { className?: string }) {
  const { status, queueState } = useOfflineStatus()

  const StatusIcon = statusIcons[status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
              status === 'online' && 'bg-[var(--color-success-muted)] text-[var(--color-success)]',
              status === 'offline' &&
                'bg-[var(--color-destructive-muted)] text-[var(--color-destructive)]',
              status === 'slow' && 'bg-[var(--color-warning-muted)] text-[var(--color-warning)]',
              className
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            <span>{statusText[status]}</span>
            {queueState.pendingCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {queueState.pendingCount}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-medium">{statusText[status]}</p>
            {queueState.pendingCount > 0 && (
              <p className="mt-0.5">{queueState.pendingCount} Pending Sync</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default OfflineIndicator
