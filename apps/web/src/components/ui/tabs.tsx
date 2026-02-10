'use client'

/**
 * Tabs Component - Enhanced
 *
 * Support:
 * - Multiple style variants
 * - Slide indicator animation
 * - Icon and badge
 * - Vertical layout
 */

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

// TabsList Variant - Supabase Style
const tabsListVariants = cva('inline-flex items-center', {
  variants: {
    variant: {
      default: 'h-9 rounded-md p-1 bg-surface-200 text-foreground-light',
      pills: 'gap-1 bg-transparent',
      underline: 'border-b border-border bg-transparent gap-0',
      segment: 'h-9 rounded-md p-1 bg-surface-200 border border-border',
      card: 'gap-2 bg-transparent',
    },
    size: {
      sm: 'h-8 text-[12px]',
      default: 'h-9 text-[13px]',
      lg: 'h-11 text-[14px]',
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    fullWidth: false,
  },
})

interface TabsListProps
  extends
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {
  /** Whether to display slide indicator */
  showIndicator?: boolean
}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, variant, size, fullWidth, showIndicator, children, ...props }, ref) => {
    const listRef = React.useRef<HTMLDivElement>(null)
    const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({})

    // Update indicator position
    React.useEffect(() => {
      if (!showIndicator || !listRef.current) return

      const updateIndicator = () => {
        const activeTab = listRef.current?.querySelector('[data-state="active"]') as HTMLElement
        if (activeTab) {
          setIndicatorStyle({
            left: activeTab.offsetLeft,
            width: activeTab.offsetWidth,
          })
        }
      }

      updateIndicator()

      // Listen to DOM changes
      const observer = new MutationObserver(updateIndicator)
      observer.observe(listRef.current, {
        attributes: true,
        subtree: true,
        attributeFilter: ['data-state'],
      })

      return () => observer.disconnect()
    }, [showIndicator, children])

    return (
      <TabsPrimitive.List
        ref={(node) => {
          ;(listRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        className={cn(tabsListVariants({ variant, size, fullWidth }), 'relative', className)}
        {...props}
      >
        {children}

        {/* Slide indicator */}
        {showIndicator && variant === 'underline' && (
          <div
            className="absolute bottom-0 h-0.5 bg-brand-500 transition-all duration-300 ease-out"
            style={indicatorStyle}
          />
        )}
        {showIndicator && (variant === 'default' || variant === 'segment') && (
          <div
            className="absolute inset-y-1 rounded-md bg-surface-100 shadow-sm transition-all duration-300 ease-out -z-10"
            style={indicatorStyle}
          />
        )}
      </TabsPrimitive.List>
    )
  }
)
TabsList.displayName = TabsPrimitive.List.displayName

// TabsTrigger Variant - Supabase Style
const tabsTriggerVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium text-[13px]',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500/30',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: [
          'rounded-md px-3 py-1.5',
          'data-[state=active]:bg-surface-100 data-[state=active]:text-foreground data-[state=active]:shadow-sm',
          'data-[state=inactive]:text-foreground-light data-[state=inactive]:hover:text-foreground',
        ],
        pills: [
          'rounded-full px-4 py-2',
          'data-[state=active]:bg-brand-500 data-[state=active]:text-[#171717]',
          'data-[state=inactive]:text-foreground-light data-[state=inactive]:hover:bg-surface-200',
        ],
        underline: [
          'px-4 py-2 border-b-2 border-transparent -mb-px rounded-none',
          'data-[state=active]:border-brand-500 data-[state=active]:text-foreground',
          'data-[state=inactive]:text-foreground-light data-[state=inactive]:hover:text-foreground',
        ],
        segment: [
          'rounded-md px-3 py-1.5 flex-1',
          'data-[state=active]:bg-surface-100 data-[state=active]:text-foreground data-[state=active]:shadow-sm',
          'data-[state=inactive]:text-foreground-light data-[state=inactive]:hover:text-foreground',
        ],
        card: [
          'rounded-lg px-4 py-3 border border-border bg-surface-100',
          'data-[state=active]:border-brand-500 data-[state=active]:bg-brand-200 data-[state=active]:text-brand-500',
          'data-[state=inactive]:text-foreground-light data-[state=inactive]:hover:border-border-strong data-[state=inactive]:hover:bg-surface-200',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface TabsTriggerProps
  extends
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {
  /** Left side icon */
  icon?: React.ReactNode
  /** Right side badge */
  badge?: React.ReactNode
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, icon, badge, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    <span>{children}</span>
    {badge && <span className="shrink-0">{badge}</span>}
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

// TabsContent Variant
interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  /** Whether to enable animation */
  animated?: boolean
  /** Animation direction */
  animationDirection?: 'horizontal' | 'vertical' | 'fade'
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, animated = false, animationDirection = 'fade', ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-3 focus-visible:outline-none',
      animated && [
        'data-[state=active]:animate-in data-[state=inactive]:animate-out',
        animationDirection === 'fade' &&
          'data-[state=active]:fade-in-0 data-[state=inactive]:fade-out-0',
        animationDirection === 'horizontal' &&
          'data-[state=active]:slide-in-from-right-4 data-[state=inactive]:slide-out-to-left-4',
        animationDirection === 'vertical' &&
          'data-[state=active]:slide-in-from-bottom-4 data-[state=inactive]:slide-out-to-top-4',
        'duration-200',
      ],
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

/**
 * AnimatedTabs - Tabs with Smooth Transition Animation
 */
interface AnimatedTabsProps {
  tabs: Array<{
    value: string
    label: string
    icon?: React.ReactNode
    badge?: React.ReactNode
    content: React.ReactNode
    disabled?: boolean
  }>
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  variant?: 'default' | 'pills' | 'underline' | 'segment' | 'card'
  className?: string
  listClassName?: string
  contentClassName?: string
}

function AnimatedTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  variant = 'default',
  className,
  listClassName,
  contentClassName,
}: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue || tabs[0]?.value)

  const handleValueChange = (newValue: string) => {
    setActiveTab(newValue)
    onValueChange?.(newValue)
  }

  return (
    <Tabs value={value || activeTab} onValueChange={handleValueChange} className={className}>
      <TabsList
        variant={variant}
        showIndicator={variant === 'underline' || variant === 'default' || variant === 'segment'}
        className={listClassName}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            variant={variant}
            icon={tab.icon}
            badge={tab.badge}
            disabled={tab.disabled}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} animated className={contentClassName}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

/**
 * VerticalTabs - Vertical layout tabs
 */
interface VerticalTabsProps {
  tabs: Array<{
    value: string
    label: string
    icon?: React.ReactNode
    description?: string
    content: React.ReactNode
    disabled?: boolean
  }>
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

function VerticalTabs({ tabs, defaultValue, value, onValueChange, className }: VerticalTabsProps) {
  return (
    <Tabs
      value={value}
      defaultValue={defaultValue || tabs[0]?.value}
      onValueChange={onValueChange}
      orientation="vertical"
      className={cn('flex gap-6', className)}
    >
      <TabsPrimitive.List className="flex flex-col gap-1 w-48 shrink-0">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              'flex items-start gap-3 w-full px-3 py-2.5 rounded-lg text-left',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30',
              'disabled:pointer-events-none disabled:opacity-50',
              'data-[state=active]:bg-brand-200/50 data-[state=active]:text-foreground',
              'data-[state=inactive]:text-foreground-light data-[state=inactive]:hover:bg-surface-200 data-[state=inactive]:hover:text-foreground'
            )}
          >
            {tab.icon && <span className="shrink-0 mt-0.5">{tab.icon}</span>}
            <div className="min-w-0">
              <div className="font-medium text-[13px]">{tab.label}</div>
              {tab.description && (
                <div className="text-[11px] text-foreground-light mt-0.5 line-clamp-2">
                  {tab.description}
                </div>
              )}
            </div>
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      <div className="flex-1 min-w-0">
        {tabs.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            animated
            animationDirection="horizontal"
            className="mt-0"
          >
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
}

/**
 * IconTabs - Icon-Based Tabs
 */
interface IconTabsProps {
  tabs: Array<{
    value: string
    icon: React.ReactNode
    label?: string
    content: React.ReactNode
    disabled?: boolean
  }>
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  showLabels?: boolean
  className?: string
}

function IconTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  showLabels = false,
  className,
}: IconTabsProps) {
  return (
    <Tabs
      value={value}
      defaultValue={defaultValue || tabs[0]?.value}
      onValueChange={onValueChange}
      className={className}
    >
      <TabsPrimitive.List className="inline-flex items-center gap-1 p-1 rounded-lg bg-surface-200">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-md',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30',
              'disabled:pointer-events-none disabled:opacity-50',
              'data-[state=active]:bg-surface-100 data-[state=active]:text-foreground data-[state=active]:shadow-sm',
              'data-[state=inactive]:text-foreground-light data-[state=inactive]:hover:text-foreground'
            )}
          >
            <span className="text-lg">{tab.icon}</span>
            {showLabels && tab.label && <span className="text-xs">{tab.label}</span>}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} animated>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  AnimatedTabs,
  VerticalTabs,
  IconTabs,
  tabsListVariants,
  tabsTriggerVariants,
}
export type {
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
  AnimatedTabsProps,
  VerticalTabsProps,
  IconTabsProps,
}
