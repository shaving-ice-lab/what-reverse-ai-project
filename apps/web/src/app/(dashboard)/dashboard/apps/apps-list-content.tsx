'use client'

/**
 * App List and Management Page - Supabase Style
 * App List, Status Filter, Create Entry, Publish Action
 */

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Users,
  Clock,
  ChevronRight,
  Loader2,
  Bot,
  Zap,
  Settings,
  Trash2,
  Copy,
  ExternalLink,
  BarChart3,
  Rocket,
  Archive,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageContainer, PageHeader, EmptyState } from '@/components/dashboard/page-layout'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { appApi, type App } from '@/lib/api/workspace'
import { workspaceApi, type Workspace } from '@/lib/api/workspace'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  buildWorkspacePermissions,
  hasAnyWorkspacePermission,
  resolveWorkspaceRoleFromUser,
} from '@/lib/permissions'
import { PermissionAction } from '@/components/permissions/permission-action'

// Status Config
const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  draft: { label: 'Draft', color: 'text-foreground-muted', bgColor: 'bg-surface-200', icon: Edit3 },
  published: {
    label: 'Published',
    color: 'text-brand-500',
    bgColor: 'bg-brand-200',
    icon: CheckCircle2,
  },
  deprecated: {
    label: 'Deprecated',
    color: 'text-warning',
    bgColor: 'bg-warning-200',
    icon: AlertCircle,
  },
  archived: {
    label: 'Archived',
    color: 'text-foreground-muted',
    bgColor: 'bg-surface-200',
    icon: Archive,
  },
}

const statusOrder: Record<string, number> = {
  published: 0,
  draft: 1,
  deprecated: 2,
  archived: 3,
}

const sortOptions = [
  { value: 'updated_desc', label: 'Recently Updated' },
  { value: 'updated_asc', label: 'Oldest Updated' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'status', label: 'Status Priority' },
]

// Access Config
const accessModeConfig: Record<
  string,
  { label: string; icon: React.ElementType; description: string }
> = {
  private: { label: 'Private', icon: Lock, description: 'Only members can access' },
  public_auth: {
    label: 'Requires Sign In',
    icon: Users,
    description: 'Signed-in users can access',
  },
  public_anonymous: { label: 'Public', icon: Globe, description: 'Anyone can access' },
}

const visibilityOptions = [
  { value: 'all', label: 'All Visibility' },
  ...Object.entries(accessModeConfig).map(([key, config]) => ({
    value: key,
    label: config.label,
  })),
]

const domainStatusOptions = [
  { value: 'all', label: 'Domain Status' },
  { value: 'bound', label: 'Bound' },
  { value: 'unbound', label: 'Unbound' },
]

const timeRangeOptions = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

export default function AppsPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const { user } = useAuthStore()
  const workspaceRole = resolveWorkspaceRoleFromUser(user?.role)
  const permissions = buildWorkspacePermissions(workspaceRole)
  const canCreate = hasAnyWorkspacePermission(permissions, 'workspace_create', 'workspace_edit')
  const canPublish = hasAnyWorkspacePermission(permissions, 'workspace_publish')
  const canEdit = hasAnyWorkspacePermission(permissions, 'workspace_edit')

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [apps, setApps] = useState<App[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<string>('updated_desc')
  const [origin, setOrigin] = useState('')
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null)
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set())
  const [isBulkPublishing, setIsBulkPublishing] = useState(false)
  const [isBulkArchiving, setIsBulkArchiving] = useState(false)
  const [bulkActionError, setBulkActionError] = useState<string | null>(null)

  // Create App Dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', slug: '', description: '' })
  const [isCreating, setIsCreating] = useState(false)

  // Load Data
  useEffect(() => {
    loadData()
  }, [workspaceId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [ws, appsData] = await Promise.all([
        workspaceApi.get(workspaceId),
        appApi.list({ workspace_id: workspaceId }),
      ])
      setWorkspace(ws)
      setApps(appsData.items)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-generate slug
  const handleNameChange = (name: string) => {
    setCreateForm({
      ...createForm,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-|-$/g, ''),
    })
  }

  // Create App
  const handleCreate = async () => {
    if (!createForm.name || !createForm.slug) return

    try {
      setIsCreating(true)
      const app = await appApi.create({
        workspace_id: workspaceId,
        name: createForm.name,
        slug: createForm.slug,
        description: createForm.description || undefined,
      })
      setShowCreateDialog(false)
      setCreateForm({ name: '', slug: '', description: '' })
      router.push(`/dashboard/app/${app.id}/builder`)
    } catch (error) {
      console.error('Failed to create app:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // Publish App
  const handlePublish = async (appId: string) => {
    try {
      await appApi.publish(appId)
      loadData()
    } catch (error) {
      console.error('Failed to publish app:', error)
    }
  }

  // Deprecate App
  const handleDeprecate = async (appId: string) => {
    try {
      await appApi.deprecate(appId)
      loadData()
    } catch (error) {
      console.error('Failed to deprecate app:', error)
    }
  }

  // Archive App
  const handleArchive = async (appId: string) => {
    try {
      await appApi.archive(appId)
      loadData()
    } catch (error) {
      console.error('Failed to archive app:', error)
    }
  }

  // Filter Apps
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    const accessMode = app.access_policy?.access_mode || 'private'
    const matchesVisibility = visibilityFilter === 'all' || accessMode === visibilityFilter
    const matchesDomain = domainFilter === 'all' || resolveDomainStatus(app) === domainFilter
    const timeRangeDays =
      timeRangeFilter === '7d'
        ? 7
        : timeRangeFilter === '30d'
          ? 30
          : timeRangeFilter === '90d'
            ? 90
            : null
    const updatedAt = parseTimestamp(app.updated_at)
    const matchesTimeRange =
      !timeRangeDays || (updatedAt && Date.now() - updatedAt <= timeRangeDays * 86400000)
    return matchesSearch && matchesStatus && matchesVisibility && matchesDomain && matchesTimeRange
  })

  const parseTimestamp = (value?: string) => {
    if (!value) return 0
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const formatShortDate = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('zh-CN')
  }

  const resolveDomain = (app: App) => {
    const candidate =
      (
        app as {
          domain?: string
          custom_domain?: string
          primary_domain?: string
        }
      ).domain ||
      (app as { custom_domain?: string }).custom_domain ||
      (app as { primary_domain?: string }).primary_domain
    return candidate || 'Unbound'
  }

  const resolveLastRun = (app: App) => {
    const candidate =
      (app as { last_run_at?: string; latest_execution_at?: string }).last_run_at ||
      (app as { latest_execution_at?: string }).latest_execution_at
    const fallback = app.updated_at || app.published_at || app.created_at
    const value = candidate || fallback
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('zh-CN')
  }

  const resolveDomainStatus = (app: App) => {
    const domain = resolveDomain(app)
    return domain === 'Unbound' ? 'unbound' : 'bound'
  }

  const resolveRuntimeLink = (app: App) => {
    if (origin && workspace?.slug) {
      return `${origin}/runtime/${workspace.slug}/${app.slug}`
    }
    return `/dashboard/app/${app.id}`
  }

  const handleCopyLink = async (app: App) => {
    const link = resolveRuntimeLink(app)
    try {
      await navigator.clipboard.writeText(link)
      setCopiedAppId(app.id)
      setTimeout(() => setCopiedAppId(null), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const toggleSelectApp = (appId: string, checked: boolean | 'indeterminate') => {
    setSelectedAppIds((prev) => {
      const next = new Set(prev)
      if (checked === true) {
        next.add(appId)
      } else {
        next.delete(appId)
      }
      return next
    })
  }

  const toggleSelectAll = (checked: boolean | 'indeterminate', appIds: string[]) => {
    setSelectedAppIds((prev) => {
      if (checked === true) {
        const next = new Set(prev)
        appIds.forEach((id) => next.add(id))
        return next
      }
      const next = new Set(prev)
      appIds.forEach((id) => next.delete(id))
      return next
    })
  }

  const handleBulkPublish = async (appsToPublish: App[]) => {
    if (appsToPublish.length === 0) return
    try {
      setIsBulkPublishing(true)
      setBulkActionError(null)
      for (const app of appsToPublish) {
        await appApi.publish(app.id)
      }
      setSelectedAppIds(new Set())
      await loadData()
    } catch (error) {
      console.error('Failed to bulk publish:', error)
      setBulkActionError('Failed to batch publish apps. Please try again later.')
    } finally {
      setIsBulkPublishing(false)
    }
  }

  const handleBulkArchive = async (appsToArchive: App[]) => {
    if (appsToArchive.length === 0) return
    const confirmed = window.confirm('Archive selected apps?')
    if (!confirmed) return
    try {
      setIsBulkArchiving(true)
      setBulkActionError(null)
      for (const app of appsToArchive) {
        await appApi.archive(app.id)
      }
      setSelectedAppIds(new Set())
      await loadData()
    } catch (error) {
      console.error('Failed to bulk archive:', error)
      setBulkActionError('Failed to batch archive apps. Please try again later.')
    } finally {
      setIsBulkArchiving(false)
    }
  }

  const sortedApps = [...filteredApps].sort((a, b) => {
    if (sortKey === 'updated_asc') {
      return parseTimestamp(a.updated_at) - parseTimestamp(b.updated_at)
    }
    if (sortKey === 'updated_desc') {
      return parseTimestamp(b.updated_at) - parseTimestamp(a.updated_at)
    }
    if (sortKey === 'name_asc') {
      return a.name.localeCompare(b.name, 'zh-CN', { sensitivity: 'base' })
    }
    if (sortKey === 'name_desc') {
      return b.name.localeCompare(a.name, 'zh-CN', { sensitivity: 'base' })
    }
    if (sortKey === 'status') {
      const rankA = statusOrder[a.status] ?? 99
      const rankB = statusOrder[b.status] ?? 99
      if (rankA !== rankB) return rankA - rankB
      return b.name.localeCompare(a.name, 'zh-CN', { sensitivity: 'base' })
    }
    return 0
  })

  const visibleAppIds = sortedApps.map((app) => app.id)
  const selectedVisibleCount = visibleAppIds.filter((id) => selectedAppIds.has(id)).length
  const allVisibleSelected =
    visibleAppIds.length > 0 && selectedVisibleCount === visibleAppIds.length
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected
  const selectedApps = sortedApps.filter((app) => selectedAppIds.has(app.id))
  const publishableApps = selectedApps.filter((app) => app.status === 'draft')

  // Get Status Config
  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.draft
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* PageHeader */}
        <PageHeader
          title="App management"
          eyebrow={workspace?.name}
          description="Manage workspace apps, publish, and monitor run status"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workspaces/${workspaceId}/settings`}>
                  <Settings className="w-4 h-4 mr-1.5" />
                  Settings
                </Link>
              </Button>
              <PermissionAction
                permissions={permissions}
                required={['workspace_create', 'workspace_edit']}
                label="Create app"
                icon={Plus}
                size="sm"
                onClick={() => setShowCreateDialog(true)}
              />
            </div>
          }
        >
          {/* Statistics Info */}
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              {apps.length} App
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {apps.filter((a) => a.status === 'published').length} Published
            </span>
          </div>
        </PageHeader>

        {/* Search and Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <Input
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-surface-75 border-border focus:bg-surface-100 focus:border-brand-500"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 bg-surface-75 border-border">
              <SelectValue placeholder="Status filter" />
            </SelectTrigger>
            <SelectContent className="bg-surface-100 border-border">
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger className="w-[120px] h-9 bg-surface-75 border-border">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent className="bg-surface-100 border-border">
              {visibilityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-[120px] h-9 bg-surface-75 border-border">
              <SelectValue placeholder="Domain status" />
            </SelectTrigger>
            <SelectContent className="bg-surface-100 border-border">
              {domainStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
            <SelectTrigger className="w-[120px] h-9 bg-surface-75 border-border">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent className="bg-surface-100 border-border">
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="w-[140px] h-9 bg-surface-75 border-border">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="bg-surface-100 border-border">
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAppIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-100 px-4 py-3">
            <div className="text-[12px] text-foreground-light">
              {selectedAppIds.size} {selectedAppIds.size === 1 ? 'app' : 'apps'} selected
              {publishableApps.length > 0 && (
                <span className="text-foreground-muted">
                  , {publishableApps.length} can be published
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canPublish ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkPublish(publishableApps)}
                  disabled={publishableApps.length === 0 || isBulkPublishing}
                >
                  {isBulkPublishing && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  Batch Publish
                </Button>
              ) : (
                <PermissionAction
                  permissions={permissions}
                  required={['workspace_publish']}
                  label="Batch publish"
                  icon={Rocket}
                  size="sm"
                  variant="outline"
                />
              )}
              {canEdit ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkArchive(selectedApps)}
                  disabled={selectedApps.length === 0 || isBulkArchiving}
                >
                  {isBulkArchiving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  Batch Archive
                </Button>
              ) : (
                <PermissionAction
                  permissions={permissions}
                  required={['workspace_edit']}
                  label="Batch archive"
                  icon={Archive}
                  size="sm"
                  variant="outline"
                />
              )}
            </div>
            {bulkActionError && (
              <div className="text-[11px] text-destructive">{bulkActionError}</div>
            )}
          </div>
        )}

        {/* App List */}
        {filteredApps.length === 0 ? (
          <EmptyState
            icon={<Bot className="w-6 h-6" />}
            title={searchQuery || statusFilter !== 'all' ? 'No matching apps' : 'No apps'}
            description={
              searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter conditions'
                : 'Create your first app and start building AI workflows'
            }
            action={
              !searchQuery && statusFilter === 'all' && canCreate
                ? {
                    label: 'Create App',
                    onClick: () => setShowCreateDialog(true),
                  }
                : undefined
            }
          />
        ) : (
          <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
            {/* head */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
              <div className="col-span-3 flex items-center gap-2">
                <Checkbox
                  checked={
                    allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false
                  }
                  onCheckedChange={(checked) => toggleSelectAll(checked, visibleAppIds)}
                  aria-label="Select all apps"
                />
                <span>App</span>
              </div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Visibility</div>
              <div className="col-span-1">Version</div>
              <div className="col-span-1">Domain</div>
              <div className="col-span-1">Last Run</div>
              <div className="col-span-1">Updated At</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            {/* App Row */}
            {sortedApps.map((app) => {
              const status = getStatusConfig(app.status)
              const StatusIcon = status.icon
              const accessMode = app.access_policy?.access_mode || 'private'
              const access = accessModeConfig[accessMode] || accessModeConfig.private
              const AccessIcon = access.icon

              return (
                <div
                  key={app.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border last:border-b-0 hover:bg-surface-75 transition-colors"
                >
                  {/* App Info */}
                  <div className="col-span-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedAppIds.has(app.id)}
                        onCheckedChange={(checked) => toggleSelectApp(app.id, checked)}
                        aria-label={`Select app ${app.name}`}
                        className="mt-2"
                      />
                      <Link
                        href={`/dashboard/app/${app.id}`}
                        className="group flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-md bg-surface-200 border border-border flex items-center justify-center text-foreground-light group-hover:border-brand-500/50 transition-colors">
                          {app.icon ? (
                            <span className="text-lg">{app.icon}</span>
                          ) : (
                            <Bot className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-[13px] font-medium text-foreground group-hover:text-brand-500 transition-colors">
                            {app.name}
                          </h3>
                          <p className="text-[11px] text-foreground-muted">
                            /{workspace?.slug}/{app.slug}
                          </p>
                          <p className="text-[10px] text-foreground-muted mt-1">
                            Updated at {formatShortDate(app.updated_at)}
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center">
                    <Badge
                      variant="secondary"
                      className={cn('gap-1', status.bgColor, status.color)}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Visibility */}
                  <div className="col-span-1 flex items-center">
                    <span className="flex items-center gap-1 text-[11px] text-foreground-light">
                      <AccessIcon className="w-3.5 h-3.5" />
                      {access.label}
                    </span>
                  </div>

                  {/* Version */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-[12px] text-foreground-light">
                      {app.current_version?.version || 'v0.0.0'}
                    </span>
                  </div>

                  {/* Domain */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-[11px] text-foreground-light truncate">
                      {resolveDomain(app)}
                    </span>
                  </div>

                  {/* Last Run */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-[11px] text-foreground-light">{resolveLastRun(app)}</span>
                  </div>

                  {/* Updated At */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-[11px] text-foreground-light">
                      {formatShortDate(app.updated_at)}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {/* Quick Actions */}
                    {app.status === 'draft' && (
                      <PermissionAction
                        permissions={permissions}
                        required={['workspace_publish']}
                        label="Publish"
                        icon={Rocket}
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => handlePublish(app.id)}
                      />
                    )}

                    {app.status === 'published' && (
                      <Button variant="outline" size="sm" asChild className="h-8">
                        <Link href={`/dashboard/app/${app.id}/monitoring`}>
                          <BarChart3 className="w-3.5 h-3.5 mr-1" />
                          Monitor
                        </Link>
                      </Button>
                    )}

                    {/* More Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-surface-100 border-border"
                      >
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/app/${app.id}`}
                            className="flex items-center gap-2 text-[12px]"
                          >
                            <Eye className="w-4 h-4" />
                            App Overview
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/app/${app.id}/builder`}
                            className="flex items-center gap-2 text-[12px]"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit App
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCopyLink(app)}
                          className="flex items-center gap-2 text-[12px]"
                        >
                          <Copy className="w-4 h-4" />
                          {copiedAppId === app.id ? 'Link Copied' : 'Copy Link'}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/app/${app.id}/monitoring`}
                            className="flex items-center gap-2 text-[12px]"
                          >
                            <BarChart3 className="w-4 h-4" />
                            Run Monitor
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/app/${app.id}/domains`}
                            className="flex items-center gap-2 text-[12px]"
                          >
                            <Globe className="w-4 h-4" />
                            Domain Management
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-border" />

                        {app.status === 'published' && (
                          <DropdownMenuItem
                            onClick={() => handleDeprecate(app.id)}
                            className="text-[12px] text-warning"
                          >
                            <Pause className="w-4 h-4" />
                            Deprecate App
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => handleArchive(app.id)}
                          className="text-[12px] text-destructive"
                        >
                          <Archive className="w-4 h-4" />
                          Archive App
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create App Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create App</DialogTitle>
            <DialogDescription className="text-foreground-light">
              Create a new AI app
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                App Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., Daily Assistant"
                value={createForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="h-9 bg-surface-75 border-border focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                URL Identifier <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-foreground-muted shrink-0">
                  /{workspace?.slug}/
                </span>
                <Input
                  placeholder="daily-report"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                  className="h-9 bg-surface-75 border-border focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                Description (Optional)
              </label>
              <Input
                placeholder="Describe app features..."
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="h-9 bg-surface-75 border-border focus:border-brand-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createForm.name || !createForm.slug || isCreating}
            >
              {isCreating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
