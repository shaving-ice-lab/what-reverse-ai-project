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
  active: { label: "正常", variant: "success" },
  suspended: { label: "已暂停", variant: "warning" },
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  creator: "Creator",
  user: "User",
};

const ADMIN_ROLE_OPTIONS: Array<{ value: AdminRole | ""; label: string; description: string }> = [
  {
    value: "",
    label: "自动（未配置）",
    description: "按 admin_roles/admin_emails 或默认策略生效",
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
  { value: "none", label: "无风险", variant: "success" as const },
  { value: "low", label: "低风险", variant: "info" as const },
  { value: "medium", label: "中风险", variant: "warning" as const },
  { value: "high", label: "高风险", variant: "error" as const },
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
    : "未配置";

  const adminRoleDescription =
    adminRoleRaw && ADMIN_ROLE_DESCRIPTIONS[adminRoleRaw as AdminRole]
      ? ADMIN_ROLE_DESCRIPTIONS[adminRoleRaw as AdminRole]
      : adminRoleRaw
      ? "未识别的管理员角色"
      : "未配置管理员角色";

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
        <PageHeader title="用户详情" description="无效的用户 ID" icon={<UserRound className="w-4 h-4" />} />
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
        title={user?.display_name || user?.email || "用户详情"}
        description={
          user
            ? `${user.email} · ${user.id}`
            : localMode
            ? "未找到对应的本地用户数据"
            : "正在加载用户数据..."
        }
        icon={<UserRound className="w-4 h-4" />}
        backHref="/users"
        backLabel="返回用户列表"
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
                  邮箱已验证
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  邮箱未验证
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
              强制下线
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetPasswordOpen(true)}
              disabled={!user}
            >
              <Key className="w-3.5 h-3.5 mr-1" />
              重置密码
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
              风险标记
            </Button>
          </div>
        }
      />

      {/* Dialogs */}
      <ConfirmDialog
        open={forceLogoutOpen}
        onOpenChange={setForceLogoutOpen}
        title="强制下线"
        description="将立即终止该用户的所有活跃会话，用户需要重新登录。"
        confirmLabel="确认下线"
        onConfirm={() => forceLogoutMutation.mutate(forceLogoutReason)}
        isLoading={forceLogoutMutation.isPending}
        variant="warning"
      >
        <div className="space-y-3 py-2">
          <div className="text-[12px] text-foreground-muted">
            用户：{user?.email}
          </div>
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">操作原因（必填）</label>
            <Input
              value={forceLogoutReason}
              onChange={(e) => setForceLogoutReason(e.target.value)}
              placeholder="请输入强制下线的原因..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        title="重置密码"
        description="将为该用户生成临时密码并发送至注册邮箱。"
        confirmLabel="确认重置"
        onConfirm={() => resetPasswordMutation.mutate()}
        isLoading={resetPasswordMutation.isPending}
        variant="warning"
      >
        <div className="space-y-3 py-2">
          <div className="text-[12px] text-foreground-muted">
            用户：{user?.email}
          </div>
          <div className="text-[12px] text-foreground-light">
            临时密码将通过邮件发送至用户邮箱，用户首次登录后需要设置新密码。
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={riskFlagOpen}
        onOpenChange={setRiskFlagOpen}
        title="设置风险标记"
        description="为该用户设置风险等级标记，用于风控与审核参考。"
        confirmLabel="确认设置"
        onConfirm={() => riskFlagMutation.mutate({ flag: riskFlag, reason: riskFlagReason })}
        isLoading={riskFlagMutation.isPending}
        variant={riskFlag === "high" ? "danger" : riskFlag === "medium" ? "warning" : "default"}
      >
        <div className="space-y-4 py-2">
          <div className="text-[12px] text-foreground-muted">
            用户：{user?.email}
          </div>
          <div className="space-y-2">
            <label className="text-[12px] text-foreground">风险等级</label>
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
            <label className="text-[12px] text-foreground">标记原因（必填）</label>
            <Input
              value={riskFlagReason}
              onChange={(e) => setRiskFlagReason(e.target.value)}
              placeholder="请输入风险标记的原因..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(terminateSessionOpen)}
        onOpenChange={(open) => !open && setTerminateSessionOpen(null)}
        title="终止会话"
        description="将终止该设备的登录会话。"
        confirmLabel="确认终止"
        onConfirm={() => terminateSessionOpen && terminateSessionMutation.mutate(terminateSessionOpen)}
        isLoading={terminateSessionMutation.isPending}
        variant="warning"
      />

      <div className="page-grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <SettingsSection title="基础信息" description="账户资料、状态与权限信息。">
          {!user ? (
            <div className="text-[12px] text-foreground-muted">
              {userQuery.isPending && !localMode ? "正在加载..." : "暂无用户数据"}
            </div>
          ) : (
            <div className="space-y-1">
              <FormRow label="用户 ID" description="用于后台检索与审计">
                <div className="text-[12px] text-foreground">{user.id}</div>
              </FormRow>
              <FormRow label="邮箱" description="登录与通知邮箱">
                <div className="text-[12px] text-foreground">{user.email}</div>
              </FormRow>
              <FormRow label="用户名" description="展示名称与别名">
                <div className="space-y-1">
                  <div className="text-[12px] text-foreground">
                    {user.display_name || user.username || "-"}
                  </div>
                  <div className="text-[11px] text-foreground-muted">
                    @{user.username || "unknown"}
                  </div>
                </div>
              </FormRow>
              <FormRow label="角色" description="权限角色与能力点">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm">
                    {roleLabel}
                  </Badge>
                  <span className="text-[11px] text-foreground-muted">
                    可在用户列表中调整
                  </span>
                </div>
              </FormRow>
              <FormRow label="管理员角色" description="控制 Admin Console 权限分配">
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
                      当前：{adminRoleLabel}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-foreground-muted">{adminRoleDescription}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={adminRoleReason}
                      onChange={(e) => setAdminRoleReason(e.target.value)}
                      placeholder="变更原因（必填）"
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
                      保存管理员角色
                    </Button>
                    {adminRoleActionDisabled && (
                      <span className="text-[11px] text-foreground-muted">
                        {localMode ? "本地模式不可保存" : "无权限修改管理员角色"}
                      </span>
                    )}
                  </div>
                </div>
              </FormRow>
              <FormRow label="状态" description="当前账号状态">
                <div className="flex items-center gap-2">
                  <Badge variant={statusConfig?.variant || "warning"} size="sm">
                    {statusConfig?.label || user.status}
                  </Badge>
                  {user.status_reason ? (
                    <span className="text-[11px] text-foreground-muted">
                      原因：{user.status_reason}
                    </span>
                  ) : null}
                </div>
              </FormRow>
              <FormRow label="风险标记" description="风控风险等级">
                <div className="flex items-center gap-2">
                  <Badge variant={riskFlagConfig?.variant || "success"} size="sm">
                    {riskFlagConfig?.label || "无风险"}
                  </Badge>
                </div>
              </FormRow>
              <FormRow label="注册时间" description="首次创建账号的时间">
                <div className="text-[12px] text-foreground-light">
                  {user.created_at ? formatDate(user.created_at) : "-"}
                </div>
              </FormRow>
              <FormRow label="最近登录" description="最近一次登录时间">
                <div className="text-[12px] text-foreground-light">
                  {user.last_login_at ? formatRelativeTime(user.last_login_at) : "-"}
                </div>
              </FormRow>
              <FormRow label="更新时间" description="用户信息最近变更">
                <div className="text-[12px] text-foreground-light">
                  {user.updated_at ? formatDate(user.updated_at) : "-"}
                </div>
              </FormRow>
              {user.status_updated_at ? (
                <FormRow label="状态更新时间" description="敏感状态变更记录">
                  <div className="text-[12px] text-foreground-light">
                    {formatDate(user.status_updated_at)}
                  </div>
                </FormRow>
              ) : null}
            </div>
          )}
        </SettingsSection>

        <SettingsSection
          title="活跃会话"
          description="当前登录设备与会话管理。"
          footer={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setForceLogoutOpen(true)}
              disabled={sessions.length === 0}
            >
              终止所有会话
            </Button>
          }
        >
          {!user ? (
            <div className="text-[12px] text-foreground-muted">
              {userQuery.isPending && !localMode ? "正在加载..." : "暂无会话信息"}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-[12px] text-foreground-muted">
              暂无活跃会话
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
                      <div>活跃于 {formatRelativeTime(session.last_active_at)}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTerminateSessionOpen(session.id)}
                    >
                      终止
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
        title="用户资产视图"
        description="工作空间、应用与用量汇总。"
        icon={<Database className="w-4 h-4" />}
      >
        {!user ? (
          <div className="text-[12px] text-foreground-muted">
            {userQuery.isPending && !localMode ? "正在加载..." : "暂无资产数据"}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Usage Stats */}
            <div className="page-grid grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="总执行量"
                value={userAssets.usage.total_executions.toLocaleString()}
                subtitle="累计工作流执行"
                icon={<Zap className="w-4 h-4" />}
              />
              <StatsCard
                title="近 30 天执行"
                value={userAssets.usage.last_30_days_executions.toLocaleString()}
                subtitle="近期活跃度"
                icon={<Clock className="w-4 h-4" />}
              />
              <StatsCard
                title="Token 消耗"
                value={`${(userAssets.usage.total_tokens / 1000000).toFixed(1)}M`}
                subtitle="累计 Token"
                icon={<Zap className="w-4 h-4" />}
              />
              <StatsCard
                title="存储占用"
                value={`${userAssets.usage.total_storage_mb} MB`}
                subtitle="文件与数据"
                icon={<Database className="w-4 h-4" />}
              />
            </div>

            {/* Workspaces */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                <Building2 className="w-4 h-4" />
                关联工作空间（{userAssets.workspaces.length}）
              </div>
              {userAssets.workspaces.length === 0 ? (
                <div className="text-[12px] text-foreground-muted">暂无关联工作空间</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>工作空间</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>加入时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
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
                              查看
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
                创建的应用（{userAssets.apps.length}）
              </div>
              {userAssets.apps.length === 0 ? (
                <div className="text-[12px] text-foreground-muted">暂无创建的应用</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>应用</TableHead>
                      <TableHead>所属工作空间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
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
                              查看
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
        <SettingsSection title="最近登录" description="登录设备与风控记录。">
          {!user ? (
            <div className="text-[12px] text-foreground-muted">
              {userQuery.isPending && !localMode ? "正在加载..." : "暂无登录信息"}
            </div>
          ) : loginEvents.length === 0 ? (
            <div className="text-[12px] text-foreground-muted">
              {localMode ? "暂无本地登录事件" : "该模块仅在本地模式展示"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>设备</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-right">结果</TableHead>
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
                          ? "成功"
                          : event.status === "blocked"
                          ? "已拦截"
                          : "验证中"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SettingsSection>

        <SettingsSection
          title="活动历史"
          description="账号活动、风险与权限变更记录。"
          footer={
            <div className="flex items-center gap-2">
              <Link href="/security/audit-logs">
                <Button variant="outline" size="sm">
                  查看全部审计
                </Button>
              </Link>
              <Button variant="outline" size="sm" disabled>
                导出记录
              </Button>
            </div>
          }
        >
          {!user ? (
            <div className="text-[12px] text-foreground-muted">
              {userQuery.isPending && !localMode ? "正在加载..." : "暂无活动数据"}
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="text-[12px] text-foreground-muted">
              {localMode ? "暂无本地活动记录" : "该模块仅在本地模式展示"}
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
                        ? "正常"
                        : log.severity === "warning"
                        ? "注意"
                        : log.severity === "error"
                        ? "高危"
                        : "信息"}
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
