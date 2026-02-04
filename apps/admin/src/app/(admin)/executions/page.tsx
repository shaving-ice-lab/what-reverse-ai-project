"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Play,
  Search,
  RotateCcw,
  XCircle,
  MoreHorizontal,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
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
import { executionRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Execution, ExecutionStatus } from "@/types/admin";
import { usePermission } from "@/hooks/usePermission";

const STATUS_OPTIONS = ["all", "success", "running", "pending", "failed", "cancelled", "timeout"] as const;
const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  all: "全部状态",
  success: "成功",
  running: "运行中",
  pending: "待执行",
  failed: "失败",
  cancelled: "已取消",
  timeout: "超时",
};

const STATUS_BADGE_MAP: Record<ExecutionStatus, "success" | "warning" | "info" | "error"> = {
  success: "success",
  running: "info",
  pending: "warning",
  failed: "error",
  cancelled: "warning",
  timeout: "error",
};

const TRIGGER_LABELS: Record<string, string> = {
  webhook: "Webhook",
  schedule: "定时任务",
  event: "事件触发",
  api: "API 调用",
  manual: "手动执行",
};

export default function ExecutionsPage() {
  const searchParams = useSearchParams();
  const workflowIdParam = searchParams.get("workflow_id");

  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canManage = hasPermission("executions.manage");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [workflowId, setWorkflowId] = useState(workflowIdParam || "");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [localExecutions, setLocalExecutions] = useState<Execution[]>(
    () => executionRows as unknown as Execution[]
  );

  const apiParams = useMemo<{
    search?: string;
    status?: "" | ExecutionStatus;
    workflow_id?: string;
    page?: number;
    page_size?: number;
  }>(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === "all" ? "" : (statusFilter as ExecutionStatus),
      workflow_id: workflowId || undefined,
      page,
      page_size: pageSize,
    }),
    [page, pageSize, search, statusFilter, workflowId]
  );

  const executionsQuery = useQuery({
    queryKey: ["admin", "executions", apiParams],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.executions.list(apiParams),
  });

  const filteredLocalExecutions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return localExecutions.filter((ex) => {
      const matchesSearch =
        !normalized ||
        ex.id.toLowerCase().includes(normalized) ||
        ex.workflow?.name?.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || ex.status === statusFilter;
      const matchesWorkflow = !workflowId || ex.workflow_id === workflowId;
      return matchesSearch && matchesStatus && matchesWorkflow;
    });
  }, [localExecutions, search, statusFilter, workflowId]);

  const localTotal = filteredLocalExecutions.length;
  const localTotalPages = Math.max(1, Math.ceil(localTotal / pageSize));
  const localPagedExecutions = filteredLocalExecutions.slice((page - 1) * pageSize, page * pageSize);

  const rows = localMode ? localPagedExecutions : executionsQuery.data?.items || [];
  const total = localMode ? localTotal : executionsQuery.data?.total || 0;
  const totalPages = localMode ? localTotalPages : Math.max(1, Math.ceil(total / pageSize));

  const [manageOpen, setManageOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmRetryOpen, setConfirmRetryOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [reasonDraft, setReasonDraft] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, workflowId, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExecution) throw new Error("请选择执行记录");
      if (localMode) {
        const next = localExecutions.map((ex) =>
          ex.id === selectedExecution.id
            ? { ...ex, status: "cancelled" as ExecutionStatus, error_message: reasonDraft || "用户取消" }
            : ex
        );
        setLocalExecutions(next);
        return { execution: { ...selectedExecution, status: "cancelled" } as Execution };
      }
      return adminApi.executions.cancel(selectedExecution.id, { reason: reasonDraft });
    },
    onSuccess: () => {
      toast.success("执行已取消");
      queryClient.invalidateQueries({ queryKey: ["admin", "executions"] });
      setManageOpen(false);
      setConfirmCancelOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "取消执行失败");
    },
  });

  const retryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExecution) throw new Error("请选择执行记录");
      if (localMode) {
        toast.success("（本地模式）重试已模拟触发");
        return { execution: selectedExecution };
      }
      return adminApi.executions.retry(selectedExecution.id);
    },
    onSuccess: () => {
      toast.success("重试已触发");
      queryClient.invalidateQueries({ queryKey: ["admin", "executions"] });
      setManageOpen(false);
      setConfirmRetryOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "重试失败");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="执行记录"
        description="查看与管理所有工作流的执行历史。"
        icon={<Play className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              导出记录
            </Button>
          </div>
        }
      />

      <SettingsSection
        title="执行列表"
        description="支持按状态、工作流筛选，点击查看节点轨迹。"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索执行 ID 或工作流名称"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">状态</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number])
              }
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          {workflowId && (
            <Badge variant="outline" size="sm" className="gap-1">
              工作流: {workflowId.slice(0, 12)}...
              <button
                onClick={() => setWorkflowId("")}
                className="ml-1 hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          )}
          <Badge variant="outline" size="sm">
            共 {total} 条
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>执行 ID</TableHead>
              <TableHead>工作流</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>触发方式</TableHead>
              <TableHead>耗时</TableHead>
              <TableHead>开始时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executionsQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  正在加载...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  {executionsQuery.error && !localMode
                    ? "加载失败，请检查 API 或权限配置"
                    : "暂无匹配执行记录"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((exec) => (
                <TableRow key={exec.id}>
                  <TableCell>
                    <Link
                      href={`/executions/${exec.id}`}
                      className="text-[12px] font-mono text-foreground hover:text-brand-500 transition-colors"
                    >
                      {exec.id.slice(0, 16)}...
                    </Link>
                  </TableCell>
                  <TableCell>
                    {exec.workflow ? (
                      <Link
                        href={`/workflows/${exec.workflow.id}`}
                        className="text-[12px] text-foreground hover:text-brand-500 transition-colors"
                      >
                        {exec.workflow.name}
                      </Link>
                    ) : (
                      <span className="text-[12px] text-foreground-muted">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_MAP[exec.status]} size="sm">
                      {STATUS_LABELS[exec.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {TRIGGER_LABELS[exec.trigger_type] || exec.trigger_type}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {exec.duration_ms ? `${exec.duration_ms}ms` : "-"}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {exec.started_at ? formatRelativeTime(exec.started_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedExecution(exec);
                        setReasonDraft("");
                        setManageOpen(true);
                      }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
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

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<Play className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>执行记录管理</DialogTitle>
            <DialogDescription>
              {selectedExecution?.id ? (
                <span className="text-foreground-light font-mono">
                  {selectedExecution.id}
                </span>
              ) : (
                "管理执行记录。"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {selectedExecution && (
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">状态</span>
                    <Badge variant={STATUS_BADGE_MAP[selectedExecution.status]} size="sm">
                      {STATUS_LABELS[selectedExecution.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">工作流</span>
                    <span className="text-foreground">
                      {selectedExecution.workflow?.name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">耗时</span>
                    <span className="text-foreground">
                      {selectedExecution.duration_ms ? `${selectedExecution.duration_ms}ms` : "-"}
                    </span>
                  </div>
                  {selectedExecution.error_message && (
                    <div className="mt-2 p-2 rounded bg-error-default/10 border border-error-default/20">
                      <div className="flex items-center gap-1 text-error-default mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span className="font-medium">错误信息</span>
                      </div>
                      <div className="text-[11px] text-foreground-light">
                        {selectedExecution.error_message}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(selectedExecution?.status === "running" || selectedExecution?.status === "pending") && (
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="text-[12px] font-medium text-foreground mb-3">取消执行</div>
                <textarea
                  value={reasonDraft}
                  onChange={(e) => setReasonDraft(e.target.value)}
                  rows={2}
                  placeholder="取消原因（可选）"
                  className={cn(
                    "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                    "text-[12px] text-foreground placeholder:text-foreground-muted",
                    "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                  )}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant="warning"
                    size="sm"
                    disabled={!canManage}
                    onClick={() => setConfirmCancelOpen(true)}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    取消执行
                  </Button>
                </div>
              </div>
            )}

            {(selectedExecution?.status === "failed" || selectedExecution?.status === "timeout") && (
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="text-[12px] font-medium text-foreground mb-3">重试执行</div>
                <p className="text-[11px] text-foreground-muted mb-2">
                  将使用相同的输入数据重新触发该工作流执行。
                </p>
                <div className="flex justify-end">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!canManage}
                    onClick={() => setConfirmRetryOpen(true)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    重试
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/executions/${selectedExecution?.id}`}>
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  查看详情
                </Link>
              </Button>
              {selectedExecution?.workflow && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/workflows/${selectedExecution.workflow.id}`}>
                    查看工作流
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <DialogFooter />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        type="warning"
        title="确认取消执行？"
        description="取消后无法恢复，当前执行将被标记为已取消。"
        confirmText="确认取消"
        cancelText="返回"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
      />

      <AlertDialog
        open={confirmRetryOpen}
        onOpenChange={setConfirmRetryOpen}
        type="info"
        title="确认重试执行？"
        description="将使用相同的输入数据创建新的执行记录。"
        confirmText="确认重试"
        cancelText="取消"
        loading={retryMutation.isPending}
        onConfirm={() => retryMutation.mutate()}
      />
    </PageContainer>
  );
}
