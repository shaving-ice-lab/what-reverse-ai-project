'use client'

/**
 * Timeline Component
 * Used for showcasing history records, flow steps, etc.
 */

import { ReactNode } from 'react'
import { CheckCircle2, Circle, Clock, AlertCircle, Loader2, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// Timelineitem
// ============================================

type TimelineStatus = 'completed' | 'current' | 'pending' | 'error'

interface TimelineItemProps {
  status?: TimelineStatus
  icon?: LucideIcon
  title: string
  description?: string
  time?: string
  isLast?: boolean
  children?: ReactNode
  className?: string
}

export function TimelineItem({
  status = 'pending',
  icon,
  title,
  description,
  time,
  isLast = false,
  children,
  className,
}: TimelineItemProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500',
          ringColor: 'ring-emerald-500/20',
        }
      case 'current':
        return {
          icon: Loader2,
          color: 'text-primary',
          bg: 'bg-primary',
          ringColor: 'ring-brand-500/20',
          animate: true,
        }
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bg: 'bg-red-500',
          ringColor: 'ring-red-500/20',
        }
      default:
        return {
          icon: Circle,
          color: 'text-foreground-light',
          bg: 'bg-surface-200',
          ringColor: 'ring-muted',
        }
    }
  }

  const config = getStatusConfig()
  const Icon = icon || config.icon

  return (
    <div className={cn('relative flex gap-4', className)}>
      {/* Connectline */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-[15px] top-8 bottom-0 w-0.5',
            status === 'completed' ? 'bg-emerald-500' : 'bg-border'
          )}
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4',
          config.bg,
          config.ringColor
        )}
      >
        <Icon className={cn('h-4 w-4 text-white', config.animate && 'animate-spin')} />
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-8', isLast && 'pb-0')}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4
              className={cn(
                'font-medium',
                status === 'pending' ? 'text-foreground-light' : 'text-foreground'
              )}
            >
              {title}
            </h4>
            {description && <p className="text-sm text-foreground-light mt-0.5">{description}</p>}
          </div>
          {time && <span className="text-xs text-foreground-light whitespace-nowrap">{time}</span>}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  )
}

// ============================================
// Timeline
// ============================================

interface TimelineProps {
  children: ReactNode
  className?: string
}

export function Timeline({ children, className }: TimelineProps) {
  return <div className={cn('space-y-0', className)}>{children}</div>
}

// ============================================
// CleanTimeline
// ============================================

interface SimpleTimelineItem {
  id: string
  title: string
  description?: string
  time: string
  icon?: LucideIcon
  iconColor?: string
  iconBg?: string
}

interface SimpleTimelineProps {
  items: SimpleTimelineItem[]
  className?: string
}

export function SimpleTimeline({ items, className }: SimpleTimelineProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item, index) => {
        const Icon = item.icon || Clock
        const isLast = index === items.length - 1

        return (
          <div key={item.id} className="relative flex gap-4">
            {/* Connectline */}
            {!isLast && <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />}

            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                item.iconBg || 'bg-surface-200'
              )}
            >
              <Icon className={cn('h-4 w-4', item.iconColor || 'text-foreground-light')} />
            </div>

            {/* Content */}
            <div className={cn('flex-1 min-w-0', !isLast && 'pb-4')}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                  {item.description && (
                    <p className="text-sm text-foreground-light mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-foreground-light whitespace-nowrap">{item.time}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// HorizontalTimeline(StepIndicator)
// ============================================

interface StepItem {
  id: string
  title: string
  description?: string
}

interface HorizontalTimelineProps {
  steps: StepItem[]
  currentStep: number
  className?: string
}

export function HorizontalTimeline({ steps, currentStep, className }: HorizontalTimelineProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* StepDot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all',
                    isCompleted && 'bg-emerald-500 text-white',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-brand-500/20',
                    !isCompleted && !isCurrent && 'bg-surface-200 text-foreground-light'
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-foreground' : 'text-foreground-light'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-foreground-light mt-0.5 max-w-[120px]">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connectline */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 mt-[-20px]',
                    isCompleted ? 'bg-emerald-500' : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// ActivityTimeline
// ============================================

interface ActivityTimelineItem {
  id: string
  user?: {
    name: string
    avatar?: string
  }
  action: string
  target?: string
  time: string
  icon?: LucideIcon
  iconColor?: string
  iconBg?: string
}

interface ActivityTimelineProps {
  activities: ActivityTimelineItem[]
  className?: string
}

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {activities.map((activity, index) => {
        const Icon = activity.icon || Clock
        const isLast = index === activities.length - 1

        return (
          <div key={activity.id} className="relative flex gap-3">
            {/* Connectline */}
            {!isLast && <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-border" />}

            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                activity.iconBg || 'bg-surface-200'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', activity.iconColor || 'text-foreground-light')} />
            </div>

            {/* Content */}
            <div className={cn('flex-1 min-w-0', !isLast && 'pb-4')}>
              <p className="text-sm text-foreground">
                {activity.user && <span className="font-medium">{activity.user.name}</span>}
                {''}
                <span className="text-foreground-light">{activity.action}</span>
                {activity.target && <span className="font-medium"> {activity.target}</span>}
              </p>
              <span className="text-xs text-foreground-light">{activity.time}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
