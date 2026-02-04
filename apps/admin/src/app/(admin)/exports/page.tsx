"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Download,
  Search,
  Plus,
  FileSpreadsheet,
  FileJson,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  RefreshCcw,
  AlertCircle,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FullPagination } from "@/components/ui/pagination";
import {
  AlertDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportJobRows, userRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ExportJob, ExportJobStatus, ExportFormat } from "@/types/admin";

const STATUS_OPTIONS = ["all", "pending", "running", "completed", "failed", "cancelled"] as const;
const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  all: "全部状态",
  pending: "等待中",
  running: "进行中",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消",
};
const STATUS_BADGE: Record<ExportJobStatus, "success" | "warning" | "info" | "error"> = {
  pending: "warning",
  running: "info",
  completed: "success",
  failed: "error",
  cancelled: "error",
};

const MODULE_OPTIONS = ["users", "workspaces", "apps", "tickets", "audit_logs", "executions"] as const;
const MODULE_LABELS: Record<string, string> = {
  users: "用户",
  workspaces: "Workspace",
  apps: "应用",
  tickets: "工单",
  audit_logs: "审计日志",
  executions: "执行记录",
};

const FORMAT_OPTIONS: ExportFormat[] = ["csv", "xlsx", "json"];
const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  csv: <FileText className="w-4 h-4" />,
  xlsx: <FileSpreadsheet className="w-4 h-4" />,
  json: <FileJson className="w-4 h-4" />,
};

export default function ExportsPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Local state for mock data
  const [localJobs, setLocalJobs] = useState(() =>
    exportJobRows.map((job) => ({
      ...job,
      creator: job.created_by ? userRows.find((u) => u.id === job.created_by) || null : null,
    })) as unknown as ExportJob[]
  );

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newJobName, setNewJobName] = useState("");
  const [newJobModule, setNewJobModule] = useState<string>(MODULE_OPTIONS[0]);
  const [newJobFormat, setNewJobFormat] = useState<ExportFormat>("csv");

  // Filter
  const filteredJobs = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return localJobs.filter((job) => {
      const matchesSearch =
        !normalized ||
        job.name.toLowerCase().includes(normalized) ||
        job.module.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [localJobs, search, statusFilter]);

  const total = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedData = filteredJobs.slice((page - 1) * pageSize, page * pageSize);

  // Stats
  const completedJobs = localJobs.filter((j) => j.status === "completed").length;
  const runningJobs = localJobs.filter((j) => j.status === "running" || j.status === "pending").length;
  const failedJobs = localJobs.filter((j) => j.status === "failed").length;

  // Create mutation
  const createJobMutation = useMutation({
    mutationFn: async () => {
      if (!newJobName.trim()) throw new Error("请输入导出任务名称");

      if (localMode) {
        const newJob: ExportJob = {
          id: `exp-${Date.now()}`,
          name: newJobName,
          module: newJobModule,
          format: newJobFormat,
          status: "pending",
          filters: null,
          fields: undefined,
          file_url: null,
          file_size_bytes: null,
          total_records: null,
          error_message: null,
          created_by: userRows[0].id,
          created_at: new Date().toISOString(),
          started_at: null,
          completed_at: null,
          expires_at: null,
          creator: userRows[0] || null,
        };
        setLocalJobs((prev) => [newJob, ...prev]);
        return { job: newJob };
      }

      return adminApi.exports.create({
        name: newJobName,
        module: newJobModule,
        format: newJobFormat,
      });
    },
    onSuccess: () => {
      toast.success("导出任务已创建");
      queryClient.invalidateQueries({ queryKey: ["admin", "exports"] });
      setCreateModalOpen(false);
      setNewJobName("");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "创建失败");
    },
  });

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusIcon = (status: ExportJobStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3.5 h-3.5" />;
      case "running":
        return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-3.5 h-3.5" />;
      case "failed":
        return <XCircle className="w-3.5 h-3.5" />;
      case "cancelled":
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="数据导出"
        description="创建和管理数据导出任务，支持 CSV、Excel 和 JSON 格式。"
        icon={<Download className="w-4 h-4" />}
        actions={
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            新建导出
          </Button>
        }
      />

      <div className="page-grid grid-cols-1 sm:grid-cols-3">
        <StatsCard
          icon={<CheckCircle className="w-4 h-4" />}
          title="已完成"
          value={completedJobs.toString()}
          subtitle="导出任务"
        />
        <StatsCard
          icon={<Loader2 className="w-4 h-4" />}
          title="进行中"
          value={runningJobs.toString()}
          subtitle="导出任务"
        />
        <StatsCard
          icon={<AlertCircle className="w-4 h-4" />}
          title="失败"
          value={failedJobs.toString()}
          subtitle="导出任务"
          trend={failedJobs > 0 ? { value: failedJobs, isPositive: false } : undefined}
        />
      </div>

      <SettingsSection
        title="导出任务列表"
        description="查看和管理所有数据导出任务。"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索任务名称或模块"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">状态</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline" size="sm">
            共 {total} 条
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>任务名称</TableHead>
              <TableHead>模块</TableHead>
              <TableHead>格式</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>记录数</TableHead>
              <TableHead>文件大小</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-[12px] text-foreground-muted">
                  暂无导出任务
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="text-[12px] font-medium text-foreground">
                      {job.name}
                    </div>
                    {job.error_message && (
                      <div className="text-[11px] text-error-default mt-0.5 max-w-[200px] truncate">
                        {job.error_message}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {MODULE_LABELS[job.module] || job.module}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-[12px] text-foreground-light">
                      {FORMAT_ICONS[job.format]}
                      <span className="uppercase">{job.format}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(job.status)}
                      <Badge variant={STATUS_BADGE[job.status]} size="sm">
                        {STATUS_LABELS[job.status]}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {job.total_records?.toLocaleString() || "-"}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {formatFileSize(job.file_size_bytes)}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatRelativeTime(job.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {job.status === "completed" && job.file_url && (
                      <Button variant="ghost" size="sm">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {(job.status === "pending" || job.status === "running") && (
                      <Button variant="ghost" size="sm">
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="mt-4">
          <FullPagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            showInput={false}
            size="sm"
            variant="outline"
          />
        </div>
      </SettingsSection>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent size="md">
          <DialogHeader icon={<Download className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>新建导出任务</DialogTitle>
            <DialogDescription>
              选择要导出的数据模块和格式
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-1.5">
                任务名称
              </label>
              <Input
                inputSize="sm"
                placeholder="例如：用户列表导出 - 2026-02"
                value={newJobName}
                onChange={(e) => setNewJobName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-foreground mb-1.5">
                数据模块
              </label>
              <select
                value={newJobModule}
                onChange={(e) => setNewJobModule(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-surface-100 px-3 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
              >
                {MODULE_OPTIONS.map((mod) => (
                  <option key={mod} value={mod}>
                    {MODULE_LABELS[mod]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-foreground mb-1.5">
                导出格式
              </label>
              <div className="flex items-center gap-2">
                {FORMAT_OPTIONS.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setNewJobFormat(fmt)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md border text-[12px] transition-colors",
                      newJobFormat === fmt
                        ? "border-brand-500 bg-brand-500/10 text-brand-500"
                        : "border-border bg-surface-100 text-foreground-light hover:border-foreground-muted"
                    )}
                  >
                    {FORMAT_ICONS[fmt]}
                    <span className="uppercase">{fmt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              disabled={!newJobName.trim()}
              loading={createJobMutation.isPending}
              onClick={() => createJobMutation.mutate()}
            >
              创建任务
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
