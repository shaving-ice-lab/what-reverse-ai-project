'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Settings,
  Users,
  CreditCard,
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  Shield,
  Check,
  AlertTriangle,
  Globe,
  Lock,
  UserPlus,
  Crown,
  BarChart3,
  Database,
  Zap,
  HardDrive,
  LayoutGrid,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  workspaceApi,
  type Workspace,
  type WorkspaceMember,
  type WorkspaceRole,
  type WorkspaceQuota,
  type UpdateWorkspaceRequest,
} from '@/lib/api/workspace'

// ===== Tab Types =====

type SettingsTab = 'general' | 'members' | 'billing'

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'billing', label: 'Usage & Billing', icon: CreditCard },
]

// ===== Main Component =====

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { switchWorkspace } = useWorkspace()

  const workspaceId = params.id as string
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'general'
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)

  // Workspace data
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sync workspace context
  useEffect(() => {
    if (workspaceId) {
      switchWorkspace(workspaceId)
    }
  }, [workspaceId, switchWorkspace])

  // Load workspace
  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const ws = await workspaceApi.get(workspaceId)
        if (!cancelled) setWorkspace(ws)
      } catch (err) {
        if (!cancelled) setError('Failed to load workspace')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab)
    const url =
      tab === 'general'
        ? `/dashboard/workspaces/${workspaceId}/settings`
        : `/dashboard/workspaces/${workspaceId}/settings?tab=${tab}`
    router.replace(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
      </div>
    )
  }

  if (error || !workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-foreground-muted">{error || 'Workspace not found'}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/workspaces">Back to Workspaces</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/workspaces"
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">{workspace.name}</h1>
              <p className="text-[11px] text-foreground-muted">/{workspace.slug}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0 border-r border-border bg-surface-100/50 py-3 px-2 space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-surface-200 text-foreground'
                    : 'text-foreground-muted hover:text-foreground hover:bg-surface-200/50'
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'general' && <GeneralTab workspace={workspace} onUpdate={setWorkspace} />}
          {activeTab === 'members' && <MembersTab workspaceId={workspaceId} />}
          {activeTab === 'billing' && (
            <BillingTab workspaceId={workspaceId} workspace={workspace} />
          )}
        </div>
      </div>
    </div>
  )
}

// ===== General Tab =====

function GeneralTab({
  workspace,
  onUpdate,
}: {
  workspace: Workspace
  onUpdate: (ws: Workspace) => void
}) {
  const [name, setName] = useState(workspace.name)
  const [slug, setSlug] = useState(workspace.slug)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const hasChanges = name !== workspace.name || slug !== workspace.slug

  const handleSave = async () => {
    if (!hasChanges) return
    setSaving(true)
    try {
      const data: UpdateWorkspaceRequest = {}
      if (name !== workspace.name) data.name = name
      if (slug !== workspace.slug) data.slug = slug
      const updated = await workspaceApi.update(workspace.id, data)
      onUpdate(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to update workspace:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== workspace.name) return
    setDeleting(true)
    try {
      await workspaceApi.delete(workspace.id)
      router.push('/dashboard/workspaces')
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-8">
      {/* Basic Info */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">General Settings</h2>
          <p className="text-[12px] text-foreground-muted mt-0.5">
            Manage your workspace name, slug, and basic configuration.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium">
              Workspace Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 mt-1"
              placeholder="My Workspace"
            />
          </div>
          <div>
            <label className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium">
              Slug
            </label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[12px] text-foreground-muted shrink-0">/runtime/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="h-9 font-mono text-sm"
                placeholder="my-workspace"
              />
            </div>
            <p className="text-[10px] text-foreground-muted mt-1">
              This is used in the public URL of your app.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving} className="h-8">
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : saved ? (
              <Check className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {saved ? 'Saved' : 'Save Changes'}
          </Button>
        </div>
      </section>

      {/* Info Cards */}
      <section className="space-y-3">
        <h3 className="text-[12px] font-semibold text-foreground-muted uppercase tracking-wider">
          Workspace Info
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Status" value={workspace.status} />
          <InfoCard label="Plan" value={workspace.plan.toUpperCase()} />
          <InfoCard label="App Status" value={workspace.app_status} />
          <InfoCard
            label="Access Mode"
            value={workspace.access_mode.replace(/_/g, ' ')}
            icon={workspace.access_mode === 'private' ? Lock : Globe}
          />
          <InfoCard label="Region" value={workspace.region || 'Default'} />
          <InfoCard label="Created" value={new Date(workspace.created_at).toLocaleDateString()} />
        </div>
      </section>

      {/* Danger Zone */}
      <section className="border border-destructive/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
        </div>
        <p className="text-[12px] text-foreground-muted">
          Deleting this workspace will permanently remove all data including database tables, app
          schema, and published runtime. This action cannot be undone.
        </p>
        <div className="space-y-2">
          <label className="text-[11px] text-foreground-muted">
            Type <span className="font-semibold text-foreground">{workspace.name}</span> to confirm
          </label>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="h-9"
            placeholder={workspace.name}
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={deleteConfirm !== workspace.name || deleting}
            onClick={handleDelete}
            className="h-8"
          >
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Delete Workspace
          </Button>
        </div>
      </section>
    </div>
  )
}

function InfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: React.ElementType
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-100/50 px-3 py-2.5">
      <div className="text-[10px] text-foreground-muted uppercase tracking-wider">{label}</div>
      <div className="flex items-center gap-1.5 mt-0.5">
        {Icon && <Icon className="w-3 h-3 text-foreground-muted" />}
        <span className="text-[13px] font-medium text-foreground capitalize">{value}</span>
      </div>
    </div>
  )
}

// ===== Members Tab =====

function MembersTab({ workspaceId }: { workspaceId: string }) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const roles: WorkspaceRole[] = [
    {
      id: 'owner',
      workspace_id: workspaceId,
      name: 'owner',
      permissions: {},
      is_system: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'admin',
      workspace_id: workspaceId,
      name: 'admin',
      permissions: {},
      is_system: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'member',
      workspace_id: workspaceId,
      name: 'member',
      permissions: {},
      is_system: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'viewer',
      workspace_id: workspaceId,
      name: 'viewer',
      permissions: {},
      is_system: true,
      created_at: '',
      updated_at: '',
    },
  ]
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const membersData = await workspaceApi.getMembers(workspaceId)
      setMembers(Array.isArray(membersData) ? membersData : [])
    } catch (err) {
      console.error('Failed to load members:', err)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteRole) return
    setInviting(true)
    try {
      await workspaceApi.inviteMember(workspaceId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      })
      setInviteEmail('')
      setShowInvite(false)
      await loadData()
    } catch (err) {
      console.error('Failed to invite member:', err)
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!window.confirm('Remove this member from the workspace?')) return
    try {
      await workspaceApi.removeMember(workspaceId, memberId)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch (err) {
      console.error('Failed to remove member:', err)
    }
  }

  const handleRoleChange = async (memberId: string, roleId: string) => {
    try {
      await workspaceApi.updateMemberRole(workspaceId, memberId, { role_id: roleId })
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? { ...m, role_id: roleId, role: roles.find((r) => r.id === roleId) || m.role }
            : m
        )
      )
    } catch (err) {
      console.error('Failed to update member role:', err)
    }
  }

  const getRoleName = (member: WorkspaceMember) => {
    return member.role?.name || roles.find((r) => r.id === member.role_id)?.name || 'member'
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Members</h2>
          <p className="text-[12px] text-foreground-muted mt-0.5">
            Manage who has access to this workspace.
          </p>
        </div>
        <Button size="sm" className="h-8" onClick={() => setShowInvite(!showInvite)}>
          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
          Invite
        </Button>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-4 space-y-3">
          <h3 className="text-[12px] font-semibold text-foreground">Invite Member</h3>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-foreground-muted uppercase tracking-wider">
                Email
              </label>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-8 mt-0.5"
                type="email"
              />
            </div>
            <div className="w-32">
              <label className="text-[10px] text-foreground-muted uppercase tracking-wider">
                Role
              </label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-8 mt-0.5">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              className="h-8"
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
            >
              {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send'}
            </Button>
          </div>
        </div>
      )}

      {/* Members List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-8 text-[12px] text-foreground-muted">
          No members yet. Invite someone to get started.
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
          {members.map((member) => {
            const roleName = getRoleName(member)
            const isOwner = roleName === 'owner'
            return (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center shrink-0">
                  {member.user?.avatar_url ? (
                    <img
                      src={member.user.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] font-semibold text-foreground-muted">
                      {(member.user?.display_name ||
                        member.user?.username ||
                        member.user?.email ||
                        '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground truncate">
                      {member.user?.display_name || member.user?.username || 'Unknown'}
                    </span>
                    {isOwner && (
                      <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-semibold">
                        <Crown className="w-2.5 h-2.5" />
                        Owner
                      </span>
                    )}
                    {member.status === 'pending' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-foreground-muted truncate">
                    {member.user?.email || '—'}
                  </div>
                </div>
                {/* Role select */}
                {!isOwner ? (
                  <Select
                    value={member.role_id}
                    onValueChange={(v) => handleRoleChange(member.id, v)}
                  >
                    <SelectTrigger className="h-7 w-28 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter((r) => r.name !== 'owner')
                        .map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-[11px] text-foreground-muted px-2">owner</span>
                )}
                {/* Remove */}
                {!isOwner && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-foreground-muted hover:text-destructive"
                    onClick={() => handleRemove(member.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Roles */}
      {roles.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[12px] font-semibold text-foreground-muted uppercase tracking-wider">
            Available Roles
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className="rounded-lg border border-border bg-surface-100/50 px-3 py-2"
              >
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-foreground-muted" />
                  <span className="text-[12px] font-medium text-foreground capitalize">
                    {role.name}
                  </span>
                  {role.is_system && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-surface-200 text-foreground-muted">
                      System
                    </span>
                  )}
                </div>
                {role.permissions && Object.keys(role.permissions).length > 0 && (
                  <div className="mt-1 text-[10px] text-foreground-muted">
                    {Object.entries(role.permissions)
                      .filter(([, v]) => v)
                      .map(([k]) => k.replace(/_/g, ' '))
                      .slice(0, 3)
                      .join(', ')}
                    {Object.values(role.permissions).filter(Boolean).length > 3 && ' ...'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ===== Billing Tab =====

function BillingTab({ workspaceId, workspace }: { workspaceId: string; workspace: Workspace }) {
  const [quota, setQuota] = useState<WorkspaceQuota | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const q = await workspaceApi.getQuota(workspaceId)
        if (!cancelled) setQuota(q)
      } catch {
        // Quota endpoint may not be available
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  const planConfig: Record<
    string,
    { label: string; color: string; bgColor: string; features: string[] }
  > = {
    free: {
      label: 'Free',
      color: 'text-foreground-muted',
      bgColor: 'bg-surface-200',
      features: ['1 Workspace', 'Basic AI Agent', '100 requests/day', '10MB storage'],
    },
    pro: {
      label: 'Pro',
      color: 'text-brand-500',
      bgColor: 'bg-brand-200',
      features: [
        'Unlimited Workspaces',
        'Advanced AI Agent',
        '10,000 requests/day',
        '1GB storage',
        'Custom domains',
      ],
    },
    enterprise: {
      label: 'Enterprise',
      color: 'text-warning',
      bgColor: 'bg-warning-200',
      features: [
        'Unlimited Everything',
        'Priority Support',
        'SSO & SAML',
        'SLA guarantee',
        'Dedicated infra',
      ],
    },
  }

  const currentPlan = planConfig[workspace.plan] || planConfig.free

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-8">
      {/* Current Plan */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Plan & Usage</h2>
          <p className="text-[12px] text-foreground-muted mt-0.5">
            View your current plan and resource usage.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-100/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  currentPlan.bgColor
                )}
              >
                <Zap className={cn('w-5 h-5', currentPlan.color)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-foreground">
                    {currentPlan.label} Plan
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-semibold rounded',
                      currentPlan.bgColor,
                      currentPlan.color
                    )}
                  >
                    CURRENT
                  </span>
                </div>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  {currentPlan.features.join(' · ')}
                </p>
              </div>
            </div>
            {workspace.plan !== 'enterprise' && (
              <Button size="sm" variant="outline" className="h-8 text-[11px]">
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Usage Metrics */}
      <section className="space-y-4">
        <h3 className="text-[12px] font-semibold text-foreground-muted uppercase tracking-wider">
          Resource Usage
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
          </div>
        ) : quota ? (
          <div className="grid grid-cols-2 gap-3">
            <UsageCard
              label="API Requests"
              icon={BarChart3}
              used={quota.requests?.used ?? 0}
              limit={quota.requests?.limit ?? 0}
            />
            <UsageCard
              label="Tokens"
              icon={Zap}
              used={quota.tokens?.used ?? 0}
              limit={quota.tokens?.limit ?? 0}
            />
            <UsageCard
              label="Storage"
              icon={HardDrive}
              used={quota.storage?.used ?? 0}
              limit={quota.storage?.limit ?? 0}
              unit="GB"
            />
            <UsageCard
              label="Apps"
              icon={Database}
              used={quota.apps?.used ?? 0}
              limit={quota.apps?.limit ?? 0}
            />
          </div>
        ) : (
          <div className="text-center py-8 text-[12px] text-foreground-muted border border-border rounded-lg bg-surface-100/50">
            Usage data is not available for your current plan.
          </div>
        )}
      </section>
    </div>
  )
}

function UsageCard({
  label,
  icon: Icon,
  used,
  limit,
  unit = '',
}: {
  label: string
  icon: React.ElementType
  used: number
  limit: number
  unit?: string
}) {
  const isUnlimited = limit <= 0
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100)
  const isHigh = percentage > 80
  const isCritical = percentage > 95

  return (
    <div className="rounded-lg border border-border bg-surface-100/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-foreground-muted" />
          <span className="text-[11px] font-medium text-foreground">{label}</span>
        </div>
        <span
          className={cn(
            'text-[11px] font-mono',
            isCritical ? 'text-destructive' : isHigh ? 'text-warning' : 'text-foreground-muted'
          )}
        >
          {used.toLocaleString()}
          {unit}
          {!isUnlimited && ` / ${limit.toLocaleString()}${unit}`}
          {isUnlimited && ' (Unlimited)'}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full h-1.5 rounded-full bg-surface-200 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isCritical ? 'bg-destructive' : isHigh ? 'bg-warning' : 'bg-brand-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}
