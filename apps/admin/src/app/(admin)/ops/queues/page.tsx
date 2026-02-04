"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, RefreshCcw, RotateCcw, Trash2 } from "lucide-react";
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
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { DeadTask } from "@/types/ops";

const QUEUE_OPTIONS = [
  { value: "execution", label: "Execution" },
  { value: "db_provision", label: "DB Provision" },
  { value: "domain_verify", label: "Domain Verify" },
  { value: "metrics_aggregation", label: "Metrics Aggregation" },
  { value: "webhook", label: "Webhook" },
  { value: "scheduled", label: "Scheduled" },
  { value: "workflow", label: "Workflow Legacy" },
];

const PAGE_SIZES = [10, 20, 50];

const STATE_LABELS: Record<string, string> = {
  "1": "处理中",
  "2": "待处理",
  "3": "已计划",
  "4": "重试中",
  "5": "已归档",
  "6": "聚合中",
};

const isZeroTime = (value?: string) =>
  !value || value.startsWith("0001-01-01") || value.startsWith("0000-00-00");

const formatTime = (value?: string) =>
  value && !isZeroTime(value) ? formatRelativeTime(value) : "-";

const decodePayload = (payload?: string) => {
  if (!payload) return "";
  if (typeof globalThis.atob === "function") {
    try {
      return globalThis.atob(payload);
    } catch {
      return payload;
    }
  }
  return payload;
};

export default function DeadQueuePage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState(QUEUE_OPTIONS[0].value);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<"retry" | "delete" | null>(null);
  const [selectedTask, setSelectedTask] = useState<DeadTask | null>(null);

  useEffect(() => {
    setPage(1);
  }, [queue, pageSize]);

  const listQuery = useQuery({
    queryKey: ["ops", "dead-tasks", queue, page, pageSize],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () =>
      opsApi.listDeadTasks({
        queue,
        page,
        page_size: pageSize,
      }),
  });

  const tasks = localMode ? [] : listQuery.data?.tasks || [];
  const canPrev = page > 1;
  const canNext = tasks.length === pageSize;

  const retryMutation = useMutation({
    mutationFn: async (task: DeadTask) => {
      if (!task.id) throw new Error("任务 ID 无效");
      return opsApi.retryDeadTask(queue, task.id);
    },
    onSuccess: () => {
      toast.success("任务已重试");
      queryClient.invalidateQueries({ queryKey: ["ops", "dead-tasks"] });
      setConfirmOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "重试失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (task: DeadTask) => {
      if (!task.id) throw new Error("任务 ID 无效");
      return opsApi.deleteDeadTask(queue, task.id);
    },
    onSuccess: () => {
      toast.success("任务已删除");
      queryClient.invalidateQueries({ queryKey: ["ops", "dead-tasks"] });
      setConfirmOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "删除失败");
    },
  });

  const openConfirm = (task: DeadTask, type: "retry" | "delete") => {
    setSelectedTask(task);
    setActionType(type);
    setConfirmOpen(true);
  };

  const payloadPreview = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((task) => {
      const decoded = decodePayload(task.payload);
      const preview = decoded ? truncate(decoded.replace(/\s+/g, " "), 120) : "-";
      map.set(task.id, preview);
    });
    return map;
  }, [tasks]);

  return (
    <PageContainer>
      <PageHeader
        title="死信队列"
        description="查看失败任务并执行重试或删除。"
        icon={<AlertTriangle className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
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
            <Badge variant="outline" size="sm">
              {queue}
            </Badge>
          </div>
        }
      />

      <SettingsSection title="队列任务" description="筛选与查看死信队列任务。">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">队列</span>
            <select
              value={queue}
              onChange={(event) => setQueue(event.target.value)}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
              disabled={localMode}
            >
              {QUEUE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">每页</span>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
              disabled={localMode}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline" size="sm">
            共 {tasks.length} 条
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!canPrev || localMode}
            >
              上一页
            </Button>
            <Badge variant="secondary" size="sm">
              第 {page} 页
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!canNext || localMode}
            >
              下一页
            </Button>
          </div>
        </div>

        {localMode ? (
          <EmptyState
            icon={<AlertTriangle className="w-5 h-5" />}
            title="本地模式未接入队列"
            description="请连接服务端后查看死信队列数据。"
          />
        ) : listQuery.isPending ? (
          <div className="text-[12px] text-foreground-muted">正在加载...</div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle className="w-5 h-5" />}
            title="暂无死信任务"
            description="当前队列没有失败任务。"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务</TableHead>
                <TableHead>重试</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>上次失败</TableHead>
                <TableHead>错误摘要</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="text-[12px] font-medium text-foreground">
                      {task.type || "-"}
                    </div>
                    <div className="text-[11px] text-foreground-muted">{task.id}</div>
                    <div className="text-[11px] text-foreground-light mt-1">
                      {payloadPreview.get(task.id) || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        (task.retried ?? 0) >= (task.max_retry ?? 0) && task.max_retry
                          ? "error"
                          : "warning"
                      }
                      size="sm"
                    >
                      {task.retried ?? 0}/{task.max_retry ?? "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" size="sm">
                      {STATE_LABELS[task.state || ""] || task.state || "未知"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatTime(task.last_failed_at)}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {task.last_err ? truncate(task.last_err, 120) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={() => openConfirm(task, "retry")}
                      >
                        重试
                      </Button>
                      <Button
                        variant="destructive-fill"
                        size="sm"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => openConfirm(task, "delete")}
                      >
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsSection>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        type={actionType === "delete" ? "error" : "warning"}
        title={
          actionType === "delete"
            ? "确认删除该任务？"
            : "确认重试该任务？"
        }
        description={
          selectedTask
            ? `${selectedTask.type || "未知任务"} · ${selectedTask.id}`
            : "请选择任务"
        }
        confirmText={actionType === "delete" ? "删除" : "重试"}
        cancelText="取消"
        loading={retryMutation.isPending || deleteMutation.isPending}
        onConfirm={() => {
          if (!selectedTask || !actionType) return;
          if (actionType === "retry") {
            retryMutation.mutate(selectedTask);
          } else {
            deleteMutation.mutate(selectedTask);
          }
        }}
      />
    </PageContainer>
  );
}
