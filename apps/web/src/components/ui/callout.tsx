'use client'

/**
 * Callout Component
 *
 * Used for displaying Info, Tip, Warning, etc.
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Flame,
  Bug,
  Zap,
  X,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

// Callout Variant
const calloutVariants = cva(['relative rounded-lg border p-4', 'transition-all duration-200'], {
  variants: {
    variant: {
      default: ['bg-muted/50 border-border', 'text-foreground'],
      info: ['bg-blue-500/10 border-blue-500/30', 'text-blue-700 dark:text-blue-300'],
      success: ['bg-primary/10 border-primary/30', 'text-primary dark:text-primary/90'],
      warning: ['bg-amber-500/10 border-amber-500/30', 'text-amber-700 dark:text-amber-300'],
      error: ['bg-red-500/10 border-red-500/30', 'text-red-700 dark:text-red-300'],
      tip: ['bg-violet-500/10 border-violet-500/30', 'text-violet-700 dark:text-violet-300'],
      note: ['bg-muted border-border', 'text-muted-foreground'],
      important: ['bg-primary/10 border-primary/30', 'text-primary'],
      caution: ['bg-orange-500/10 border-orange-500/30', 'text-orange-700 dark:text-orange-300'],
      bug: ['bg-pink-500/10 border-pink-500/30', 'text-pink-700 dark:text-pink-300'],
    },
    size: {
      sm: 'p-3 text-sm',
      default: 'p-4',
      lg: 'p-5',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

// IconConfig
const variantIcons: Record<string, LucideIcon> = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  tip: Lightbulb,
  note: Info,
  important: Zap,
  caution: Flame,
  bug: Bug,
}

export interface CalloutProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof calloutVariants> {
  /** Title */
  title?: string
  /** Custom icon */
  icon?: React.ReactNode
  /** Whether to display icon */
  showIcon?: boolean
  /** Whether the callout can be closed */
  closable?: boolean
  /** Close callback */
  onClose?: () => void
}

function Callout({
  className,
  variant = 'default',
  size,
  title,
  icon,
  showIcon = true,
  closable = false,
  onClose,
  children,
  ...props
}: CalloutProps) {
  const [visible, setVisible] = React.useState(true)
  const Icon = variantIcons[variant || 'default']

  if (!visible) return null

  const handleClose = () => {
    setVisible(false)
    onClose?.()
  }

  return (
    <div className={cn(calloutVariants({ variant, size }), className)} role="alert" {...props}>
      <div className="flex gap-3">
        {/* Icon */}
        {showIcon && <div className="shrink-0 mt-0.5">{icon || <Icon className="w-5 h-5" />}</div>}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && <h5 className="font-semibold mb-1">{title}</h5>}
          <div className="text-sm opacity-90 [&_a]:underline [&_a]:font-medium">{children}</div>
        </div>

        {/* CloseButton */}
        {closable && (
          <button
            onClick={handleClose}
            className="shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * CalloutTitle
 */
function CalloutTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 className={cn('font-semibold mb-1', className)} {...props}>
      {children}
    </h5>
  )
}

/**
 * CalloutDescription
 */
function CalloutDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm opacity-90', className)} {...props}>
      {children}
    </p>
  )
}

/**
 * InlineCallout - Inline Tip
 */
interface InlineCalloutProps {
  variant?: CalloutProps['variant']
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

function InlineCallout({ variant = 'info', icon, children, className }: InlineCalloutProps) {
  const Icon = variantIcons[variant || 'info']

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-sm',
        variant === 'info' && 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        variant === 'success' && 'bg-primary/10 text-primary',
        variant === 'warning' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        variant === 'error' && 'bg-red-500/10 text-red-600 dark:text-red-400',
        variant === 'tip' && 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        className
      )}
    >
      {icon || <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  )
}

/**
 * BannerCallout - Banner Callout
 */
interface BannerCalloutProps extends Omit<CalloutProps, 'size'> {
  /** Action button */
  action?: React.ReactNode
}

function BannerCallout({
  variant = 'info',
  title,
  icon,
  showIcon = true,
  closable = false,
  onClose,
  action,
  children,
  className,
  ...props
}: BannerCalloutProps) {
  const [visible, setVisible] = React.useState(true)
  const Icon = variantIcons[variant || 'info']

  if (!visible) return null

  const handleClose = () => {
    setVisible(false)
    onClose?.()
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3 rounded-lg',
        variant === 'default' && 'bg-muted/50 border border-border',
        variant === 'info' && 'bg-blue-500/10 border border-blue-500/30',
        variant === 'success' && 'bg-primary/10 border border-primary/30',
        variant === 'warning' && 'bg-amber-500/10 border border-amber-500/30',
        variant === 'error' && 'bg-red-500/10 border border-red-500/30',
        variant === 'tip' && 'bg-violet-500/10 border border-violet-500/30',
        variant === 'important' && 'bg-primary/10 border border-primary/30',
        className
      )}
      role="alert"
      {...props}
    >
      {/* Icon */}
      {showIcon && <div className="shrink-0">{icon || <Icon className="w-5 h-5" />}</div>}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && <span className="font-medium">{title}</span>}
        {title && children && <span className="mx-1">—</span>}
        <span className="text-sm opacity-90">{children}</span>
      </div>

      {/* Action */}
      {action && <div className="shrink-0">{action}</div>}

      {/* CloseButton */}
      {closable && (
        <button
          onClick={handleClose}
          className="shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

/**
 * FeatureCallout - Feature Callout
 */
interface FeatureCalloutProps {
  title: string
  description: string
  icon?: React.ReactNode
  badge?: string
  action?: React.ReactNode
  className?: string
}

function FeatureCallout({
  title,
  description,
  icon,
  badge,
  action,
  className,
}: FeatureCalloutProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl',
        'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent',
        'border border-primary/20',
        'p-6',
        className
      )}
    >
      {/* BackgroundDecoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        {icon && (
          <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground">{title}</h4>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>

          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  )
}

export {
  Callout,
  CalloutTitle,
  CalloutDescription,
  InlineCallout,
  BannerCallout,
  FeatureCallout,
  calloutVariants,
}
export type { CalloutProps, InlineCalloutProps, BannerCalloutProps, FeatureCalloutProps }
