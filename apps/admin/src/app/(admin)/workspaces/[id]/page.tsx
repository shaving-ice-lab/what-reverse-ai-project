"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Archive,
  Building2,
  Clock,
  Database,
  Download,
  FileDown,
  History,
  Key,
  RefreshCw,
  Settings,
  TrendingUp,
  UserMinus,
  Users,
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
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import {
  appRows,
  userRows,
  workspaceActivityLogs,
  workspaceMembers,
  workspaceRows,
  workspaceUsageSnapshots,
} from "@/lib/mock-data";
import type { App, Workspace, WorkspaceMember } from "@/types/admin";

const STATUS_LABELS: Record<string, string> = {
  active: "正常",
  suspended: "已暂停",
  cold_storage: "冷存储",
  deleted: "已删除",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  active: "success",
  suspended: "warning",
  cold_storage: "secondary",
  deleted: "destructive",
};

const APP_STATUS_LABELS: Record<string, string> = {
  published: "已发布",
  draft: "草稿",
  deprecated: "已废弃",
  archived: "已归档",
  suspended: "已暂停",
};

const PLAN_OPTIONS = ["free", "pro", "enterprise"] as const;
const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

function getParamId(params: ReturnType<typeof useParams>) {
  const raw = (params as Record<string, string | string[] | undefined>)?.id;
  if (!raw) return "";
  return Array.isArray(raw) ? raw[0] : raw;
}

// Mock data
const mockDbInfo = {
  status: "healthy",
  size_mb: 2450,
  connection_count: 24,
  last_backup_at: "2026-02-03T02:00:00Z",
  encryption_status: "encrypted",
};

const mockQuota = {
  plan: "enterprise",
  quotas: {
    members: { used: 42, limit: 80 },
    apps: { used: 14, limit: 50 },
    executions_per_month: { used: 82120, limit: 200000 },
    storage_gb: { used: 320, limit: 500 },
    api_calls_per_minute: { used: 450, limit: 1000 },
  },
  overages: [],
};

const mockLogArchives = [
  { id: "archive-1", name: "audit-logs-202601.tar.gz", size_bytes: 24580000, created_at: "2026-02-01T08:00:00Z", download_url: "#" },
  { id: "archive-2", name: "audit-logs-202512.tar.gz", size_bytes: 18920000, created_at: "2026-01-01T08:00:00Z", download_url: "#" },
];

const mockPlanHistory = [
  { id: "ph-1", from_plan: "pro", to_plan: "enterprise", changed_by: "ray@agentflow.ai", reason: "业务扩展需要", created_at: "2026-01-15T10:00:00Z" },
  { id: "ph-2", from_plan: "free", to_plan: "pro", changed_by: "ray@agentflow.ai", reason: "试用期结束升级", created_at: "2025-12-20T08:00:00Z" },
];

export default function WorkspaceDetailPage() {
  const localMode = isLocalModeEnabled();
  const params = useParams();
  const workspaceId = getParamId(params);
  const queryClient = useQueryClient();

  // Dialog states
  const [exportDataOpen, setExportDataOpen] = useState(false);
  const [createArchiveOpen, setCreateArchiveOpen] = useState(false);
  const [dbMigrateOpen, setDbMigrateOpen] = useState(false);
  const [rotateKeyOpen, setRotateKeyOpen] = useState(false);
  const [updatePlanOpen, setUpdatePlanOpen] = useState(false);
  const [removeMemberOpen, setRemoveMemberOpen] = useState<string | null>(null);

  // Form states
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [archiveStartDate, setArchiveStartDate] = useState("");
  const [archiveEndDate, setArchiveEndDate] = useState("");
  const [migrateReason, setMigrateReason] = useState("");
  const [rotateKeyReason, setRotateKeyReason] = useState("");
  const [newPlan, setNewPlan] = useState<string>("pro");
  const [planChangeReason, setPlanChangeReason] = useState("");

  const workspaceQuery = useQuery({
    queryKey: ["admin", "workspaces", "detail", workspaceId],
    enabled: Boolean(workspaceId) && !localMode,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const data = await adminApi.workspaces.get(workspaceId, { include_deleted: true });
      return data;
    },
  });

  const localWorkspace = useMemo<Workspace | null>(() => {
    if (!localMode) return null;
    const rows = workspaceRows as unknown as Workspace[];
    return rows.find((row) => row.id === workspaceId) || null;
  }, [localMode, workspaceId]);

  const workspaceDetail = localMode ? null : workspaceQuery.data || null;
  const workspace = localMode ? localWorkspace : workspaceDetail?.workspace || null;

  const usageSnapshot = useMemo(
    () =>
      localMode
        ? workspaceUsageSnapshots.find((item) => item.workspace_id === workspaceId) || null
        : null,
    [localMode, workspaceId]
  );

  const members = useMemo(() => {
    if (!localMode) return workspaceDetail?.members || [];
    const userMap = new Map(userRows.map((user) => [user.id, user]));
    return workspaceMembers
      .filter((member) => member.workspace_id === workspaceId)
      .map((member) => ({
        ...member,
        user: userMap.get(member.user_id),
      }));
  }, [localMode, workspaceDetail?.members, workspaceId]);

  const apps = useMemo<App[]>(() => {
    if (!localMode) return workspaceDetail?.apps || [];
    return (appRows as unknown as App[]).filter((app) => app.workspace_id === workspaceId);
  }, [localMode, workspaceDetail?.apps, workspaceId]);

  const activityLogs = useMemo(
    () =>
      localMode
        ? workspaceActivityLogs.filter((log) => log.workspace_id === workspaceId)
        : [],
    [localMode, workspaceId]
  );

  // Mutations
  const exportDataMutation = useMutation({
    mutationFn: () => adminApi.workspaces.exportData(workspaceId, { format: exportFormat, include_logs: true }),
    onSuccess: () => {
      toast.success("数据导出任务已创建");
      setExportDataOpen(false);
    },
    onError: () => toast.error("导出失败"),
  });

  const createArchiveMutation = useMutation({
    mutationFn: () => adminApi.workspaces.createLogArchive(workspaceId, {
      start_date: archiveStartDate,
      end_date: archiveEndDate,
    }),
    onSuccess: () => {
      toast.success("日志归档任务已创建");
      setCreateArchiveOpen(false);
      setArchiveStartDate("");
      setArchiveEndDate("");
    },
    onError: () => toast.error("归档失败"),
  });

  const dbMigrateMutation = useMutation({
    mutationFn: () => adminApi.workspaces.triggerDbMigration(workspaceId, { reason: migrateReason }),
    onSuccess: () => {
      toast.success("数据库迁移任务已启动");
      setDbMigrateOpen(false);
      setMigrateReason("");
    },
    onError: () => toast.error("迁移启动失败"),
  });

  const rotateKeyMutation = useMutation({
    mutationFn: () => adminApi.workspaces.rotateDbKey(workspaceId, { reason: rotateKeyReason }),
    onSuccess: () => {
      toast.success("密钥轮换已完成");
      setRotateKeyOpen(false);
      setRotateKeyReason("");
    },
    onError: () => toast.error("密钥轮换失败"),
  });

  const updatePlanMutation = useMutation({
    mutationFn: () => adminApi.workspaces.updatePlan(workspaceId, { plan: newPlan, reason: planChangeReason }),
    onSuccess: () => {
      toast.success("计划已更新");
      setUpdatePlanOpen(false);
      setPlanChangeReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "workspaces"] });
    },
    onError: () => toast.error("计划更新失败"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => adminApi.workspaces.removeMember(workspaceId, userId, { reason: "管理员移除" }),
    onSuccess: () => {
      toast.success("成员已移除");
      setRemoveMemberOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "workspaces"] });
    },
    onError: () => toast.error("移除成员失败"),
  });

  if (!workspaceId) {
    return (
      <PageContainer>
        <PageHeader title="Workspace 详情" description="无效的 Workspace ID" icon={<Building2 className="w-4 h-4" />} />
      </PageContainer>
    );
  }

  const statusLabel = workspace?.status ? STATUS_LABELS[workspace.status] || workspace.status : "-";
  const statusVariant = workspace?.status
    ? STATUS_VARIANTS[workspace.status] || "warning"
    : "warning";

  return (
    <PageContainer>
      <PageHeader
        title={workspace?.name || "Workspace 详情"}
        description={
          workspace
            ? `${workspace.slug || "-"} · ${workspace.id}`
            : localMode
            ? "未找到对应的本地 Workspace 数据"
            : "正在加载 Workspace 数据..."
        }
        icon={<Building2 className="w-4 h-4" />}
        backHref="/workspaces"
        backLabel="返回 Workspace 列表"
        badge={
          workspace ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant} size="sm">
                {statusLabel}
              </Badge>
              <Badge variant="outline" size="sm">
                {workspace.plan}
              </Badge>
              {workspace.region ? (
                <Badge variant="secondary" size="sm">
                  {workspace.region}
                </Badge>
              ) : null}
            </div>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportDataOpen(true)}>
              <FileDown className="w-3.5 h-3.5 mr-1" />
              导出数据
            </Button>
            <Button size="sm" onClick={() => {
              setNewPlan(workspace?.plan || "pro");
              setUpdatePlanOpen(true);
            }}>
              调整计划
            </Button>
          </div>
        }
      />

      {/* Dialogs */}
      <ConfirmDialog
        open={exportDataOpen}
        onOpenChange={setExportDataOpen}
        title="导出 Workspace 数据"
        description="导出该工作空间的所有配置、成员和应用数据。"
        confirmLabel="开始导出"
        onConfirm={() => exportDataMutation.mutate()}
        isLoading={exportDataMutation.isPending}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-[12px] text-foreground">导出格式</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={exportFormat === "csv" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportFormat("csv")}
              >
                CSV
              </Button>
              <Button
                type="button"
                variant={exportFormat === "json" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportFormat("json")}
              >
                JSON
              </Button>
            </div>
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={createArchiveOpen}
        onOpenChange={setCreateArchiveOpen}
        title="创建日志归档"
        description="将指定时间范围的日志打包归档。"
        confirmLabel="创建归档"
        onConfirm={() => createArchiveMutation.mutate()}
        isLoading={createArchiveMutation.isPending}
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[12px] text-foreground">开始日期</label>
              <Input
                type="date"
                value={archiveStartDate}
                onChange={(e) => setArchiveStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-foreground">结束日期</label>
              <Input
                type="date"
                value={archiveEndDate}
                onChange={(e) => setArchiveEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={dbMigrateOpen}
        onOpenChange={setDbMigrateOpen}
        title="数据库迁移"
        description="启动数据库迁移任务，此操作可能需要较长时间。"
        confirmLabel="开始迁移"
        onConfirm={() => dbMigrateMutation.mutate()}
        isLoading={dbMigrateMutation.isPending}
        variant="warning"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">迁移原因（必填）</label>
            <Input
              value={migrateReason}
              onChange={(e) => setMigrateReason(e.target.value)}
              placeholder="请输入迁移原因..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={rotateKeyOpen}
        onOpenChange={setRotateKeyOpen}
        title="轮换加密密钥"
        description="轮换数据库加密密钥，旧密钥将在 24 小时后失效。"
        confirmLabel="确认轮换"
        onConfirm={() => rotateKeyMutation.mutate()}
        isLoading={rotateKeyMutation.isPending}
        variant="warning"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">轮换原因（必填）</label>
            <Input
              value={rotateKeyReason}
              onChange={(e) => setRotateKeyReason(e.target.value)}
              placeholder="请输入轮换原因..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={updatePlanOpen}
        onOpenChange={setUpdatePlanOpen}
        title="调整计划"
        description="更改该 Workspace 的订阅计划。"
        confirmLabel="确认调整"
        onConfirm={() => updatePlanMutation.mutate()}
        isLoading={updatePlanMutation.isPending}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-[12px] text-foreground">目标计划</label>
            <div className="flex gap-2">
              {PLAN_OPTIONS.map((plan) => (
                <Button
                  key={plan}
                  type="button"
                  variant={newPlan === plan ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewPlan(plan)}
                >
                  {PLAN_LABELS[plan]}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">变更原因（必填）</label>
            <Input
              value={planChangeReason}
              onChange={(e) => setPlanChangeReason(e.target.value)}
              placeholder="请输入计划变更原因..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(removeMemberOpen)}
        onOpenChange={(open) => !open && setRemoveMemberOpen(null)}
        title="移除成员"
        description="确认要将该成员从工作空间中移除吗？"
        confirmLabel="确认移除"
        onConfirm={() => removeMemberOpen && removeMemberMutation.mutate(removeMemberOpen)}
        isLoading={removeMemberMutation.isPending}
        variant="danger"
      />

      <div className="page-grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <SettingsSection title="基础信息" description="Workspace 配置与归属信息。">
          {!workspace ? (
            <div className="text-[12px] text-foreground-muted">
              {workspaceQuery.isPending && !localMode ? "正在加载..." : "暂无 Workspace 数据"}
            </div>
          ) : (
            <div className="space-y-1">
              <FormRow label="Workspace ID" description="系统唯一标识">
                <div className="text-[12px] text-foreground">{workspace.id}</div>
              </FormRow>
              <FormRow label="Slug" description="URL 与路由标识">
                <div className="text-[12px] text-foreground-light">{workspace.slug}</div>
              </FormRow>
              <FormRow label="Owner" description="Workspace 所属用户">
                <div className="space-y-1">
                  <Link
                    href={`/users/${workspace.owner_user_id}`}
                    className="text-[12px] text-foreground hover:text-brand-500 transition-colors"
                  >
                    {workspace.owner?.email || workspace.owner_user_id}
                  </Link>
                  <div className="text-[11px] text-foreground-muted">
                    {workspace.owner?.display_name || "-"}
                  </div>
                </div>
              </FormRow>
              <FormRow label="状态" description="当前运行状态">
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant} size="sm">
                    {statusLabel}
                  </Badge>
                  {workspace.status_reason ? (
                    <span className="text-[11px] text-foreground-muted">
                      原因：{workspace.status_reason}
                    </span>
                  ) : null}
                </div>
              </FormRow>
              <FormRow label="计划" description="当前计费计划">
                <div className="text-[12px] text-foreground-light">{workspace.plan}</div>
              </FormRow>
              <FormRow label="区域" description="数据中心区域">
                <div className="text-[12px] text-foreground-light">
                  {workspace.region || "-"}
                </div>
              </FormRow>
              <FormRow label="创建时间" description="Workspace 创建时间">
                <div className="text-[12px] text-foreground-light">
                  {workspace.created_at ? formatDate(workspace.created_at) : "-"}
                </div>
              </FormRow>
              <FormRow label="更新时间" description="最近一次配置变更">
                <div className="text-[12px] text-foreground-light">
                  {workspace.updated_at ? formatRelativeTime(workspace.updated_at) : "-"}
                </div>
              </FormRow>
            </div>
          )}
        </SettingsSection>

        {/* Quota & Usage View */}
        <SettingsSection
          title="配额与用量"
          description="资源配额使用情况。"
          icon={<TrendingUp className="w-4 h-4" />}
        >
          {!workspace ? (
            <div className="text-[12px] text-foreground-muted">
              {workspaceQuery.isPending && !localMode ? "正在加载..." : "暂无配额数据"}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(mockQuota.quotas).map(([key, value]) => {
                const percent = Math.round((value.used / value.limit) * 100);
                const isWarning = percent >= 80;
                const labels: Record<string, string> = {
                  members: "成员数",
                  apps: "应用数",
                  executions_per_month: "月执行量",
                  storage_gb: "存储 (GB)",
                  api_calls_per_minute: "API 调用/分钟",
                };
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-foreground-light">{labels[key] || key}</span>
                      <span className={cn("text-foreground", isWarning && "text-warning-400")}>
                        {value.used.toLocaleString()} / {value.limit.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isWarning ? "bg-warning-400" : "bg-brand-500"
                        )}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SettingsSection>
      </div>

      {/* DB Operations */}
      <SettingsSection
        title="数据库运维"
        description="数据库状态、备份与密钥管理。"
        icon={<Database className="w-4 h-4" />}
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDbMigrateOpen(true)}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              数据库迁移
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRotateKeyOpen(true)}>
              <Key className="w-3.5 h-3.5 mr-1" />
              轮换密钥
            </Button>
          </div>
        }
      >
        {!workspace ? (
          <div className="text-[12px] text-foreground-muted">暂无数据库信息</div>
        ) : (
          <div className="page-grid grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="数据库状态"
              value={mockDbInfo.status === "healthy" ? "正常" : "异常"}
              subtitle="运行状态"
            />
            <StatsCard
              title="数据库大小"
              value={`${(mockDbInfo.size_mb / 1024).toFixed(1)} GB`}
              subtitle="存储占用"
            />
            <StatsCard
              title="连接数"
              value={mockDbInfo.connection_count.toString()}
              subtitle="活跃连接"
            />
            <StatsCard
              title="最近备份"
              value={formatRelativeTime(mockDbInfo.last_backup_at)}
              subtitle="自动备份"
            />
          </div>
        )}
      </SettingsSection>

      {/* Data Export & Log Archives */}
      <SettingsSection
        title="数据导出与日志归档"
        description="导出工作空间数据，管理历史日志归档。"
        icon={<Archive className="w-4 h-4" />}
        footer={
          <Button variant="outline" size="sm" onClick={() => setCreateArchiveOpen(true)}>
            <Archive className="w-3.5 h-3.5 mr-1" />
            创建归档
          </Button>
        }
      >
        {mockLogArchives.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">暂无日志归档</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>归档文件</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogArchives.map((archive) => (
                <TableRow key={archive.id}>
                  <TableCell className="text-[12px] font-medium text-foreground">
                    {archive.name}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {(archive.size_bytes / 1024 / 1024).toFixed(1)} MB
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatDate(archive.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="w-3.5 h-3.5 mr-1" />
                      下载
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsSection>

      {/* Member Management */}
      <SettingsSection
        title="成员与角色管理"
        description="Workspace 成员列表与角色分配。"
        icon={<Users className="w-4 h-4" />}
      >
        {!workspace ? (
          <div className="text-[12px] text-foreground-muted">
            {workspaceQuery.isPending && !localMode ? "正在加载..." : "暂无成员数据"}
          </div>
        ) : members.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">
            {localMode ? "暂无本地成员数据" : "暂无成员数据"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>成员</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>加入时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="text-[12px] font-medium text-foreground">
                      {member.user?.display_name || member.user?.email || member.user_id}
                    </div>
                    <div className="text-[11px] text-foreground-muted">
                      <Link
                        href={`/users/${member.user_id}`}
                        className="hover:text-brand-500 transition-colors"
                      >
                        {member.user?.email || member.user_id}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {typeof member.role === "string"
                        ? member.role
                        : member.role?.name || "member"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {member.joined_at ? formatDate(member.joined_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" disabled>
                        <Settings className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRemoveMemberOpen(member.user_id)}
                        disabled={(typeof member.role === "string" ? member.role : member.role?.name) === "owner"}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsSection>

      {/* Plan History */}
      <SettingsSection
        title="计划变更历史"
        description="订阅计划变更记录。"
        icon={<History className="w-4 h-4" />}
      >
        {mockPlanHistory.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">暂无计划变更记录</div>
        ) : (
          <div className="space-y-3">
            {mockPlanHistory.map((history) => (
              <div
                key={history.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface-75 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                    <Badge variant="outline" size="sm">{history.from_plan}</Badge>
                    <span className="text-foreground-muted">→</span>
                    <Badge variant="success" size="sm">{history.to_plan}</Badge>
                  </div>
                  <div className="text-[11px] text-foreground-light mt-1">
                    {history.reason}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-foreground-muted">
                    {history.changed_by}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-foreground-muted">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(history.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      {/* Related Apps */}
      <SettingsSection title="关联应用" description="Workspace 下的应用列表。">
        {!workspace ? (
          <div className="text-[12px] text-foreground-muted">
            {workspaceQuery.isPending && !localMode ? "正在加载..." : "暂无应用数据"}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">
            {localMode ? "暂无本地应用数据" : "暂无应用数据"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>应用</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="text-[12px] font-medium text-foreground">
                      <Link
                        href={`/apps/${app.id}`}
                        className="hover:text-brand-500 transition-colors"
                      >
                        {app.name}
                      </Link>
                    </div>
                    <div className="text-[11px] text-foreground-muted">{app.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={app.status === "published" ? "success" : "warning"} size="sm">
                      {APP_STATUS_LABELS[app.status] || app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {app.updated_at ? formatRelativeTime(app.updated_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/apps/${app.id}`}>
                      <Button variant="ghost" size="sm">
                        查看详情
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsSection>

      {/* Activity Logs */}
      <SettingsSection title="运维日志" description="关键操作与风险记录。">
        {!workspace ? (
          <div className="text-[12px] text-foreground-muted">
            {workspaceQuery.isPending && !localMode ? "正在加载..." : "暂无日志数据"}
          </div>
        ) : activityLogs.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">
            {localMode ? "暂无本地日志记录" : "该模块仅在本地模式展示"}
          </div>
        ) : (
          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface-75 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-foreground">{log.action}</div>
                  <div className="text-[11px] text-foreground-light mt-1">{log.detail}</div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <Badge
                    variant={
                      log.severity === "warning"
                        ? "warning"
                        : log.severity === "error"
                        ? "error"
                        : log.severity === "success"
                        ? "success"
                        : "info"
                    }
                    size="sm"
                  >
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
    </PageContainer>
  );
}
