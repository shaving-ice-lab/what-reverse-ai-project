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
  { value: "", label: "All Types" },
  { value: "export", label: "Export" },
  { value: "migration", label: "Migration" },
  { value: "backup", label: "Backup" },
  { value: "cleanup", label: "Cleanup" },
  { value: "sync", label: "Sync" },
  { value: "report", label: "Report" },
];

const JOB_STATUS_OPTIONS: { value: JobStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

const PAGE_SIZES = [10, 20, 50];

const JOB_TYPE_LABELS: Record<JobType, string> = {
  export: "Export",
  migration: "Migration",
  backup: "Backup",
  cleanup: "Cleanup",
  sync: "Sync",
  report: "Report",
};

const JOB_STATUS_CONFIG: Record<
  JobStatus,
  { label: string; variant: "success" | "warning" | "error" | "secondary" | "info"; icon: React.ReactNode }
> = {
  pending: { label: "Pending", variant: "secondary", icon: <Clock className="w-3.5 h-3.5" /> },
  running: { label: "Running", variant: "info", icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  completed: { label: "Completed", variant: "success", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  failed: { label: "Failed", variant: "error", icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: "Cancelled", variant: "warning", icon: <StopCircle className="w-3.5 h-3.5" /> },
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
      toast.success("Job cancelled");
      queryClient.invalidateQueries({ queryKey: ["ops", "jobs"] });
      setConfirmOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Cancellation failed");
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (job: BackgroundJob) => opsApi.retryJob(job.id),
    onSuccess: () => {
      toast.success("Job resubmitted");
      queryClient.invalidateQueries({ queryKey: ["ops", "jobs"] });
      setConfirmOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Retry failed");
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
        title="Jobs & Task Monitoring"
        description="View and manage background jobs, export tasks, and data migration progress."
        icon={<Server className="w-4 h-4" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            loading={listQuery.isFetching}
            loadingText="Refreshing..."
            leftIcon={<RefreshCcw className="w-4 h-4" />}
            onClick={() => listQuery.refetch()}
            disabled={localMode}
          >
            Refresh
          </Button>
        }
      />

      <SettingsSection title="Job List" description="Filter and view background job statuses.">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Type</span>
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
            <span className="text-[11px] text-foreground-muted">Status</span>
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
            <span className="text-[11px] text-foreground-muted">Per Page</span>
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
            {jobs.length} total
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev}
            >
              Previous
            </Button>
            <Badge variant="secondary" size="sm">
              Page {page}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
            >
              Next
            </Button>
          </div>
        </div>

        {listQuery.isPending && !localMode ? (
          <div className="text-[12px] text-foreground-muted">Loading...</div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<Server className="w-5 h-5" />}
            title="No Jobs"
            description="No background jobs match the current filters."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Initiated By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                              Download
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
                            Retry
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
                            Cancel
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
        title={actionType === "cancel" ? "Confirm cancellation of this job?" : "Confirm resubmission of this job?"}
        description={selectedJob ? `${selectedJob.name}` : "Please select a job"}
        confirmText={actionType === "cancel" ? "Cancel Job" : "Resubmit"}
        cancelText="Back"
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
