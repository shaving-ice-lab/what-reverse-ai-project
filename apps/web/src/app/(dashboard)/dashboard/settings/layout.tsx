'use client'

/**
 * Settings Page Layout - Supabase Style
 * Left sidebar navigation + Right content area
 */

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User,
  Key,
  Cpu,
  Settings,
  Bell,
  AlertTriangle,
  Shield,
  Crown,
  CreditCard,
  BarChart3,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Settings Navigation Config
const settingsNavSections = [
  {
    title: 'Account Settings',
    items: [
      {
        label: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
      },
      {
        label: 'Profile',
        href: '/dashboard/settings/profile',
        icon: User,
      },
      {
        label: 'Security Settings',
        href: '/dashboard/settings/security',
        icon: Shield,
      },
      {
        label: 'Notification Settings',
        href: '/dashboard/settings/notifications',
        icon: Bell,
      },
    ],
  },
  {
    title: 'Developers',
    items: [
      {
        label: 'API Key',
        href: '/dashboard/settings/api-keys',
        icon: Key,
        badge: '3',
      },
      {
        label: 'Local LLM',
        href: '/dashboard/settings/local-llm',
        icon: Cpu,
        badge: 'Beta',
        badgeColor: 'bg-brand-200 text-brand-500',
      },
    ],
  },
  {
    title: 'Billing',
    items: [
      {
        label: 'Subscription Plan',
        href: '/dashboard/upgrade',
        icon: CreditCard,
        external: true,
      },
      {
        label: 'Usage',
        href: '/dashboard/analytics',
        icon: BarChart3,
        external: true,
      },
    ],
  },
]

// Danger Actions
const dangerItem = {
  label: 'Delete Account',
  href: '/dashboard/settings/delete-account',
  icon: AlertTriangle,
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Exact match or path starts with href
  const isActive = (href: string) => {
    if (href === '/dashboard/settings') {
      return pathname === '/dashboard/settings' || pathname === '/dashboard/settings/preferences'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-full overflow-hidden bg-background-studio">
      {/* Left Sidebar */}
      <aside className="w-[220px] shrink-0 border-r border-border bg-background-studio overflow-y-auto">
        {/* Title */}
        <div className="px-4 py-3 border-b border-border bg-surface-200/60">
          <h2 className="text-[12px] font-medium text-foreground">Settings</h2>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-6">
          {settingsNavSections.map((section) => (
            <div key={section.title}>
              <h3 className="px-3 py-2 page-caption">{section.title}</h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between px-3 py-1.5 rounded-md text-[12px] transition-all group relative',
                        active
                          ? 'bg-surface-200 text-foreground before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[2px] before:rounded-full before:bg-brand-500'
                          : 'text-foreground-light hover:bg-surface-100 hover:text-foreground'
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <item.icon
                          className={cn(
                            'w-4 h-4',
                            active
                              ? 'text-foreground'
                              : 'text-foreground-muted group-hover:text-foreground-light'
                          )}
                        />
                        <span>{item.label}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        {item.badge && (
                          <span
                            className={cn(
                              'px-1.5 py-0.5 text-[10px] font-medium rounded',
                              item.badgeColor || 'bg-surface-300 text-foreground-muted'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.external && (
                          <ExternalLink className="w-3 h-3 text-foreground-muted" />
                        )}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Danger Zone */}
          <div>
            <h3 className="px-3 py-2 page-caption">Danger Zone</h3>
            <Link
              href={dangerItem.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[12px] transition-all relative',
                pathname === dangerItem.href
                  ? 'bg-destructive-200 text-destructive before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[2px] before:rounded-full before:bg-destructive'
                  : 'text-destructive-400 hover:bg-destructive-200/50 hover:text-destructive'
              )}
            >
              <dangerItem.icon className="w-4 h-4" />
              <span>{dangerItem.label}</span>
            </Link>
          </div>
        </nav>

        {/* Footer Upgrade Banner */}
        <div className="p-3 mt-auto border-t border-border">
          <div className="p-3 rounded-lg bg-surface-100 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-warning" />
              <span className="text-xs font-medium text-foreground">Free Version</span>
            </div>
            <p className="text-[11px] text-foreground-muted mb-3">
              Upgrade to Professional to unlock more features
            </p>
            <Link
              href="/dashboard/upgrade"
              className="block w-full text-center text-[11px] font-medium py-1.5 rounded-md bg-brand-500 text-background hover:bg-brand-600 transition-colors"
            >
              Upgrade to Professional
            </Link>
          </div>
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 overflow-auto bg-background-studio">{children}</main>
    </div>
  )
}
