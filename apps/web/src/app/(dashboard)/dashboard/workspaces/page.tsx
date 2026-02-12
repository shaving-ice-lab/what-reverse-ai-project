'use client'

/**
 * Apps Page — Supabase-style project list
 * Each workspace = one app with isolated database, AI Agent, and runtime.
 */

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  LayoutGrid,
  Bot,
  Globe,
  Loader2,
  FolderOpen,
  Clock,
  Database,
  ExternalLink,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { workspaceApi, type Workspace } from '@/lib/api/workspace'
import { useWorkspace } from '@/hooks/useWorkspace'

const planConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  free: { label: 'FREE', color: 'text-foreground-muted', bgColor: 'bg-surface-200' },
  pro: { label: 'PRO', color: 'text-brand-500', bgColor: 'bg-brand-200' },
  enterprise: { label: 'ENTERPRISE', color: 'text-warning', bgColor: 'bg-warning-200' },
}

const regionOptions = [
  { value: 'cn-east-1', label: 'China East' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'us-east-1', label: 'US East' },
]

const WORKSPACE_STORAGE_KEY = 'last_workspace_id'

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return isoDate
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function WorkspacesPage() {
  const router = useRouter()
  const { switchWorkspace } = useWorkspace()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    region: regionOptions[0]?.value || '',
  })
  const [isCreating, setIsCreating] = useState(false)

  const rememberWorkspace = useCallback(
    (workspaceId: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId)
      }
      switchWorkspace?.(workspaceId)
    },
    [switchWorkspace]
  )

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const data = await workspaceApi.list()
      setWorkspaces(data)
    } catch (error) {
      console.error('Failed to load apps:', error)
      setLoadError('Failed to load apps. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameChange = (name: string) => {
    setCreateForm((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
    }))
  }

  const handleCreate = async () => {
    if (!createForm.name || !createForm.slug || !createForm.region) return
    try {
      setIsCreating(true)
      const workspace = await workspaceApi.create({
        name: createForm.name,
        slug: createForm.slug,
        region: createForm.region,
      })
      setShowCreateDialog(false)
      setCreateForm({ name: '', slug: '', region: regionOptions[0]?.value || '' })
      rememberWorkspace(workspace.id)
      router.push('/dashboard/agent')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create app')
    } finally {
      setIsCreating(false)
    }
  }

  const filteredWorkspaces = workspaces.filter((ws) => {
    const q = searchQuery.toLowerCase()
    return ws.name.toLowerCase().includes(q) || ws.slug.toLowerCase().includes(q)
  })

  const getPlanConfig = (plan: string) => planConfig[plan] || planConfig.free

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Apps"
          description="Each app has its own database, AI Agent, and public runtime URL."
          actions={
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              New App
            </Button>
          }
        />

        {loadError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            {loadError}
          </div>
        )}

        {/* Search bar */}
        {workspaces.length > 0 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <Input
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-surface-75 border-border focus:border-brand-500"
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="w-6 h-6" />}
            title={searchQuery ? 'No matching apps' : 'No apps yet'}
            description={
              searchQuery
                ? 'Try a different search term.'
                : 'Create your first app and let AI build it for you.'
            }
            action={
              !searchQuery
                ? { label: 'Create New App', onClick: () => setShowCreateDialog(true) }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkspaces.map((workspace) => {
              const plan = getPlanConfig(workspace.plan)
              const isPublished = workspace.app_status === 'published'
              const isActive = workspace.status === 'active'
              return (
                <div
                  key={workspace.id}
                  className={cn(
                    'rounded-lg border bg-surface-100 transition-all overflow-hidden',
                    isActive
                      ? 'border-border hover:border-brand-500/40'
                      : 'border-border/50 opacity-60'
                  )}
                >
                  {/* Card Header */}
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-md bg-surface-200 border border-border flex items-center justify-center shrink-0">
                          {workspace.icon ? (
                            <span className="text-base">{workspace.icon}</span>
                          ) : (
                            <LayoutGrid className="w-4 h-4 text-foreground-muted" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[13px] font-medium text-foreground truncate">
                            {workspace.name}
                          </h3>
                          <p className="text-[11px] text-foreground-muted truncate">
                            /{workspace.slug}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[9px] font-semibold px-1.5',
                            isPublished
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-surface-200 text-foreground-muted'
                          )}
                        >
                          {isPublished ? 'Live' : 'Draft'}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[9px] font-semibold px-1.5',
                            plan.bgColor,
                            plan.color
                          )}
                        >
                          {plan.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-[10px] text-foreground-muted mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(workspace.updated_at)}
                      </span>
                      {workspace.region && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {workspace.region}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="px-4 py-2.5 border-t border-border bg-surface-75/50 flex items-center gap-1.5">
                    <Link
                      href="/dashboard/agent"
                      onClick={(e) => {
                        e.stopPropagation()
                        rememberWorkspace(workspace.id)
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-foreground-light hover:text-foreground hover:bg-surface-200/60 transition-colors"
                    >
                      <Bot className="w-3 h-3" />
                      Edit
                    </Link>
                    <Link
                      href="/dashboard/database"
                      onClick={(e) => {
                        e.stopPropagation()
                        rememberWorkspace(workspace.id)
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-foreground-light hover:text-foreground hover:bg-surface-200/60 transition-colors"
                    >
                      <Database className="w-3 h-3" />
                      Database
                    </Link>
                    {isPublished && workspace.slug && (
                      <Link
                        href={`/runtime/${workspace.slug}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-brand-500 hover:text-brand-400 hover:bg-brand-500/5 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open
                      </Link>
                    )}
                    <div className="flex-1" />
                    <Link
                      href={`/dashboard/workspaces/${workspace.id}/settings`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-foreground-muted hover:text-foreground hover:bg-surface-200/60 transition-colors"
                    >
                      <Settings className="w-3 h-3" />
                    </Link>
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
            <DialogTitle className="text-foreground">Create New App</DialogTitle>
            <DialogDescription className="text-foreground-light">
              Give your app a name. The AI Agent will help you build the database and UI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                App Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., Fleet Manager"
                value={createForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={100}
                className="h-9 bg-surface-75 border-border focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                URL Slug <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-foreground-muted shrink-0">reverseai.app/</span>
                <Input
                  placeholder="fleet-manager"
                  value={createForm.slug}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    }))
                  }
                  className="h-9 bg-surface-75 border-border focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">Region</label>
              <Select
                value={createForm.region}
                onValueChange={(region) => setCreateForm((prev) => ({ ...prev, region }))}
              >
                <SelectTrigger className="h-9 bg-surface-75 border-border">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent className="bg-surface-100 border-border">
                  {regionOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-border text-foreground-light hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createForm.name || !createForm.slug || !createForm.region || isCreating}
            >
              {isCreating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Create App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
