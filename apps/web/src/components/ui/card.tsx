"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Card 卡片组件 - Supabase 风格：深色主题、surface 层级
 */
const cardVariants = cva(
  "rounded-lg text-foreground transition-colors duration-150 ease-in-out",
  {
    variants: {
      variant: {
        // 默认卡片 - Supabase surface-100
        default: [
          "bg-surface-100 border border-border",
        ].join(" "),
        // 提升卡片 - 带阴影
        elevated: [
          "bg-surface-100 border border-border",
          "shadow-md shadow-black/25",
        ].join(" "),
        // 轮廓卡片 - 透明背景
        outline: [
          "bg-transparent border border-border",
        ].join(" "),
        // 幽灵卡片 - 无边框
        ghost: [
          "bg-transparent border-0",
        ].join(" "),
        // 静音卡片 - Supabase surface-75
        muted: [
          "bg-surface-75 border border-border-muted",
        ].join(" "),
        // 玻璃卡片 - 毛玻璃效果
        glass: [
          "bg-surface-100/70 backdrop-blur-xl border border-border/50",
        ].join(" "),
        // 玻璃卡片 - 更透明
        "glass-subtle": [
          "bg-surface-100/40 backdrop-blur-lg border border-border/30",
        ].join(" "),
        // 渐变边框卡片 - 品牌绿色
        gradient: [
          "bg-surface-100 border-0 relative",
          "before:absolute before:inset-0 before:rounded-lg before:p-[1px]",
          "before:bg-gradient-to-br before:from-brand-500 before:via-brand-500/50 before:to-transparent",
          "before:-z-10",
        ].join(" "),
        // 强调卡片 - 左边框品牌绿
        accent: [
          "bg-surface-100 border-l-4 border-l-brand-500 border border-border rounded-l-none",
        ].join(" "),
        // 面板卡片 - Supabase 风格面板
        panel: [
          "bg-surface-75 border border-border",
        ].join(" "),
        // 统计卡片 - Supabase 仪表盘统计卡
        stats: [
          "bg-surface-100 border border-border",
        ].join(" "),
        // 品牌高亮卡片 - 绿色背景
        brand: [
          "bg-brand-200 border border-brand-400/30",
        ].join(" "),
        // 警告卡片
        warning: [
          "bg-warning-200 border border-warning/30",
        ].join(" "),
        // 错误卡片
        destructive: [
          "bg-destructive-200 border border-destructive/30",
        ].join(" "),
      },
      hover: {
        none: "",
        border: "hover:border-border-strong",
        shadow: "hover:shadow-lg hover:shadow-black/30",
        lift: "hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5",
        muted: "hover:bg-surface-200",
        // 交互卡片: Supabase 绿色边框
        glow: "hover:border-brand-500 hover:shadow-brand-500/10",
        "glow-border": "hover:border-brand-500/50 hover:shadow-sm",
        // 缩放
        scale: "hover:scale-[1.02]",
        // 组合效果
        interactive: "hover:border-border-strong hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5",
      },
      padding: {
        none: "",
        xs: "p-3",
        sm: "p-4",
        // 默认 padding: 24px
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: "none",
      padding: "none",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** 是否可交互 */
  interactive?: boolean
  /** 入场动画 */
  animation?: "none" | "fade" | "slide-up" | "scale"
  /** 动画延迟 (ms) */
  animationDelay?: number
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    hover, 
    padding, 
    interactive = false,
    animation = "none",
    animationDelay,
    style,
    ...props 
  }, ref) => {
    const animationClass = {
      none: "",
      fade: "animate-fade-in",
      "slide-up": "animate-slide-up",
      scale: "animate-scale-in",
    }

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, hover, padding }),
          interactive && "cursor-pointer",
          animation !== "none" && animationClass[animation],
          className
        )}
        style={{
          ...style,
          animationDelay: animationDelay ? `${animationDelay}ms` : undefined,
        }}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 是否显示底部边框 */
  bordered?: boolean
  /** 右侧操作区 */
  action?: React.ReactNode
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, bordered, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1 px-5 py-4",
        bordered && "border-b border-border",
        action && "flex-row items-start justify-between gap-4",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0 space-y-1">
        {children}
      </div>
      {action && (
        <div className="shrink-0">{action}</div>
      )}
    </div>
  )
)
CardHeader.displayName = "CardHeader"

interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 标题大小 */
  size?: "default" | "sm" | "lg"
}

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, size = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "font-medium leading-tight tracking-tight text-foreground",
        size === "sm" && "text-[13px]",
        size === "default" && "text-[13px]",
        size === "lg" && "text-base",
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-[12px] text-foreground-light", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 内边距大小 */
  padding?: "default" | "sm" | "lg" | "none"
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        padding === "default" && "p-5",
        padding === "sm" && "p-4",
        padding === "lg" && "p-6",
        padding === "none" && "p-0",
        className
      )}
      {...props}
    />
  )
)
CardContent.displayName = "CardContent"

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 是否显示顶部边框 */
  bordered?: boolean
  /** 对齐方式 */
  align?: "start" | "center" | "end" | "between"
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, bordered, align = "start", ...props }, ref) => {
    const alignClass = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 px-6 py-4",
          bordered && "border-t border-border bg-surface-75",
          alignClass[align],
          className
        )}
        {...props}
      />
    )
  }
)
CardFooter.displayName = "CardFooter"

/**
 * SpotlightCard - 带有鼠标跟随光效的卡片
 */
interface SpotlightCardProps extends CardProps {
  /** 光效颜色 */
  spotlightColor?: string
  /** 光效大小 */
  spotlightSize?: number
}

const SpotlightCard = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
  ({ 
    className, 
    spotlightColor = "rgba(62, 207, 142, 0.15)",
    spotlightSize = 300,
    children,
    ...props 
  }, ref) => {
    const cardRef = React.useRef<HTMLDivElement>(null)
    const [position, setPosition] = React.useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = React.useState(false)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    return (
      <Card
        ref={(node) => {
          (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        className={cn("relative overflow-hidden", className)}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* 光效层 */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(${spotlightSize}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent)`,
          }}
        />
        {children}
      </Card>
    )
  }
)
SpotlightCard.displayName = "SpotlightCard"

/**
 * GlowCard - 发光边框卡片
 */
interface GlowCardProps extends CardProps {
  /** 发光颜色 */
  glowColor?: string
  /** 是否一直发光 */
  alwaysGlow?: boolean
}

const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
  ({ 
    className, 
    glowColor = "#3ECF8E",
    alwaysGlow = false,
    children,
    ...props 
  }, ref) => {
    return (
      <div className="relative group">
        {/* 发光背景 */}
        <div
          className={cn(
            "absolute -inset-0.5 rounded-lg blur-sm transition-opacity duration-300",
            alwaysGlow ? "opacity-30" : "opacity-0 group-hover:opacity-30"
          )}
          style={{ backgroundColor: glowColor }}
        />
        <Card
          ref={ref}
          className={cn("relative", className)}
          {...props}
        >
          {children}
        </Card>
      </div>
    )
  }
)
GlowCard.displayName = "GlowCard"

/**
 * FlipCard - 翻转卡片
 */
interface FlipCardProps {
  front: React.ReactNode
  back: React.ReactNode
  className?: string
  flipOnHover?: boolean
  flipped?: boolean
  onFlip?: (flipped: boolean) => void
}

function FlipCard({ 
  front, 
  back, 
  className,
  flipOnHover = true,
  flipped: controlledFlipped,
  onFlip,
}: FlipCardProps) {
  const [internalFlipped, setInternalFlipped] = React.useState(false)
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped

  const handleClick = () => {
    if (!flipOnHover) {
      const newFlipped = !isFlipped
      setInternalFlipped(newFlipped)
      onFlip?.(newFlipped)
    }
  }

  return (
    <div 
      className={cn(
        "relative perspective-1000",
        flipOnHover && "group",
        className
      )}
      onClick={handleClick}
      style={{ perspective: "1000px" }}
    >
      <div 
        className={cn(
          "relative w-full h-full transition-transform duration-500 preserve-3d",
          flipOnHover && "group-hover:rotate-y-180",
          !flipOnHover && isFlipped && "rotate-y-180"
        )}
        style={{ 
          transformStyle: "preserve-3d",
          transform: !flipOnHover && isFlipped ? "rotateY(180deg)" : flipOnHover ? undefined : "rotateY(0deg)",
        }}
      >
        {/* 正面 */}
        <div 
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          {front}
        </div>
        {/* 背面 */}
        <div 
          className="absolute inset-0 backface-hidden rotate-y-180"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {back}
        </div>
      </div>
    </div>
  )
}

/**
 * ExpandableCard - 可展开卡片
 */
interface ExpandableCardProps extends CardProps {
  /** 折叠时的内容 */
  collapsedContent: React.ReactNode
  /** 展开时的额外内容 */
  expandedContent: React.ReactNode
  /** 是否展开 */
  expanded?: boolean
  /** 默认展开 */
  defaultExpanded?: boolean
  /** 展开状态改变回调 */
  onExpandedChange?: (expanded: boolean) => void
}

function ExpandableCard({ 
  collapsedContent,
  expandedContent,
  expanded: controlledExpanded,
  defaultExpanded = false,
  onExpandedChange,
  className,
  ...props
}: ExpandableCardProps) {
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded)
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded

  const toggle = () => {
    const newExpanded = !isExpanded
    setInternalExpanded(newExpanded)
    onExpandedChange?.(newExpanded)
  }

  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <div onClick={toggle} className="cursor-pointer">
        {collapsedContent}
      </div>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          {expandedContent}
        </div>
      </div>
    </Card>
  )
}

/**
 * CardStack - 卡片堆叠效果
 */
interface CardStackProps {
  children: React.ReactNode[]
  className?: string
  offset?: number
}

function CardStack({ children, className, offset = 8 }: CardStackProps) {
  return (
    <div className={cn("relative", className)}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-all duration-300"
          style={{
            transform: `translateY(${index * offset}px) scale(${1 - index * 0.03})`,
            zIndex: children.length - index,
            opacity: 1 - index * 0.15,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  SpotlightCard,
  GlowCard,
  FlipCard,
  ExpandableCard,
  CardStack,
  cardVariants,
}
export type { 
  CardProps, 
  CardHeaderProps, 
  CardTitleProps, 
  CardContentProps, 
  CardFooterProps,
  SpotlightCardProps,
  GlowCardProps,
  FlipCardProps,
  ExpandableCardProps,
  CardStackProps,
}
