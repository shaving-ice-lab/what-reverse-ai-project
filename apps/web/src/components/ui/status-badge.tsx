'use client'

/**
 * StatusBadge Component
 * Used for displaying status indicators
 */

import { ReactNode } from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Pause,
  Play,
  Info,
  Zap,
  Shield,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// BasicStatusBadge
// ============================================

type StatusType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'draft'
  | 'pending'
  | 'processing'
  | 'published'
  | 'failed'
  | 'paused'
  | 'active'
  | 'inactive'

interface StatusBadgeProps {
  status: StatusType
  label?: string
  showIcon?: boolean
  showDot?: boolean
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  className?: string
}

const statusConfig: Record<
  StatusType,
  {
    label: string
    icon: LucideIcon
    color: string
    bg: string
    dot: string
  }
> = {
  success: {
    label: 'Success',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-500',
  },
  error: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    dot: 'bg-red-500',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-500',
  },
  info: {
    label: 'Info',
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    dot: 'bg-blue-500',
  },
  draft: {
    label: 'Draft',
    icon: FileText,
    color: 'text-muted-foreground',
    bg: 'bg-muted/50',
    dot: 'bg-muted-foreground',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-muted-foreground',
    bg: 'bg-muted/50',
    dot: 'bg-muted-foreground',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    dot: 'bg-blue-500',
  },
  published: {
    label: 'Published',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-500',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    dot: 'bg-red-500',
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    dot: 'bg-orange-500',
  },
  active: {
    label: 'Active',
    icon: Play,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-500',
  },
  inactive: {
    label: 'Active',
    icon: Minus,
    color: 'text-muted-foreground',
    bg: 'bg-muted/50',
    dot: 'bg-muted-foreground',
  },
}

const sizeConfig = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    icon: 'w-3 h-3',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    padding: 'px-2.5 py-1',
    text: 'text-sm',
    icon: 'w-4 h-4',
    dot: 'w-2 h-2',
  },
  lg: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
    icon: 'w-5 h-5',
    dot: 'w-2.5 h-2.5',
  },
}

export function StatusBadge({
  status,
  label,
  showIcon = true,
  showDot = false,
  size = 'md',
  pulse = false,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const sizeConf = sizeConfig[size]
  const Icon = config.icon
  const displayLabel = label || config.label

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeConf.padding,
        sizeConf.text,
        config.bg,
        config.color,
        className
      )}
    >
      {showDot && (
        <span className="relative flex">
          <span className={cn('rounded-full', sizeConf.dot, config.dot)} />
          {pulse && (
            <span
              className={cn('absolute inset-0 rounded-full animate-ping opacity-75', config.dot)}
            />
          )}
        </span>
      )}
      {showIcon && !showDot && (
        <Icon className={cn(sizeConf.icon, status === 'processing' && 'animate-spin')} />
      )}
      {displayLabel}
    </span>
  )
}

// ============================================
// OnlineStatusIndicator
// ============================================

interface OnlineIndicatorProps {
  isOnline: boolean
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function OnlineIndicator({
  isOnline,
  showLabel = false,
  size = 'md',
  className,
}: OnlineIndicatorProps) {
  const dotSize = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex">
        <span
          className={cn('rounded-full', dotSize[size], isOnline ? 'bg-emerald-500' : 'bg-gray-400')}
        />
        {isOnline && (
          <span
            className={cn('absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75')}
          />
        )}
      </span>
      {showLabel && (
        <span className={cn('text-sm', isOnline ? 'text-emerald-600' : 'text-muted-foreground')}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </span>
  )
}

// ============================================
// TrendBadge
// ============================================

interface TrendBadgeProps {
  value: number
  suffix?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TrendBadge({
  value,
  suffix = '%',
  showIcon = true,
  size = 'md',
  className,
}: TrendBadgeProps) {
  const isPositive = value > 0
  const isNeutral = value === 0
  const sizeConf = sizeConfig[size]

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown
  const colorClass = isNeutral
    ? 'text-muted-foreground bg-muted/50'
    : isPositive
      ? 'text-emerald-600 bg-emerald-500/10'
      : 'text-red-600 bg-red-500/10'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeConf.padding,
        sizeConf.text,
        colorClass,
        className
      )}
    >
      {showIcon && <Icon className={sizeConf.icon} />}
      {isPositive && '+'}
      {value}
      {suffix}
    </span>
  )
}

// ============================================
// PriorityBadge
// ============================================

type Priority = 'critical' | 'high' | 'medium' | 'low'

interface PriorityBadgeProps {
  priority: Priority
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  critical: {
    label: 'Urgent',
    color: 'text-red-600',
    bg: 'bg-red-500',
  },
  high: {
    label: '',
    color: 'text-orange-600',
    bg: 'bg-orange-500',
  },
  medium: {
    label: '',
    color: 'text-amber-600',
    bg: 'bg-amber-500',
  },
  low: {
    label: '',
    color: 'text-blue-600',
    bg: 'bg-blue-500',
  },
}

export function PriorityBadge({
  priority,
  showLabel = true,
  size = 'md',
  className,
}: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  const sizeConf = sizeConfig[size]

  return (
    <span className={cn('inline-flex items-center gap-1.5', sizeConf.text, className)}>
      <span
        className={cn(
          'rounded-sm',
          size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : 'w-3 h-3',
          config.bg
        )}
      />
      {showLabel && <span className={config.color}>{config.label}</span>}
    </span>
  )
}

// ============================================
// etcBadge
// ============================================

interface LevelBadgeProps {
  level: number
  maxLevel?: number
  showLabel?: boolean
  className?: string
}

export function LevelBadge({ level, maxLevel = 5, showLabel = true, className }: LevelBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {Array.from({ length: maxLevel }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-4 h-4',
            i < level ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/50'
          )}
        />
      ))}
      {showLabel && (
        <span className="text-sm text-muted-foreground ml-1">
          {level}/{maxLevel}
        </span>
      )}
    </span>
  )
}

// ============================================
// Security Badge
// ============================================

type SecurityLevel = 'high' | 'medium' | 'low' | 'none'

interface SecurityBadgeProps {
  level: SecurityLevel
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const securityConfig: Record<
  SecurityLevel,
  { label: string; color: string; bg: string; fillLevel: number }
> = {
  high: {
    label: 'Security',
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    fillLevel: 3,
  },
  medium: {
    label: 'Security',
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    fillLevel: 2,
  },
  low: {
    label: 'Security',
    color: 'text-orange-600',
    bg: 'bg-orange-500/10',
    fillLevel: 1,
  },
  none: {
    label: 'Not Protected',
    color: 'text-red-600',
    bg: 'bg-red-500/10',
    fillLevel: 0,
  },
}

export function SecurityBadge({
  level,
  showLabel = true,
  size = 'md',
  className,
}: SecurityBadgeProps) {
  const config = securityConfig[level]
  const sizeConf = sizeConfig[size]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeConf.padding,
        sizeConf.text,
        config.bg,
        config.color,
        className
      )}
    >
      <Shield className={sizeConf.icon} />
      {showLabel && config.label}
    </span>
  )
}

// ============================================
// Energy Badge
// ============================================

interface EnergyBadgeProps {
  percentage: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EnergyBadge({
  percentage,
  showLabel = true,
  size = 'md',
  className,
}: EnergyBadgeProps) {
  const sizeConf = sizeConfig[size]
  const color =
    percentage > 60
      ? 'text-emerald-600 bg-emerald-500/10'
      : percentage > 30
        ? 'text-amber-600 bg-amber-500/10'
        : 'text-red-600 bg-red-500/10'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeConf.padding,
        sizeConf.text,
        color,
        className
      )}
    >
      <Zap className={sizeConf.icon} />
      {showLabel && `${percentage}%`}
    </span>
  )
}
