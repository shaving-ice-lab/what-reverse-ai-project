'use client'

/**
 * Workspace entry page - Supabase style
 * Workspace list, create, select
 */

import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Users,
  LayoutGrid,
  ChevronRight,
  Crown,
  Bot,
  Globe,
  Loader2,
  FolderOpen,
  Star,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  EmptyState,
  PageWithSidebar,
  SidebarNavGroup,
  SidebarNavItem,
} from '@/components/dashboard/page-layout'
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

// PlanConfig
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

const workspaceSidebarLinks = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'create', label: 'Create Workspace', icon: Plus },
  { id: 'guides', label: 'Plans & Regions', icon: Crown },
  { id: 'list', label: 'Workspace List', icon: FolderOpen },
]

const WORKSPACE_STORAGE_KEY = 'last_workspace_id'

function CreateWorkspaceFormFields({
  createForm,
  onNameChange,
  onSlugChange,
  onRegionChange,
}: {
  createForm: { name: string; slug: string; region: string }
  onNameChange: (name: string) => void
  onSlugChange: (slug: string) => void
  onRegionChange: (region: string) => void
}) {
  return (
    <>
      <div>
        <label className="block text-[12px] font-medium text-foreground mb-2">
          Workspace Name <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="e.g., My Team"
          value={createForm.name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={100}
          className="h-9 bg-surface-75 border-border focus:border-brand-500"
        />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-foreground mb-2">
          URL Identifier <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-foreground-muted shrink-0">agentflow.app/</span>
          <Input
            placeholder="my-team"
            value={createForm.slug}
            onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className="h-9 bg-surface-75 border-border focus:border-brand-500"
          />
        </div>
        <p className="text-[11px] text-foreground-muted mt-1.5">
          Can contain lowercase letters, numbers, and hyphens
        </p>
      </div>

      <div>
        <label className="block text-[12px] font-medium text-foreground mb-2">
          Deploy Region <span className="text-destructive">*</span>
        </label>
        <Select value={createForm.region} onValueChange={onRegionChange}>
          <SelectTrigger className="h-9 bg-surface-75 border-border">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent className="bg-surface-100 border-border">
            {regionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}

export default function WorkspacesPage() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinHint, setJoinHint] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    region: regionOptions[0]?.value || '',
  })
  const [isCreating, setIsCreating] = useState(false)

  const rememberWorkspace = (workspaceId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId)
    }
  }

  // LoadWorkspaceList
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
      console.error('Failed to load workspaces:', error)
      setLoadError('Failed to load workspaces. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  // AutoGenerate slug
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

  // CreateWorkspace
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
      setCreateForm({
        name: '',
        slug: '',
        region: regionOptions[0]?.value || '',
      })
      rememberWorkspace(workspace.id)
      router.push('/dashboard/apps')
    } catch (error: any) {
      const message = error?.message || 'Failed to create workspace'
      toast.error(message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setShowCreateDialog(false)
    setCreateForm({
      name: '',
      slug: '',
      region: regionOptions[0]?.value || '',
    })
  }

  const handleJoinWorkspace = () => {
    if (!joinCode.trim()) {
      setJoinHint('Please enter an invite link or code')
      return
    }
    setJoinHint('Invite info recorded. Please contact the admin to complete joining.')
    setShowJoinDialog(false)
    setJoinCode('')
  }

  // FilterWorkspace
  const filteredWorkspaces = workspaces.filter((ws) => {
    const matchesSearch =
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.slug.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // FetchPlanConfig
  const getPlanConfig = (plan: string) => {
    return planConfig[plan] || planConfig.free
  }

  const workspaceStats = useMemo(() => {
    const stats = {
      total: workspaces.length,
      active: 0,
      suspended: 0,
      deleted: 0,
      planFree: 0,
      planPro: 0,
      planEnterprise: 0,
    }
    workspaces.forEach((workspace) => {
      if (workspace.status === 'active') stats.active += 1
      if (workspace.status === 'suspended') stats.suspended += 1
      if (workspace.status === 'deleted') stats.deleted += 1
      if (workspace.plan === 'free') stats.planFree += 1
      if (workspace.plan === 'pro') stats.planPro += 1
      if (workspace.plan === 'enterprise') stats.planEnterprise += 1
    })
    return stats
  }, [workspaces])

  const recentWorkspaces = useMemo(() => {
    return [...workspaces]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3)
  }, [workspaces])

  const sidebar = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Button size="sm" className="w-full" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Create Workspace
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-border text-foreground-light hover:text-foreground"
          onClick={() => setShowJoinDialog(true)}
        >
          Join Workspace
        </Button>
        {joinHint && <div className="text-[11px] text-foreground-muted px-1">{joinHint}</div>}
      </div>

      <SidebarNavGroup title="Navigation">
        {workspaceSidebarLinks.map((item) => {
          const Icon = item.icon
          return (
            <SidebarNavItem
              key={item.id}
              href={`#${item.id}`}
              label={item.label}
              icon={<Icon className="w-3.5 h-3.5" />}
            />
          )
        })}
      </SidebarNavGroup>

      <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
          Quick Search
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <Input
            placeholder="Search workspaces"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 bg-surface-75 border-border focus:bg-surface-100 focus:border-brand-500"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-foreground-muted">
          <span>Current results</span>
          <span>
            {filteredWorkspaces.length} / {workspaces.length}
          </span>
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
          Workspace Overview
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-md border border-border bg-surface-75 px-2 py-2">
            <div className="text-foreground-muted">Total</div>
            <div className="text-foreground font-semibold">{workspaceStats.total}</div>
          </div>
          <div className="rounded-md border border-border bg-surface-75 px-2 py-2">
            <div className="text-foreground-muted">Active</div>
            <div className="text-foreground font-semibold">{workspaceStats.active}</div>
          </div>
          <div className="rounded-md border border-border bg-surface-75 px-2 py-2">
            <div className="text-foreground-muted">Paused</div>
            <div className="text-foreground font-semibold">{workspaceStats.suspended}</div>
          </div>
          <div className="rounded-md border border-border bg-surface-75 px-2 py-2">
            <div className="text-foreground-muted">Deleted</div>
            <div className="text-foreground font-semibold">{workspaceStats.deleted}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] font-semibold',
              planConfig.free.bgColor,
              planConfig.free.color
            )}
          >
            FREE · {workspaceStats.planFree}
          </Badge>
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] font-semibold',
              planConfig.pro.bgColor,
              planConfig.pro.color
            )}
          >
            PRO · {workspaceStats.planPro}
          </Badge>
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] font-semibold',
              planConfig.enterprise.bgColor,
              planConfig.enterprise.color
            )}
          >
            ENT · {workspaceStats.planEnterprise}
          </Badge>
        </div>
      </div>

      <SidebarNavGroup title="Recently Updated">
        {recentWorkspaces.length === 0 ? (
          <div className="px-2 text-[11px] text-foreground-muted">No recent updates</div>
        ) : (
          recentWorkspaces.map((workspace) => {
            const plan = getPlanConfig(workspace.plan)
            return (
              <Link
                key={workspace.id}
                href="/dashboard/apps"
                onClick={() => rememberWorkspace(workspace.id)}
                className="flex items-center justify-between px-2 py-1.5 rounded-md text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-100/60 transition-colors"
              >
                <span className="truncate">{workspace.name}</span>
                <span
                  className={cn(
                    'text-[9px] font-semibold px-1.5 py-0.5 rounded',
                    plan.bgColor,
                    plan.color
                  )}
                >
                  {plan.label}
                </span>
              </Link>
            )
          })
        )}
      </SidebarNavGroup>
    </div>
  )

  const errorBanner = loadError ? (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
      {loadError}
    </div>
  ) : null

  return (
    <PageWithSidebar sidebarTitle="Workspaces" sidebarWidth="narrow" sidebar={sidebar}>
      <PageContainer>
        <div className="space-y-6">
          {/* PageHeader */}
          <PageHeader
            title="Workspace"
            description="Manage your workspaces, default configuration and plan info. Quickly create or switch to an existing workspace."
            actions={
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Create Workspace
              </Button>
            }
          />

          {errorBanner}

          {/* Default Config and Description */}
          <section id="overview" className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-md bg-surface-100 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-surface-200 border border-border flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-foreground-muted" />
                </div>
                <div>
                  <h3 className="text-[12px] font-medium text-foreground mb-1">
                    Default Workspace
                  </h3>
                  <p className="text-[11px] text-foreground-light leading-relaxed">
                    A workspace is the foundation for team collaboration and resource isolation,
                    including apps, member permissions and quota settings.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-md bg-surface-100 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-surface-200 border border-border flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-brand-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[12px] font-medium text-foreground">Plans & Quotas</h3>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] font-semibold',
                        planConfig.free.bgColor,
                        planConfig.free.color
                      )}
                    >
                      {planConfig.free.label}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-foreground-light leading-relaxed">
                    New workspaces use the Free plan by default, supporting up to 3 apps and basic
                    call quotas.
                  </p>
                  <Link
                    href="/dashboard/billing"
                    className="text-[11px] text-brand-500 hover:underline"
                  >
                    View quotas & upgrade
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-md bg-surface-100 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-surface-200 border border-border flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-foreground-muted" />
                </div>
                <div>
                  <h3 className="text-[12px] font-medium text-foreground mb-1">Region & Data</h3>
                  <p className="text-[11px] text-foreground-light leading-relaxed">
                    Select a region when creating a workspace. This affects runtime latency and
                    compliance needs. Default region can be viewed in settings.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="create" className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
            <SettingsSection
              title="Create Workspace"
              description="Fill in name, region, and plan info. You can switch immediately after creating."
              compact
            >
              <div className="space-y-4">
                <CreateWorkspaceFormFields
                  createForm={createForm}
                  onNameChange={handleNameChange}
                  onSlugChange={(slug) => setCreateForm((prev) => ({ ...prev, slug }))}
                  onRegionChange={(region) => setCreateForm((prev) => ({ ...prev, region }))}
                />

                <div className="rounded-md border border-border bg-surface-75 px-3 py-3 text-[12px] text-foreground-light">
                  <div className="flex items-center justify-between">
                    <span>Current Plan</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] font-semibold',
                        planConfig.free.bgColor,
                        planConfig.free.color
                      )}
                    >
                      {planConfig.free.label}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[11px] text-foreground-muted">
                    After creating, you can upgrade plan and quotas in settings.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={
                      !createForm.name || !createForm.slug || !createForm.region || isCreating
                    }
                  >
                    {isCreating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelCreate}
                    className="border-border text-foreground-light hover:text-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </SettingsSection>

            <div id="guides">
              <SettingsSection
                title="Plans & Region Guide"
                description="Impact of quota and region selection"
                compact
              >
                <div className="space-y-4 text-[12px] text-foreground-light">
                  <div className="rounded-md border border-border bg-surface-75 p-3">
                    <p className="font-medium text-foreground mb-1">Plans & Quotas</p>
                    <p>
                      The Free plan allows up to 3 apps, suitable for personal use and small teams.
                    </p>
                    <Link
                      href="/dashboard/billing"
                      className="text-brand-500 hover:underline text-[11px]"
                    >
                      View quota details
                    </Link>
                  </div>
                  <div className="rounded-md border border-border bg-surface-75 p-3">
                    <p className="font-medium text-foreground mb-1">Region Selection</p>
                    <p>
                      Region affects access latency and compliance needs. We recommend selecting a
                      region closest to your target users.
                    </p>
                    <p className="text-[11px] text-foreground-muted mt-1">
                      Available regions: {regionOptions.map((option) => option.label).join(' / ')}
                    </p>
                  </div>
                  <div className="text-[11px] text-foreground-muted">
                    Need to join an existing workspace? Use the quick entry on the left sidebar to
                    submit a request.
                  </div>
                </div>
              </SettingsSection>
            </div>
          </section>

          <section id="list" className="space-y-3">
            <div>
              <h3 className="text-[13px] font-medium text-foreground">Select Workspace</h3>
              <p className="text-[12px] text-foreground-light">
                Select from workspaces you have joined, or create a new workspace to start building.
              </p>
              {searchQuery && (
                <p className="text-[11px] text-foreground-muted mt-1">Searching: {searchQuery}</p>
              )}
            </div>
            <span className="text-[11px] text-foreground-muted">
              Click a card to switch workspace
            </span>
          </section>

          {/* WorkspaceList */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="w-6 h-6" />}
              title={searchQuery ? 'No matching workspaces found' : 'No workspaces'}
              description={
                searchQuery
                  ? 'Try searching with different keywords'
                  : 'Create your first workspace to start building apps'
              }
              action={
                !searchQuery
                  ? {
                      label: 'Create Workspace',
                      onClick: () => setShowCreateDialog(true),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkspaces.map((workspace) => {
                const plan = getPlanConfig(workspace.plan)
                return (
                  <Link
                    key={workspace.id}
                    href="/dashboard/apps"
                    onClick={() => rememberWorkspace(workspace.id)}
                    className="group"
                  >
                    <div className="p-4 rounded-md bg-surface-100 border border-border hover:border-brand-500/50 transition-all">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-surface-200 border border-border flex items-center justify-center text-foreground-light group-hover:border-brand-500/50 transition-colors">
                            {workspace.icon ? (
                              <span className="text-lg">{workspace.icon}</span>
                            ) : (
                              <LayoutGrid className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-[13px] font-medium text-foreground group-hover:text-brand-500 transition-colors">
                              {workspace.name}
                            </h3>
                            <p className="text-[11px] text-foreground-muted">/{workspace.slug}</p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px] font-semibold', plan.bgColor, plan.color)}
                        >
                          {plan.label}
                        </Badge>
                      </div>

                      {/* Statistics */}
                      <div className="flex items-center gap-4 text-[11px] text-foreground-muted mb-3">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3.5 h-3.5" />
                          -- App
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          -- Member
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-1 text-[10px] text-foreground-muted">
                          <Clock className="w-3 h-3" />
                          {new Date(workspace.updated_at).toLocaleDateString('zh-CN')}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-foreground-muted">
                          Switch
                          <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-brand-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* CreateWorkspaceDialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-md bg-surface-100 border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Workspace</DialogTitle>
              <DialogDescription className="text-foreground-light">
                Create a new workspace to organize your apps and team
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <CreateWorkspaceFormFields
                createForm={createForm}
                onNameChange={handleNameChange}
                onSlugChange={(slug) => setCreateForm((prev) => ({ ...prev, slug }))}
                onRegionChange={(region) => setCreateForm((prev) => ({ ...prev, region }))}
              />

              <div className="p-3 rounded-md bg-surface-75 text-[12px] text-foreground-light">
                <p className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-foreground-muted" />
                  New workspaces will use the Free plan, supporting up to 3 apps
                </p>
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
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
          <DialogContent className="sm:max-w-md bg-surface-100 border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Join Workspace</DialogTitle>
              <DialogDescription className="text-foreground-light">
                Join an existing workspace via invite link or invite code
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-[12px] font-medium text-foreground mb-2">
                  Invite Link / Code <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Paste invite link or enter invite code"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                  className="h-9 bg-surface-75 border-border focus:border-brand-500"
                />
              </div>
              <div className="p-3 rounded-md bg-surface-75 text-[11px] text-foreground-muted">
                An admin must send an invite link before you can join.
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowJoinDialog(false)}
                className="border-border text-foreground-light hover:text-foreground"
              >
                Cancel
              </Button>
              <Button onClick={handleJoinWorkspace} disabled={!joinCode.trim()}>
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </PageWithSidebar>
  )
}
