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
  all: "All Statuses",
  active: "Running",
  draft: "Draft",
  archived: "Archived",
  disabled: "Disabled",
};

const STATUS_BADGE_MAP: Record<WorkflowStatus, "success" | "warning" | "info" | "error"> = {
  active: "success",
  draft: "info",
  archived: "warning",
  disabled: "error",
};

const TRIGGER_LABELS: Record<string, string> = {
  webhook: "Webhook",
  schedule: "Scheduled",
  event: "Event Triggered",
  api: "API Call",
  manual: "Manual",
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
      if (!selectedWorkflow) throw new Error("Please select a workflow");
      const reason = reasonDraft.trim();
      if ((statusDraft === "disabled" || statusDraft === "archived") && !reason) {
        throw new Error("A reason is required when disabling or archiving a workflow");
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
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "workflows"] });
      setManageOpen(false);
      setConfirmStatusOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Workflow Management"
        description="View and manage all workspace workflow definitions and versions."
        icon={<GitBranch className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Export List
            </Button>
          </div>
        }
      />

      <SettingsSection
        title="Workflow List"
        description="Filter by name or status. Click to view details and execution history."
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search by name or ID"
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
              <TableHead>Workflow</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Last Execution</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflowsQuery.isPending && !localMode ? (
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
                  {workflowsQuery.error && !localMode
                    ? "Failed to load. Please check API or permission configuration."
                    : "No matching workflows"}
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
            <DialogTitle>Workflow Management</DialogTitle>
            <DialogDescription>
              {selectedWorkflow?.name ? (
                <span className="text-foreground-light">
                  {selectedWorkflow.name}{" "}
                  <span className="text-foreground-muted">({selectedWorkflow.slug})</span>
                </span>
              ) : (
                "Adjust workflow status."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-surface-75 p-4">
              <div className="text-[12px] font-medium text-foreground mb-3">Status</div>
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
                    placeholder="Reason (required when disabling or archiving)"
                    className={cn(
                      "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                      "text-[12px] text-foreground placeholder:text-foreground-muted",
                      "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    )}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setManageOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant={statusDraft === "disabled" ? "warning" : "default"}
                      size="sm"
                      onClick={() => setConfirmStatusOpen(true)}
                      disabled={updateStatusMutation.isPending}
                    >
                      Submit Status Change
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workflows/${selectedWorkflow?.id}`}>
                  <Play className="w-3.5 h-3.5 mr-1" />
                  View Details
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/executions?workflow_id=${selectedWorkflow?.id}`}>
                  View Execution History
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
            ? "Confirm disable this workflow?"
            : statusDraft === "archived"
            ? "Confirm archive this workflow?"
            : "Confirm status update?"
        }
        description={
          statusDraft === "disabled"
            ? `The workflow will be disabled and all triggers will be paused. Reason: ${reasonDraft.trim() || "(not provided)"}`
            : statusDraft === "archived"
            ? `The workflow will be archived and no longer shown in the active list. Reason: ${reasonDraft.trim() || "(not provided)"}`
            : "Confirm workflow status update."
        }
        confirmText="Confirm"
        cancelText="Cancel"
        loading={updateStatusMutation.isPending}
        onConfirm={() => updateStatusMutation.mutate()}
      />
    </PageContainer>
  );
}
