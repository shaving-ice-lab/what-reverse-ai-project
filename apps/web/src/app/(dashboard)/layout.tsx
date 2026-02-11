'use client'

/**
 * Dashboard Layout - Supabase Style
 * TopNavbar + canExpandSidebar
 * SupportLight/DarkThemeSwitch
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import {
  Sparkles,
  MessageSquare,
  Zap,
  Settings,
  Plus,
  Search,
  User,
  LogOut,
  CreditCard,
  LayoutGrid,
  Store,
  Palette,
  FolderOpen,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Bot,
  HelpCircle,
  LifeBuoy,
  Crown,
  Activity,
  PanelLeftClose,
  PanelLeft,
  BarChart3,
  PlugZap,
  ListTodo,
  Loader2,
  Shield,
  Database,
} from 'lucide-react'
import { RequireAuth } from '@/components/auth/auth-guard'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCommandPalette } from '@/components/dashboard/use-command-palette'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { workspaceApi, type Workspace, type WorkspaceQuota } from '@/lib/api/workspace'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// mainNavigationMenu
const mainNavItems = [
  { title: 'Home', href: '/dashboard', icon: Activity },
  { title: 'AI Agent', href: '/dashboard/agent', icon: Bot },
  { title: 'My Apps', href: '/dashboard/apps', icon: LayoutGrid },
  { title: 'Database', href: '/dashboard/database', icon: Database },
  { title: 'Agent Flow', href: '/dashboard/workflows', icon: Zap },
  { title: 'Skills', href: '/dashboard/skills', icon: Sparkles },
]

// personMenu
const personalNavItems = [
  { title: 'My Files', href: '/dashboard/files', icon: FolderOpen },
  { title: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
]

// allPage(PageControlLayoutandScroll)
const fullBleedRoutes = [
  '/dashboard',
  '/dashboard/editor',
  '/dashboard/apps/editor',
  '/dashboard/chat',
  '/dashboard/conversations',
  '/dashboard/creative',
  '/dashboard/store',
  '/dashboard/review',
  '/dashboard/workflows',
  '/dashboard/my-agents',
  '/dashboard/files',
  '/dashboard/analytics',
  '/dashboard/workspaces',
  '/dashboard/plans',
  '/dashboard/support-tickets',
  '/dashboard/apps',
  '/dashboard/database',
  '/dashboard/agent',
  '/dashboard/skills',
]

const WORKSPACE_STORAGE_KEY = 'last_workspace_id'
const RECENT_WORKSPACE_STORAGE_KEY = 'recent_workspace_ids'
const RECENT_WORKSPACE_LIMIT = 4
const SETUP_STORAGE_KEY = 'agentflow-setup-completed'

const NotificationPanel = dynamic(
  () =>
    import('@/components/dashboard/notification-panel').then((mod) => ({
      default: mod.NotificationPanel,
    })),
  { ssr: false }
)

const CommandPalette = dynamic(
  () =>
    import('@/components/dashboard/command-palette').then((mod) => ({
      default: mod.CommandPalette,
    })),
  { ssr: false }
)

const workspacePlanConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  free: { label: 'FREE', color: 'text-foreground-muted', bgColor: 'bg-surface-200' },
  pro: { label: 'PRO', color: 'text-brand-500', bgColor: 'bg-brand-200' },
  enterprise: { label: 'ENTERPRISE', color: 'text-warning', bgColor: 'bg-warning-200' },
}

const workspaceStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Available', color: 'text-brand-500' },
  suspended: { label: 'Paused', color: 'text-warning' },
  deleted: { label: 'Deleted', color: 'text-destructive' },
}

// MockConversationHistory
const recentConversations = [
  { id: '1', title: 'Create automation email workflow', time: '2 min ago' },
  { id: '2', title: 'Webhook trigger config', time: '1 hour ago' },
  { id: '3', title: 'Sales data analytics report', time: 'Yesterday' },
  { id: '4', title: 'GitHub issue auto category', time: 'Yesterday' },
  { id: '5', title: 'Customer feedback sentiment analytics', time: '3 days ago' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const commandPalette = useCommandPalette()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [workspaceLoading, setWorkspaceLoading] = useState(true)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)
  const [workspaceQuota, setWorkspaceQuota] = useState<WorkspaceQuota | null>(null)
  const [quotaLoading, setQuotaLoading] = useState(false)
  const [recentWorkspaceIds, setRecentWorkspaceIds] = useState<string[]>([])
  const [needsSetup, setNeedsSetup] = useState(false)
  const [setupChecked, setSetupChecked] = useState(false)
  const resolvedMainNavItems = useMemo(
    () =>
      user?.role === 'admin'
        ? [
            ...mainNavItems,
            {
              title: 'Admin Panel',
              href: '/dashboard/admin',
              icon: Shield,
            },
          ]
        : mainNavItems,
    [user?.role]
  )

  const workspaceIdFromPath = pathname.startsWith('/dashboard/workspaces/')
    ? pathname.split('/')[3] || null
    : null

  const updateRecentWorkspaces = useCallback((workspaceId: string) => {
    if (!workspaceId || typeof window === 'undefined') return
    setRecentWorkspaceIds((prev) => {
      const next = [workspaceId, ...prev.filter((id) => id !== workspaceId)].slice(
        0,
        RECENT_WORKSPACE_LIMIT
      )
      localStorage.setItem(RECENT_WORKSPACE_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // Wait for client-side mount to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(RECENT_WORKSPACE_STORAGE_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        setRecentWorkspaceIds(parsed.filter((id) => typeof id === 'string'))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    let isActive = true
    const loadWorkspaces = async () => {
      try {
        setWorkspaceLoading(true)
        const data = await workspaceApi.list()
        if (!isActive) return
        setWorkspaces(data)
      } catch (error) {
        console.error('Failed to load workspaces:', error)
      } finally {
        if (isActive) {
          setWorkspaceLoading(false)
        }
      }
    }

    loadWorkspaces()
    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!workspaceIdFromPath || typeof window === 'undefined') return
    localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceIdFromPath)
    updateRecentWorkspaces(workspaceIdFromPath)
  }, [workspaceIdFromPath, updateRecentWorkspaces])

  useEffect(() => {
    if (workspaces.length === 0) return
    const storedId =
      typeof window !== 'undefined' ? localStorage.getItem(WORKSPACE_STORAGE_KEY) : null
    const preferredId = workspaceIdFromPath || storedId
    const fallbackId = workspaces[0]?.id
    const resolvedId = workspaces.some((ws) => ws.id === preferredId) ? preferredId : fallbackId
    setActiveWorkspaceId(resolvedId ?? null)
  }, [workspaces, workspaceIdFromPath])

  useEffect(() => {
    if (!mounted || workspaceLoading) return
    if (typeof window === 'undefined') return
    if (setupChecked) return

    const completed = localStorage.getItem(SETUP_STORAGE_KEY) === 'true'
    if (completed) {
      setSetupChecked(true)
      setNeedsSetup(false)
      return
    }

    const activeWorkspace =
      workspaces.find((ws) => ws.id === activeWorkspaceId) ?? workspaces[0] ?? null
    if (!activeWorkspace) {
      setSetupChecked(true)
      setNeedsSetup(true)
      return
    }

    const isDefaultName = activeWorkspace.name?.trim() === 'Default Workspace'
    setNeedsSetup(isDefaultName)
    setSetupChecked(true)
  }, [activeWorkspaceId, mounted, setupChecked, workspaceLoading, workspaces])

  useEffect(() => {
    if (!needsSetup) return
    if (pathname?.startsWith('/dashboard/setup')) return
    // Re-check localStorage in case setup was just completed
    const justCompleted =
      typeof window !== 'undefined' && localStorage.getItem('agentflow-setup-completed') === 'true'
    if (justCompleted) {
      setNeedsSetup(false)
      setSetupChecked(true)
      return
    }
    router.replace('/dashboard/setup')
  }, [needsSetup, pathname, router])

  useEffect(() => {
    if (!activeWorkspaceId) return
    updateRecentWorkspaces(activeWorkspaceId)
  }, [activeWorkspaceId, updateRecentWorkspaces])

  useEffect(() => {
    if (!activeWorkspaceId) {
      setWorkspaceQuota(null)
      return
    }
    let isActive = true
    const loadQuota = async () => {
      try {
        setQuotaLoading(true)
        const quota = await workspaceApi.getQuota(activeWorkspaceId)
        if (isActive) {
          setWorkspaceQuota(quota)
        }
      } catch (error) {
        if (isActive) {
          setWorkspaceQuota(null)
        }
      } finally {
        if (isActive) {
          setQuotaLoading(false)
        }
      }
    }
    loadQuota()
    return () => {
      isActive = false
    }
  }, [activeWorkspaceId])

  // SwitchTheme
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  // Check if currently in dark mode
  const isDark = mounted ? resolvedTheme === 'dark' : true

  // Determine if the path is active
  const isActive = (href: string) => {
    return pathname.startsWith(href)
  }

  const isFullBleed = fullBleedRoutes.some((route) => {
    return pathname === route || pathname.startsWith(`${route}/`)
  })

  const isSetupPage = pathname === '/dashboard/setup' || pathname.startsWith('/dashboard/setup/')

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId) || null

  const resolvePlanConfig = (plan?: string) => {
    if (!plan) return workspacePlanConfig.free
    return workspacePlanConfig[plan] || workspacePlanConfig.free
  }

  const handleWorkspaceSwitch = (workspaceId: string) => {
    if (workspaceId === activeWorkspaceId) return
    if (typeof window !== 'undefined' && activeWorkspaceId) {
      const confirmed = window.confirm(
        'Switching workspace will leave the current context. Continue?'
      )
      if (!confirmed) return
    }
    setActiveWorkspaceId(workspaceId)
    if (typeof window !== 'undefined') {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId)
      // Clear Agent session context (workspace-scoped)
      sessionStorage.removeItem('agent_session_id')
      // Trigger DB stats refresh for new workspace
      window.dispatchEvent(new CustomEvent('workspace-switched', { detail: { workspaceId } }))
    }
    updateRecentWorkspaces(workspaceId)
    router.push('/dashboard')
  }

  const activePlan = resolvePlanConfig(activeWorkspace?.plan)
  const recentWorkspaces = useMemo(() => {
    return recentWorkspaceIds
      .map((id) => workspaces.find((workspace) => workspace.id === id))
      .filter((workspace): workspace is Workspace => Boolean(workspace))
      .filter((workspace) => workspace.id !== activeWorkspaceId)
  }, [recentWorkspaceIds, workspaces, activeWorkspaceId])

  const quotaSummaryItems = useMemo(() => {
    if (!workspaceQuota) return []
    const buildItem = (label: string, used: number, limit: number, unit = '') => {
      if (limit <= 0) return { label, value: 'Unlimited' }
      return { label, value: `${used}/${limit}${unit}` }
    }
    const q = (field: { used: number; limit: number } | undefined) => field ?? { used: 0, limit: 0 }
    return [
      buildItem('Request', q(workspaceQuota.requests).used, q(workspaceQuota.requests).limit, ''),
      buildItem('Token', q(workspaceQuota.tokens).used, q(workspaceQuota.tokens).limit, ''),
      buildItem('Storage', q(workspaceQuota.storage).used, q(workspaceQuota.storage).limit, 'GB'),
      buildItem('App', q(workspaceQuota.apps).used, q(workspaceQuota.apps).limit, ''),
    ]
  }, [workspaceQuota])

  const quotaUsagePercent = useMemo(() => {
    if (!workspaceQuota) return null
    const ratios = [
      workspaceQuota.requests,
      workspaceQuota.tokens,
      workspaceQuota.storage,
      workspaceQuota.apps,
    ]
      .filter((item): item is { used: number; limit: number } => !!item && item.limit > 0)
      .map((item) => item.used / item.limit)
    if (ratios.length === 0) return null
    return Math.max(...ratios)
  }, [workspaceQuota])

  const quotaUsageLabel =
    quotaUsagePercent === null ? '—' : `${Math.round(quotaUsagePercent * 100)}%`
  const hasRestrictedWorkspaces = useMemo(
    () => workspaces.some((workspace) => workspace.status !== 'active'),
    [workspaces]
  )
  const workspaceQuickLinks = activeWorkspace
    ? [
        { label: 'Create App', href: '/dashboard/apps' },
        {
          label: 'Member Management',
          href: `/dashboard/workspaces/${activeWorkspace.id}/settings?tab=members`,
        },
        { label: 'Usage and Billing', href: '/dashboard/billing' },
        { label: 'Settings', href: `/dashboard/workspaces/${activeWorkspace.id}/settings` },
      ]
    : []

  // keyBoard Shortcutskey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        commandPalette.toggle()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        router.push('/dashboard/conversations')
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarCollapsed(!sidebarCollapsed)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, commandPalette, sidebarCollapsed])

  // IconButtonComponent
  const IconButton = ({
    icon: Icon,
    tooltip,
    onClick,
    href,
    active,
    badge,
  }: {
    icon: React.ElementType
    tooltip: string
    onClick?: () => void
    href?: string
    active?: boolean
    badge?: boolean
  }) => {
    const content = (
      <button
        onClick={onClick}
        className={cn(
          'w-7 h-7 rounded-md flex items-center justify-center transition-all relative',
          active
            ? 'bg-surface-200 text-foreground'
            : 'text-foreground-light hover:text-foreground hover:bg-surface-100'
        )}
      >
        <Icon className="w-4 h-4" />
        {badge && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-500" />}
      </button>
    )

    const wrapped = href ? <Link href={href}>{content}</Link> : content

    return (
      <Tooltip>
        <TooltipTrigger asChild>{wrapped}</TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={8}
          className="rounded-md px-2.5 py-1.5 bg-surface-100 border border-border text-foreground"
        >
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <RequireAuth>
      <TooltipProvider delayDuration={100}>
        <div className="flex flex-col h-screen overflow-hidden transition-colors duration-200 bg-background-studio text-foreground">
          {/* ===== Supabase StyleTopNavbar ===== */}
          <header className="h-11 shrink-0 border-b border-border bg-background-studio/95 backdrop-blur flex items-center px-4 gap-2">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-brand-500">
                <Sparkles className="w-3.5 h-3.5 text-background" />
              </div>
              <span className="hidden sm:inline text-[12px] font-semibold tracking-tight text-foreground">
                AgentFlow
              </span>
            </Link>

            <span className="text-foreground-muted">/</span>

            {/* WorkspaceSwitch */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-0.5 rounded-md hover:bg-surface-100 transition-colors text-foreground-light hover:text-foreground">
                  {workspaceLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground-muted" />
                  ) : (
                    <LayoutGrid className="w-3.5 h-3.5 text-foreground-muted" />
                  )}
                  <span className="text-[12px] font-medium">
                    {workspaceLoading
                      ? 'Loading workspace...'
                      : activeWorkspace?.name || 'Select workspace'}
                  </span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 text-[10px] font-medium rounded',
                      activePlan.bgColor,
                      activePlan.color
                    )}
                  >
                    {workspaceLoading ? '...' : activeWorkspace ? activePlan.label : 'Not selected'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-foreground-muted" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-surface-100 border-border">
                <div className="px-3 py-2 text-[11px] text-foreground-muted">Workspace</div>
                {activeWorkspace && (
                  <div className="px-3 pb-2 space-y-2 text-[11px] text-foreground-light">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">Current plan</span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 text-[10px] font-semibold rounded',
                          activePlan.bgColor,
                          activePlan.color
                        )}
                      >
                        {activePlan.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">Quota overview</span>
                      <span className="text-[10px] text-foreground-muted">
                        {quotaLoading ? 'Syncing...' : `Usage ${quotaUsageLabel}`}
                      </span>
                    </div>
                    {quotaSummaryItems.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {quotaSummaryItems.map((item) => (
                          <div
                            key={item.label}
                            className="rounded-md border border-border bg-surface-75 px-2 py-1 text-[10px] text-foreground-muted"
                          >
                            <span className="text-foreground-light">{item.label}</span>
                            <span className="ml-1 text-foreground">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-foreground-muted">No quota data</div>
                    )}
                    <Link href="/dashboard/billing" className="text-brand-500 hover:underline">
                      View Usage Details
                    </Link>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {workspaceQuickLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center justify-center rounded-md border border-border bg-surface-75 px-2 py-1 text-[11px] text-foreground-light hover:text-foreground hover:border-border-strong hover:bg-surface-100 transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <DropdownMenuSeparator className="bg-border" />
                {workspaceLoading ? (
                  <DropdownMenuItem
                    disabled
                    className="text-[12px] text-foreground-muted flex items-center gap-2"
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading
                  </DropdownMenuItem>
                ) : workspaces.length === 0 ? (
                  <DropdownMenuItem asChild className="text-[12px]">
                    <Link href="/dashboard/workspaces" className="flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5" />
                      Create workspace
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  workspaces.map((workspace) => {
                    const plan = resolvePlanConfig(workspace.plan)
                    const isActiveWorkspace = workspace.id === activeWorkspaceId
                    const status = workspaceStatusConfig[workspace.status] || {
                      label: 'Limited',
                      color: 'text-foreground-muted',
                    }
                    const isDisabled = workspace.status !== 'active'
                    return (
                      <DropdownMenuItem
                        key={workspace.id}
                        disabled={isDisabled}
                        onClick={() => {
                          if (isDisabled) return
                          handleWorkspaceSwitch(workspace.id)
                        }}
                        className={cn(
                          'flex items-center justify-between gap-2 text-[12px]',
                          isActiveWorkspace && 'bg-surface-200/70 text-foreground',
                          isDisabled && 'opacity-60 cursor-not-allowed'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', workspace.status === 'active' ? 'bg-emerald-500' : 'bg-foreground-muted/30')} title={workspace.status === 'active' ? 'DB Ready' : 'Not Configured'} />
                          <span className="font-medium">{workspace.name}</span>
                          <span className="text-[10px] text-foreground-muted">
                            /{workspace.slug}
                          </span>
                          {isDisabled && (
                            <span className={cn('text-[10px]', status.color)}>{status.label}</span>
                          )}
                        </div>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 text-[10px] font-semibold rounded',
                            plan.bgColor,
                            plan.color
                          )}
                        >
                          {plan.label}
                        </span>
                      </DropdownMenuItem>
                    )
                  })
                )}
                {hasRestrictedWorkspaces && (
                  <div className="px-3 pb-2 text-[10px] text-foreground-muted">
                    Workspace paused or permission limited. An admin can restore access.
                  </div>
                )}
                {recentWorkspaces.length > 0 && (
                  <>
                    <DropdownMenuSeparator className="bg-border" />
                    <div className="px-3 py-2 text-[11px] text-foreground-muted">Recent access</div>
                    {recentWorkspaces.map((workspace) => {
                      const plan = resolvePlanConfig(workspace.plan)
                      const status = workspaceStatusConfig[workspace.status] || {
                        label: 'Limited',
                        color: 'text-foreground-muted',
                      }
                      const isDisabled = workspace.status !== 'active'
                      return (
                        <DropdownMenuItem
                          key={`recent-${workspace.id}`}
                          disabled={isDisabled}
                          onClick={() => {
                            if (isDisabled) return
                            handleWorkspaceSwitch(workspace.id)
                          }}
                          className={cn(
                            'flex items-center justify-between gap-2 text-[12px]',
                            isDisabled && 'opacity-60 cursor-not-allowed'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{workspace.name}</span>
                            <span className="text-[10px] text-foreground-muted">
                              /{workspace.slug}
                            </span>
                            {isDisabled && (
                              <span className={cn('text-[10px]', status.color)}>
                                {status.label}
                              </span>
                            )}
                          </div>
                          <span
                            className={cn(
                              'px-1.5 py-0.5 text-[10px] font-semibold rounded',
                              plan.bgColor,
                              plan.color
                            )}
                          >
                            {plan.label}
                          </span>
                        </DropdownMenuItem>
                      )
                    })}
                  </>
                )}
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild className="text-[12px]">
                  <Link href="/dashboard/workspaces" className="flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5" />
                    Workspace list
                  </Link>
                </DropdownMenuItem>
                {activeWorkspace && (
                  <DropdownMenuItem asChild className="text-[12px]">
                    <Link
                      href={`/dashboard/workspaces/${activeWorkspace.id}/settings`}
                      className="flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Workspace settings
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="text-foreground-muted">/</span>

            {/* Workspace Context */}
            {workspaceLoading ? (
              <div className="hidden md:flex items-center gap-2 px-2 py-0.5 rounded-md border border-border bg-surface-100 text-[11px] text-foreground-muted">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading
              </div>
            ) : activeWorkspace ? (
              <div className="hidden md:flex items-center gap-2 px-2 py-0.5 rounded-md border border-border bg-surface-100 text-[11px] text-foreground-light">
                <span className="text-foreground-muted">/{activeWorkspace.slug}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] font-semibold rounded',
                    activePlan.bgColor,
                    activePlan.color
                  )}
                >
                  {activePlan.label}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-surface-200 text-foreground-muted">
                  Quota {quotaUsageLabel}
                </span>
                <span className="h-3 w-px bg-border" />
                <Link href="/dashboard/apps" className="hover:text-foreground transition-colors">
                  Create App
                </Link>
                <Link
                  href={`/dashboard/workspaces/${activeWorkspace.id}/settings?tab=members`}
                  className="hover:text-foreground transition-colors"
                >
                  Members
                </Link>
                <Link href="/dashboard/billing" className="hover:text-foreground transition-colors">
                  Usage
                </Link>
                <Link
                  href={`/dashboard/workspaces/${activeWorkspace.id}/settings`}
                  className="hover:text-foreground transition-colors"
                >
                  Settings
                </Link>
              </div>
            ) : (
              <Link
                href="/dashboard/workspaces"
                className="hidden md:inline-flex items-center gap-2 px-2 py-0.5 rounded-md border border-border bg-surface-100 text-[11px] text-foreground-light hover:text-foreground transition-colors"
              >
                Create or select workspace
              </Link>
            )}

            <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-warning/15 text-warning">
              PRODUCTION
            </span>

            {/* Right sideToolbar */}
            <div className="ml-auto flex items-center gap-1.5">
              <Link href="/dashboard/integrations">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[11px] border-border text-foreground-light hover:text-foreground"
                >
                  <PlugZap className="w-3.5 h-3.5 mr-1.5" />
                  Connect
                </Button>
              </Link>

              <button
                onClick={() => commandPalette.toggle()}
                className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-surface-100 border border-border text-[11px] text-foreground-light hover:text-foreground hover:border-border-strong transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search...</span>
                <kbd className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-surface-200 text-foreground-muted">
                  ⌘K
                </kbd>
              </button>

              {/* Help */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="w-7 h-7 rounded-md flex items-center justify-center text-foreground-light hover:text-foreground hover:bg-surface-100 transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-surface-100 border-border text-foreground"
                >
                  <p className="text-xs">Help</p>
                </TooltipContent>
              </Tooltip>

              {/* Notifications */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowNotifications(true)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-foreground-light hover:text-foreground hover:bg-surface-100 transition-colors relative"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-surface-100 border-border text-foreground"
                >
                  <p className="text-xs">Notifications</p>
                </TooltipContent>
              </Tooltip>

              {/* ThemeSwitch */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleTheme}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-foreground-light hover:text-foreground hover:bg-surface-100 transition-colors"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-surface-100 border-border text-foreground"
                >
                  <p className="text-xs">{isDark ? 'Light Mode' : 'Dark Mode'}</p>
                </TooltipContent>
              </Tooltip>

              {/* UserAvatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-border hover:ring-brand-500/50 transition-all">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-surface-200 text-foreground-light text-xs">
                        {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-surface-100 border-border">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user?.displayName || user?.username}
                    </p>
                    <p className="text-xs text-foreground-light truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-200 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-200 cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/billing"
                        className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-200 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Subscription Plan
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <div className="py-1">
                    <DropdownMenuItem
                      icon={<LogOut className="w-3.5 h-3.5" />}
                      destructive
                      onClick={() => logout()}
                      className="px-3 py-1.5 cursor-pointer"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* ===== mainRegion(Sidebar + Content) ===== */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <aside
              data-collapsed={sidebarCollapsed}
              className={cn(
                'flex flex-col transition-all duration-300 ease-out relative shrink-0 bg-background-studio border-r border-border overflow-hidden',
                isSetupPage ? 'w-0 border-r-0 hidden' : sidebarCollapsed ? 'w-[52px]' : 'w-[188px]'
              )}
            >
              <div className="relative z-10 flex h-full flex-col">
                {/* Scrollable Navigation Region */}
                <div
                  className={cn(
                    'flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin',
                    sidebarCollapsed ? 'px-1.5' : 'px-2'
                  )}
                >
                  {/* mainNavigation */}
                  <div className="py-1">
                    <nav className="space-y-0">
                      {resolvedMainNavItems.map((item) => {
                        const active = isActive(item.href)
                        return sidebarCollapsed ? (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                              <Link href={item.href}>
                                <button
                                  className={cn(
                                    'w-full h-8 rounded-md flex items-center justify-center transition-colors',
                                    active
                                      ? 'bg-surface-100/70 text-foreground'
                                      : 'text-foreground-muted hover:text-foreground hover:bg-surface-100/60'
                                  )}
                                >
                                  <item.icon className="w-4 h-4" />
                                </button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              sideOffset={8}
                              className="rounded-md px-2.5 py-1.5 bg-surface-100 border border-border text-foreground"
                            >
                              <p className="text-xs">{item.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Link key={item.href} href={item.href}>
                            <button
                              className={cn(
                                'w-full h-8 rounded-md flex items-center px-2 transition-colors text-[12px] font-medium',
                                active
                                  ? 'bg-surface-100/70 text-foreground'
                                  : 'text-foreground-light hover:text-foreground hover:bg-surface-100/60'
                              )}
                            >
                              <span className="truncate">{item.title}</span>
                            </button>
                          </Link>
                        )
                      })}
                    </nav>
                  </div>

                  {/* personMenu */}
                  <div className="py-1">
                    <nav className="space-y-0">
                      {personalNavItems.map((item) => {
                        const active = isActive(item.href)
                        return sidebarCollapsed ? (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                              <Link href={item.href}>
                                <button
                                  className={cn(
                                    'w-full h-8 rounded-md flex items-center justify-center transition-colors',
                                    active
                                      ? 'bg-surface-100/70 text-foreground'
                                      : 'text-foreground-muted hover:text-foreground hover:bg-surface-100/60'
                                  )}
                                >
                                  <item.icon className="w-4 h-4" />
                                </button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              sideOffset={8}
                              className="rounded-md px-2.5 py-1.5 bg-surface-100 border border-border text-foreground"
                            >
                              <p className="text-xs">{item.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Link key={item.href} href={item.href}>
                            <button
                              className={cn(
                                'w-full h-8 rounded-md flex items-center px-2 transition-colors text-[12px] font-medium',
                                active
                                  ? 'bg-surface-100/70 text-foreground'
                                  : 'text-foreground-light hover:text-foreground hover:bg-surface-100/60'
                              )}
                            >
                              <span className="truncate">{item.title}</span>
                            </button>
                          </Link>
                        )
                      })}
                    </nav>
                  </div>

                  {/* ConversationHistory */}
                  {!sidebarCollapsed && (
                    <>
                      <div className="my-1.5 h-px bg-border" />
                      <div>
                        <button
                          onClick={() => setShowHistory(!showHistory)}
                          className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-foreground-muted transition-colors w-full hover:text-foreground"
                        >
                          <ChevronDown
                            className={cn(
                              'w-3 h-3 transition-transform',
                              !showHistory && '-rotate-90'
                            )}
                          />
                          Recent Conversations
                        </button>

                        {showHistory && (
                          <div className="py-1 space-y-0.5">
                            {recentConversations.map((conv) => (
                              <button
                                key={conv.id}
                                onClick={() => setActiveConversation(conv.id)}
                                className={cn(
                                  'w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors relative',
                                  activeConversation === conv.id
                                    ? 'bg-surface-100/70 text-foreground'
                                    : 'text-foreground-muted hover:bg-surface-100/60 hover:text-foreground'
                                )}
                              >
                                {activeConversation === conv.id && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-r-full bg-brand-500" />
                                )}
                                <p className="truncate leading-snug">{conv.title}</p>
                                <p className="text-[10px] mt-0.5 text-foreground-muted">
                                  {conv.time}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* FooterRegion */}
                <div className="mt-auto shrink-0">
                  {!sidebarCollapsed && (
                    <div className="px-2 py-2">
                      <div className="p-2.5 rounded-md bg-surface-100 border border-border">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-brand-500" />
                            <span className="text-[11px] font-medium text-foreground-light">
                              Free Plan
                            </span>
                          </div>
                          <Link
                            href="/dashboard/billing"
                            className="text-[10px] text-brand-500 hover:underline"
                          >
                            Upgrade
                          </Link>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden bg-surface-300">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: '85%' }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-1 text-foreground-muted">
                          <span>850 / 1000 Credits</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="h-px mx-2 my-2 bg-border" />

                  <div className={cn('py-2', sidebarCollapsed ? 'px-1.5' : 'px-2')}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                          className={cn(
                            'w-full h-8 rounded-md flex items-center transition-colors text-[12px] font-medium',
                            sidebarCollapsed ? 'justify-center' : 'gap-2 px-2',
                            'text-foreground-muted hover:text-foreground hover:bg-surface-100/60'
                          )}
                        >
                          {sidebarCollapsed ? (
                            <PanelLeft className="w-4 h-4" />
                          ) : (
                            <PanelLeftClose className="w-4 h-4" />
                          )}
                          {!sidebarCollapsed && (
                            <span className="truncate text-[12px] font-medium">
                              Collapse sidebar
                            </span>
                          )}
                        </button>
                      </TooltipTrigger>
                      {sidebarCollapsed && (
                        <TooltipContent side="right" className="bg-surface-100 border-border">
                          <p className="text-xs">Expand sidebar</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                </div>
              </div>
            </aside>

            {/* mainContentRegion */}
            <main className="flex-1 overflow-hidden bg-background-studio">
              <div className="dashboard-shell" data-layout={isFullBleed ? 'full' : 'standard'}>
                <div className="dashboard-content">
                  <div className="dashboard-page">
                    {!setupChecked && !isSetupPage ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-6 h-6 border-2 border-foreground-muted border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      children
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>

          {/* NotificationsPanel */}
          {showNotifications && (
            <NotificationPanel
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          )}

          {/* CommandPanel */}
          {commandPalette.isOpen && (
            <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />
          )}
        </div>
      </TooltipProvider>
    </RequireAuth>
  )
}
