"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileDown,
  Loader2,
  Play,
  RefreshCcw,
  RotateCcw,
  Server,
  StopCircle,
  XCircle,
} from "lucide-react";
import {
  EmptyState,
  PageContainer,
  PageHeader,
  SettingsSection,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { opsApi } from "@/lib/api/ops";
import { isLocalModeEnabled } from "@/lib/env";
import { backgroundJobRows } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";
import type { BackgroundJob, JobStatus, JobType } from "@/types/ops";

const JOB_TYPE_OPTIONS: { value: JobType | ""; label: string }[] = [
  { value: "", label: "全部类型" },
  { value: "export", label: "导出" },
  { value: "migration", label: "迁移" },
  { value: "backup", label: "备份" },
  { value: "cleanup", label: "清理" },
  { value: "sync", label: "同步" },
  { value: "report", label: "报表" },
];

const JOB_STATUS_OPTIONS: { value: JobStatus | ""; label: string }[] = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待执行" },
  { value: "running", label: "运行中" },
  { value: "completed", label: "已完成" },
  { value: "failed", label: "已失败" },
  { value: "cancelled", label: "已取消" },
];

const PAGE_SIZES = [10, 20, 50];

const JOB_TYPE_LABELS: Record<JobType, string> = {
  export: "导出",
  migration: "迁移",
  backup: "备份",
  cleanup: "清理",
  sync: "同步",
  report: "报表",
};

const JOB_STATUS_CONFIG: Record<
  JobStatus,
  { label: string; variant: "success" | "warning" | "error" | "secondary" | "info"; icon: React.ReactNode }
> = {
  pending: { label: "待执行", variant: "secondary", icon: <Clock className="w-3.5 h-3.5" /> },
  running: { label: "运行中", variant: "info", icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  completed: { label: "已完成", variant: "success", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  failed: { label: "已失败", variant: "error", icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: "已取消", variant: "warning", icon: <StopCircle className="w-3.5 h-3.5" /> },
};

export default function OpsJobsPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState<JobType | "">("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<"cancel" | "retry" | null>(null);
  const [selectedJob, setSelectedJob] = useState<BackgroundJob | null>(null);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, pageSize]);

  const listQuery = useQuery({
    queryKey: ["ops", "jobs", typeFilter, statusFilter, page, pageSize],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () =>
      opsApi.listJobs({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        page,
        page_size: pageSize,
      }),
  });

  // Filter mock data for local mode
  const mockJobs = backgroundJobRows.filter((job) => {
    if (typeFilter && job.type !== typeFilter) return false;
    if (statusFilter && job.status !== statusFilter) return false;
    return true;
  }) as BackgroundJob[];

  const jobs = localMode ? mockJobs : listQuery.data?.jobs || [];
  const canPrev = page > 1;
  const canNext = jobs.length === pageSize;

  const cancelMutation = useMutation({
    mutationFn: async (job: BackgroundJob) => opsApi.cancelJob(job.id),
    onSuccess: () => {
      toast.success("任务已取消");
      queryClient.invalidateQueries({ queryKey: ["ops", "jobs"] });
      setConfirmOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "取消失败");
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (job: BackgroundJob) => opsApi.retryJob(job.id),
    onSuccess: () => {
      toast.success("任务已重新提交");
      queryClient.invalidateQueries({ queryKey: ["ops", "jobs"] });
      setConfirmOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "重试失败");
    },
  });

  const openConfirm = (job: BackgroundJob, type: "cancel" | "retry") => {
    setSelectedJob(job);
    setActionType(type);
    setConfirmOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader
        title="任务与作业监控"
        description="查看和管理后台任务、导出作业与数据迁移进度。"
        icon={<Server className="w-4 h-4" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            loading={listQuery.isFetching}
            loadingText="刷新中..."
            leftIcon={<RefreshCcw className="w-4 h-4" />}
            onClick={() => listQuery.refetch()}
            disabled={localMode}
          >
            刷新
          </Button>
        }
      />

      <SettingsSection title="作业列表" description="筛选与查看后台任务状态。">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">类型</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as JobType | "")}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {JOB_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">状态</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as JobStatus | "")}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {JOB_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">每页</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline" size="sm">
            共 {jobs.length} 条
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev}
            >
              上一页
            </Button>
            <Badge variant="secondary" size="sm">
              第 {page} 页
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
            >
              下一页
            </Button>
          </div>
        </div>

        {listQuery.isPending && !localMode ? (
          <div className="text-[12px] text-foreground-muted">正在加载...</div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<Server className="w-5 h-5" />}
            title="暂无任务"
            description="当前没有符合条件的后台任务。"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>进度</TableHead>
                <TableHead>发起人</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const statusConfig = JOB_STATUS_CONFIG[job.status];
                const canCancel = job.status === "pending" || job.status === "running";
                const canRetry = job.status === "failed" || job.status === "cancelled";
                const hasResult = job.status === "completed" && job.result_url;

                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="text-[12px] font-medium text-foreground">{job.name}</div>
                      <div className="text-[11px] text-foreground-muted">{job.description}</div>
                      {job.error_message && (
                        <div className="text-[11px] text-destructive-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {job.error_message}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" size="sm">
                        {JOB_TYPE_LABELS[job.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant} size="sm" className="gap-1">
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.progress !== undefined ? (
                        <div className="w-24">
                          <div className="flex items-center justify-between text-[11px] text-foreground-muted mb-1">
                            <span>{job.progress}%</span>
                            {job.total_items !== undefined && (
                              <span>
                                {job.processed_items || 0}/{job.total_items}
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                job.status === "failed"
                                  ? "bg-destructive-500"
                                  : job.status === "completed"
                                  ? "bg-brand-500"
                                  : "bg-brand-400"
                              }`}
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-foreground-muted">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-light">
                      {job.initiator_email || job.initiated_by}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-muted">
                      {formatRelativeTime(job.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasResult && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Download className="w-3.5 h-3.5" />}
                            asChild
                          >
                            <a href={job.result_url} target="_blank" rel="noopener noreferrer">
                              下载
                            </a>
                          </Button>
                        )}
                        {canRetry && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                            onClick={() => openConfirm(job, "retry")}
                            disabled={localMode}
                          >
                            重试
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            variant="destructive-outline"
                            size="sm"
                            leftIcon={<StopCircle className="w-3.5 h-3.5" />}
                            onClick={() => openConfirm(job, "cancel")}
                            disabled={localMode}
                          >
                            取消
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SettingsSection>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        type={actionType === "cancel" ? "warning" : "info"}
        title={actionType === "cancel" ? "确认取消该任务？" : "确认重新提交该任务？"}
        description={selectedJob ? `${selectedJob.name}` : "请选择任务"}
        confirmText={actionType === "cancel" ? "取消任务" : "重新提交"}
        cancelText="返回"
        loading={cancelMutation.isPending || retryMutation.isPending}
        onConfirm={() => {
          if (!selectedJob || !actionType) return;
          if (actionType === "cancel") {
            cancelMutation.mutate(selectedJob);
          } else {
            retryMutation.mutate(selectedJob);
          }
        }}
      />
    </PageContainer>
  );
}
