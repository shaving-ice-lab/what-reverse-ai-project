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
  { id: "log-3", action: "app.deploy", target_type: "app", target_id: "app-789", actor_email: "dev@agentflow.ai", ip_address: "192.168.1.102", created_at: "2026-02-03T08:05:00Z" },
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
  "user.login": "用户登录",
  "user.logout": "用户登出",
  "user.role_change": "角色变更",
  "workspace.create": "创建工作空间",
  "workspace.update": "更新工作空间",
  "workspace.delete": "删除工作空间",
  "app.create": "创建应用",
  "app.deploy": "部署应用",
  "config.change": "配置变更",
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
      toast.success("导出任务已创建");
      setExportOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "security", "audit-logs"] });
    },
    onError: () => toast.error("创建导出任务失败"),
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
      toast.success("留存策略已更新");
      setPolicyOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "security", "audit-logs", "policy"] });
    },
    onError: () => toast.error("更新失败"),
  });

  return (
    <PageContainer>
      <PageHeader
        title="审计日志"
        description="查看系统审计日志，管理导出与留存策略。"
        icon={<History className="w-4 h-4" />}
        backHref="/security"
        backLabel="返回安全概览"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPolicyOpen(true)}>
              <Settings className="w-3.5 h-3.5 mr-1" />
              留存策略
            </Button>
            <Button size="sm" onClick={() => setExportOpen(true)}>
              <FileDown className="w-3.5 h-3.5 mr-1" />
              导出日志
            </Button>
          </div>
        }
      />

      <div className="page-grid grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="总日志数"
          value="1.2M"
          subtitle="条记录"
        />
        <StatsCard
          title="今日日志"
          value="4,521"
          subtitle="条记录"
        />
        <StatsCard
          title="默认留存"
          value={`${mockRetentionPolicy.default_retention_days}天`}
          subtitle="留存期限"
        />
        <StatsCard
          title="归档状态"
          value={mockRetentionPolicy.archive_enabled ? "已启用" : "已停用"}
          subtitle="自动归档"
        />
      </div>

      <SettingsSection
        title="最近日志"
        description="系统操作审计记录。"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-[300px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索操作、用户或目标 ID"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" size="sm">
            共 {filteredLogs.length} 条
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>操作</TableHead>
              <TableHead>目标</TableHead>
              <TableHead>操作者</TableHead>
              <TableHead>IP 地址</TableHead>
              <TableHead>时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  暂无日志记录
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
        title="导出历史"
        description="已创建的日志导出任务。"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>时间范围</TableHead>
              <TableHead>格式</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockExportJobs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  暂无导出任务
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
                      {job.status === "completed" ? "已完成" : job.status === "running" ? "进行中" : "失败"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatDate(job.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {job.status === "completed" && job.download_url && (
                      <Button variant="ghost" size="sm">
                        <Download className="w-3.5 h-3.5 mr-1" />
                        下载
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
            <DialogTitle>导出审计日志</DialogTitle>
            <DialogDescription>
              选择时间范围和导出格式。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">开始日期</label>
                <Input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">结束日期</label>
                <Input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </div>
            </div>

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

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => exportMutation.mutate()}
              loading={exportMutation.isPending}
              loadingText="创建中..."
            >
              开始导出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retention Policy Dialog */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent size="md">
          <DialogHeader icon={<Archive className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>留存策略设置</DialogTitle>
            <DialogDescription>
              配置审计日志的留存期限和归档规则。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[12px] text-foreground">默认留存天数</label>
              <Input
                type="number"
                min={30}
                max={365}
                value={defaultRetention}
                onChange={(e) => setDefaultRetention(parseInt(e.target.value) || 90)}
              />
              <p className="text-[11px] text-foreground-muted">常规日志的留存期限</p>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] text-foreground">敏感日志留存天数</label>
              <Input
                type="number"
                min={90}
                max={730}
                value={sensitiveRetention}
                onChange={(e) => setSensitiveRetention(parseInt(e.target.value) || 365)}
              />
              <p className="text-[11px] text-foreground-muted">涉及安全和合规的日志留存期限</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-75">
              <div>
                <div className="text-[12px] font-medium text-foreground">启用自动归档</div>
                <div className="text-[11px] text-foreground-muted">
                  到期日志自动归档至 {mockRetentionPolicy.archive_destination}
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
              取消
            </Button>
            <Button
              onClick={() => updatePolicyMutation.mutate()}
              loading={updatePolicyMutation.isPending}
              loadingText="保存中..."
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
