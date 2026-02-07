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
  all: "All Statuses",
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
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
        title="Creative Tasks"
        description="View all AI creative generation tasks and statuses."
        icon={<Sparkles className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Export Records
            </Button>
          </div>
        }
      />

      <SettingsSection
        title="Task List"
        description="Filter by title, user, or status."
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search by title, ID, or user email"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Status</span>
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
            {total} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasksQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  {tasksQuery.error && !localMode
                    ? "Failed to load. Please check API or permission configuration."
                    : "No matching tasks"}
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
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>{selectedTask?.title || "Creative Task"}</DialogDescription>
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
                    <span className="text-foreground-muted">Status</span>
                    <Badge variant={STATUS_BADGE_MAP[selectedTask.status]} size="sm">
                      {STATUS_LABELS[selectedTask.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Model</span>
                    <span className="text-foreground">{selectedTask.model || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Tokens Used</span>
                    <span className="text-foreground">
                      {selectedTask.tokens_used?.toLocaleString() || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Template ID</span>
                    <span className="text-foreground">{selectedTask.template_id || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Created</span>
                    <span className="text-foreground">
                      {new Date(selectedTask.created_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedTask.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Completed</span>
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
                    <Link href={`/users/${selectedTask.user.id}`}>View User</Link>
                  </Button>
                )}
                {selectedTask.workspace && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/workspaces/${selectedTask.workspace.id}`}>View Workspace</Link>
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
