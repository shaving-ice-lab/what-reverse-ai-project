'use client'

/**
 * Team Management Page - Supabase Style
 * Manage team members, roles, and permissions
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { buildWorkspacePermissions, resolveWorkspaceRoleFromUser } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { PageContainer, PageHeader } from '@/components/dashboard/page-layout'
import { PermissionGate } from '@/components/permissions/permission-gate'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Shield,
  Mail,
  Clock,
  Check,
  X,
  Crown,
  Settings,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  Link,
  Send,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Filter,
  UserCog,
  Key,
  Eye,
  EyeOff,
  Zap,
  MessageSquare,
  FileText,
  Bot,
} from 'lucide-react'

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

// RoleConfig - Supabase Style

const roles = [
  {
    id: 'owner',

    name: 'Owner',

    description: 'Full control; can manage team settings and billing',

    color: 'text-warning',

    bgColor: 'bg-warning-200',

    icon: Crown,
  },

  {
    id: 'admin',

    name: 'Admin',

    description: 'Can manage members and most settings',

    color: 'text-brand-500',

    bgColor: 'bg-brand-200',

    icon: Shield,
  },

  {
    id: 'editor',

    name: 'Editor',

    description: 'Can create and edit workflows and agents',

    color: 'text-foreground-light',

    bgColor: 'bg-surface-200',

    icon: Edit3,
  },

  {
    id: 'viewer',

    name: 'Viewer',

    description: 'Can view content, cannot edit',

    color: 'text-foreground-muted',

    bgColor: 'bg-surface-200',

    icon: Eye,
  },
]

// Team member data

const teamMembers = [
  {
    id: '1',

    name: '',

    email: 'zhangming@example.com',

    avatar: null,

    role: 'owner',

    status: 'active',

    joinedAt: '2025-10-15',

    lastActive: 'Just now',

    stats: { workflows: 12, agents: 5, conversations: 156 },
  },

  {
    id: '2',

    name: 'Li Hua',

    email: 'lihua@example.com',

    avatar: null,

    role: 'admin',

    status: 'active',

    joinedAt: '2025-11-20',

    lastActive: '5 min ago',

    stats: { workflows: 8, agents: 3, conversations: 89 },
  },

  {
    id: '3',

    name: 'Wang Fang',

    email: 'wangfang@example.com',

    avatar: null,

    role: 'editor',

    status: 'active',

    joinedAt: '2025-12-05',

    lastActive: '1 hour ago',

    stats: { workflows: 5, agents: 2, conversations: 45 },
  },

  {
    id: '4',

    name: 'Zhao Qiang',

    email: 'zhaoqiang@example.com',

    avatar: null,

    role: 'viewer',

    status: 'pending',

    joinedAt: null,

    lastActive: null,

    stats: { workflows: 0, agents: 0, conversations: 0 },
  },
]

// Pending invites

const pendingInvites = [
  {
    id: 'inv-1',

    email: 'newuser@example.com',

    role: 'editor',

    sentAt: '2026-01-28',

    expiresAt: '2026-02-04',
  },
]

// Team statistics

const teamStats = {
  members: 4,

  maxMembers: 5,

  workflows: 25,

  agents: 10,

  apiCalls: 15600,
}

export default function TeamPage() {
  const { user } = useAuthStore()
  const workspaceRole = resolveWorkspaceRoleFromUser(user?.role)
  const permissions = buildWorkspacePermissions(workspaceRole)
  const [members, setMembers] = useState(teamMembers)
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedRole, setSelectedRole] = useState<string>('all')

  const [showInviteModal, setShowInviteModal] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')

  const [inviteRole, setInviteRole] = useState('editor')

  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [frozenMembers, setFrozenMembers] = useState<Set<string>>(new Set())
  const [managementMessage, setManagementMessage] = useState<string | null>(null)

  // Filter members

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = selectedRole === 'all' || member.role === selectedRole

    return matchesSearch && matchesRole
  })

  const allSelected = filteredMembers.length > 0 && selectedMembers.size === filteredMembers.length
  const someSelected = selectedMembers.size > 0 && !allSelected

  // Get role config

  const getRoleConfig = (roleId: string) => {
    return roles.find((r) => r.id === roleId) || roles[3]
  }

  // Toggle selection

  const toggleSelect = (id: string, checked?: boolean | 'indeterminate') => {
    const newSelected = new Set(selectedMembers)

    if (checked === true || (checked === undefined && !newSelected.has(id))) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }

    setSelectedMembers(newSelected)
  }

  const toggleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedMembers(new Set(filteredMembers.map((member) => member.id)))
    } else {
      setSelectedMembers(new Set())
    }
  }

  const handleToggleFreeze = (memberId: string) => {
    setFrozenMembers((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
        setManagementMessage('Member unfrozen.')
      } else {
        next.add(memberId)
        setManagementMessage('Member frozen.')
      }
      return next
    })
    setTimeout(() => setManagementMessage(null), 2000)
  }

  const handleBulkFreeze = () => {
    if (selectedMembers.size === 0) return
    setFrozenMembers((prev) => {
      const next = new Set(prev)
      selectedMembers.forEach((id) => next.add(id))
      return next
    })
    setManagementMessage('Member frozen.')
    setSelectedMembers(new Set())
    setTimeout(() => setManagementMessage(null), 2000)
  }

  const handleBulkRemove = () => {
    if (selectedMembers.size === 0) return
    if (!confirm('Remove selected member?')) return
    setMembers((prev) => prev.filter((member) => !selectedMembers.has(member.id)))
    setFrozenMembers((prev) => {
      const next = new Set(prev)
      selectedMembers.forEach((id) => next.delete(id))
      return next
    })
    setManagementMessage('Member removed.')
    setSelectedMembers(new Set())
    setTimeout(() => setManagementMessage(null), 2000)
  }

  const handleRemoveMember = (memberId: string) => {
    if (!confirm('Remove this member?')) return
    setMembers((prev) => prev.filter((member) => member.id !== memberId))
    setFrozenMembers((prev) => {
      const next = new Set(prev)
      next.delete(memberId)
      return next
    })
    setSelectedMembers((prev) => {
      const next = new Set(prev)
      next.delete(memberId)
      return next
    })
    setManagementMessage('Member removed.')
    setTimeout(() => setManagementMessage(null), 2000)
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('en-US')
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Team management"
          description="Manage team members, roles, and access permissions"
          actions={
            <div className="flex items-center gap-2">
              <PermissionGate
                permissions={permissions}
                required={['workspace_admin', 'billing_manage']}
              >
                <Button variant="outline" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
                  Team Settings
                </Button>
              </PermissionGate>
              <PermissionGate permissions={permissions} required={['members_manage']}>
                <Button
                  size="sm"
                  leftIcon={<UserPlus className="w-4 h-4" />}
                  onClick={() => setShowInviteModal(true)}
                >
                  Invite Member
                </Button>
              </PermissionGate>
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Member {members.length}/{teamStats.maxMembers}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Workflow {teamStats.workflows}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              Agent {teamStats.agents}
            </span>
          </div>
        </PageHeader>

        <div className="p-4 rounded-md bg-surface-100 border border-border">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
                <Shield className="w-4 h-4 text-foreground-light" />
              </div>
              <div className="space-y-1 text-[12px] text-foreground-light">
                <p>
                  Invite members by email to join the workspace; resend and expiry reminders are
                  supported.
                </p>
                <p>Roles: Owner / Admin / Editor / Viewer — each with its own permission scope.</p>
                <p>
                  Permission Note: Member management, billing, and security policies require Admin
                  or Owner permissions.
                </p>
              </div>
            </div>
            <div className="min-w-[260px] space-y-2">
              <div className="text-[11px] text-foreground-muted">Invite and manage</div>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-9 bg-surface-75 border-border">
                  <SelectValue placeholder="Default invite role" />
                </SelectTrigger>
                <SelectContent className="bg-surface-100 border-border">
                  {roles
                    .filter((role) => role.id !== 'owner')
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <PermissionGate permissions={permissions} required={['members_manage']}>
                  <Button size="sm" onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Invite Member
                  </Button>
                </PermissionGate>
                <PermissionGate permissions={permissions} required={['members_manage']}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkFreeze}
                    disabled={selectedMembers.size === 0}
                  >
                    Freeze
                  </Button>
                </PermissionGate>
                <PermissionGate permissions={permissions} required={['members_manage']}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkRemove}
                    disabled={selectedMembers.size === 0}
                  >
                    Remove
                  </Button>
                </PermissionGate>
              </div>
              <div className="text-[11px] text-foreground-muted">
                {selectedMembers.size} {selectedMembers.size === 1 ? 'member' : 'members'} selected
              </div>
              {managementMessage && (
                <div className="text-[11px] text-brand-500">{managementMessage}</div>
              )}
            </div>
          </div>
        </div>

        <div className="page-divider" />

        {/* Team overview */}

        <div className="page-grid grid-cols-2 lg:grid-cols-4">
          <div className="page-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
                <Users className="w-4 h-4 text-foreground-light" />
              </div>

              <span className="text-xs text-foreground-light">
                {teamStats.members}/{teamStats.maxMembers}
              </span>
            </div>

            <p className="text-stat-number text-foreground">{members.length}</p>

            <p className="text-xs text-foreground-muted">Team member</p>
          </div>

          <div className="page-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
                <Zap className="w-4 h-4 text-brand-500" />
              </div>
            </div>

            <p className="text-stat-number text-foreground">{teamStats.workflows}</p>

            <p className="text-xs text-foreground-muted">Workflow</p>
          </div>

          <div className="page-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
                <Bot className="w-4 h-4 text-foreground-light" />
              </div>
            </div>

            <p className="text-stat-number text-foreground">{teamStats.agents}</p>

            <p className="text-xs text-foreground-muted">AI Agent</p>
          </div>

          <div className="page-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-brand-500" />
              </div>
            </div>

            <p className="text-stat-number text-foreground">
              {(teamStats.apiCalls / 1000).toFixed(1)}K
            </p>

            <p className="text-xs text-foreground-muted">API calls this month</p>
          </div>
        </div>

        {/* Pending invitations */}

        {pendingInvites.length > 0 && (
          <div className="p-4 rounded-md bg-warning-200 border border-border-muted">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-warning" />

              <span className="font-medium text-foreground">Pending Invitations</span>

              <Badge variant="secondary" className="bg-warning-200 text-warning">
                {pendingInvites.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {pendingInvites.map((invite) => {
                const roleConfig = getRoleConfig(invite.role)

                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 rounded-md bg-surface-100"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-foreground-muted" />

                      <div>
                        <p className="text-sm font-medium text-foreground">{invite.email}</p>

                        <p className="text-xs text-foreground-muted">
                          Sent on {invite.sentAt} · Expires on {invite.expiresAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(roleConfig.bgColor, roleConfig.color)}
                      >
                        {roleConfig.name}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Resend
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive-200"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Member list */}

        <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
          {/* Filters */}

          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />

                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-surface-75 border-border focus:bg-surface-100 focus:border-brand-500"
                />
              </div>

              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[140px] h-10 bg-surface-75 border-border text-foreground-light">
                  <SelectValue placeholder="Role filter" />
                </SelectTrigger>

                <SelectContent className="bg-surface-100 border-border">
                  <SelectItem value="all">All Roles</SelectItem>

                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Member table */}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-75">
                  <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all members"
                    />
                  </th>

                  <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">
                    User
                  </th>

                  <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">
                    Role
                  </th>

                  <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">
                    Status
                  </th>

                  <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">
                    Joined
                  </th>

                  <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">
                    Last Active
                  </th>

                  <th className="text-right text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member) => {
                  const roleConfig = getRoleConfig(member.role)
                  const RoleIcon = roleConfig.icon
                  const isFrozen = frozenMembers.has(member.id)
                  const statusLabel = isFrozen
                    ? 'Frozen'
                    : member.status === 'active'
                      ? 'Active'
                      : 'Pending'
                  const statusColor = isFrozen
                    ? 'text-warning'
                    : member.status === 'active'
                      ? 'text-brand-500'
                      : 'text-warning'
                  const statusDot = isFrozen
                    ? 'bg-warning'
                    : member.status === 'active'
                      ? 'bg-brand-500'
                      : 'bg-warning'

                  return (
                    <tr
                      key={member.id}
                      className="border-b border-border hover:bg-surface-75 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <Checkbox
                          checked={selectedMembers.has(member.id)}
                          onCheckedChange={(checked) => toggleSelect(member.id, checked)}
                          aria-label={`Select member ${member.name}`}
                        />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.avatar || undefined} />
                            <AvatarFallback className="bg-brand-200 text-brand-500">
                              {member.name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                            <p className="text-sm text-foreground-light">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          variant="secondary"
                          className={cn('gap-1', roleConfig.bgColor, roleConfig.color)}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {roleConfig.name}
                        </Badge>
                      </td>

                      <td className="px-4 py-4">
                        <span className={cn('flex items-center gap-1.5 text-sm', statusColor)}>
                          <span className={cn('w-2 h-2 rounded-full', statusDot)} />
                          {statusLabel}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-sm text-foreground-light">
                          {member.joinedAt ? formatDate(member.joinedAt) : '-'}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-sm text-foreground-light">
                          {member.lastActive ||
                            (member.status === 'pending' ? 'Not yet joined' : '—')}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-foreground-muted hover:text-foreground hover:bg-surface-200"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 bg-surface-100 border-border"
                          >
                            <PermissionGate permissions={permissions} required={['members_manage']}>
                              <DropdownMenuItem className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                                <UserCog className="w-4 h-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate permissions={permissions} required={['members_manage']}>
                              <DropdownMenuItem className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                                <Key className="w-4 h-4 mr-2" />
                                Manage Permissions
                              </DropdownMenuItem>
                            </PermissionGate>
                            <DropdownMenuItem className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                              <Mail className="w-4 h-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <PermissionGate permissions={permissions} required={['members_manage']}>
                              {member.role !== 'owner' && (
                                <DropdownMenuItem
                                  className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                                  onClick={() => handleToggleFreeze(member.id)}
                                >
                                  {isFrozen ? (
                                    <Eye className="w-4 h-4 mr-2" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 mr-2" />
                                  )}
                                  {isFrozen ? 'Unfreeze' : 'Freeze Member'}
                                </DropdownMenuItem>
                              )}
                            </PermissionGate>
                            <PermissionGate permissions={permissions} required={['members_manage']}>
                              {member.role !== 'owner' && (
                                <DropdownMenuItem
                                  className="text-destructive hover:bg-destructive-200"
                                  onClick={() => handleRemoveMember(member.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove Member
                                </DropdownMenuItem>
                              )}
                            </PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role descriptions */}

        <div className="p-6 rounded-md bg-surface-100 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Role permission description</h3>

          <div className="page-grid md:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => {
              const RoleIcon = role.icon

              return (
                <div key={role.id} className="p-4 rounded-md bg-surface-75">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-md flex items-center justify-center',
                        role.bgColor
                      )}
                    >
                      <RoleIcon className={cn('w-4 h-4', role.color)} />
                    </div>

                    <span className={cn('font-medium', role.color)}>{role.name}</span>
                  </div>

                  <p className="text-sm text-foreground-muted">{role.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Invite member modal */}

      {showInviteModal && (
        <PermissionGate permissions={permissions} required={['members_manage']}>
          <>
            <div
              className="fixed inset-0 bg-background/80 z-50"
              onClick={() => setShowInviteModal(false)}
            />

            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-md bg-surface-100 border border-border z-50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Invite new member</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>

                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-10 bg-surface-75 border-border focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Role</label>

                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="h-10 bg-surface-75 border-border">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent className="bg-surface-100 border-border">
                      {roles
                        .filter((r) => r.id !== 'owner')
                        .map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <span className="flex items-center gap-2">
                              <role.icon className={cn('w-4 h-4', role.color)} />

                              {role.name}
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-md bg-surface-75 text-sm text-foreground-light">
                  <p>Invite link will be sent to the specified email and is valid for 7 days.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                  className="border-border text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  Cancel
                </Button>

                <Button className="bg-brand-500 hover:bg-brand-600 text-background">
                  <Send className="w-4 h-4 mr-2" />
                  Send Invite
                </Button>
              </div>
            </div>
          </>
        </PermissionGate>
      )}
    </PageContainer>
  )
}
