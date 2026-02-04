"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GitBranch,
  Search,
  Play,
  Pause,
  Archive,
  MoreHorizontal,
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
import { workflowRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Workflow, WorkflowStatus } from "@/types/admin";
import { usePermission } from "@/hooks/usePermission";

const STATUS_OPTIONS = ["all", "active", "draft", "archived", "disabled"] as const;
const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  all: "全部状态",
  active: "运行中",
  draft: "草稿",
  archived: "已归档",
  disabled: "已禁用",
};

const STATUS_BADGE_MAP: Record<WorkflowStatus, "success" | "warning" | "info" | "error"> = {
  active: "success",
  draft: "info",
  archived: "warning",
  disabled: "error",
};

const TRIGGER_LABELS: Record<string, string> = {
  webhook: "Webhook",
  schedule: "定时任务",
  event: "事件触发",
  api: "API 调用",
  manual: "手动执行",
};

export default function WorkflowsPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canManage = hasPermission("workflows.manage");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [localWorkflows, setLocalWorkflows] = useState<Workflow[]>(
    () => workflowRows as unknown as Workflow[]
  );

  const apiParams = useMemo<{
    search?: string;
    status?: "" | WorkflowStatus;
    page?: number;
    page_size?: number;
  }>(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === "all" ? "" : (statusFilter as WorkflowStatus),
      page,
      page_size: pageSize,
    }),
    [page, pageSize, search, statusFilter]
  );

  const workflowsQuery = useQuery({
    queryKey: ["admin", "workflows", apiParams],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.workflows.list(apiParams),
  });

  const filteredLocalWorkflows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return localWorkflows.filter((wf) => {
      const matchesSearch =
        !normalized ||
        wf.name.toLowerCase().includes(normalized) ||
        wf.slug.toLowerCase().includes(normalized) ||
        wf.id.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || wf.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [localWorkflows, search, statusFilter]);

  const localTotal = filteredLocalWorkflows.length;
  const localTotalPages = Math.max(1, Math.ceil(localTotal / pageSize));
  const localPagedWorkflows = filteredLocalWorkflows.slice((page - 1) * pageSize, page * pageSize);

  const rows = localMode ? localPagedWorkflows : workflowsQuery.data?.items || [];
  const total = localMode ? localTotal : workflowsQuery.data?.total || 0;
  const totalPages = localMode ? localTotalPages : Math.max(1, Math.ceil(total / pageSize));

  const [manageOpen, setManageOpen] = useState(false);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [statusDraft, setStatusDraft] = useState<WorkflowStatus>("active");
  const [reasonDraft, setReasonDraft] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWorkflow) throw new Error("请选择工作流");
      const reason = reasonDraft.trim();
      if ((statusDraft === "disabled" || statusDraft === "archived") && !reason) {
        throw new Error("禁用或归档工作流时必须填写原因");
      }

      if (localMode) {
        const next = localWorkflows.map((wf) =>
          wf.id === selectedWorkflow.id ? { ...wf, status: statusDraft } : wf
        );
        setLocalWorkflows(next);
        return { workflow: { ...selectedWorkflow, status: statusDraft } as Workflow };
      }

      return adminApi.workflows.updateStatus(selectedWorkflow.id, {
        status: statusDraft,
        reason,
      });
    },
    onSuccess: () => {
      toast.success("状态已更新");
      queryClient.invalidateQueries({ queryKey: ["admin", "workflows"] });
      setManageOpen(false);
      setConfirmStatusOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "更新状态失败");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="工作流管理"
        description="查看与管理所有 Workspace 的工作流定义与版本。"
        icon={<GitBranch className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              导出列表
            </Button>
          </div>
        }
      />

      <SettingsSection
        title="工作流列表"
        description="支持按名称、状态筛选，点击查看详情与执行历史。"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索名称或 ID"
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
              <TableHead>工作流</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>触发方式</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>版本</TableHead>
              <TableHead>最近执行</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflowsQuery.isPending && !localMode ? (
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
                  {workflowsQuery.error && !localMode
                    ? "加载失败，请检查 API 或权限配置"
                    : "暂无匹配工作流"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((wf) => (
                <TableRow key={wf.id}>
                  <TableCell>
                    <Link
                      href={`/workflows/${wf.id}`}
                      className="text-[12px] font-medium text-foreground hover:text-brand-500 transition-colors"
                    >
                      {wf.name}
                    </Link>
                    <div className="text-[11px] text-foreground-muted">{wf.slug}</div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {wf.workspace?.name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {TRIGGER_LABELS[wf.trigger_type] || wf.trigger_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_MAP[wf.status]} size="sm">
                      {STATUS_LABELS[wf.status] || wf.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    v{wf.version}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {wf.last_run_at ? formatRelativeTime(wf.last_run_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canManage}
                      onClick={() => {
                        setSelectedWorkflow(wf);
                        setStatusDraft(wf.status);
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
          <DialogHeader icon={<GitBranch className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>工作流管理</DialogTitle>
            <DialogDescription>
              {selectedWorkflow?.name ? (
                <span className="text-foreground-light">
                  {selectedWorkflow.name}{" "}
                  <span className="text-foreground-muted">({selectedWorkflow.slug})</span>
                </span>
              ) : (
                "调整工作流状态。"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-surface-75 p-4">
              <div className="text-[12px] font-medium text-foreground mb-3">状态</div>
              <div className="grid gap-2 sm:grid-cols-[160px_1fr] items-start">
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as WorkflowStatus)}
                  className="h-8 rounded-md border border-border bg-surface-100 px-2 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  {STATUS_OPTIONS.filter((s) => s !== "all").map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>

                <div className="space-y-2">
                  <textarea
                    value={reasonDraft}
                    onChange={(e) => setReasonDraft(e.target.value)}
                    rows={3}
                    placeholder="原因（禁用或归档时必填）"
                    className={cn(
                      "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                      "text-[12px] text-foreground placeholder:text-foreground-muted",
                      "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    )}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setManageOpen(false)}>
                      取消
                    </Button>
                    <Button
                      variant={statusDraft === "disabled" ? "warning" : "default"}
                      size="sm"
                      onClick={() => setConfirmStatusOpen(true)}
                      disabled={updateStatusMutation.isPending}
                    >
                      提交状态变更
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workflows/${selectedWorkflow?.id}`}>
                  <Play className="w-3.5 h-3.5 mr-1" />
                  查看详情
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/executions?workflow_id=${selectedWorkflow?.id}`}>
                  查看执行记录
                </Link>
              </Button>
            </div>
          </div>

          <DialogFooter />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmStatusOpen}
        onOpenChange={setConfirmStatusOpen}
        type={statusDraft === "disabled" ? "warning" : "info"}
        title={
          statusDraft === "disabled"
            ? "确认禁用该工作流？"
            : statusDraft === "archived"
            ? "确认归档该工作流？"
            : "确认更新状态？"
        }
        description={
          statusDraft === "disabled"
            ? `将工作流置为禁用状态，所有触发将被暂停。原因：${reasonDraft.trim() || "（未填写）"}`
            : statusDraft === "archived"
            ? `将工作流归档，不再显示于活跃列表。原因：${reasonDraft.trim() || "（未填写）"}`
            : "确认更新工作流状态。"
        }
        confirmText="确认"
        cancelText="取消"
        loading={updateStatusMutation.isPending}
        onConfirm={() => updateStatusMutation.mutate()}
      />
    </PageContainer>
  );
}
