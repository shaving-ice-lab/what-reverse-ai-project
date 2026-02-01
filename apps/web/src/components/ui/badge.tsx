/**
 * Badge 徽章组件 - 增强版
 * 
 * 支持多种样式、尺寸、动画和交互效果
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  cn(
    "inline-flex items-center gap-1 font-medium",
    "border transition-all duration-150"
  ),
  {
    variants: {
      variant: {
        // Supabase default/primary: 品牌绿色
        default: [
          "bg-surface-200",
          "border-border",
          "text-foreground-light",
        ].join(" "),
        primary: [
          "bg-brand-200",
          "border-brand-400/30",
          "text-brand-500",
        ].join(" "),
        // Supabase secondary: 灰色
        secondary: [
          "bg-surface-200",
          "border-border",
          "text-foreground-light",
        ].join(" "),
        // Supabase success: 绿色
        success: [
          "bg-brand-200",
          "border-brand-400/30",
          "text-brand-500",
        ].join(" "),
        // Supabase warning: 橙色
        warning: [
          "bg-warning-200",
          "border-warning/30",
          "text-warning",
        ].join(" "),
        // Supabase error/destructive: 红色
        error: [
          "bg-destructive-200",
          "border-destructive/30",
          "text-destructive",
        ].join(" "),
        destructive: [
          "bg-destructive-200",
          "border-destructive/30",
          "text-destructive",
        ].join(" "),
        // info: 蓝色
        info: [
          "bg-blue-500/15",
          "border-blue-500/30",
          "text-blue-400",
        ].join(" "),
        // violet: 紫色
        violet: [
          "bg-violet-500/15",
          "border-violet-500/30",
          "text-violet-400",
        ].join(" "),
        // pink: 粉色
        pink: [
          "bg-pink-500/15",
          "border-pink-500/30",
          "text-pink-400",
        ].join(" "),
        // Supabase outline: 边框样式
        outline: [
          "bg-transparent",
          "border-border",
          "text-foreground-light",
        ].join(" "),
        // solid 变体 - Supabase 风格
        "solid-primary": [
          "bg-brand-500",
          "border-brand-500",
          "text-[#171717]",
        ].join(" "),
        "solid-secondary": [
          "bg-surface-300",
          "border-surface-300",
          "text-foreground",
        ].join(" "),
        "solid-destructive": [
          "bg-destructive",
          "border-destructive",
          "text-white",
        ].join(" "),
        // gradient 变体
        gradient: [
          "bg-gradient-to-r from-brand-500 to-brand-400",
          "border-transparent",
          "text-[#171717]",
        ].join(" "),
        "gradient-violet": [
          "bg-gradient-to-r from-violet-500 to-purple-500",
          "border-transparent",
          "text-white",
        ].join(" "),
        "gradient-blue": [
          "bg-gradient-to-r from-blue-500 to-cyan-500",
          "border-transparent",
          "text-white",
        ].join(" "),
      },
      size: {
        xs: "px-1.5 py-0.5 text-[10px] rounded",
        sm: "px-2 py-0.5 text-[11px] rounded-md",
        default: "px-2.5 py-1 text-[11px] rounded-md",
        lg: "px-3 py-1.5 text-[12px] rounded-md",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        ping: "relative",
        glow: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** 左侧图标 */
  icon?: React.ReactNode
  /** 点击关闭回调 */
  onClose?: () => void
  /** 是否可交互 */
  interactive?: boolean
  /** 数字（显示为徽章数字） */
  count?: number
  /** 最大数字，超过显示 {max}+ */
  maxCount?: number
  /** 是否显示为点 */
  dot?: boolean
  /** 点的颜色 */
  dotColor?: string
}

function Badge({ 
  className, 
  variant, 
  size,
  animation,
  icon,
  onClose,
  interactive,
  count,
  maxCount = 99,
  dot,
  dotColor,
  children, 
  ...props 
}: BadgeProps) {
  // 处理数字显示
  const displayCount = count !== undefined 
    ? count > maxCount 
      ? `${maxCount}+` 
      : count.toString()
    : null

  // Ping 动画效果
  const pingEffect = animation === "ping" && (
    <span className="absolute inset-0 rounded-full animate-ping opacity-75 bg-current" />
  )

  // Glow 动画效果
  const glowClass = animation === "glow" && "shadow-[0_0_10px_currentColor]"

  return (
    <div 
      className={cn(
        badgeVariants({ variant, size, animation: animation === "ping" ? "none" : animation }),
        interactive && "cursor-pointer hover:opacity-80",
        glowClass,
        className
      )} 
      {...props}
    >
      {pingEffect}
      
      {/* 点模式 */}
      {dot && (
        <span 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: dotColor || "currentColor" }}
        />
      )}
      
      {/* 图标 */}
      {icon && !dot && (
        <span className="shrink-0 -ml-0.5">{icon}</span>
      )}
      
      {/* 内容或数字 */}
      {displayCount !== null ? (
        <span className="tabular-nums">{displayCount}</span>
      ) : (
        children
      )}
      
      {/* 关闭按钮 */}
      {onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="shrink-0 -mr-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

/**
 * BadgeGroup - 徽章组
 */
interface BadgeGroupProps {
  children: React.ReactNode
  className?: string
  /** 最大显示数量 */
  max?: number
  /** 是否可折叠 */
  collapsible?: boolean
}

function BadgeGroup({ 
  children, 
  className, 
  max,
  collapsible = false,
}: BadgeGroupProps) {
  const childArray = React.Children.toArray(children)
  const visibleChildren = max ? childArray.slice(0, max) : childArray
  const hiddenCount = max ? childArray.length - max : 0

  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {visibleChildren}
      {hiddenCount > 0 && (
        <Badge variant="secondary" size="sm">
          +{hiddenCount}
        </Badge>
      )}
    </div>
  )
}

/**
 * StatusBadge - 状态徽章
 */
interface StatusBadgeProps {
  status: "online" | "offline" | "busy" | "away" | "dnd"
  label?: string
  showDot?: boolean
  className?: string
}

const statusConfig = {
  online: { color: "hsl(var(--brand-500))", label: "在线", bgColor: "bg-brand-500/15" },
  offline: { color: "#6B7280", label: "离线", bgColor: "bg-surface-200/50" },
  busy: { color: "#EF4444", label: "忙碌", bgColor: "bg-red-500/15" },
  away: { color: "#F59E0B", label: "离开", bgColor: "bg-amber-500/15" },
  dnd: { color: "#EF4444", label: "请勿打扰", bgColor: "bg-red-500/15" },
}

function StatusBadge({ 
  status, 
  label, 
  showDot = true,
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        config.bgColor,
        className
      )}
      style={{ color: config.color }}
    >
      {showDot && (
        <span 
          className={cn(
            "w-2 h-2 rounded-full",
            status === "online" && "animate-pulse"
          )}
          style={{ backgroundColor: config.color }}
        />
      )}
      {label || config.label}
    </div>
  )
}

/**
 * NotificationBadge - 通知徽章（用于包裹元素）
 */
interface NotificationBadgeProps {
  children: React.ReactNode
  count?: number
  maxCount?: number
  showZero?: boolean
  dot?: boolean
  offset?: [number, number]
  className?: string
  badgeClassName?: string
}

function NotificationBadge({
  children,
  count = 0,
  maxCount = 99,
  showZero = false,
  dot = false,
  offset = [0, 0],
  className,
  badgeClassName,
}: NotificationBadgeProps) {
  const showBadge = dot || count > 0 || (showZero && count === 0)
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString()

  return (
    <div className={cn("relative inline-flex", className)}>
      {children}
      {showBadge && (
        <span
          className={cn(
            "absolute flex items-center justify-center",
            "min-w-[18px] h-[18px] px-1",
            "text-[10px] font-medium text-white",
            "bg-red-500 rounded-full",
            "ring-2 ring-background",
            "transform -translate-y-1/2 translate-x-1/2",
            dot && "min-w-[10px] h-[10px] px-0",
            badgeClassName
          )}
          style={{
            top: offset[1],
            right: offset[0],
          }}
        >
          {!dot && displayCount}
        </span>
      )}
    </div>
  )
}

export { Badge, BadgeGroup, StatusBadge, NotificationBadge, badgeVariants }
