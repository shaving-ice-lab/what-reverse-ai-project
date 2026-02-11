'use client'

/**
 * Workbench - AppList
 */

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { appApi, type App } from '@/lib/api'
import {
  PageContainer,
  PageHeader,
  PageWithSidebar,
  EmptyState,
} from '@/components/dashboard/page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Layers,
  Loader2,
  Plus,
  Search,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'

const statusStyles: Record<
  string,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error' }
> = {
  draft: { label: 'Draft', variant: 'default' },
  published: { label: 'Published', variant: 'success' },
  deprecated: { label: 'Deprecated', variant: 'warning' },
  archived: { label: 'Archived', variant: 'error' },
}


function formatDate(value?: string | null) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default function AppsPage() {
  const router = useRouter()
  const { workspaceId: activeWorkspaceId, workspace: activeWorkspace, workspaces, isLoading: workspaceLoading } = useWorkspace()
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [showCreateAppDialog, setShowCreateAppDialog] = useState(false)
  const [createAppForm, setCreateAppForm] = useState({ name: '', slug: '', description: '' })
  const [isCreatingApp, setIsCreatingApp] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await appApi.list({ page: 1, pageSize: 50 })
        if (!mounted) return
        setApps(response.items || [])
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load app')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const filteredApps = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return apps
    return apps.filter((app) => {
      return (
        app.name.toLowerCase().includes(keyword) ||
        app.slug.toLowerCase().includes(keyword) ||
        (app.description || '').toLowerCase().includes(keyword)
      )
    })
  }, [apps, query])

  const workspaceApps = useMemo(() => {
    if (!activeWorkspaceId) return []
    return apps.filter((app) => app.id === activeWorkspaceId)
  }, [apps, activeWorkspaceId])

  const workspaceAppsPreview = useMemo(() => workspaceApps.slice(0, 3), [workspaceApps])

  const primaryWorkspaceApp = workspaceAppsPreview[0]
  const workspaceAppsHref = '/dashboard/apps'
  const monitoringHref = primaryWorkspaceApp
    ? `/dashboard/app/${primaryWorkspaceApp.id}/monitoring`
    : workspaceAppsHref

  const handleCreateAppNameChange = useCallback((name: string) => {
    setCreateAppForm((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    }))
  }, [])

  const handleCreateApp = useCallback(async () => {
    if (!activeWorkspaceId || !createAppForm.name || !createAppForm.slug) return
    try {
      setIsCreatingApp(true)
      const app = await appApi.create({
        workspace_id: activeWorkspaceId,
        name: createAppForm.name.trim(),
        slug: createAppForm.slug.trim(),
        description: createAppForm.description.trim() || undefined,
      })
      setShowCreateAppDialog(false)
      setCreateAppForm({ name: '', slug: '', description: '' })
      setApps((prev) => [...prev, app])
      router.push(`/dashboard/app/${app.id}/builder`)
    } catch (err) {
      console.error('Failed to create app:', err)
    } finally {
      setIsCreatingApp(false)
    }
  }, [activeWorkspaceId, createAppForm, router])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    apps.forEach((app) => {
      counts[app.status] = (counts[app.status] || 0) + 1
    })
    return counts
  }, [apps])

  const sidebar = (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
          Current Workspace
        </div>
        {workspaceLoading ? (
          <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading...
          </div>
        ) : activeWorkspace ? (
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="text-[12px] font-medium text-foreground">
                {activeWorkspace.name}
              </div>
              <div className="text-[10px] text-foreground-muted">
                /{activeWorkspace.slug} · {activeWorkspace.plan?.toUpperCase() ?? 'PLAN'}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-foreground-muted">
              <span>Status</span>
              <span className="text-foreground">{activeWorkspace.app_status || 'draft'}</span>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-foreground-muted">No workspace selected.</div>
        )}
        <div className="flex items-center justify-between text-[11px] text-foreground-muted">
          <Link href="/dashboard/workspaces" className="hover:text-foreground">
            Workspace List
          </Link>
          {activeWorkspaceId && (
            <Link href={`/dashboard/app/${activeWorkspaceId}/builder`} className="text-brand-500 hover:text-brand-400">
              Open Builder
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-foreground-muted">App Search</div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search app name or slug"
            className="pl-8 h-8 bg-surface-75 border-border"
          />
        </div>
        <div className="text-[10px] text-foreground-muted">
          {filteredApps.length} / {apps.length}
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
          Status Distribution
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {Object.entries(statusStyles).map(([key, style]) => (
            <div key={key} className="rounded-md border border-border bg-surface-75 px-2 py-2">
              <div className="text-foreground-muted">{style.label}</div>
              <div className="text-foreground font-semibold">{statusCounts[key] || 0}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-foreground-muted">App</div>
        {workspaceAppsPreview.length > 0 ? (
          <div className="space-y-2">
            {workspaceAppsPreview.map((app) => (
              <div key={app.id} className="flex items-center justify-between text-[12px]">
                <span className="truncate text-foreground">{app.name}</span>
                <Link
                  href={`/dashboard/app/${app.id}/monitoring`}
                  className="text-[11px] text-brand-500 hover:text-brand-400"
                >
                  Monitor
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-foreground-muted">
            {activeWorkspaceId ? 'No apps' : 'Select a workspace to view apps'}
          </div>
        )}
        <div className="flex items-center justify-between text-[11px] text-foreground-muted">
          <span>Run & monitor</span>
          <Link href={monitoringHref} className="text-brand-500 hover:text-brand-400">
            Open Monitor
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <PageWithSidebar sidebarTitle="Workbench" sidebarWidth="wide" sidebar={sidebar}>
      <PageContainer>
        <PageHeader
          title="Workbench"
          eyebrow="Apps"
          icon={<LayoutGrid className="h-4 w-4" />}
          description="View and manage app runtime; enter edit mode to update workflow and config."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowCreateAppDialog(true)}
                disabled={!activeWorkspaceId}
                title={!activeWorkspaceId ? 'Select a workspace first' : undefined}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create App
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/dashboard/workflows/new">
                  <Layers className="h-4 w-4 mr-1.5" />
                  Create Workflow
                </Link>
              </Button>
            </div>
          }
        />

        <section id="apps-list" className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-foreground-muted">Apps</div>
              <h2 className="text-sm font-medium text-foreground">App list</h2>
              <p className="text-xs text-foreground-light">
                {query ? `Current search: ${query}` : 'Manage apps by workspace'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateAppDialog(true)}
                disabled={!activeWorkspaceId}
                title={!activeWorkspaceId ? 'Select a workspace first' : undefined}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create App
              </Button>
              <Badge variant="secondary" size="xs" className="bg-surface-200 text-foreground-light">
                {filteredApps.length} / {apps.length}
              </Badge>
            </div>
          </div>

          <div>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading app list...
              </div>
            ) : error ? (
              <EmptyState
                icon={<Layers className="h-5 w-5" />}
                title="Failed to Load Apps"
                description={error}
              />
            ) : filteredApps.length === 0 ? (
              <EmptyState
                icon={<Layers className="h-5 w-5" />}
                title="No apps"
                description="Create an app from a workflow or AI first, then manage it here in the Workbench."
                action={
                  activeWorkspaceId
                    ? { label: 'Create App', onClick: () => setShowCreateAppDialog(true) }
                    : { label: 'Create workflow', href: '/dashboard/workflows/new' }
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredApps.map((app) => {
                  const status = statusStyles[app.status] || {
                    label: app.status,
                    variant: 'default' as const,
                  }
                  return (
                    <div
                      key={app.id}
                      className={cn(
                        'group rounded-lg border border-border bg-surface-100 p-4',
                        'hover:border-brand-500/50 hover:shadow-sm transition'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-md bg-surface-200 flex items-center justify-center text-lg">
                            {app.icon || '\uD83D\uDCE6'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-foreground truncate">
                                {app.name}
                              </h3>
                              <Badge variant={status.variant} size="xs">
                                {status.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-foreground-muted truncate">/{app.slug}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-foreground-muted hover:text-foreground"
                          asChild
                        >
                          <Link href={`/dashboard/app/${app.id}/builder`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>

                      {app.description && (
                        <p className="mt-3 text-xs text-foreground-light line-clamp-2">
                          {app.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between text-xs text-foreground-muted">
                        <span>Workspace: {app.name || 'Unnamed workspace'}</span>
                        <span>Updated at {formatDate(app.updated_at)}</span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-foreground-muted">
                        <span>Version: {app.current_version_id ? 'Bound' : 'Unbound'}</span>
                        <Link
                          href={`/dashboard/app/${app.id}/builder`}
                          className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-400"
                        >
                          Open Editor
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>


        <Dialog open={showCreateAppDialog} onOpenChange={setShowCreateAppDialog}>
          <DialogContent className="sm:max-w-md bg-surface-100 border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create App</DialogTitle>
              <DialogDescription className="text-foreground-light">
                Create a new app in the current workspace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-[12px] font-medium text-foreground mb-2">
                  App Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g., Daily Assistant"
                  value={createAppForm.name}
                  onChange={(e) => handleCreateAppNameChange(e.target.value)}
                  className="h-9 bg-surface-75 border-border focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-foreground mb-2">
                  URL Identifier <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {activeWorkspace && (
                    <span className="text-[12px] text-foreground-muted shrink-0">
                      /{activeWorkspace.slug}/
                    </span>
                  )}
                  <Input
                    placeholder="daily-assistant"
                    value={createAppForm.slug}
                    onChange={(e) =>
                      setCreateAppForm((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    className="h-9 bg-surface-75 border-border focus:border-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-foreground mb-2">
                  Description (optional)
                </label>
                <Input
                  placeholder="Describe app features..."
                  value={createAppForm.description}
                  onChange={(e) =>
                    setCreateAppForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="h-9 bg-surface-75 border-border focus:border-brand-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateAppDialog(false)}
                className="border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateApp}
                disabled={!createAppForm.name || !createAppForm.slug || isCreatingApp}
              >
                {isCreatingApp && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </PageWithSidebar>
  )
}
