"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  AppWindow,
  Building2,
  Clock,
  Database,
  Key,
  LogOut,
  Monitor,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Zap,
} from "lucide-react";
import {
  FormRow,
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { ADMIN_ROLE_DESCRIPTIONS, ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/permissions";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import {
  appRows,
  userActivityLogs,
  userLoginEvents,
  userRows,
  workspaceMembers,
  workspaceRows,
} from "@/lib/mock-data";
import type { User } from "@/types/auth";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "error" }> = {
  active: { label: "Active", variant: "success" },
  suspended: { label: "Suspended", variant: "warning" },
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  creator: "Creator",
  user: "User",
};

const ADMIN_ROLE_OPTIONS: Array<{ value: AdminRole | ""; label: string; description: string }> = [
  {
    value: "",
    label: "Auto (Not Configured)",
    description: "Uses admin_roles/admin_emails or default policy",
  },
  ...(["super_admin", "ops", "support", "finance", "reviewer", "viewer"] as AdminRole[]).map((role) => ({
    value: role,
    label: ADMIN_ROLE_LABELS[role],
    description: ADMIN_ROLE_DESCRIPTIONS[role],
  })),
];

const LOGIN_STATUS_VARIANTS: Record<string, "success" | "warning" | "error"> = {
  success: "success",
  blocked: "error",
  challenge: "warning",
};

const ACTIVITY_VARIANTS: Record<string, "info" | "warning" | "error" | "success"> = {
  info: "info",
  warning: "warning",
  error: "error",
  success: "success",
};

const RISK_FLAG_OPTIONS = [
  { value: "none", label: "No Risk", variant: "success" as const },
  { value: "low", label: "Low Risk", variant: "info" as const },
  { value: "medium", label: "Medium Risk", variant: "warning" as const },
  { value: "high", label: "High Risk", variant: "error" as const },
];

function getParamId(params: ReturnType<typeof useParams>) {
  const raw = (params as Record<string, string | string[] | undefined>)?.id;
  if (!raw) return "";
  return Array.isArray(raw) ? raw[0] : raw;
}

// Mock data for user assets
const mockUserAssets = {
  workspaces: [
    { id: "ws-1", name: "Hypergrowth Lab", role: "owner", created_at: "2025-12-19T09:10:00Z" },
    { id: "ws-2", name: "Nova Studio", role: "admin", created_at: "2026-01-05T08:00:00Z" },
  ],
  apps: [
    { id: "app-1", name: "Support Copilot", workspace_name: "Hypergrowth Lab", status: "published" },
    { id: "app-2", name: "Template Hub", workspace_name: "Hypergrowth Lab", status: "published" },
  ],
  usage: {
    total_executions: 82120,
    total_tokens: 8920000,
    total_storage_mb: 320,
    last_30_days_executions: 28420,
  },
};

// Mock data for user sessions
const mockUserSessions = [
  {
    id: "sess-1",
    device: "Chrome · macOS",
    ip: "18.141.2.21",
    location: "Singapore",
    last_active_at: "2026-02-03T07:58:00Z",
    created_at: "2026-02-03T06:00:00Z",
  },
  {
    id: "sess-2",
    device: "Admin Console · Desktop",
    ip: "34.88.14.2",
    location: "Tokyo",
    last_active_at: "2026-02-02T18:30:00Z",
    created_at: "2026-02-02T16:00:00Z",
  },
  {
    id: "sess-3",
    device: "Safari · iOS",
    ip: "13.112.32.10",
    location: "Seoul",
    last_active_at: "2026-02-01T12:00:00Z",
    created_at: "2026-02-01T10:00:00Z",
  },
];

export default function AdminUserDetailPage() {
  const localMode = isLocalModeEnabled();
  const params = useParams();
  const userId = getParamId(params);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();

  // Dialog states
  const [forceLogoutOpen, setForceLogoutOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [riskFlagOpen, setRiskFlagOpen] = useState(false);
  const [terminateSessionOpen, setTerminateSessionOpen] = useState<string | null>(null);

  // Form states
  const [forceLogoutReason, setForceLogoutReason] = useState("");
  const [riskFlag, setRiskFlag] = useState<"none" | "low" | "medium" | "high">("none");
  const [riskFlagReason, setRiskFlagReason] = useState("");
  const [adminRoleDraft, setAdminRoleDraft] = useState<AdminRole | "">("");
  const [adminRoleReason, setAdminRoleReason] = useState("");

  const userQuery = useQuery({
    queryKey: ["admin", "users", "detail", userId],
    enabled: Boolean(userId) && !localMode,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const data = await adminApi.users.get(userId);
      return data.user || null;
    },
  });

  const localUser = useMemo<User | null>(() => {
    if (!localMode) return null;
    const rows = userRows as unknown as User[];
    return rows.find((row) => row.id === userId) || null;
  }, [localMode, userId]);

  const user = localMode ? localUser : userQuery.data || null;

  const adminRoleRaw = useMemo(() => {
    const settings = (user?.settings ?? {}) as Record<string, unknown>;
    const raw = settings.admin_role ?? settings.adminRole;
    return typeof raw === "string" ? raw : "";
  }, [user?.settings]);

  const adminRoleValue = useMemo<"" | AdminRole>(() => {
    return ADMIN_ROLE_OPTIONS.some((option) => option.value === adminRoleRaw)
      ? (adminRoleRaw as AdminRole)
      : "";
  }, [adminRoleRaw]);

  const adminRoleLabel = adminRoleRaw
    ? ADMIN_ROLE_LABELS[adminRoleRaw as AdminRole] || adminRoleRaw
    : "Not Configured";

  const adminRoleDescription =
    adminRoleRaw && ADMIN_ROLE_DESCRIPTIONS[adminRoleRaw as AdminRole]
      ? ADMIN_ROLE_DESCRIPTIONS[adminRoleRaw as AdminRole]
      : adminRoleRaw
      ? "Unrecognized admin role"
      : "No admin role configured";

  // User assets data
  const userAssets = useMemo(() => {
    if (!localMode || !userId) return mockUserAssets;
    
    // Get workspaces where user is a member
    const memberWorkspaces = workspaceMembers
      .filter((m) => m.user_id === userId)
      .map((m) => {
        const ws = workspaceRows.find((w) => w.id === m.workspace_id);
        return ws ? { id: ws.id, name: ws.name, role: m.role, created_at: m.joined_at || ws.created_at } : null;
      })
      .filter(Boolean);

    // Get apps owned by user
    const userApps = appRows
      .filter((a) => a.owner_user_id === userId)
      .map((a) => ({
        id: a.id,
        name: a.name,
        workspace_name: a.workspace?.name || "Unknown",
        status: a.status,
      }));

    return {
      workspaces: memberWorkspaces as { id: string; name: string; role: string; created_at: string }[],
      apps: userApps,
      usage: mockUserAssets.usage,
    };
  }, [localMode, userId]);

  // User sessions
  const sessions = useMemo(() => (localMode ? mockUserSessions : []), [localMode]);

  const loginEvents = useMemo(
    () => (localMode ? userLoginEvents.filter((event) => event.user_id === userId) : []),
    [localMode, userId]
  );

  const activityLogs = useMemo(
    () => (localMode ? userActivityLogs.filter((log) => log.user_id === userId) : []),
    [localMode, userId]
  );

  useEffect(() => {
    if (!user) return;
    setAdminRoleDraft(adminRoleValue);
    setAdminRoleReason("");
  }, [user?.id, adminRoleValue, user]);

  // Mutations
  const forceLogoutMutation = useMutation({
    mutationFn: (reason: string) => adminApi.users.forceLogout(userId, { reason }),
    onSuccess: () => {
      setForceLogoutOpen(false);
      setForceLogoutReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => adminApi.users.resetPassword(userId, { notify: true }),
    onSuccess: () => {
      setResetPasswordOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const riskFlagMutation = useMutation({
    mutationFn: ({ flag, reason }: { flag: "none" | "low" | "medium" | "high"; reason: string }) =>
      adminApi.users.setRiskFlag(userId, { flag, reason }),
    onSuccess: () => {
      setRiskFlagOpen(false);
      setRiskFlag("none");
      setRiskFlagReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const terminateSessionMutation = useMutation({
    mutationFn: (sessionId: string) => adminApi.users.terminateSession(userId, sessionId),
    onSuccess: () => {
      setTerminateSessionOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const updateAdminRoleMutation = useMutation({
    mutationFn: async ({ role, reason }: { role: string; reason: string }) => {
      if (localMode) {
        return { user: user as User };
      }
      return adminApi.users.updateAdminRole(userId, {
        admin_role: role,
        reason,
      });
    },
    onSuccess: () => {
      setAdminRoleReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "detail", userId] });
    },
  });

  if (!userId) {
    return (
      <PageContainer>
        <PageHeader title="User Details" description="Invalid user ID" icon={<UserRound className="w-4 h-4" />} />
      </PageContainer>
    );
  }

  const statusConfig = user?.status ? STATUS_LABELS[user.status] : null;
  const roleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : "-";
  const currentRiskFlag = (user as User & { risk_flag?: string })?.risk_flag || "none";
  const riskFlagConfig = RISK_FLAG_OPTIONS.find((opt) => opt.value === currentRiskFlag);
  const canUpdateAdminRole = hasPermission("permissions.write");
  const isAdminRoleDirty = adminRoleDraft !== adminRoleValue;
  const isAdminRoleReasonValid = adminRoleReason.trim().length > 0;
  const adminRoleActionDisabled = localMode || !user || !canUpdateAdminRole;
  const canSubmitAdminRole =
    !adminRoleActionDisabled && isAdminRoleDirty && isAdminRoleReasonValid && !updateAdminRoleMutation.isPending;

  return (
    <PageContainer>
      <PageHeader
        title={user?.display_name || user?.email || "User Details"}
        description={
          user
            ? `${user.email} · ${user.id}`
            : localMode
            ? "Local user data not found"
            : "Loading user data..."
        }
        icon={<UserRound className="w-4 h-4" />}
        backHref="/users"
        backLabel="Back to User List"
        badge={
          user ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusConfig?.variant || "warning"} size="sm">
                {statusConfig?.label || user.status}
              </Badge>
              <Badge variant="outline" size="sm">
                {roleLabel}
              </Badge>
              {user.email_verified ? (
                <Badge variant="success" size="sm">
                  Email Verified
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  Email Not Verified
                </Badge>
              )}
              {riskFlagConfig && riskFlagConfig.value !== "none" && (
                <Badge variant={riskFlagConfig.variant} size="sm">
                  {riskFlagConfig.label}
                </Badge>
              )}
            </div>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setForceLogoutOpen(true)}
              disabled={!user}
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Force Logout
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetPasswordOpen(true)}
              disabled={!user}
            >
              <Key className="w-3.5 h-3.5 mr-1" />
              Reset Password
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRiskFlag((currentRiskFlag as "none" | "low" | "medium" | "high") || "none");
                setRiskFlagOpen(true);
              }}
              disabled={!user}
            >
              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
              Risk Flag
            </Button>
          </div>
        }
      />

      {/* Dialogs */}
      <ConfirmDialog
        open={forceLogoutOpen}
        onOpenChange={setForceLogoutOpen}
        title="Force Logout"
        description="This will immediately terminate all active sessions. The user will need to log in again."
        confirmLabel="Confirm Logout"
        onConfirm={() => forceLogoutMutation.mutate(forceLogoutReason)}
        isLoading={forceLogoutMutation.isPending}
        variant="warning"
      >
        <div className="space-y-3 py-2">
          <div className="text-[12px] text-foreground-muted">
            User: {user?.email}
          </div>
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">Reason (required)</label>
            <Input
              value={forceLogoutReason}
              onChange={(e) => setForceLogoutReason(e.target.value)}
              placeholder="Enter reason for force logout..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        title="Reset Password"
        description="A temporary password will be generated and sent to the user's email."
        confirmLabel="Confirm Reset"
        onConfirm={() => resetPasswordMutation.mutate()}
        isLoading={resetPasswordMutation.isPending}
        variant="warning"
      >
        <div className="space-y-3 py-2">
          <div className="text-[12px] text-foreground-muted">
            User: {user?.email}
          </div>
          <div className="text-[12px] text-foreground-light">
            A temporary password will be sent to the user's email. The user will need to set a new password on first login.
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={riskFlagOpen}
        onOpenChange={setRiskFlagOpen}
        title="Set Risk Flag"
        description="Set a risk level flag for this user, used for risk control and review reference."
        confirmLabel="Confirm"
        onConfirm={() => riskFlagMutation.mutate({ flag: riskFlag, reason: riskFlagReason })}
        isLoading={riskFlagMutation.isPending}
        variant={riskFlag === "high" ? "danger" : riskFlag === "medium" ? "warning" : "default"}
      >
        <div className="space-y-4 py-2">
          <div className="text-[12px] text-foreground-muted">
            User: {user?.email}
          </div>
          <div className="space-y-2">
            <label className="text-[12px] text-foreground">Risk Level</label>
            <div className="flex flex-wrap gap-2">
              {RISK_FLAG_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={riskFlag === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRiskFlag(opt.value as "none" | "low" | "medium" | "high")}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">Reason (required)</label>
            <Input
              value={riskFlagReason}
              onChange={(e) => setRiskFlagReason(e.target.value)}
              placeholder="Enter reason for risk flag..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(terminateSessionOpen)}
        onOpenChange={(open) => !open && setTerminateSessionOpen(null)}
        title="Terminate Session"
        description="This will terminate the login session on this device."
        confirmLabel="Confirm Termination"
        onConfirm={() => terminateSessionOpen && terminateSessionMutation.mutate(terminateSessionOpen)}
        isLoading={terminateSessionMutation.isPending}
        variant="warning"
      />

      <div className="page-grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <SettingsSection title="Basic Information" description="Account profile, status, and permission details.">
          {!user ? (
            <div className="text-[12px] text-foreground-muted">
              {userQuery.isPending && !localMode ? "Loading..." : "No user data available"}
            </div>
          ) : (
            <div className="space-y-1">
              <FormRow label="User ID" description="Used for backend lookup and auditing">
                <div className="text-[12px] text-foreground">{user.id}</div>
              </FormRow>
              <FormRow label="Email" description="Login and notification email">
                <div className="text-[12px] text-foreground">{user.email}</div>
              </FormRow>
              <FormRow label="Username" description="Display name and alias">
                <div className="space-y-1">
                  <div className="text-[12px] text-foreground">
                    {user.display_name || user.username || "-"}
                  </div>
                  <div className="text-[11px] text-foreground-muted">
                    @{user.username || "unknown"}
                  </div>
                </div>
              </FormRow>
              <FormRow label="Role" description="Permission role and capabilities">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm">
                    {roleLabel}
                  </Badge>
                  <span className="text-[11px] text-foreground-muted">
                    Can be adjusted in the user list
                  </span>
                </div>
              </FormRow>
              <FormRow label="Admin Role" description="Controls Admin Console permission assignment">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={adminRoleDraft}
                      onChange={(e) => setAdminRoleDraft(e.target.value as AdminRole | "")}
                      disabled={adminRoleActionDisabled}
                      className="h-8 rounded-md border border-border bg-surface-100 px-2 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {ADMIN_ROLE_OPTIONS.map((option) => (
                        <option key={option.value || "auto"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Badge variant="outline" size="sm">
                      Current: {adminRoleLabel}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-foreground-muted">{adminRoleDescription}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={adminRoleReason}
                      onChange={(e) => setAdminRoleReason(e.target.value)}
                      placeholder="Reason for change (required)"
                      disabled={adminRoleActionDisabled}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateAdminRoleMutation.mutate({ role: adminRoleDraft, reason: adminRoleReason })
                      }
                      disabled={!canSubmitAdminRole}
                    >
                      Save Admin Role
                    </Button>
                    {adminRoleActionDisabled && (
                      <span className="text-[11px] text-foreground-muted">
                        {localMode ? "Cannot save in local mode" : "No permission to modify admin role"}
                      </span>
                    )}
                  </div>
                </div>
              </FormRow>
              <FormRow label="Status" description="Current account status">
                <div className="flex items-center gap-2">
                  <Badge variant={statusConfig?.variant || "warning"} size="sm">
                    {statusConfig?.label || user.status}
                  </Badge>
                  {user.status_reason ? (
                    <span className="text-[11px] text-foreground-muted">
                      Reason: {user.status_reason}
                    </span>
                  ) : null}
                </div>
              </FormRow>
              <FormRow label="Risk Flag" description="Risk control level">
                <div className="flex items-center gap-2">
                  <Badge variant={riskFlagConfig?.variant || "success"} size="sm">
                    {riskFlagConfig?.label || "No Risk"}
                  </Badge>
                </div>
              </FormRow>
              <FormRow label="Registration Date" description="Date the account was first created">
                <div className="text-[12px] text-foreground-light">
                  {user.created_at ? formatDate(user.created_at) : "-"}
                </div>
              </FormRow>
              <FormRow label="Last Login" description="Most recent login time">
                <div className="text-[12px] text-foreground-light">
                  {user.last_login_at ? formatRelativeTime(user.last_login_at) : "-"}
                </div>
              </FormRow>
              <FormRow label="Updated At" description="Most recent profile change">
                <div className="text-[12px] text-foreground-light">
                  {user.updated_at ? formatDate(user.updated_at) : "-"}
                </div>
              </FormRow>
              {user.status_updated_at ? (
                <FormRow label="Status Updated At" description="Sensitive status change record">
                  <div className="text-[12px] text-foreground-light">
                    {formatDate(user.status_updated_at)}
                  </div>
                </FormRow>
              ) : null}
            </div>
          )}
        </SettingsSection>

        <SettingsSection
          title="Active Sessions"
          description="Current login devices and session management."
          footer={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setForceLogoutOpen(true)}
              disabled={sessions.length === 0}
            >
              Terminate All Sessions
            </Button>
          }
        >
          {!user ? (
            <div className="text-[12px] text-foreground-muted">
              {userQuery.isPending && !localMode ? "Loading..." : "No session data available"}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-[12px] text-foreground-muted">
              No active sessions
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface-75 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                      <Monitor className="w-3.5 h-3.5 text-foreground-muted" />
                      {session.device}
                    </div>
                    <div className="text-[11px] text-foreground-light mt-1">
                      {session.ip} · {session.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-[11px] text-foreground-muted text-right">
                      <div>Active {formatRelativeTime(session.last_active_at)}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTerminateSessionOpen(session.id)}
                    >
                      Terminate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SettingsSection>
      </div>

      {/* User Assets Section */}
      <SettingsSection
        title="User Assets Overview"
        description="Workspaces, apps, and usage summary."
        icon={<Database className="w-4 h-4" />}
      >
        {!user ? (
          <div className="text-[12px] text-foreground-muted">
            {userQuery.isPending && !localMode ? "Loading..." : "No asset data available"}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Usage Stats */}
            <div className="page-grid grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Executions"
                value={userAssets.usage.total_executions.toLocaleString()}
                subtitle="Cumulative workflow executions"
                icon={<Zap className="w-4 h-4" />}
              />
              <StatsCard
                title="Last 30 Days"
                value={userAssets.usage.last_30_days_executions.toLocaleString()}
                subtitle="Recent activity"
                icon={<Clock className="w-4 h-4" />}
              />
              <StatsCard
                title="Token Usage"
                value={`${(userAssets.usage.total_tokens / 1000000).toFixed(1)}M`}
                subtitle="Total tokens"
                icon={<Zap className="w-4 h-4" />}
              />
              <StatsCard
                title="Storage Used"
                value={`${userAssets.usage.total_storage_mb} MB`}
                subtitle="Files and data"
                icon={<Database className="w-4 h-4" />}
              />
            </div>

            {/* Workspaces */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                <Building2 className="w-4 h-4" />
                Associated Workspaces ({userAssets.workspaces.length})
              </div>
              {userAssets.workspaces.length === 0 ? (
                <div className="text-[12px] text-foreground-muted">No associated workspaces</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workspace</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAssets.workspaces.map((ws) => (
                      <TableRow key={ws.id}>
                        <TableCell className="text-[12px] font-medium text-foreground">
                          {ws.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" size="sm">
                            {ws.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[12px] text-foreground-muted">
                          {formatDate(ws.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/workspaces/${ws.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Apps */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                <AppWindow className="w-4 h-4" />
                Created Apps ({userAssets.apps.length})
              </div>
              {userAssets.apps.length === 0 ? (
                <div className="text-[12px] text-foreground-muted">No apps created</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>App</TableHead>
                      <TableHead>Workspace</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAssets.apps.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="text-[12px] font-medium text-foreground">
                          {app.name}
                        </TableCell>
                        <TableCell className="text-[12px] text-foreground-light">
                          {app.workspace_name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={app.status === "published" ? "success" : "warning"}
                            size="sm"
                          >
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/apps/${app.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </SettingsSection>

      <div className="page-grid grid-cols-1 lg:grid-cols-2">
        <SettingsSection title="Recent Logins" description="Login devices and risk control records.">
          {!user ? (
            <div className="text-[12px] text-foreground-muted">
              {userQuery.isPending && !localMode ? "Loading..." : "No login data available"}
            </div>
          ) : loginEvents.length === 0 ? (
            <div className="text-[12px] text-foreground-muted">
              {localMode ? "No local login events" : "This module is only shown in local mode"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-right">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-[12px] text-foreground-light">
                      {formatRelativeTime(event.created_at)}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground">
                      {event.device}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-light">
                      {event.location}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-light">
                      {event.ip}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={LOGIN_STATUS_VARIANTS[event.status] || "warning"}
                        size="sm"
                      >
                        {event.status === "success"
                          ? "Success"
                          : event.status === "blocked"
                          ? "Blocked"
                          : "Verifying"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SettingsSection>

        <SettingsSection
          title="Activity History"
          description="Account activity, risk, and permission change records."
          footer={
            <div className="flex items-center gap-2">
              <Link href="/security/audit-logs">
                <Button variant="outline" size="sm">
                  View All Audits
                </Button>
              </Link>
              <Button variant="outline" size="sm" disabled>
                Export Records
              </Button>
            </div>
          }
        >
          {!user ? (
            <div className="text-[12px] text-foreground-muted">
              {userQuery.isPending && !localMode ? "Loading..." : "No activity data available"}
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="text-[12px] text-foreground-muted">
              {localMode ? "No local activity records" : "This module is only shown in local mode"}
            </div>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface-75 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                      {log.action}
                    </div>
                    <div className="text-[11px] text-foreground-light mt-1">
                      {log.detail}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <Badge variant={ACTIVITY_VARIANTS[log.severity] || "info"} size="sm">
                      {log.severity === "success"
                        ? "Normal"
                        : log.severity === "warning"
                        ? "Warning"
                        : log.severity === "error"
                        ? "Critical"
                        : "Info"}
                    </Badge>
                    <div className="flex items-center gap-1 text-[11px] text-foreground-muted">
                      <Clock className="w-3.5 h-3.5" />
                      {formatRelativeTime(log.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SettingsSection>
      </div>
    </PageContainer>
  );
}
