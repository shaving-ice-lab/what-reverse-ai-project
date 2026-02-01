"use client"

/**
 * NotificationCenter 通知中心组件
 * 
 * 支持：
 * - 通知列表
 * - 分类筛选
 * - 已读/未读状态
 * - 实时更新
 */

import * as React from "react"
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  X,
  Info,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  UserPlus,
  Heart,
  Star,
  Package,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

// 通知类型
type NotificationType = "info" | "success" | "warning" | "error" | "message" | "social" | "system"

// 通知项
interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  description?: string
  time: Date | string
  read: boolean
  avatar?: string
  icon?: LucideIcon
  action?: {
    label: string
    onClick: () => void
  }
  link?: string
}

// 类型配置
const typeConfig: Record<NotificationType, { icon: LucideIcon; color: string }> = {
  info: { icon: Info", color: "text-blue-500" },
  success: { icon: CheckCircle2, color: "text-primary" },
  warning: { icon: AlertTriangle, color: "text-amber-500" },
  error: { icon: AlertCircle, color: "text-red-500" },
  message: { icon: MessageSquare, color: "text-violet-500" },
  social: { icon: Heart, color: "text-pink-500" },
  system: { icon: Settings, color: "text-muted-foreground" },
}

interface NotificationCenterProps {
  /** 通知列表 */
  notifications: NotificationItem[]
  /** 标记已读 */
  onMarkRead?: (id: string) => void
  /** 标记全部已读 */
  onMarkAllRead?: () => void
  /** 删除通知 */
  onDelete?: (id: string) => void
  /** 清空全部 */
  onClearAll?: () => void
  /** 通知点击 */
  onNotificationClick?: (notification: NotificationItem) => void
  /** 最大显示数量 */
  maxItems?: number
  /** 空状态文本 */
  emptyText?: string
  className?: string
}

function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClearAll,
  onNotificationClick,
  maxItems = 50,
  emptyText = "暂无通知",
  className,
}: NotificationCenterProps) {
  const [filter, setFilter] = React.useState<"all" | "unread">("all")

  const unreadCount = notifications.filter((n) => !n.read).length
  const filteredNotifications = notifications
    .filter((n) => filter === "all" || !n.read)
    .slice(0, maxItems)

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">通知</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && onMarkAllRead && (
            <button
              onClick={onMarkAllRead}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="全部标为已读"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          {notifications.length > 0 && onClearAll && (
            <button
              onClick={onClearAll}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="清空全部"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          全部
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            filter === "unread"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          未读 {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* 通知列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <BellOff className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                onMarkRead={onMarkRead}
                onDelete={onDelete}
                onClick={onNotificationClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * NotificationListItem - 通知列表项
 */
interface NotificationListItemProps {
  notification: NotificationItem
  onMarkRead?: (id: string) => void
  onDelete?: (id: string) => void
  onClick?: (notification: NotificationItem) => void
}

function NotificationListItem({
  notification,
  onMarkRead,
  onDelete,
  onClick,
}: NotificationListItemProps) {
  const config = typeConfig[notification.type]
  const Icon = notification.icon || config.icon

  const handleClick = () => {
    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id)
    }
    onClick?.(notification)
  }

  return (
    <div
      className={cn(
        "relative px-4 py-3 cursor-pointer transition-colors",
        "hover:bg-muted/50",
        !notification.read && "bg-primary/5"
      )}
      onClick={handleClick}
    >
      {/* 未读指示器 */}
      {!notification.read && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
      )}

      <div className="flex gap-3">
        {/* 头像/图标 */}
        <div className="shrink-0">
          {notification.avatar ? (
            <img
              src={notification.avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              "bg-muted"
            )}>
              <Icon className={cn("w-5 h-5", config.color)} />
            </div>
          )}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm",
            !notification.read ? "font-medium text-foreground" : "text-muted-foreground"
          )}>
            {notification.title}
          </p>
          {notification.description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {notification.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatTime(notification.time)}
          </p>

          {/* 操作按钮 */}
          {notification.action && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                notification.action?.onClick()
              }}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {notification.action.label}
            </button>
          )}
        </div>

        {/* 删除按钮 */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(notification.id)
            }}
            className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * NotificationBell - 通知铃铛按钮
 */
interface NotificationBellProps {
  count?: number
  maxCount?: number
  onClick?: () => void
  className?: string
}

function NotificationBell({
  count = 0,
  maxCount = 99,
  onClick,
  className,
}: NotificationBellProps) {
  const displayCount = count > maxCount ? `${maxCount}+` : count

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-lg",
        "text-muted-foreground hover:text-foreground hover:bg-muted",
        "transition-colors",
        className
      )}
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className={cn(
          "absolute -top-0.5 -right-0.5",
          "min-w-[18px] h-[18px] px-1",
          "rounded-full bg-destructive text-destructive-foreground",
          "text-[10px] font-medium",
          "flex items-center justify-center"
        )}>
          {displayCount}
        </span>
      )}
    </button>
  )
}

/**
 * NotificationPopover - 通知弹出层
 */
interface NotificationPopoverProps extends NotificationCenterProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function NotificationPopover({
  trigger,
  open: controlledOpen,
  onOpenChange,
  notifications,
  ...props
}: NotificationPopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)}>
        {trigger || <NotificationBell count={unreadCount} />}
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-96 max-h-[480px] bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
            <NotificationCenter
              notifications={notifications}
              {...props}
            />
          </div>
        </>
      )}
    </div>
  )
}

/**
 * NotificationToast - 通知 Toast（用于实时推送）
 */
interface NotificationToastProps {
  notification: NotificationItem
  onClose?: () => void
  onClick?: () => void
  duration?: number
}

function NotificationToast({
  notification,
  onClose,
  onClick,
  duration = 5000,
}: NotificationToastProps) {
  const config = typeConfig[notification.type]
  const Icon = notification.icon || config.icon

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl",
        "bg-popover border border-border shadow-lg",
        "animate-in slide-in-from-right-full fade-in-0 duration-300",
        "cursor-pointer",
        "max-w-sm"
      )}
      onClick={onClick}
    >
      {/* 图标 */}
      <div className={cn(
        "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        "bg-muted"
      )}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{notification.title}</p>
        {notification.description && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {notification.description}
          </p>
        )}
      </div>

      {/* 关闭按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose?.()
        }}
        className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  )
}

// 辅助函数：格式化时间
function formatTime(time: Date | string): string {
  const date = typeof time === "string" ? new Date(time) : time
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`

  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  })
}

export {
  NotificationCenter,
  NotificationListItem,
  NotificationBell,
  NotificationPopover,
  NotificationToast,
  typeConfig as notificationTypeConfig,
}
export type {
  NotificationType,
  NotificationItem,
  NotificationCenterProps,
  NotificationListItemProps,
  NotificationBellProps,
  NotificationPopoverProps,
  NotificationToastProps,
}