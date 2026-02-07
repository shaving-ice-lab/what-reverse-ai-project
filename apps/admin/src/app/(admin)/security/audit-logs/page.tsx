"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Archive,
  Calendar,
  Clock,
  Download,
  FileDown,
  History,
  Search,
  Settings,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { formatDate, formatRelativeTime } from "@/lib/utils";

// Mock data
const mockAuditLogs = [
  { id: "log-1", action: "user.login", target_type: "user", target_id: "user-123", actor_email: "admin@agentflow.ai", ip_address: "192.168.1.100", created_at: "2026-02-03T08:15:00Z" },
  { id: "log-2", action: "workspace.update", target_type: "workspace", target_id: "ws-456", actor_email: "ray@agentflow.ai", ip_address: "192.168.1.101", created_at: "2026-02-03T08:10:00Z" },
  { id: "log-3", action: "workspace.publish", target_type: "workspace", target_id: "ws-789", actor_email: "dev@agentflow.ai", ip_address: "192.168.1.102", created_at: "2026-02-03T08:05:00Z" },
  { id: "log-4", action: "config.change", target_type: "config", target_id: "cfg-001", actor_email: "admin@agentflow.ai", ip_address: "192.168.1.100", created_at: "2026-02-03T08:00:00Z" },
  { id: "log-5", action: "user.role_change", target_type: "user", target_id: "user-456", actor_email: "admin@agentflow.ai", ip_address: "192.168.1.100", created_at: "2026-02-03T07:55:00Z" },
];

const mockRetentionPolicy = {
  default_retention_days: 90,
  sensitive_retention_days: 365,
  archive_enabled: true,
  archive_destination: "s3://agentflow-audit-archives",
};

const mockExportJobs = [
  { id: "exp-1", status: "completed", format: "csv", start_date: "2026-01-01", end_date: "2026-01-31", created_at: "2026-02-01T10:00:00Z", download_url: "#" },
  { id: "exp-2", status: "completed", format: "json", start_date: "2025-12-01", end_date: "2025-12-31", created_at: "2026-01-02T09:00:00Z", download_url: "#" },
  { id: "exp-3", status: "running", format: "csv", start_date: "2026-02-01", end_date: "2026-02-03", created_at: "2026-02-03T08:00:00Z", download_url: null },
];

const ACTION_LABELS: Record<string, string> = {
  "user.login": "User Login",
  "user.logout": "User Logout",
  "user.role_change": "Role Change",
  "workspace.create": "Create Workspace",
  "workspace.update": "Update Workspace",
  "workspace.delete": "Delete Workspace",
  "app.create": "Create App",
  "app.deploy": "Deploy App",
  "config.change": "Config Change",
};

export default function AuditLogsPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  // Policy form states
  const [defaultRetention, setDefaultRetention] = useState(mockRetentionPolicy.default_retention_days);
  const [sensitiveRetention, setSensitiveRetention] = useState(mockRetentionPolicy.sensitive_retention_days);
  const [archiveEnabled, setArchiveEnabled] = useState(mockRetentionPolicy.archive_enabled);

  const logsQuery = useQuery({
    queryKey: ["admin", "security", "audit-logs", search],
    enabled: !localMode,
    queryFn: () => adminApi.security.auditLogs.list({ action: search || undefined }),
  });

  const logs = localMode ? mockAuditLogs : logsQuery.data?.items || [];

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.actor_email?.toLowerCase().includes(searchLower) ||
      log.target_id.toLowerCase().includes(searchLower)
    );
  });

  const exportMutation = useMutation({
    mutationFn: () => {
      if (localMode) {
        return Promise.resolve({ job_id: "exp-new", status: "running" });
      }
      return adminApi.security.auditLogs.export({
        start_date: exportStartDate,
        end_date: exportEndDate,
        format: exportFormat,
      });
    },
    onSuccess: () => {
      toast.success("Export job created");
      setExportOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "security", "audit-logs"] });
    },
    onError: () => toast.error("Failed to create export job"),
  });

  const updatePolicyMutation = useMutation({
    mutationFn: () => {
      if (localMode) {
        return Promise.resolve({ success: true });
      }
      return adminApi.security.auditLogs.updateRetentionPolicy({
        default_retention_days: defaultRetention,
        sensitive_retention_days: sensitiveRetention,
        archive_enabled: archiveEnabled,
      });
    },
    onSuccess: () => {
      toast.success("Retention policy updated");
      setPolicyOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "security", "audit-logs", "policy"] });
    },
    onError: () => toast.error("Update failed"),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Audit Logs"
        description="View system audit logs, manage exports and retention policies."
        icon={<History className="w-4 h-4" />}
        backHref="/security"
        backLabel="Back to Security Overview"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPolicyOpen(true)}>
              <Settings className="w-3.5 h-3.5 mr-1" />
              Retention Policy
            </Button>
            <Button size="sm" onClick={() => setExportOpen(true)}>
              <FileDown className="w-3.5 h-3.5 mr-1" />
              Export Logs
            </Button>
          </div>
        }
      />

      <div className="page-grid grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Total Logs"
          value="1.2M"
          subtitle="records"
        />
        <StatsCard
          title="Today's Logs"
          value="4,521"
          subtitle="records"
        />
        <StatsCard
          title="Default Retention"
          value={`${mockRetentionPolicy.default_retention_days} days`}
          subtitle="retention period"
        />
        <StatsCard
          title="Archive Status"
          value={mockRetentionPolicy.archive_enabled ? "Enabled" : "Disabled"}
          subtitle="auto-archive"
        />
      </div>

      <SettingsSection
        title="Recent Logs"
        description="System operation audit records."
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-[300px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search actions, users, or target IDs"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" size="sm">
            {filteredLogs.length} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  No log records found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {ACTION_LABELS[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px]">
                    <div className="text-foreground-light">{log.target_type}</div>
                    <div className="text-foreground-muted font-mono text-[11px]">{log.target_id}</div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {(log as { actor_email?: string }).actor_email || "-"}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted font-mono">
                    {(log as { ip_address?: string }).ip_address || "-"}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(log.created_at)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SettingsSection>

      <SettingsSection
        title="Export History"
        description="Previously created log export jobs."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time Range</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockExportJobs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  No export jobs found
                </TableCell>
              </TableRow>
            ) : (
              mockExportJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="text-[12px] text-foreground">
                    {job.start_date} ~ {job.end_date}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {job.format.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={job.status === "completed" ? "success" : job.status === "running" ? "info" : "warning"}
                      size="sm"
                    >
                      {job.status === "completed" ? "Completed" : job.status === "running" ? "In Progress" : "Failed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatDate(job.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {job.status === "completed" && job.download_url && (
                      <Button variant="ghost" size="sm">
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Download
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SettingsSection>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent size="md">
          <DialogHeader icon={<FileDown className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Export Audit Logs</DialogTitle>
            <DialogDescription>
              Select a time range and export format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">Start Date</label>
                <Input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">End Date</label>
                <Input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </div>
            </div>

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

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => exportMutation.mutate()}
              loading={exportMutation.isPending}
              loadingText="Creating..."
            >
              Start Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retention Policy Dialog */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent size="md">
          <DialogHeader icon={<Archive className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Retention Policy Settings</DialogTitle>
            <DialogDescription>
              Configure audit log retention periods and archival rules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[12px] text-foreground">Default Retention (days)</label>
              <Input
                type="number"
                min={30}
                max={365}
                value={defaultRetention}
                onChange={(e) => setDefaultRetention(parseInt(e.target.value) || 90)}
              />
              <p className="text-[11px] text-foreground-muted">Retention period for regular logs</p>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] text-foreground">Sensitive Log Retention (days)</label>
              <Input
                type="number"
                min={90}
                max={730}
                value={sensitiveRetention}
                onChange={(e) => setSensitiveRetention(parseInt(e.target.value) || 365)}
              />
              <p className="text-[11px] text-foreground-muted">Retention period for security and compliance logs</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-75">
              <div>
                <div className="text-[12px] font-medium text-foreground">Enable Auto-Archive</div>
                <div className="text-[11px] text-foreground-muted">
                  Expired logs are automatically archived to {mockRetentionPolicy.archive_destination}
                </div>
              </div>
              <Switch
                checked={archiveEnabled}
                onCheckedChange={setArchiveEnabled}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPolicyOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updatePolicyMutation.mutate()}
              loading={updatePolicyMutation.isPending}
              loadingText="Saving..."
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
