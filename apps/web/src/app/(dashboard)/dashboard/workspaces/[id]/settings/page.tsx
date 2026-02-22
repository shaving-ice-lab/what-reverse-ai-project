'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Settings,
  Users,
  CreditCard,
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
  Bot,
  Eye,
  EyeOff,
  Plus,
  Star,
  Pencil,
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
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  workspaceApi,
  type Workspace,
  type WorkspaceMember,
  type WorkspaceRole,
  type WorkspaceQuota,
  type UpdateWorkspaceRequest,
  type LLMEndpoint,
  type AddLLMEndpointRequest,
  type UpdateLLMEndpointRequest,
} from '@/lib/api/workspace'

// ===== Tab Types =====

type SettingsTab = 'general' | 'members' | 'llm' | 'billing'

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'llm', label: 'LLM Endpoints', icon: Bot },
  { id: 'billing', label: 'Usage & Billing', icon: CreditCard },
]

// ===== Reusable Section Wrapper =====

function SettingsSection({
  title,
  description,
  children,
  action,
  variant = 'default',
}: {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
  variant?: 'default' | 'danger'
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-5',
        variant === 'danger'
          ? 'border-destructive/20 bg-destructive/2'
          : 'border-border bg-surface-50/50'
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3
            className={cn(
              'text-[13px] font-semibold',
              variant === 'danger' ? 'text-destructive' : 'text-foreground'
            )}
          >
            {title}
          </h3>
          {description && (
            <p className="text-[12px] text-foreground-muted mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ===== Main Component =====

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { switchWorkspace } = useWorkspace()

  const workspaceId = params.id as string
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'general'
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (workspaceId) switchWorkspace(workspaceId)
  }, [workspaceId, switchWorkspace])

  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const ws = await workspaceApi.get(workspaceId)
        if (!cancelled) setWorkspace(ws)
      } catch {
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
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <p className="text-sm text-foreground-muted">{error || 'Workspace not found'}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/workspace">Back to Workspace</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Breadcrumb Header */}
      <div className="shrink-0 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-brand-500/20 to-brand-500/5 flex items-center justify-center border border-brand-500/10">
              <Settings className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                Workspace Settings
              </h1>
              <p className="text-[12px] text-foreground-muted">
                {workspace.name} · <span className="font-mono">/{workspace.slug}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Horizontal Tab Bar */}
        <div className="max-w-5xl mx-auto px-6">
          <nav className="flex gap-1 -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors',
                    isActive
                      ? 'border-brand-500 text-foreground'
                      : 'border-transparent text-foreground-muted hover:text-foreground hover:border-border'
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5', isActive && 'text-brand-500')} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {activeTab === 'general' && <GeneralTab workspace={workspace} onUpdate={setWorkspace} />}
          {activeTab === 'members' && <MembersTab workspaceId={workspaceId} />}
          {activeTab === 'llm' && <LLMTab workspaceId={workspaceId} />}
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

  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!hasChanges) return
    setSaving(true)
    setSaveError(null)
    try {
      const data: UpdateWorkspaceRequest = {}
      if (name !== workspace.name) data.name = name
      if (slug !== workspace.slug) data.slug = slug
      const updated = await workspaceApi.update(workspace.id, data)
      onUpdate(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save workspace'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== workspace.name) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await workspaceApi.delete(workspace.id)
      router.push('/dashboard/workspace')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete workspace'
      setDeleteError(msg)
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <SettingsSection
        title="Workspace Name & Slug"
        description="Update your workspace display name and URL slug."
        action={
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving} className="h-8">
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : saved ? (
              <Check className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {saved ? 'Saved' : 'Save'}
          </Button>
        }
      >
        {saveError && <p className="text-[12px] text-destructive mb-3">{saveError}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 mt-1.5"
              placeholder="My Workspace"
            />
          </div>
          <div>
            <label className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium">
              Slug
            </label>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[12px] text-foreground-muted shrink-0 select-none">/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="h-9 font-mono text-sm"
                placeholder="my-workspace"
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Info Cards */}
      <SettingsSection
        title="Workspace Info"
        description="Current workspace status and configuration."
      >
        <div className="grid grid-cols-3 gap-3">
          <InfoCard label="Status" value={workspace.status} />
          <InfoCard label="Plan" value={workspace.plan.toUpperCase()} />
          <InfoCard label="App Status" value={workspace.app_status} />
          <InfoCard
            label="Access"
            value={workspace.access_mode.replace(/_/g, ' ')}
            icon={workspace.access_mode === 'private' ? Lock : Globe}
          />
          <InfoCard label="Region" value={workspace.region || 'Default'} />
          <InfoCard label="Created" value={new Date(workspace.created_at).toLocaleDateString()} />
        </div>
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection
        title="Delete Workspace"
        description="Permanently remove this workspace and all its data including database tables, app schema, and published runtime. This cannot be undone."
        variant="danger"
      >
        {deleteError && <p className="text-[12px] text-destructive mb-3">{deleteError}</p>}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-[11px] text-foreground-muted">
              Type <span className="font-semibold text-foreground">{workspace.name}</span> to
              confirm
            </label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="h-9 mt-1.5"
              placeholder={workspace.name}
            />
          </div>
          <Button
            size="sm"
            variant="destructive"
            disabled={deleteConfirm !== workspace.name || deleting}
            onClick={handleDelete}
            className="h-9 shrink-0"
          >
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </SettingsSection>
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
    <div className="rounded-lg bg-background border border-border/50 px-3.5 py-2.5">
      <div className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">
        {label}
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        {Icon && <Icon className="w-3 h-3 text-foreground-muted" />}
        <span className="text-[13px] font-semibold text-foreground capitalize">{value}</span>
      </div>
    </div>
  )
}

// ===== Members Tab =====

function MembersTab({ workspaceId }: { workspaceId: string }) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [roles, setRoles] = useState<WorkspaceRole[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [membersData, rolesData] = await Promise.all([
        workspaceApi.getMembers(workspaceId),
        workspaceApi.listRoles(workspaceId),
      ])
      setMembers(Array.isArray(membersData) ? membersData : [])
      setRoles(Array.isArray(rolesData) ? rolesData : [])
    } catch (err) {
      console.error('Failed to load members/roles:', err)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (roles.length > 0 && !roles.some((r) => r.id === inviteRole)) {
      const defaultRole =
        roles.find((r) => r.name === 'member') || roles.find((r) => r.name !== 'owner')
      if (defaultRole) setInviteRole(defaultRole.id)
    }
  }, [roles])

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteRole) return
    setInviting(true)
    setInviteError(null)
    try {
      await workspaceApi.inviteMember(workspaceId, {
        email: inviteEmail.trim(),
        role: roles.find((r) => r.id === inviteRole)?.name || inviteRole,
      })
      setInviteEmail('')
      setShowInvite(false)
      await loadData()
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite member')
    } finally {
      setInviting(false)
    }
  }

  const { confirm: confirmRemoveMember, Dialog: RemoveMemberDialog } = useConfirmDialog()

  const handleRemove = async (memberId: string) => {
    const confirmed = await confirmRemoveMember({
      title: 'Remove Member',
      description: 'Remove this member from the workspace?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    })
    if (!confirmed) return
    setRemoveError(null)
    try {
      await workspaceApi.removeMember(workspaceId, memberId)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch (err: unknown) {
      setRemoveError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  const handleRoleChange = async (memberId: string, roleId: string) => {
    setRoleChangeError(null)
    try {
      await workspaceApi.updateMemberRole(workspaceId, memberId, { role_id: roleId })
      const matched = roles.find((r) => r.id === roleId)
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                role_id: roleId,
                role: matched ? { id: matched.id, name: matched.name } : m.role,
              }
            : m
        )
      )
    } catch (err: unknown) {
      setRoleChangeError(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const getRoleName = (member: WorkspaceMember) => {
    if (member.role?.name) return member.role.name
    return roles.find((r) => r.id === member.role_id)?.name || 'member'
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Team Members"
        description="Manage who has access to this workspace and their permissions."
        action={
          <Button size="sm" className="h-8" onClick={() => setShowInvite(!showInvite)}>
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Invite
          </Button>
        }
      >
        {inviteError && <p className="text-[12px] text-destructive mb-3">{inviteError}</p>}
        {removeError && <p className="text-[12px] text-destructive mb-3">{removeError}</p>}
        {roleChangeError && <p className="text-[12px] text-destructive mb-3">{roleChangeError}</p>}
        {showInvite && (
          <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-4 mb-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">
                  Email
                </label>
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="h-9 mt-1"
                  type="email"
                />
              </div>
              <div className="w-32">
                <label className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">
                  Role
                </label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="Role" />
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
              </div>
              <Button
                size="sm"
                className="h-9"
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
              >
                {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Invite'}
              </Button>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-[12px] text-foreground-muted rounded-lg border border-dashed border-border">
            No members yet. Invite someone to get started.
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="text-left px-4 py-2 text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
                    Member
                  </th>
                  <th className="text-left px-4 py-2 text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-right px-4 py-2 text-[10px] font-medium text-foreground-muted uppercase tracking-wider w-16" />
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const roleName = getRoleName(member)
                  const isOwner = roleName === 'owner'
                  return (
                    <tr
                      key={member.id}
                      className="border-b border-border last:border-b-0 hover:bg-background/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
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
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-foreground truncate">
                                {member.user?.display_name || member.user?.username || 'Unknown'}
                              </span>
                              {isOwner && (
                                <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning font-semibold">
                                  <Crown className="w-2.5 h-2.5" /> Owner
                                </span>
                              )}
                              {member.status === 'pending' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold">
                                  Pending
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-foreground-muted truncate">
                              {member.user?.email || '\u2014'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {!isOwner ? (
                          <Select
                            value={member.role_id || ''}
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
                          <span className="text-[11px] text-foreground-muted capitalize">
                            owner
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isOwner && (
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="p-1 rounded hover:bg-destructive/10 text-foreground-muted hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SettingsSection>
      {roles.length > 0 && (
        <SettingsSection
          title="Available Roles"
          description="System-defined roles and their permissions."
        >
          <div className="grid grid-cols-2 gap-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className="rounded-lg bg-background border border-border/50 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-foreground-muted" />
                  <span className="text-[12px] font-semibold text-foreground capitalize">
                    {role.name}
                  </span>
                  {role.is_system && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-surface-200 text-foreground-muted font-medium uppercase tracking-wider">
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
        </SettingsSection>
      )}
      <RemoveMemberDialog />
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
    <div className="space-y-6">
      <SettingsSection
        title="Current Plan"
        description="View your current plan and upgrade options."
        action={
          workspace.plan !== 'enterprise' ? (
            <Button size="sm" variant="outline" className="h-8 text-[12px]">
              Upgrade Plan
            </Button>
          ) : undefined
        }
      >
        <div className="rounded-lg bg-background border border-border/50 p-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                currentPlan.bgColor
              )}
            >
              <Zap className={cn('w-5 h-5', currentPlan.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground">{currentPlan.label}</span>
                <span
                  className={cn(
                    'px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider',
                    currentPlan.bgColor,
                    currentPlan.color
                  )}
                >
                  Active
                </span>
              </div>
              <p className="text-[11px] text-foreground-muted mt-0.5">
                {currentPlan.features.join(' \u00b7 ')}
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>
      <SettingsSection
        title="Resource Usage"
        description="Monitor your workspace resource consumption."
      >
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
          <div className="text-center py-8 text-[12px] text-foreground-muted rounded-lg border border-dashed border-border">
            Usage data is not available for your current plan.
          </div>
        )}
      </SettingsSection>
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
    <div className="rounded-lg border border-border/50 bg-background p-3.5 space-y-2">
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

// ===== LLM Tab =====

const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', defaultBaseUrl: 'https://api.openai.com/v1' },
  { value: 'custom', label: 'Custom (OpenAI Compatible)', defaultBaseUrl: '' },
]

const POPULAR_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
  'claude-3-5-sonnet-20241022',
  'deepseek-chat',
  'deepseek-reasoner',
]

function LLMTab({ workspaceId }: { workspaceId: string }) {
  const [endpoints, setEndpoints] = useState<LLMEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { confirm: confirmDeleteEndpoint, Dialog: DeleteEndpointDialog } = useConfirmDialog()

  // Form state
  const [formName, setFormName] = useState('')
  const [formProvider, setFormProvider] = useState('openai')
  const [formApiKey, setFormApiKey] = useState('')
  const [formBaseUrl, setFormBaseUrl] = useState('https://api.openai.com/v1')
  const [formModel, setFormModel] = useState('gpt-4o')
  const [showApiKey, setShowApiKey] = useState(false)

  const loadEndpoints = useCallback(async () => {
    try {
      const list = await workspaceApi.listLLMEndpoints(workspaceId)
      setEndpoints(list)
    } catch {
      // may not exist yet
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadEndpoints()
  }, [loadEndpoints])

  const resetForm = () => {
    setFormName('')
    setFormProvider('openai')
    setFormApiKey('')
    setFormBaseUrl('https://api.openai.com/v1')
    setFormModel('gpt-4o')
    setShowApiKey(false)
    setShowForm(false)
    setEditingId(null)
    setError(null)
  }

  const handleProviderChange = (value: string) => {
    setFormProvider(value)
    const prov = LLM_PROVIDERS.find((p) => p.value === value)
    if (prov?.defaultBaseUrl) setFormBaseUrl(prov.defaultBaseUrl)
  }

  const handleAdd = async () => {
    if (!formName.trim() || !formModel.trim()) {
      setError('Name and Model are required')
      return
    }
    setActionLoading('add')
    setError(null)
    try {
      const data: AddLLMEndpointRequest = {
        name: formName.trim(),
        provider: formProvider,
        api_key: formApiKey.trim(),
        base_url: formBaseUrl.trim(),
        model: formModel.trim(),
      }
      await workspaceApi.addLLMEndpoint(workspaceId, data)
      resetForm()
      await loadEndpoints()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add endpoint'
      setError(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleEdit = (ep: LLMEndpoint) => {
    setEditingId(ep.id)
    setFormName(ep.name)
    setFormProvider(ep.provider)
    setFormApiKey('')
    setFormBaseUrl(ep.base_url)
    setFormModel(ep.model)
    setShowApiKey(false)
    setShowForm(true)
    setError(null)
  }

  const handleUpdate = async () => {
    if (!editingId) return
    if (!formName.trim() || !formModel.trim()) {
      setError('Name and Model are required')
      return
    }
    setActionLoading('update')
    setError(null)
    try {
      const data: UpdateLLMEndpointRequest = {}
      if (formName.trim()) data.name = formName.trim()
      if (formProvider) data.provider = formProvider
      if (formApiKey.trim()) data.api_key = formApiKey.trim()
      if (formBaseUrl) data.base_url = formBaseUrl.trim()
      if (formModel.trim()) data.model = formModel.trim()
      await workspaceApi.updateLLMEndpoint(workspaceId, editingId, data)
      resetForm()
      await loadEndpoints()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update endpoint'
      setError(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    const ep = endpoints.find((e) => e.id === id)
    const confirmed = await confirmDeleteEndpoint({
      title: 'Delete Endpoint',
      description: `Delete "${ep?.name || 'this endpoint'}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    })
    if (!confirmed) return
    setActionLoading(id)
    setError(null)
    try {
      await workspaceApi.deleteLLMEndpoint(workspaceId, id)
      await loadEndpoints()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete endpoint'
      setError(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    setActionLoading(id)
    setError(null)
    try {
      await workspaceApi.setDefaultLLMEndpoint(workspaceId, id)
      await loadEndpoints()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to set default'
      setError(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const defaultEp = endpoints.find((e) => e.is_default)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="LLM Endpoints"
        description="Manage LLM endpoints for this workspace. The default endpoint is used by the AI Agent and all system features."
        action={
          !showForm ? (
            <Button
              size="sm"
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="h-8 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Endpoint
            </Button>
          ) : undefined
        }
      >
        {/* Default indicator */}
        {defaultEp && (
          <div className="flex items-center gap-2 rounded-lg border border-brand-500/20 bg-brand-500/5 px-3 py-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[12px] text-foreground">
              Active: <span className="font-semibold">{defaultEp.name}</span>
              {' — '}
              <span className="font-mono text-[11px]">{defaultEp.model}</span>
            </span>
            {defaultEp.api_key_preview && (
              <span className="text-[11px] text-foreground-muted ml-auto font-mono">
                {defaultEp.api_key_preview}
              </span>
            )}
          </div>
        )}

        {error && <p className="text-[12px] text-destructive mb-3">{error}</p>}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-4 space-y-3 mb-4">
            <h3 className="text-[12px] font-semibold text-foreground">
              {editingId ? 'Edit Endpoint' : 'New Endpoint'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium">
                  Name
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-9 mt-1.5"
                  placeholder="e.g. OpenAI GPT-4o"
                />
              </div>
              <div>
                <label className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium">
                  Provider
                </label>
                <Select value={formProvider} onValueChange={handleProviderChange}>
                  <SelectTrigger className="h-9 mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LLM_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium">
                API Key{' '}
                {editingId && (
                  <span className="normal-case text-foreground-muted">(leave empty to keep)</span>
                )}
              </label>
              <div className="relative mt-1.5">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  className="h-9 pr-10 font-mono text-sm"
                  placeholder={editingId ? 'Enter new key to update...' : 'sk-...'}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                >
                  {showApiKey ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium">
                Base URL
              </label>
              <Input
                value={formBaseUrl}
                onChange={(e) => setFormBaseUrl(e.target.value)}
                className="h-9 mt-1.5 font-mono text-sm"
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <div>
              <label className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium">
                Model
              </label>
              <Input
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
                className="h-9 mt-1.5 font-mono text-sm"
                placeholder="gpt-4o"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {POPULAR_MODELS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormModel(m)}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors border',
                      formModel === m
                        ? 'bg-brand-500/10 text-brand-500 border-brand-500/30'
                        : 'bg-background text-foreground-muted border-border hover:text-foreground hover:border-foreground-muted'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={editingId ? handleUpdate : handleAdd}
                disabled={actionLoading === 'add' || actionLoading === 'update'}
                className="h-8"
              >
                {(actionLoading === 'add' || actionLoading === 'update') && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                )}
                {editingId ? 'Update' : 'Add'}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm} className="h-8">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Endpoints Table */}
        {endpoints.length === 0 && !showForm ? (
          <div className="rounded-lg border border-dashed border-border py-12 flex flex-col items-center gap-2">
            <Bot className="w-8 h-8 text-foreground-muted" />
            <p className="text-[12px] text-foreground-muted">No LLM endpoints configured yet.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="h-8 mt-2"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add your first endpoint
            </Button>
          </div>
        ) : (
          endpoints.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="text-left px-4 py-2 text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 py-2 text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
                      Model
                    </th>
                    <th className="text-left px-4 py-2 text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="text-left px-4 py-2 text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
                      Key
                    </th>
                    <th className="text-left px-4 py-2 text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-4 py-2 text-[10px] font-medium text-foreground-muted uppercase tracking-wider w-20" />
                  </tr>
                </thead>
                <tbody>
                  {endpoints.map((ep) => (
                    <tr
                      key={ep.id}
                      className="border-b border-border last:border-b-0 hover:bg-background/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-medium text-foreground">{ep.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono text-foreground-muted">
                          {ep.model}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-foreground-muted capitalize">
                          {ep.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ep.has_api_key ? (
                          <span className="text-[10px] font-mono text-foreground-muted">
                            {ep.api_key_preview}
                          </span>
                        ) : (
                          <span className="text-[10px] text-destructive">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ep.is_default ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-500/10 text-brand-500 border border-brand-500/20">
                            <Star className="w-3 h-3" />
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefault(ep.id)}
                            disabled={actionLoading === ep.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-foreground-muted border border-border hover:border-brand-500/30 hover:text-brand-500 transition-colors"
                          >
                            {actionLoading === ep.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Star className="w-3 h-3" />
                            )}
                            Set Default
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(ep)}
                            className="p-1.5 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(ep.id)}
                            disabled={actionLoading === ep.id}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-foreground-muted hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            {actionLoading === ep.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </SettingsSection>
      <DeleteEndpointDialog />
    </div>
  )
}
