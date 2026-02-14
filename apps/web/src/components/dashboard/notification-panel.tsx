'use client'

/**
 * Notifications Dropdown — Supabase-style topnav dropdown
 */

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Bell,
  Check,
  Zap,
  MessageSquare,
  AlertTriangle,
  Info,
  Gift,
  Clock,
  Settings,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type NotificationType = 'agent' | 'message' | 'alert' | 'info' | 'reward' | 'system'

interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  time: string
  read: boolean
  actionUrl?: string
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'agent',
    title: 'App Build Complete',
    description: 'AI Agent has finished building your app.',
    time: '2 min ago',
    read: false,
    actionUrl: '/dashboard/workspace',
  },
  {
    id: '2',
    type: 'alert',
    title: 'API Call Limit Warning',
    description: "API calls reached 80% of this month's limit.",
    time: '1 hour ago',
    read: false,
    actionUrl: '/dashboard/settings/api-keys',
  },
  {
    id: '3',
    type: 'reward',
    title: 'Achievement Earned',
    description: 'You built 10 apps — Automation Expert badge unlocked.',
    time: '3 hours ago',
    read: false,
  },
  {
    id: '4',
    type: 'message',
    title: 'New Team Message',
    description: '3 people mentioned you in Project Collaboration.',
    time: 'Yesterday',
    read: true,
    actionUrl: '/messages',
  },
  {
    id: '5',
    type: 'system',
    title: 'System Update',
    description: 'New AI Agent features are coming soon.',
    time: '2 days ago',
    read: true,
    actionUrl: '/whats-new',
  },
]

const iconConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  agent: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  message: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  alert: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  info: { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  reward: { icon: Gift, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  system: { icon: Settings, color: 'text-foreground-lighter', bg: 'bg-surface-200' },
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState(mockNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-7 h-7 rounded-md flex items-center justify-center text-foreground-light hover:text-foreground hover:bg-surface-100 transition-colors relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-surface-100 border-border p-0">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-brand-500/15 text-brand-500">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[10px] text-brand-500 hover:text-brand-400 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[320px] overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-1.5">
              <Bell className="w-5 h-5 text-foreground-lighter" />
              <span className="text-[11px] text-foreground-lighter">No notifications</span>
            </div>
          ) : (
            notifications.map((n) => {
              const { icon: Icon, color, bg } = iconConfig[n.type] || iconConfig.system
              return (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={cn(
                    'px-3 py-2.5 flex gap-2.5 cursor-pointer hover:bg-surface-75 transition-colors group',
                    !n.read && 'bg-brand-500/3'
                  )}
                >
                  <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0', bg)}>
                    <Icon className={cn('w-3.5 h-3.5', color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-[12px] font-medium truncate',
                          n.read ? 'text-foreground-lighter' : 'text-foreground'
                        )}
                      >
                        {n.title}
                      </span>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-foreground-lighter truncate mt-0.5">
                      {n.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-foreground-lighter flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {n.time}
                      </span>
                      {n.actionUrl && (
                        <Link
                          href={n.actionUrl}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-brand-500 hover:text-brand-400 transition-colors"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteNotification(n.id, e)}
                    className="w-5 h-5 rounded flex items-center justify-center text-foreground-lighter hover:text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-3 py-2 border-t border-border flex items-center justify-between">
            <button
              onClick={() => setNotifications([])}
              className="text-[10px] text-foreground-lighter hover:text-foreground transition-colors"
            >
              Clear all
            </button>
            <Link
              href="/dashboard/settings"
              className="text-[10px] text-foreground-lighter hover:text-foreground transition-colors"
            >
              Settings
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
