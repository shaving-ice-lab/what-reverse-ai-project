"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
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
import { creativeTaskRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { formatRelativeTime } from "@/lib/utils";
import type { CreativeTask } from "@/types/admin";

type TaskStatus = "pending" | "processing" | "completed" | "failed";

const STATUS_OPTIONS = ["all", "pending", "processing", "completed", "failed"] as const;
const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  all: "全部状态",
  pending: "待处理",
  processing: "处理中",
  completed: "已完成",
  failed: "失败",
};

const STATUS_BADGE_MAP: Record<TaskStatus, "success" | "warning" | "info" | "error"> = {
  pending: "warning",
  processing: "info",
  completed: "success",
  failed: "error",
};

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-warning" />,
  processing: <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />,
  completed: <CheckCircle className="w-4 h-4 text-success" />,
  failed: <XCircle className="w-4 h-4 text-error-default" />,
};

export default function CreativeTasksPage() {
  const localMode = isLocalModeEnabled();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [localTasks] = useState<CreativeTask[]>(
    () => creativeTaskRows as unknown as CreativeTask[]
  );

  const apiParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === "all" ? "" : statusFilter,
      page,
      page_size: pageSize,
    }),
    [page, pageSize, search, statusFilter]
  );

  const tasksQuery = useQuery({
    queryKey: ["admin", "creative", "tasks", apiParams],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.creativeTasks.list(apiParams),
  });

  const filteredLocalTasks = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return localTasks.filter((task) => {
      const matchesSearch =
        !normalized ||
        task.title.toLowerCase().includes(normalized) ||
        task.id.toLowerCase().includes(normalized) ||
        task.user?.email?.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [localTasks, search, statusFilter]);

  const localTotal = filteredLocalTasks.length;
  const localTotalPages = Math.max(1, Math.ceil(localTotal / pageSize));
  const localPagedTasks = filteredLocalTasks.slice((page - 1) * pageSize, page * pageSize);

  const rows = localMode ? localPagedTasks : tasksQuery.data?.items || [];
  const total = localMode ? localTotal : tasksQuery.data?.total || 0;
  const totalPages = localMode ? localTotalPages : Math.max(1, Math.ceil(total / pageSize));

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CreativeTask | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <PageContainer>
      <PageHeader
        title="创意任务"
        description="查看所有 AI 创意生成任务与状态。"
        icon={<Sparkles className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              导出记录
            </Button>
          </div>
        }
      />

      <SettingsSection
        title="任务列表"
        description="支持按标题、用户、状态筛选。"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索标题、ID 或用户邮箱"
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
          <Badge variant="outline" size="sm">
            共 {total} 条
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>任务</TableHead>
              <TableHead>用户</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>模型</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasksQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  正在加载...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  {tasksQuery.error && !localMode
                    ? "加载失败，请检查 API 或权限配置"
                    : "暂无匹配任务"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="text-[12px] font-medium text-foreground">{task.title}</div>
                    <div className="text-[11px] text-foreground-muted font-mono">
                      {task.id.slice(0, 16)}...
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.user ? (
                      <Link
                        href={`/users/${task.user.id}`}
                        className="text-[12px] text-foreground hover:text-brand-500 transition-colors"
                      >
                        {task.user.email}
                      </Link>
                    ) : (
                      <span className="text-[12px] text-foreground-muted">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.workspace ? (
                      <Link
                        href={`/workspaces/${task.workspace.id}`}
                        className="text-[12px] text-foreground hover:text-brand-500 transition-colors"
                      >
                        {task.workspace.name}
                      </Link>
                    ) : (
                      <span className="text-[12px] text-foreground-muted">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {task.model || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {task.tokens_used?.toLocaleString() || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {STATUS_ICONS[task.status]}
                      <Badge variant={STATUS_BADGE_MAP[task.status]} size="sm">
                        {STATUS_LABELS[task.status]}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatRelativeTime(task.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task);
                        setDetailOpen(true);
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<Sparkles className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>任务详情</DialogTitle>
            <DialogDescription>{selectedTask?.title || "创意任务"}</DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">ID</span>
                    <span className="text-foreground font-mono">{selectedTask.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">状态</span>
                    <Badge variant={STATUS_BADGE_MAP[selectedTask.status]} size="sm">
                      {STATUS_LABELS[selectedTask.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">模型</span>
                    <span className="text-foreground">{selectedTask.model || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Tokens 使用</span>
                    <span className="text-foreground">
                      {selectedTask.tokens_used?.toLocaleString() || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">模板 ID</span>
                    <span className="text-foreground">{selectedTask.template_id || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">创建时间</span>
                    <span className="text-foreground">
                      {new Date(selectedTask.created_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedTask.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">完成时间</span>
                      <span className="text-foreground">
                        {new Date(selectedTask.completed_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedTask.user && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/users/${selectedTask.user.id}`}>查看用户</Link>
                  </Button>
                )}
                {selectedTask.workspace && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/workspaces/${selectedTask.workspace.id}`}>查看 Workspace</Link>
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
