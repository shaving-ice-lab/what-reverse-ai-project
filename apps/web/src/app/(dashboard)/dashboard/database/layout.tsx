'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Table2,
  Terminal,
  GitBranch,
  Shield,
  Network,
  FunctionSquare,
  HardDrive,
  Lock,
} from 'lucide-react'
import {
  PageWithSidebar,
  SidebarNavItem,
  SidebarNavGroup,
} from '@/components/dashboard/page-layout'

const databaseNavItems = [
  { href: '/dashboard/database', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/database/tables', label: 'Tables', icon: Table2 },
  { href: '/dashboard/database/sql', label: 'SQL Editor', icon: Terminal },
  { href: '/dashboard/database/schema-graph', label: 'Schema Graph', icon: Network },
  { href: '/dashboard/database/migrations', label: 'Migrations', icon: GitBranch },
  { href: '/dashboard/database/functions', label: 'Functions', icon: FunctionSquare },
  { href: '/dashboard/database/roles', label: 'Roles', icon: Shield },
  { href: '/dashboard/database/storage', label: 'Storage', icon: HardDrive },
  { href: '/dashboard/database/rls', label: 'RLS Policies', icon: Lock },
]

export default function DatabaseLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard/database') {
      return pathname === '/dashboard/database'
    }
    return pathname.startsWith(href)
  }

  const sidebar = (
    <>
      <SidebarNavGroup>
        {databaseNavItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={<item.icon className="w-4 h-4" />}
            active={isActive(item.href)}
          />
        ))}
      </SidebarNavGroup>

      <div className="mt-auto pt-4 px-3 border-t border-border">
        <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
          <div className="w-2 h-2 rounded-full bg-brand-500" />
          <span>Database connected</span>
        </div>
      </div>
    </>
  )

  return (
    <PageWithSidebar sidebar={sidebar} sidebarTitle="Database">
      {children}
    </PageWithSidebar>
  )
}
