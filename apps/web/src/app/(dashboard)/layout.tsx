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
  Settings,
  Plus,
  Search,
  User,
  Users,
  LogOut,
  CreditCard,
  LayoutGrid,
  Sun,
  Moon,
  ChevronDown,
  Bot,
  HelpCircle,
  Crown,
  Activity,
  PanelLeftClose,
  PanelLeft,
  Loader2,
  Shield,
  Database,
  Globe,
  Clock,
} from 'lucide-react'
import { RequireAuth } from '@/components/auth/auth-guard'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCommandPalette } from '@/components/dashboard/use-command-palette'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { workspaceApi, type Workspace, type WorkspaceQuota } from '@/lib/api/workspace'
import { agentChatApi } from '@/lib/api/agent-chat'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { WorkspaceContext, WORKSPACE_STORAGE_KEY, RECENT_WORKSPACE_STORAGE_KEY, RECENT_WORKSPACE_LIMIT, SETUP_STORAGE_KEY } from '@/hooks/useWorkspace'

// mainNavigationMenu — workspace-scoped
function getMainNavItems(workspaceId: string | null) {
  return [
    { title: 'Home', href: '/dashboard', icon: Activity },
    { title: 'Workspace', href: '/dashboard/workspace', icon: Bot },
    { title: 'Database', href: '/dashboard/database', icon: Database },
    { title: 'Skills', href: '/dashboard/skills', icon: Sparkles },
    {
      title: 'Settings',
      href: workspaceId ? `/dashboard/workspaces/${workspaceId}/settings` : '/dashboard/settings',
      icon: Settings,
    },
  ]
}

// allPage(PageControlLayoutandScroll)
const fullBleedRoutes = [
  '/dashboard',
  '/dashboard/database',
  '/dashboard/workspace',
  '/dashboard/skills',
  '/dashboard/setup',
]

const NotificationDropdown = dynamic(
  () =>
    import('@/components/dashboard/notification-panel').then((mod) => ({
      default: mod.NotificationDropdown,
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const { setTheme, resolvedTheme } = useTheme()
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
  const [recentConversations, setRecentConversations] = useState<
    { id: string; title: string; time: string }[]
  >([])
  const resolvedMainNavItems = useMemo(() => {
    const items = getMainNavItems(activeWorkspaceId)
    return user?.role === 'admin'
      ? [
          ...items,
          {
            title: 'Admin Panel',
            href: '/dashboard/admin',
            icon: Shield,
          },
        ]
      : items
  }, [user?.role, activeWorkspaceId])

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
      typeof window !== 'undefined' && localStorage.getItem('reverseai-setup-completed') === 'true'
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

  useEffect(() => {
    if (!activeWorkspaceId) {
      setRecentConversations([])
      return
    }
    let isActive = true
    const loadSessions = async () => {
      try {
        const sessions = await agentChatApi.listSessions(activeWorkspaceId)
        if (!isActive) return
        const items = (sessions || []).slice(0, 5).map((s) => ({
          id: s.id,
          title: s.title || `Session ${s.id.slice(0, 8)}`,
          time: s.updated_at
            ? formatRelativeTime(s.updated_at)
            : s.created_at
              ? formatRelativeTime(s.created_at)
              : '',
        }))
        setRecentConversations(items)
      } catch {
        if (isActive) setRecentConversations([])
      }
    }
    loadSessions()
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

  // Silent workspace switch — no confirm dialog, no redirect. Used by child components
  // (e.g. App Layout) to sync context when navigating to a workspace-scoped route.
  const switchWorkspaceSilent = useCallback(
    (workspaceId: string) => {
      if (workspaceId === activeWorkspaceId) return
      setActiveWorkspaceId(workspaceId)
      if (typeof window !== 'undefined') {
        localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId)
        sessionStorage.removeItem('agent_session_id')
        window.dispatchEvent(new CustomEvent('workspace-switched', { detail: { workspaceId } }))
      }
      updateRecentWorkspaces(workspaceId)
    },
    [activeWorkspaceId, updateRecentWorkspaces]
  )

  const handleWorkspaceSwitch = useCallback(
    (workspaceId: string) => {
      if (workspaceId === activeWorkspaceId) return
      if (typeof window !== 'undefined' && activeWorkspaceId) {
        const confirmed = window.confirm(
          'Switching workspace will leave the current context. Continue?'
        )
        if (!confirmed) return
      }
      switchWorkspaceSilent(workspaceId)
      router.push('/dashboard')
    },
    [activeWorkspaceId, switchWorkspaceSilent, router]
  )

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

  const workspaceContextValue = useMemo(
    () => ({
      workspaceId: activeWorkspaceId,
      workspace: activeWorkspace,
      workspaces,
      isLoading: workspaceLoading,
      switchWorkspace: switchWorkspaceSilent,
    }),
    [activeWorkspaceId, activeWorkspace, workspaces, workspaceLoading, switchWorkspaceSilent]
  )

  const workspaceQuickLinks = activeWorkspace
    ? [
        { label: 'Create App', href: '/dashboard/workspace' },
        {
          label: 'Member Management',
          href: `/dashboard/workspaces/${activeWorkspace.id}/settings?tab=members`,
        },
        {
          label: 'Usage and Billing',
          href: `/dashboard/workspaces/${activeWorkspace.id}/settings?tab=billing`,
        },
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
        router.push('/dashboard/workspace')
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarCollapsed(!sidebarCollapsed)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, commandPalette, sidebarCollapsed])

  return (
    <RequireAuth>
      <WorkspaceContext.Provider value={workspaceContextValue}>
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
                  ReverseAI
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
                      {workspaceLoading
                        ? '...'
                        : activeWorkspace
                          ? activePlan.label
                          : 'Not selected'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-foreground-muted" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 bg-surface-100 border-border p-0">
                  {/* Active workspace info */}
                  {activeWorkspace && (
                    <div className="px-3 py-2.5 border-b border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold text-foreground truncate mr-2">
                          {activeWorkspace.name}
                        </span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 text-[9px] font-semibold rounded shrink-0',
                            activePlan.bgColor,
                            activePlan.color
                          )}
                        >
                          {activePlan.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-foreground-lighter">
                        <span>/{activeWorkspace.slug}</span>
                        <span>·</span>
                        <span>{quotaLoading ? 'Syncing...' : `Usage ${quotaUsageLabel}`}</span>
                      </div>
                    </div>
                  )}

                  {/* Quick actions */}
                  {activeWorkspace && (
                    <div className="py-1 border-b border-border">
                      <DropdownMenuItem asChild className="text-[12px] h-8 px-3">
                        <Link href="/dashboard/workspace" className="flex items-center gap-2.5">
                          <Bot className="w-3.5 h-3.5 text-foreground-lighter" />
                          Workspace
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-[12px] h-8 px-3">
                        <Link href={`/dashboard/workspaces/${activeWorkspace.id}/settings?tab=members`} className="flex items-center gap-2.5">
                          <Users className="w-3.5 h-3.5 text-foreground-lighter" />
                          Members
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-[12px] h-8 px-3">
                        <Link href={`/dashboard/workspaces/${activeWorkspace.id}/settings?tab=billing`} className="flex items-center gap-2.5">
                          <CreditCard className="w-3.5 h-3.5 text-foreground-lighter" />
                          Usage & Billing
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-[12px] h-8 px-3">
                        <Link href={`/dashboard/workspaces/${activeWorkspace.id}/settings`} className="flex items-center gap-2.5">
                          <Settings className="w-3.5 h-3.5 text-foreground-lighter" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    </div>
                  )}

                  {/* Workspace list */}
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-[10px] font-medium text-foreground-lighter uppercase tracking-wider">
                      All workspaces
                    </div>
                    <div className="max-h-[200px] overflow-y-auto scrollbar-thin">
                      {workspaceLoading ? (
                        <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-foreground-lighter">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Loading...
                        </div>
                      ) : workspaces.length === 0 ? (
                        <DropdownMenuItem asChild className="text-[12px] h-8 px-3">
                          <Link href="/dashboard/workspace" className="flex items-center gap-2.5">
                            <Plus className="w-3.5 h-3.5 text-foreground-lighter" />
                            Create workspace
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        workspaces.map((workspace) => {
                          const plan = resolvePlanConfig(workspace.plan)
                          const isActiveWorkspace = workspace.id === activeWorkspaceId
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
                                'flex items-center gap-2.5 px-3 h-8 text-[12px]',
                                isActiveWorkspace && 'bg-surface-200/60',
                                isDisabled && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              <div
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full shrink-0',
                                  workspace.status === 'active' ? 'bg-emerald-500' : 'bg-foreground-muted/30'
                                )}
                              />
                              <span className="truncate flex-1 font-medium">{workspace.name}</span>
                              <span
                                className={cn(
                                  'px-1.5 py-0.5 text-[9px] font-semibold rounded shrink-0',
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
                    </div>
                    {hasRestrictedWorkspaces && (
                      <div className="px-3 py-1.5 text-[10px] text-foreground-lighter">
                        Some workspaces are paused or restricted.
                      </div>
                    )}
                  </div>

                  {/* Recent */}
                  {recentWorkspaces.length > 0 && (
                    <div className="py-1 border-t border-border">
                      <div className="px-3 py-1.5 text-[10px] font-medium text-foreground-lighter uppercase tracking-wider">
                        Recent
                      </div>
                      {recentWorkspaces.map((workspace) => {
                        const plan = resolvePlanConfig(workspace.plan)
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
                              'flex items-center gap-2.5 px-3 h-8 text-[12px]',
                              isDisabled && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <Clock className="w-3 h-3 text-foreground-lighter shrink-0" />
                            <span className="truncate flex-1">{workspace.name}</span>
                            <span
                              className={cn(
                                'px-1.5 py-0.5 text-[9px] font-semibold rounded shrink-0',
                                plan.bgColor,
                                plan.color
                              )}
                            >
                              {plan.label}
                            </span>
                          </DropdownMenuItem>
                        )
                      })}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <span className="text-foreground-muted">/</span>

              {/* Current page context */}
              {!workspaceLoading && activeWorkspace && (
                <span className="hidden md:inline text-[11px] text-foreground-lighter truncate max-w-[120px]">
                  {activeWorkspace.slug}
                </span>
              )}

              <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-warning/15 text-warning">
                PRODUCTION
              </span>

              {/* Right sideToolbar */}
              <div className="ml-auto flex items-center gap-1.5">
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
                <NotificationDropdown />

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
                        <AvatarImage src={user?.avatar_url} />
                        <AvatarFallback className="bg-surface-200 text-foreground-light text-xs">
                          {user?.display_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-surface-100 border-border p-0">
                    <div className="px-3 py-2.5 border-b border-border">
                      <p className="text-[12px] font-semibold text-foreground truncate">
                        {user?.display_name || user?.username}
                      </p>
                      <p className="text-[11px] text-foreground-lighter truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <DropdownMenuItem asChild className="text-[12px] h-8 px-3">
                        <Link href="/dashboard/profile" className="flex items-center gap-2.5">
                          <User className="w-3.5 h-3.5 text-foreground-lighter" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-[12px] h-8 px-3">
                        <Link href="/dashboard/settings" className="flex items-center gap-2.5">
                          <Settings className="w-3.5 h-3.5 text-foreground-lighter" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-[12px] h-8 px-3">
                        <Link href={`/dashboard/workspaces/${activeWorkspace?.id}/settings?tab=billing`} className="flex items-center gap-2.5">
                          <CreditCard className="w-3.5 h-3.5 text-foreground-lighter" />
                          Billing
                        </Link>
                      </DropdownMenuItem>
                    </div>
                    <div className="py-1 border-t border-border">
                      <DropdownMenuItem
                        icon={<LogOut className="w-3.5 h-3.5" />}
                        destructive
                        onClick={() => logout()}
                        className="h-8 px-3 cursor-pointer"
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
                  isSetupPage
                    ? 'w-0 border-r-0 hidden'
                    : sidebarCollapsed
                      ? 'w-[52px]'
                      : 'w-[188px]'
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
                                  onClick={() => {
                                    setActiveConversation(conv.id)
                                    router.push(`/dashboard/workspace?session=${conv.id}`)
                                  }}
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
                                {activePlan.label} Plan
                              </span>
                            </div>
                            <Link
                              href={`/dashboard/workspaces/${activeWorkspace?.id}/settings?tab=billing`}
                              className="text-[10px] text-brand-500 hover:underline"
                            >
                              Upgrade
                            </Link>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden bg-surface-300">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{
                                width: `${quotaUsagePercent !== null ? Math.min(Math.round(quotaUsagePercent * 100), 100) : 0}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] mt-1 text-foreground-muted">
                            <span>Usage {quotaUsageLabel}</span>
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


            {/* CommandPanel */}
            {commandPalette.isOpen && (
              <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />
            )}
          </div>
        </TooltipProvider>
      </WorkspaceContext.Provider>
    </RequireAuth>
  )
}
