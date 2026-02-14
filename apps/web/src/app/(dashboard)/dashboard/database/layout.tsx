'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Table2,
  Terminal,
  Network,
  HardDrive,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard/database', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/database/tables', label: 'Tables', icon: Table2 },
  { href: '/dashboard/database/sql', label: 'SQL', icon: Terminal },
  { href: '/dashboard/database/schema-graph', label: 'Schema', icon: Network },
  { href: '/dashboard/database/storage', label: 'Storage', icon: HardDrive },
]

export default function DatabaseLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard/database') {
      return pathname === '/dashboard/database'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background-studio">
      {/* Tab bar — pill style (matches workspace page) */}
      <header className="h-10 shrink-0 border-b border-border bg-background-studio flex items-center px-3 gap-1">
        <nav className="flex items-center gap-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[12px] font-medium transition-colors',
                  active
                    ? 'bg-surface-200 text-foreground'
                    : 'text-foreground-muted hover:text-foreground hover:bg-surface-100/60'
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden bg-background">
        {children}
      </div>
    </div>
  )
}
