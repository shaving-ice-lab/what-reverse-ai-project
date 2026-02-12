'use client'

/**
 * Avatar Component - Enhanced
 *
 * Supports:
 * - Multiple sizes
 * - Status indicator
 * - Avatar group
 * - Border and shape variants
 */

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Size Variants
const avatarVariants = cva('relative flex shrink-0 overflow-hidden', {
  variants: {
    size: {
      xs: 'h-6 w-6 text-[10px]',
      sm: 'h-8 w-8 text-xs',
      default: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
      '2xl': 'h-20 w-20 text-xl',
    },
    shape: {
      circle: 'rounded-full',
      square: 'rounded-lg',
      rounded: 'rounded-xl',
    },
    border: {
      none: '',
      default: 'ring-2 ring-background',
      primary: 'ring-2 ring-brand-500',
      white: 'ring-2 ring-white',
    },
  },
  defaultVariants: {
    size: 'default',
    shape: 'circle',
    border: 'none',
  },
})

export interface AvatarProps
  extends
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  ({ className, size, shape, border, ...props }, ref) => (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(avatarVariants({ size, shape, border }), className)}
      {...props}
    />
  )
)
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

// Gradient Backgrounds
const fallbackGradients = [
  'bg-gradient-to-br from-violet-500 to-purple-600',
  'bg-gradient-to-br from-blue-500 to-cyan-500',
  'bg-gradient-to-br from-brand-500 to-emerald-600',
  'bg-gradient-to-br from-orange-500 to-red-500',
  'bg-gradient-to-br from-pink-500 to-rose-500',
  'bg-gradient-to-br from-amber-500 to-yellow-500',
]

interface AvatarFallbackProps extends React.ComponentPropsWithoutRef<
  typeof AvatarPrimitive.Fallback
> {
  /** Use gradient background */
  gradient?: boolean
  /** Gradient index (auto-generated based on content) */
  gradientIndex?: number
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, gradient, gradientIndex, children, ...props }, ref) => {
  // Generate gradient index based on content
  const index =
    gradientIndex ??
    (typeof children === 'string' ? children.charCodeAt(0) % fallbackGradients.length : 0)

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center font-medium',
        gradient
          ? cn(fallbackGradients[index], 'text-white')
          : 'bg-surface-200 text-foreground-muted',
        className
      )}
      {...props}
    >
      {children}
    </AvatarPrimitive.Fallback>
  )
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

/**
 * AvatarWithStatus - Avatar with status indicator
 */
type StatusType = 'online' | 'offline' | 'busy' | 'away' | 'dnd'

const statusColors: Record<StatusType, string> = {
  online: 'bg-brand-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
  dnd: 'bg-red-500',
}

interface AvatarWithStatusProps extends AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  status?: StatusType
  /** Status indicator position */
  statusPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  /** Whether to use gradient background */
  gradient?: boolean
}

function AvatarWithStatus({
  src,
  alt,
  fallback,
  status,
  statusPosition = 'bottom-right',
  gradient = false,
  size = 'default',
  shape,
  border,
  className,
  ...props
}: AvatarWithStatusProps) {
  const statusPositionClasses = {
    'top-right': 'top-0 right-0',
    'bottom-right': 'bottom-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-left': 'bottom-0 left-0',
  }

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    default: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4',
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar size={size} shape={shape} border={border} {...props}>
        {src && <AvatarImage src={src} alt={alt} />}
        <AvatarFallback gradient={gradient}>{fallback}</AvatarFallback>
      </Avatar>

      {status && (
        <span
          className={cn(
            'absolute rounded-full ring-2 ring-background',
            statusColors[status],
            statusPositionClasses[statusPosition],
            statusSizeClasses[size || 'default'],
            status === 'online' && 'animate-pulse'
          )}
        />
      )}
    </div>
  )
}

/**
 * AvatarGroup - Avatar Group
 */
interface AvatarGroupProps {
  /** Avatar data */
  avatars: Array<{
    src?: string
    alt?: string
    fallback?: string
  }>
  /** Maximum display count */
  max?: number
  /** Size */
  size?: AvatarProps['size']
  /** Shape */
  shape?: AvatarProps['shape']
  /** Overlap (negative margin value) */
  overlap?: number
  /** Whether to use gradient background */
  gradient?: boolean
  className?: string
}

function AvatarGroup({
  avatars,
  max = 5,
  size = 'default',
  shape = 'circle',
  overlap = -8,
  gradient = true,
  className,
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={cn('flex items-center', className)}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className="relative"
          style={{ marginLeft: index > 0 ? overlap : 0, zIndex: visibleAvatars.length - index }}
        >
          <Avatar size={size} shape={shape} border="white">
            {avatar.src && <AvatarImage src={avatar.src} alt={avatar.alt} />}
            <AvatarFallback gradient={gradient} gradientIndex={index}>
              {avatar.fallback}
            </AvatarFallback>
          </Avatar>
        </div>
      ))}

      {remainingCount > 0 && (
        <div className="relative" style={{ marginLeft: overlap, zIndex: 0 }}>
          <Avatar size={size} shape={shape} border="white">
            <AvatarFallback className="bg-surface-200 text-foreground-muted">
              +{remainingCount}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  )
}

/**
 * AvatarWithBadge - Avatar with badge
 */
interface AvatarWithBadgeProps extends AvatarWithStatusProps {
  /** Badge content (count or icon) */
  badge?: React.ReactNode
  /** Badge position */
  badgePosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  /** Badge color */
  badgeColor?: string
}

function AvatarWithBadge({
  badge,
  badgePosition = 'top-right',
  badgeColor = 'hsl(var(--primary))',
  status,
  ...props
}: AvatarWithBadgeProps) {
  const badgePositionClasses = {
    'top-right': '-top-1 -right-1',
    'bottom-right': '-bottom-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-left': '-bottom-1 -left-1',
  }

  return (
    <div className="relative inline-block">
      <AvatarWithStatus status={status} {...props} />

      {badge && (
        <span
          className={cn(
            'absolute flex items-center justify-center',
            'min-w-[18px] h-[18px] px-1',
            'text-[10px] font-medium text-white rounded-full',
            'ring-2 ring-background',
            badgePositionClasses[badgePosition]
          )}
          style={{ backgroundColor: badgeColor }}
        >
          {badge}
        </span>
      )}
    </div>
  )
}

/**
 * EditableAvatar - Editable Avatar
 */
interface EditableAvatarProps extends AvatarWithStatusProps {
  /** Edit click callback */
  onEdit?: () => void
  /** Edit icon */
  editIcon?: React.ReactNode
}

function EditableAvatar({ onEdit, editIcon, className, ...props }: EditableAvatarProps) {
  return (
    <div className={cn('relative inline-block group', className)}>
      <AvatarWithStatus {...props} />

      {/* Edit Overlay */}
      <button
        onClick={onEdit}
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          'bg-black/50 opacity-0 group-hover:opacity-100',
          'transition-opacity duration-200 cursor-pointer',
          'rounded-full'
        )}
      >
        {editIcon || (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )}
      </button>
    </div>
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarWithStatus,
  AvatarGroup,
  AvatarWithBadge,
  EditableAvatar,
  avatarVariants,
}
export type {
  AvatarFallbackProps,
  AvatarWithStatusProps,
  AvatarGroupProps,
  AvatarWithBadgeProps,
  EditableAvatarProps,
  StatusType,
}
