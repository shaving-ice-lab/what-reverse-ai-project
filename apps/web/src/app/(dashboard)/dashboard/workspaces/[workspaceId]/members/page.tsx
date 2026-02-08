"use client";

/**
 * Workspace Members and Permissions Page - Supabase Style
 * Task #149: Member list table, invite and manage section, role description section
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
 Users,
 UserPlus,
 Search,
 MoreHorizontal,
 Shield,
 Mail,
 Clock,
 Crown,
 Edit3,
 Eye,
 Trash2,
 Send,
 RefreshCw,
 X,
 Check,
 UserCog,
 Key,
 Filter,
 Loader2,
 AlertCircle,
 Snowflake,
 Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
 PageContainer,
 PageHeader,
 SettingsSection,
} from "@/components/dashboard/page-layout";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 workspaceApi,
 type WorkspaceMember,
} from "@/lib/api/workspace";
import { useAuthStore } from "@/stores/useAuthStore";
import { buildWorkspacePermissions, resolveWorkspaceRoleFromUser } from "@/lib/permissions";
import { PermissionGate } from "@/components/permissions/permission-gate";

// ===== Role Config =====
const roles = [
  {
    id: "owner",
    name: "Owner",
    description: "Full control permissions, including billing, security policies, and workspace deletion",
    color: "text-warning",
    bgColor: "bg-warning-200",
    icon: Crown,
    permissions: [
      "Manage all members and roles",
      "Edit billing and subscription",
      "Delete workspace",
      "Manage security policies",
    ],
  },
  {
    id: "admin",
    name: "Admin",
    description: "Can manage members, apps, and most settings",
    color: "text-brand-500",
    bgColor: "bg-brand-200",
    icon: Shield,
    permissions: [
      "Invite and remove members",
      "Create and manage apps",
      "View audit logs",
      "Manage integration config",
    ],
  },
  {
    id: "member",
    name: "Member",
    description: "Can create and edit apps, execute workflows",
    color: "text-foreground-light",
    bgColor: "bg-surface-200",
    icon: Edit3,
    permissions: [
      "Create and edit apps",
      "Execute workflows",
      "View execution logs",
      "Manage personal API keys",
    ],
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Read access only; cannot edit or execute",
    color: "text-foreground-muted",
    bgColor: "bg-surface-200",
    icon: Eye,
    permissions: [
      "View apps and workflows",
      "View execution records",
      "View member list",
    ],
  },
];

// ===== Member Status Config =====
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "text-brand-500", bg: "bg-brand-200" },
  pending: { label: "Pending", color: "text-warning", bg: "bg-warning-200" },
  suspended: { label: "Suspended", color: "text-foreground-muted", bg: "bg-surface-200" },
};

// ===== Mock Data (pending real API integration) =====
const mockMembers: Array<WorkspaceMember & { lastActiveAt?: string }> = [
 {
 id: "m1",
 workspace_id: "ws1",
 user_id: "u1",
 role_id: "owner",
 role_name: "owner",
 status: "active",
 joined_at: "2025-10-15T08:00:00Z",
 created_at: "2025-10-15T08:00:00Z",
 updated_at: "2026-02-02T10:00:00Z",
 lastActiveAt: "Just now",
 user: { id: "u1", username: "", email: "zhangming@example.com", avatar: undefined },
 },
 {
 id: "m2",
 workspace_id: "ws1",
 user_id: "u2",
 role_id: "admin",
 role_name: "admin",
 status: "active",
 joined_at: "2025-11-20T09:30:00Z",
 created_at: "2025-11-20T09:30:00Z",
 updated_at: "2026-02-01T14:00:00Z",
 lastActiveAt: "5 min ago",
 user: { id: "u2", username: "Li Hua", email: "lihua@example.com", avatar: undefined },
 },
 {
 id: "m3",
 workspace_id: "ws1",
 user_id: "u3",
 role_id: "member",
 role_name: "member",
 status: "active",
 joined_at: "2025-12-05T11:00:00Z",
 created_at: "2025-12-05T11:00:00Z",
 updated_at: "2026-01-30T16:00:00Z",
 lastActiveAt: "1 hour ago",
 user: { id: "u3", username: "Wang Fang", email: "wangfang@example.com", avatar: undefined },
 },
 {
 id: "m4",
 workspace_id: "ws1",
 user_id: "u4",
 role_id: "viewer",
 role_name: "viewer",
 status: "suspended",
 joined_at: "2026-01-10T10:00:00Z",
 created_at: "2026-01-10T10:00:00Z",
 updated_at: "2026-01-25T12:00:00Z",
 lastActiveAt: "3 days ago",
 user: { id: "u4", username: "Zhao Qiang", email: "zhaoqiang@example.com", avatar: undefined },
 },
];

const mockPendingInvites = [
 {
 id: "inv-1",
 email: "newmember@example.com",
 role: "member",
 sentAt: "2026-01-30",
 expiresAt: "2026-02-06",
 },
 {
 id: "inv-2",
 email: "analyst@example.com",
 role: "viewer",
 sentAt: "2026-02-01",
 expiresAt: "2026-02-08",
 },
];

// ===== Main Component =====
export default function WorkspaceMembersPage() {
 const params = useParams();
 const workspaceId = params.workspaceId as string;

 const { user } = useAuthStore();
 const workspaceRole = resolveWorkspaceRoleFromUser(user?.role);
 const permissions = buildWorkspacePermissions(workspaceRole);

 // ===== Status =====
 const [members, setMembers] = useState<Array<WorkspaceMember & { lastActiveAt?: string }>>(mockMembers);
 const [pendingInvites, setPendingInvites] = useState(mockPendingInvites);
 const [loading, setLoading] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");
 const [roleFilter, setRoleFilter] = useState<string>("all");
 const [statusFilter, setStatusFilter] = useState<string>("all");

  // Invite Dialog
 const [showInviteDialog, setShowInviteDialog] = useState(false);
 const [inviteEmail, setInviteEmail] = useState("");
 const [inviteRole, setInviteRole] = useState("member");
 const [inviting, setInviting] = useState(false);

  // Change Role Dialog
 const [showRoleDialog, setShowRoleDialog] = useState(false);
 const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
 const [newRole, setNewRole] = useState("");

  // ===== Load Member Data =====
 useEffect(() => {
 async function fetchMembers() {
 if (!workspaceId) return;
 setLoading(true);
 try {
      // TODO: Connect to real API
      // const data = await workspaceApi.getMembers(workspaceId);
      // setMembers(data);
      await new Promise((r) => setTimeout(r, 500)); // Simulated latency
 } catch (err) {
 console.error("Failed to fetch members:", err);
 } finally {
 setLoading(false);
 }
 }
 fetchMembers();
 }, [workspaceId]);

  // ===== Filter Members =====
 const filteredMembers = useMemo(() => {
 return members.filter((m) => {
 const matchesSearch =
 m.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 m.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesRole = roleFilter === "all" || m.role_name === roleFilter;
 const matchesStatus = statusFilter === "all" || m.status === statusFilter;
 return matchesSearch && matchesRole && matchesStatus;
 });
 }, [members, searchQuery, roleFilter, statusFilter]);

  // ===== Get Role Config =====
 const getRoleConfig = useCallback((roleId: string) => {
 return roles.find((r) => r.id === roleId) || roles[2];
 }, []);

  // ===== Invite Member =====
 const handleInvite = async () => {
 if (!inviteEmail.trim()) return;
 setInviting(true);
 try {
      // TODO: Connect to real API
      // await workspaceApi.inviteMember(workspaceId, { email: inviteEmail, role: inviteRole });
 await new Promise((r) => setTimeout(r, 800));
 setPendingInvites((prev) => [
 ...prev,
 {
 id: `inv-${Date.now()}`,
 email: inviteEmail,
 role: inviteRole,
 sentAt: new Date().toISOString().split("T")[0],
 expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
 },
 ]);
 setInviteEmail("");
 setShowInviteDialog(false);
 } catch (err) {
 console.error("Failed to invite member:", err);
 } finally {
 setInviting(false);
 }
 };

  // ===== Change Role =====
 const handleChangeRole = async () => {
 if (!selectedMember || !newRole) return;
 try {
      // TODO: Connect to real API
      // await workspaceApi.updateMemberRole(workspaceId, selectedMember.id, { role_id: newRole });
 setMembers((prev) =>
 prev.map((m) =>
 m.id === selectedMember.id ? { ...m, role_id: newRole, role_name: newRole } : m
 )
 );
 setShowRoleDialog(false);
 setSelectedMember(null);
 } catch (err) {
 console.error("Failed to change role:", err);
 }
 };

  // ===== Suspend/Activate Member =====
 const handleToggleSuspend = async (member: WorkspaceMember) => {
 const newStatus = member.status === "suspended" ? "active" : "suspended";
 try {
      // TODO: Connect to real API
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m))
 );
 } catch (err) {
 console.error("Failed to toggle suspend:", err);
 }
 };

  // ===== Remove Member =====
  const handleRemoveMember = async (member: WorkspaceMember) => {
    if (!confirm(`Are you sure you want to remove ${member.user?.username || member.user?.email}?`)) return;
    try {
      // TODO: Connect to real API
      // await workspaceApi.removeMember(workspaceId, member.id);
 setMembers((prev) => prev.filter((m) => m.id !== member.id));
 } catch (err) {
 console.error("Failed to remove member:", err);
 }
 };

  // ===== Cancel Invite =====
 const handleCancelInvite = (inviteId: string) => {
 setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
 };

  // ===== Resend Invite =====
  const handleResendInvite = async (inviteId: string) => {
    // TODO: Connect to real API
    alert("Invitation has been resent");
  };

  // ===== Format Date =====
 const formatDate = (dateStr?: string) => {
 if (!dateStr) return "-";
 return new Date(dateStr).toLocaleDateString("zh-CN", {
 year: "numeric",
 month: "short",
 day: "numeric",
 });
 };

 return (
 <PageContainer>
 <div className="space-y-6">
        {/* Page Header */}
 <PageHeader
title="Members and permissions"
  description="Manage workspace members, roles and access permissions"
 actions={
 <PermissionGate permissions={permissions} required={["members_manage"]}>
 <Button
 size="sm"
 leftIcon={<UserPlus className="w-4 h-4" />}
 onClick={() => setShowInviteDialog(true)}
 >
              Invite Member
            </Button>
 </PermissionGate>
 }
 >
 <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
 <span className="inline-flex items-center gap-1.5">
 <Users className="w-3.5 h-3.5" />
              {members.filter((m) => m.status !== "suspended").length} Members
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {pendingInvites.length} Pending
 </span>
 </div>
 </PageHeader>

        {/* Role Permission Description */}
        <div className="p-4 rounded-md bg-surface-100 border border-border">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-foreground-light" />
            </div>
            <div className="space-y-1 text-[12px] text-foreground-light">
              <p><strong>Invite Members</strong>: Invite via email to join the workspace. Supports resending and expiration reminders.</p>
              <p><strong>Role Configuration</strong>: Owner / Admin / Member / Viewer each have different permission scopes.</p>
              <p><strong>Permission Details</strong>: Member management, billing, and security policies require Admin or Owner permissions.</p>
            </div>
          </div>
        </div>

        {/* Pending Invitations */}
 {pendingInvites.length > 0 && (
 <div className="p-4 rounded-md bg-warning-200/50 border border-warning/20">
 <div className="flex items-center gap-2 mb-3">
 <Mail className="w-4 h-4 text-warning" />
              <span className="font-medium text-foreground">Pending Invitations</span>
 <Badge variant="secondary" className="bg-warning-200 text-warning">
 {pendingInvites.length}
 </Badge>
 </div>
 <div className="space-y-2">
 {pendingInvites.map((invite) => {
 const roleConfig = getRoleConfig(invite.role);
 return (
 <div
 key={invite.id}
 className="flex items-center justify-between p-3 rounded-md bg-surface-100"
 >
 <div className="flex items-center gap-3">
 <Avatar className="w-8 h-8">
 <AvatarFallback className="bg-surface-200 text-foreground-muted text-xs">
 {invite.email.slice(0, 2).toUpperCase()}
 </AvatarFallback>
 </Avatar>
 <div>
 <p className="text-sm font-medium text-foreground">{invite.email}</p>
 <p className="text-xs text-foreground-muted">
                      Sent on {invite.sentAt} · Expires on {invite.expiresAt}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant="secondary" className={cn(roleConfig.bgColor, roleConfig.color)}>
 {roleConfig.name}
 </Badge>
 <PermissionGate permissions={permissions} required={["members_manage"]}>
 <Button
 variant="ghost"
 size="sm"
 className="text-foreground-light hover:text-foreground hover:bg-surface-200"
 onClick={() => handleResendInvite(invite.id)}
 >
 <RefreshCw className="w-4 h-4 mr-1" />
                    Resend
 </Button>
 <Button
 variant="ghost"
 size="sm"
 className="text-destructive hover:text-destructive hover:bg-destructive-200"
 onClick={() => handleCancelInvite(invite.id)}
 >
 <X className="w-4 h-4" />
 </Button>
 </PermissionGate>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

        {/* Member List */}
 <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
 {/* Filter */}
 <div className="p-4 border-b border-border">
 <div className="flex flex-wrap items-center gap-3">
 <div className="relative flex-1 min-w-[200px] max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
 <Input
 placeholder="Search member name or email..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 h-9 bg-surface-75 border-border focus:bg-surface-100 focus:border-brand-500"
 />
 </div>
 <Select value={roleFilter} onValueChange={setRoleFilter}>
 <SelectTrigger className="w-[130px] h-9 bg-surface-75 border-border text-foreground-light">
 <Filter className="w-3.5 h-3.5 mr-1.5" />
 <SelectValue placeholder="Role" />
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
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger className="w-[130px] h-9 bg-surface-75 border-border text-foreground-light">
 <SelectValue placeholder="Status" />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 <SelectItem value="all">All Status</SelectItem>
 <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>

          {/* Member Table */}
 {loading ? (
 <div className="flex items-center justify-center py-12">
 <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
 </div>
 ) : filteredMembers.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12 text-foreground-muted">
 <Users className="w-10 h-10 mb-3 opacity-50" />
 <p>No matching members</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="border-b border-border bg-surface-75">
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
 const roleConfig = getRoleConfig(member.role_name);
 const RoleIcon = roleConfig.icon;
 const status = statusConfig[member.status] || statusConfig.active;
 const isOwner = member.role_name === "owner";

 return (
 <tr
 key={member.id}
 className="border-b border-border hover:bg-surface-75 transition-colors"
 >
 {/* User */}
 <td className="px-4 py-4">
 <div className="flex items-center gap-3">
 <Avatar className="w-9 h-9">
 <AvatarImage src={member.user?.avatar} />
 <AvatarFallback className="bg-brand-200 text-brand-500 text-sm">
 {member.user?.username?.slice(0, 2) || "??"}
 </AvatarFallback>
 </Avatar>
 <div>
 <p className="font-medium text-foreground">
                        {member.user?.username || "Unknown User"}
 </p>
 <p className="text-sm text-foreground-light">
 {member.user?.email}
 </p>
 </div>
 </div>
 </td>

 {/* Role */}
 <td className="px-4 py-4">
 <Badge
 variant="secondary"
 className={cn("gap-1", roleConfig.bgColor, roleConfig.color)}
 >
 <RoleIcon className="w-3 h-3" />
 {roleConfig.name}
 </Badge>
 </td>

 {/* Status */}
 <td className="px-4 py-4">
 <span className={cn("flex items-center gap-1.5 text-sm", status.color)}>
 <span className={cn("w-2 h-2 rounded-full", status.bg)} />
 {status.label}
 </span>
 </td>

                        {/* Joined */}
 <td className="px-4 py-4 text-sm text-foreground-light">
 {formatDate(member.joined_at)}
 </td>

                        {/* Last Active */}
 <td className="px-4 py-4 text-sm text-foreground-muted">
 {member.lastActiveAt || "-"}
 </td>

 {/* Action */}
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
 <PermissionGate permissions={permissions} required={["members_manage"]}>
 {!isOwner && (
 <DropdownMenuItem
 className="text-foreground-light hover:text-foreground hover:bg-surface-200"
 onClick={() => {
 setSelectedMember(member);
 setNewRole(member.role_name);
 setShowRoleDialog(true);
 }}
 >
 <UserCog className="w-4 h-4 mr-2" />
                          Change Role
 </DropdownMenuItem>
 )}
 </PermissionGate>

 <DropdownMenuItem className="text-foreground-light hover:text-foreground hover:bg-surface-200">
 <Mail className="w-4 h-4 mr-2" />
                          Send Message
 </DropdownMenuItem>

 <PermissionGate permissions={permissions} required={["members_manage"]}>
 {!isOwner && (
 <>
 <DropdownMenuSeparator className="bg-border" />
 <DropdownMenuItem
 className="text-foreground-light hover:text-foreground hover:bg-surface-200"
 onClick={() => handleToggleSuspend(member)}
 >
 {member.status === "suspended" ? (
 <>
 <Play className="w-4 h-4 mr-2" />
                                Activate Member
 </>
 ) : (
 <>
 <Snowflake className="w-4 h-4 mr-2" />
                                Suspend Member
 </>
 )}
 </DropdownMenuItem>
 <DropdownMenuItem
 className="text-destructive hover:bg-destructive-200"
 onClick={() => handleRemoveMember(member)}
 >
 <Trash2 className="w-4 h-4 mr-2" />
                                Remove Member
 </DropdownMenuItem>
 </>
 )}
 </PermissionGate>
 </DropdownMenuContent>
 </DropdownMenu>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>

        {/* Role Permission Description */}
 <SettingsSection title="Role permission description" description="Each role has a different permission scope">
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
 {roles.map((role) => {
 const RoleIcon = role.icon;
 return (
 <div
 key={role.id}
 className="p-4 rounded-md bg-surface-75 border border-border"
 >
 <div className="flex items-center gap-2 mb-3">
 <div
 className={cn(
 "w-8 h-8 rounded-md flex items-center justify-center",
 role.bgColor
 )}
 >
 <RoleIcon className={cn("w-4 h-4", role.color)} />
 </div>
 <span className={cn("font-medium", role.color)}>{role.name}</span>
 </div>
 <p className="text-sm text-foreground-muted mb-3">{role.description}</p>
 <ul className="space-y-1.5">
 {role.permissions.map((perm, idx) => (
 <li
 key={idx}
 className="flex items-center gap-2 text-xs text-foreground-light"
 >
 <Check className="w-3 h-3 text-brand-500 shrink-0" />
 {perm}
 </li>
 ))}
 </ul>
 </div>
 );
 })}
 </div>
 </SettingsSection>
 </div>

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-surface-100 border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Invite New Member</DialogTitle>
 <DialogDescription className="text-foreground-muted">
 Enter email address and select role; invite link will be sent to that email.
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4 py-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-2">
 Email Address
 </label>
 <Input
 type="email"
 placeholder="member@example.com"
 value={inviteEmail}
 onChange={(e) => setInviteEmail(e.target.value)}
 className="h-10 bg-surface-75 border-border focus:border-brand-500"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-foreground mb-2">
 Role
 </label>
 <Select value={inviteRole} onValueChange={setInviteRole}>
 <SelectTrigger className="h-10 bg-surface-75 border-border">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 {roles
 .filter((r) => r.id !== "owner")
 .map((role) => {
 const RoleIcon = role.icon;
 return (
 <SelectItem key={role.id} value={role.id}>
 <span className="flex items-center gap-2">
 <RoleIcon className={cn("w-4 h-4", role.color)} />
 {role.name}
 </span>
 </SelectItem>
 );
 })}
 </SelectContent>
 </Select>
 </div>

 <div className="p-3 rounded-md bg-surface-75 text-sm text-foreground-light">
 <div className="flex items-start gap-2">
 <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>Invite links are valid for 7 days. After expiration, you'll need to resend.</p>
 </div>
 </div>
 </div>

 <DialogFooter>
 <Button
 variant="outline"
 onClick={() => setShowInviteDialog(false)}
 className="border-border text-foreground-light hover:text-foreground hover:bg-surface-200"
 >
 Cancel
 </Button>
 <Button
 onClick={handleInvite}
 disabled={!inviteEmail.trim() || inviting}
 className="bg-brand-500 hover:bg-brand-600 text-background"
 >
 {inviting ? (
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 ) : (
 <Send className="w-4 h-4 mr-2" />
 )}
            Send Invite
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

      {/* Change Role Dialog */}
 <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
 <DialogContent className="bg-surface-100 border-border max-w-md">
 <DialogHeader>
 <DialogTitle className="text-foreground">Change member role</DialogTitle>
 <DialogDescription className="text-foreground-muted">
              Select a new role for {selectedMember?.user?.username || selectedMember?.user?.email}.
 </DialogDescription>
 </DialogHeader>

 <div className="py-4">
 <Select value={newRole} onValueChange={setNewRole}>
 <SelectTrigger className="h-10 bg-surface-75 border-border">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 {roles
 .filter((r) => r.id !== "owner")
 .map((role) => {
 const RoleIcon = role.icon;
 return (
 <SelectItem key={role.id} value={role.id}>
 <span className="flex items-center gap-2">
 <RoleIcon className={cn("w-4 h-4", role.color)} />
 {role.name}
 <span className="text-foreground-muted text-xs ml-2">
 - {role.description}
 </span>
 </span>
 </SelectItem>
 );
 })}
 </SelectContent>
 </Select>
 </div>

 <DialogFooter>
 <Button
 variant="outline"
 onClick={() => setShowRoleDialog(false)}
 className="border-border text-foreground-light hover:text-foreground hover:bg-surface-200"
 >
 Cancel
 </Button>
 <Button
 onClick={handleChangeRole}
 disabled={newRole === selectedMember?.role_name}
 className="bg-brand-500 hover:bg-brand-600 text-background"
 >
 <Check className="w-4 h-4 mr-2" />
            Confirm Change
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </PageContainer>
 );
}
