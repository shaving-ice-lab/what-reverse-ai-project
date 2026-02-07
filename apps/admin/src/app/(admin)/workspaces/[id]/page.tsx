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
  active: "Active",
  suspended: "Suspended",
  cold_storage: "Cold Storage",
  deleted: "Deleted",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  active: "success",
  suspended: "warning",
  cold_storage: "secondary",
  deleted: "destructive",
};

const APP_STATUS_LABELS: Record<string, string> = {
  published: "Published",
  draft: "Draft",
  deprecated: "Deprecated",
  archived: "Archived",
  suspended: "Suspended",
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
  { id: "ph-1", from_plan: "pro", to_plan: "enterprise", changed_by: "ray@agentflow.ai", reason: "Business expansion needed", created_at: "2026-01-15T10:00:00Z" },
  { id: "ph-2", from_plan: "free", to_plan: "pro", changed_by: "ray@agentflow.ai", reason: "Trial period ended, upgrade", created_at: "2025-12-20T08:00:00Z" },
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
      toast.success("Data export task created");
      setExportDataOpen(false);
    },
    onError: () => toast.error("Export failed"),
  });

  const createArchiveMutation = useMutation({
    mutationFn: () => adminApi.workspaces.createLogArchive(workspaceId, {
      start_date: archiveStartDate,
      end_date: archiveEndDate,
    }),
    onSuccess: () => {
      toast.success("Log archive task created");
      setCreateArchiveOpen(false);
      setArchiveStartDate("");
      setArchiveEndDate("");
    },
    onError: () => toast.error("Archive failed"),
  });

  const dbMigrateMutation = useMutation({
    mutationFn: () => adminApi.workspaces.triggerDbMigration(workspaceId, { reason: migrateReason }),
    onSuccess: () => {
      toast.success("Database migration started");
      setDbMigrateOpen(false);
      setMigrateReason("");
    },
    onError: () => toast.error("Migration failed to start"),
  });

  const rotateKeyMutation = useMutation({
    mutationFn: () => adminApi.workspaces.rotateDbKey(workspaceId, { reason: rotateKeyReason }),
    onSuccess: () => {
      toast.success("Key rotation completed");
      setRotateKeyOpen(false);
      setRotateKeyReason("");
    },
    onError: () => toast.error("Key rotation failed"),
  });

  const updatePlanMutation = useMutation({
    mutationFn: () => adminApi.workspaces.updatePlan(workspaceId, { plan: newPlan, reason: planChangeReason }),
    onSuccess: () => {
      toast.success("Plan updated");
      setUpdatePlanOpen(false);
      setPlanChangeReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "workspaces"] });
    },
    onError: () => toast.error("Plan update failed"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => adminApi.workspaces.removeMember(workspaceId, userId, { reason: "Removed by admin" }),
    onSuccess: () => {
      toast.success("Member removed");
      setRemoveMemberOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "workspaces"] });
    },
    onError: () => toast.error("Failed to remove member"),
  });

  if (!workspaceId) {
    return (
      <PageContainer>
        <PageHeader title="Workspace Details" description="Invalid workspace ID" icon={<Building2 className="w-4 h-4" />} />
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
        title={workspace?.name || "Workspace Details"}
        description={
          workspace
            ? `${workspace.slug || "-"} · ${workspace.id}`
            : localMode
            ? "Local workspace data not found"
            : "Loading workspace data..."
        }
        icon={<Building2 className="w-4 h-4" />}
        backHref="/workspaces"
        backLabel="Back to Workspace List"
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
              Export Data
            </Button>
            <Button size="sm" onClick={() => {
              setNewPlan(workspace?.plan || "pro");
              setUpdatePlanOpen(true);
            }}>
              Adjust Plan
            </Button>
          </div>
        }
      />

      {/* Dialogs */}
      <ConfirmDialog
        open={exportDataOpen}
        onOpenChange={setExportDataOpen}
        title="Export Workspace Data"
        description="Export all configuration, member, and app data for this workspace."
        confirmLabel="Start Export"
        onConfirm={() => exportDataMutation.mutate()}
        isLoading={exportDataMutation.isPending}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-[12px] text-foreground">Export Format</label>
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
        title="Create Log Archive"
        description="Archive logs within a specified date range."
        confirmLabel="Create Archive"
        onConfirm={() => createArchiveMutation.mutate()}
        isLoading={createArchiveMutation.isPending}
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[12px] text-foreground">Start Date</label>
              <Input
                type="date"
                value={archiveStartDate}
                onChange={(e) => setArchiveStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-foreground">End Date</label>
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
        title="Database Migration"
        description="Start a database migration task. This may take a while."
        confirmLabel="Start Migration"
        onConfirm={() => dbMigrateMutation.mutate()}
        isLoading={dbMigrateMutation.isPending}
        variant="warning"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">Migration Reason (required)</label>
            <Input
              value={migrateReason}
              onChange={(e) => setMigrateReason(e.target.value)}
              placeholder="Enter migration reason..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={rotateKeyOpen}
        onOpenChange={setRotateKeyOpen}
        title="Rotate Encryption Key"
        description="Rotate the database encryption key. The old key will expire after 24 hours."
        confirmLabel="Confirm Rotation"
        onConfirm={() => rotateKeyMutation.mutate()}
        isLoading={rotateKeyMutation.isPending}
        variant="warning"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">Rotation Reason (required)</label>
            <Input
              value={rotateKeyReason}
              onChange={(e) => setRotateKeyReason(e.target.value)}
              placeholder="Enter rotation reason..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={updatePlanOpen}
        onOpenChange={setUpdatePlanOpen}
        title="Adjust Plan"
        description="Change the subscription plan for this workspace."
        confirmLabel="Confirm Adjustment"
        onConfirm={() => updatePlanMutation.mutate()}
        isLoading={updatePlanMutation.isPending}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-[12px] text-foreground">Target Plan</label>
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
            <label className="text-[12px] text-foreground">Change Reason (required)</label>
            <Input
              value={planChangeReason}
              onChange={(e) => setPlanChangeReason(e.target.value)}
              placeholder="Enter plan change reason..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(removeMemberOpen)}
        onOpenChange={(open) => !open && setRemoveMemberOpen(null)}
        title="Remove Member"
        description="Are you sure you want to remove this member from the workspace?"
        confirmLabel="Confirm Removal"
        onConfirm={() => removeMemberOpen && removeMemberMutation.mutate(removeMemberOpen)}
        isLoading={removeMemberMutation.isPending}
        variant="danger"
      />

      <div className="page-grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <SettingsSection title="Basic Information" description="Workspace configuration and ownership.">
          {!workspace ? (
            <div className="text-[12px] text-foreground-muted">
              {workspaceQuery.isPending && !localMode ? "Loading..." : "No workspace data available"}
            </div>
          ) : (
            <div className="space-y-1">
              <FormRow label="Workspace ID" description="System unique identifier">
                <div className="text-[12px] text-foreground">{workspace.id}</div>
              </FormRow>
              <FormRow label="Slug" description="URL and routing identifier">
                <div className="text-[12px] text-foreground-light">{workspace.slug}</div>
              </FormRow>
              <FormRow label="Owner" description="Workspace owner">
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
              <FormRow label="Status" description="Current running status">
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant} size="sm">
                    {statusLabel}
                  </Badge>
                  {workspace.status_reason ? (
                    <span className="text-[11px] text-foreground-muted">
                      Reason: {workspace.status_reason}
                    </span>
                  ) : null}
                </div>
              </FormRow>
              <FormRow label="Plan" description="Current billing plan">
                <div className="text-[12px] text-foreground-light">{workspace.plan}</div>
              </FormRow>
              <FormRow label="Region" description="Data center region">
                <div className="text-[12px] text-foreground-light">
                  {workspace.region || "-"}
                </div>
              </FormRow>
              <FormRow label="Created At" description="Workspace creation time">
                <div className="text-[12px] text-foreground-light">
                  {workspace.created_at ? formatDate(workspace.created_at) : "-"}
                </div>
              </FormRow>
              <FormRow label="Updated At" description="Most recent configuration change">
                <div className="text-[12px] text-foreground-light">
                  {workspace.updated_at ? formatRelativeTime(workspace.updated_at) : "-"}
                </div>
              </FormRow>
            </div>
          )}
        </SettingsSection>

        {/* Quota & Usage View */}
        <SettingsSection
          title="Quota & Usage"
          description="Resource quota utilization."
          icon={<TrendingUp className="w-4 h-4" />}
        >
          {!workspace ? (
            <div className="text-[12px] text-foreground-muted">
              {workspaceQuery.isPending && !localMode ? "Loading..." : "No quota data available"}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(mockQuota.quotas).map(([key, value]) => {
                const percent = Math.round((value.used / value.limit) * 100);
                const isWarning = percent >= 80;
                const labels: Record<string, string> = {
                  members: "Members",
                  apps: "Apps",
                  executions_per_month: "Monthly Executions",
                  storage_gb: "Storage (GB)",
                  api_calls_per_minute: "API Calls/min",
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
        title="Database Operations"
        description="Database status, backups, and key management."
        icon={<Database className="w-4 h-4" />}
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDbMigrateOpen(true)}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              DB Migration
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRotateKeyOpen(true)}>
              <Key className="w-3.5 h-3.5 mr-1" />
              Rotate Key
            </Button>
          </div>
        }
      >
        {!workspace ? (
          <div className="text-[12px] text-foreground-muted">No database info available</div>
        ) : (
          <div className="page-grid grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="DB Status"
              value={mockDbInfo.status === "healthy" ? "Healthy" : "Unhealthy"}
              subtitle="Running status"
            />
            <StatsCard
              title="DB Size"
              value={`${(mockDbInfo.size_mb / 1024).toFixed(1)} GB`}
              subtitle="Storage used"
            />
            <StatsCard
              title="Connections"
              value={mockDbInfo.connection_count.toString()}
              subtitle="Active connections"
            />
            <StatsCard
              title="Last Backup"
              value={formatRelativeTime(mockDbInfo.last_backup_at)}
              subtitle="Automatic backup"
            />
          </div>
        )}
      </SettingsSection>

      {/* Data Export & Log Archives */}
      <SettingsSection
        title="Data Export & Log Archives"
        description="Export workspace data and manage historical log archives."
        icon={<Archive className="w-4 h-4" />}
        footer={
          <Button variant="outline" size="sm" onClick={() => setCreateArchiveOpen(true)}>
            <Archive className="w-3.5 h-3.5 mr-1" />
            Create Archive
          </Button>
        }
      >
        {mockLogArchives.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">No log archives</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Archive File</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                      Download
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
        title="Members & Role Management"
        description="Workspace member list and role assignment."
        icon={<Users className="w-4 h-4" />}
      >
        {!workspace ? (
          <div className="text-[12px] text-foreground-muted">
            {workspaceQuery.isPending && !localMode ? "Loading..." : "No member data available"}
          </div>
        ) : members.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">
            {localMode ? "No local member data" : "No member data available"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
        title="Plan Change History"
        description="Subscription plan change records."
        icon={<History className="w-4 h-4" />}
      >
        {mockPlanHistory.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">No plan change records</div>
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
      <SettingsSection title="Related Apps" description="Apps under this workspace.">
        {!workspace ? (
          <div className="text-[12px] text-foreground-muted">
            {workspaceQuery.isPending && !localMode ? "Loading..." : "No app data available"}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">
            {localMode ? "No local app data" : "No app data available"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                        View Details
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
      <SettingsSection title="Operations Log" description="Critical operations and risk records.">
        {!workspace ? (
          <div className="text-[12px] text-foreground-muted">
            {workspaceQuery.isPending && !localMode ? "Loading..." : "No log data available"}
          </div>
        ) : activityLogs.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">
            {localMode ? "No local log records" : "This module is only shown in local mode"}
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
    </PageContainer>
  );
}
