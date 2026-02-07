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
  all: "All Statuses",
  success: "Success",
  running: "Running",
  pending: "Pending",
  failed: "Failed",
  cancelled: "Cancelled",
  timeout: "Timeout",
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
  schedule: "Scheduled",
  event: "Event Trigger",
  api: "API Call",
  manual: "Manual",
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
      if (!selectedExecution) throw new Error("Please select an execution");
      if (localMode) {
        const next = localExecutions.map((ex) =>
          ex.id === selectedExecution.id
            ? { ...ex, status: "cancelled" as ExecutionStatus, error_message: reasonDraft || "Cancelled by user" }
            : ex
        );
        setLocalExecutions(next);
        return { execution: { ...selectedExecution, status: "cancelled" } as Execution };
      }
      return adminApi.executions.cancel(selectedExecution.id, { reason: reasonDraft });
    },
    onSuccess: () => {
      toast.success("Execution cancelled");
      queryClient.invalidateQueries({ queryKey: ["admin", "executions"] });
      setManageOpen(false);
      setConfirmCancelOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to cancel execution");
    },
  });

  const retryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExecution) throw new Error("Please select an execution");
      if (localMode) {
        toast.success("(Local mode) Retry simulated");
        return { execution: selectedExecution };
      }
      return adminApi.executions.retry(selectedExecution.id);
    },
    onSuccess: () => {
      toast.success("Retry triggered");
      queryClient.invalidateQueries({ queryKey: ["admin", "executions"] });
      setManageOpen(false);
      setConfirmRetryOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Retry failed");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Execution Records"
        description="View and manage execution history for all workflows."
        icon={<Play className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Export Records
            </Button>
          </div>
        }
      />

      <SettingsSection
        title="Execution List"
        description="Filter by status and workflow. Click to view node trace."
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search execution ID or workflow name"
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
          {workflowId && (
            <Badge variant="outline" size="sm" className="gap-1">
              Workflow: {workflowId.slice(0, 12)}...
              <button
                onClick={() => setWorkflowId("")}
                className="ml-1 hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          )}
          <Badge variant="outline" size="sm">
            {total} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Execution ID</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Started</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executionsQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  {executionsQuery.error && !localMode
                    ? "Failed to load. Check API or permission settings."
                    : "No matching execution records"}
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
            <DialogTitle>Execution Management</DialogTitle>
            <DialogDescription>
              {selectedExecution?.id ? (
                <span className="text-foreground-light font-mono">
                  {selectedExecution.id}
                </span>
              ) : (
                "Manage execution records."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {selectedExecution && (
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Status</span>
                    <Badge variant={STATUS_BADGE_MAP[selectedExecution.status]} size="sm">
                      {STATUS_LABELS[selectedExecution.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Workflow</span>
                    <span className="text-foreground">
                      {selectedExecution.workflow?.name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Duration</span>
                    <span className="text-foreground">
                      {selectedExecution.duration_ms ? `${selectedExecution.duration_ms}ms` : "-"}
                    </span>
                  </div>
                  {selectedExecution.error_message && (
                    <div className="mt-2 p-2 rounded bg-error-default/10 border border-error-default/20">
                      <div className="flex items-center gap-1 text-error-default mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span className="font-medium">Error Message</span>
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
                <div className="text-[12px] font-medium text-foreground mb-3">Cancel Execution</div>
                <textarea
                  value={reasonDraft}
                  onChange={(e) => setReasonDraft(e.target.value)}
                  rows={2}
                    placeholder="Cancellation reason (optional)"
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
                    Cancel Execution
                  </Button>
                </div>
              </div>
            )}

            {(selectedExecution?.status === "failed" || selectedExecution?.status === "timeout") && (
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="text-[12px] font-medium text-foreground mb-3">Retry Execution</div>
                <p className="text-[11px] text-foreground-muted mb-2">
                  This will re-trigger the workflow execution with the same input data.
                </p>
                <div className="flex justify-end">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!canManage}
                    onClick={() => setConfirmRetryOpen(true)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/executions/${selectedExecution?.id}`}>
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  View Details
                </Link>
              </Button>
              {selectedExecution?.workflow && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/workflows/${selectedExecution.workflow.id}`}>
                    View Workflow
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
        title="Confirm cancel execution?"
        description="This cannot be undone. The current execution will be marked as cancelled."
        confirmText="Confirm Cancel"
        cancelText="Go Back"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
      />

      <AlertDialog
        open={confirmRetryOpen}
        onOpenChange={setConfirmRetryOpen}
        type="info"
        title="Confirm retry execution?"
        description="A new execution record will be created with the same input data."
        confirmText="Confirm Retry"
        cancelText="Cancel"
        loading={retryMutation.isPending}
        onConfirm={() => retryMutation.mutate()}
      />
    </PageContainer>
  );
}
