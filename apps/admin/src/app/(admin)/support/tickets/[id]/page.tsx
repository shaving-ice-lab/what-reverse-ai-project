"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Clock, LifeBuoy, MessageSquare, RefreshCcw, Send } from "lucide-react";
import {
  FormRow,
  PageContainer,
  PageHeader,
  SettingsSection,
  ToggleRow,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog } from "@/components/ui/dialog";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import type {
  SupportTicket,
  SupportTicketComment,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/types/admin";
import { ticketRows } from "@/lib/mock-data";

const STATUS_OPTIONS = [
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
  "closed",
] as const satisfies readonly SupportTicketStatus[];

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_on_customer: "Waiting on Customer",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

type SlaStage = "response" | "update" | "resolve";

const SLA_DEFAULTS: Record<
  SupportTicketPriority,
  { responseMinutes: number; updateMinutes: number; resolveMinutes: number }
> = {
  urgent: { responseMinutes: 30, updateMinutes: 120, resolveMinutes: 720 },
  high: { responseMinutes: 60, updateMinutes: 240, resolveMinutes: 1440 },
  medium: { responseMinutes: 120, updateMinutes: 480, resolveMinutes: 2880 },
  low: { responseMinutes: 240, updateMinutes: 720, resolveMinutes: 4320 },
};

const SLA_LABELS: Record<SlaStage, string> = {
  response: "First Response",
  update: "Progress Update",
  resolve: "Resolution",
};

const SLA_STAGE_ORDER: SlaStage[] = ["response", "update", "resolve"];

const SLA_ESCALATIONS: Array<{ key: SlaStage; label: string; owner: string }> = [
  { key: "response", label: "First response timeout escalates to", owner: "Support L2" },
  { key: "update", label: "Progress update timeout escalates to", owner: "Ops" },
  { key: "resolve", label: "Resolution timeout escalates to", owner: "Owner" },
];

function formatDuration(ms: number): string {
  const minutes = Math.max(1, Math.round(Math.abs(ms) / 60000));
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function normalizeDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return value;
}

function addMinutes(base: string, minutes: number): string | null {
  const date = new Date(base);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + minutes * 60000).toISOString();
}

function getSlaStatus(dueAt: string | null | undefined, now: Date) {
  if (!dueAt) {
    return {
      variant: "secondary" as const,
      label: "Not Configured",
      detail: "No SLA target set",
    };
  }
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return {
      variant: "secondary" as const,
      label: "Invalid Time",
      detail: "Failed to parse SLA time",
    };
  }
  const diff = due.getTime() - now.getTime();
  if (diff <= 0) {
    return {
      variant: "error" as const,
      label: "Overdue",
      detail: `Overdue by ${formatDuration(diff)}`,
    };
  }
  if (diff <= 30 * 60 * 1000) {
    return {
      variant: "warning" as const,
      label: "Due Soon",
      detail: `${formatDuration(diff)} remaining`,
    };
  }
  return {
    variant: "success" as const,
      label: "On Track",
      detail: `${formatDuration(diff)} remaining`,
  };
}

function getTicketId(params: ReturnType<typeof useParams>) {
  const raw = (params as Record<string, string | string[] | undefined>)?.id;
  if (!raw) return "";
  return Array.isArray(raw) ? raw[0] : raw;
}

export default function SupportTicketDetailPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const params = useParams();
  const ticketId = getTicketId(params);

  const ticketQuery = useQuery({
    queryKey: ["admin", "support", "ticket", ticketId],
    enabled: Boolean(ticketId) && !localMode,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const data = await adminApi.support.tickets.get(ticketId);
      return data.ticket;
    },
  });

  const commentsQuery = useQuery({
    queryKey: ["admin", "support", "ticket", ticketId, "comments"],
    enabled: Boolean(ticketId) && !localMode,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const data = await adminApi.support.tickets.comments.list(ticketId);
      return data.comments;
    },
  });

  const localTicket = useMemo<SupportTicket | null>(() => {
    if (!localMode) return null;
    const rows = ticketRows as unknown as SupportTicket[];
    return rows.find((t) => t.id === ticketId) || null;
  }, [localMode, ticketId]);

  const ticket = localMode ? localTicket : ticketQuery.data || null;
  const [localComments, setLocalComments] = useState<SupportTicketComment[]>([]);
  const comments = localMode ? localComments : commentsQuery.data || [];

  const [now, setNow] = useState(() => new Date());
  const [statusDraft, setStatusDraft] = useState<SupportTicketStatus>("open");
  const [statusNote, setStatusNote] = useState("");
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (ticket?.status) setStatusDraft(ticket.status);
  }, [ticket?.status]);

  const slaDue = useMemo(() => {
    if (!ticket) return null;
    const priority = ticket.priority || "medium";
    const defaults = SLA_DEFAULTS[priority] || SLA_DEFAULTS.medium;
    const response =
      normalizeDate(ticket.sla_response_due_at) ??
      (ticket.created_at ? addMinutes(ticket.created_at, defaults.responseMinutes) : null);
    const update =
      normalizeDate(ticket.sla_update_due_at) ??
      (ticket.created_at ? addMinutes(ticket.created_at, defaults.updateMinutes) : null);
    const resolve =
      normalizeDate(ticket.sla_resolve_due_at) ??
      (ticket.created_at ? addMinutes(ticket.created_at, defaults.resolveMinutes) : null);
    return { response, update, resolve };
  }, [ticket]);

  const escalationSteps = useMemo(() => {
    if (!slaDue) return [];
    return SLA_ESCALATIONS.map((rule) => {
      const dueAt = slaDue[rule.key];
      const dueMs = dueAt ? new Date(dueAt).getTime() : null;
      const triggered = dueMs ? dueMs <= now.getTime() : false;
      return {
        ...rule,
        dueAt,
        triggered,
        status: getSlaStatus(dueAt, now),
      };
    });
  }, [slaDue, now]);

  const nextEscalation = useMemo(() => {
    const pending = escalationSteps.filter((step) => step.dueAt && !step.triggered);
    if (pending.length === 0) return null;
    pending.sort((a, b) => {
      const aMs = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
      const bMs = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
      return aMs - bMs;
    });
    const next = pending[0];
    if (!next.dueAt) return null;
    const diff = new Date(next.dueAt).getTime() - now.getTime();
    return {
      ...next,
      countdown: `${formatDuration(diff)} remaining`,
    };
  }, [escalationSteps, now]);

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!ticket) throw new Error("Ticket not found");
      const note = statusNote.trim();
      if (localMode) {
        // Local mode: display only, no persistence
        return { ticket: { ...ticket, status: statusDraft, status_note: note || null } };
      }
      return adminApi.support.tickets.updateStatus(ticket.id, {
        status: statusDraft,
        note,
      });
    },
    onSuccess: () => {
      toast.success("Ticket status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "ticket", ticketId] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "support", "tickets"],
      });
      setConfirmStatusOpen(false);
      setStatusNote("");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed");
    },
  });

  const [commentBody, setCommentBody] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [authorName, setAuthorName] = useState("Admin");

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      if (!ticket) throw new Error("Ticket not found");
      const body = commentBody.trim();
      if (!body) throw new Error("Please enter comment content");

      if (localMode) {
        const next: SupportTicketComment = {
          id: `local_${Date.now()}`,
          ticket_id: ticket.id,
          author_name: authorName || "Admin",
          body,
          is_internal: isInternal,
          created_at: new Date().toISOString(),
        };
        setLocalComments((prev) => [next, ...prev]);
        return { comment: next };
      }

      return adminApi.support.tickets.comments.create(ticket.id, {
        body,
        is_internal: isInternal,
        author_name: authorName || "Admin",
      });
    },
    onSuccess: () => {
      toast.success("Comment added");
      setCommentBody("");
      queryClient.invalidateQueries({
        queryKey: ["admin", "support", "ticket", ticketId, "comments"],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add comment");
    },
  });

  if (!ticketId) {
    return (
      <PageContainer>
        <PageHeader title="Ticket Details" description="Invalid ticket ID" icon={<LifeBuoy className="w-4 h-4" />} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={ticket?.subject || "Ticket Details"}
        description={
          ticket
            ? `${ticket.reference} · ${ticket.requester_email}`
            : localMode
            ? "No matching local ticket data found"
            : "Loading ticket data..."
        }
        icon={<LifeBuoy className="w-4 h-4" />}
        backHref="/support/tickets"
        backLabel="Back to Tickets"
        badge={
          ticket ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  ticket.priority === "urgent"
                    ? "error"
                    : ticket.priority === "high"
                    ? "warning"
                    : ticket.priority === "low"
                    ? "secondary"
                    : "info"
                }
                size="sm"
              >
                {PRIORITY_LABELS[ticket.priority] || ticket.priority}
              </Badge>
              <Badge variant={ticket.status === "open" ? "warning" : "info"} size="sm">
                {STATUS_LABELS[ticket.status]}
              </Badge>
            </div>
          ) : null
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCcw className="w-4 h-4" />}
            onClick={() => {
              ticketQuery.refetch();
              commentsQuery.refetch();
            }}
            disabled={localMode}
          >
            Refresh
          </Button>
        }
      />

      <div className="page-grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <SettingsSection title="Ticket Information" description="Basic info, description, and SLA.">
          {!ticket ? (
            <div className="text-[12px] text-foreground-muted">
              {ticketQuery.isPending && !localMode ? "Loading..." : "No ticket data"}
            </div>
          ) : (
            <div className="space-y-1">
              <FormRow label="Reference" description="Used for external reference and search">
                <div className="text-[12px] text-foreground">{ticket.reference}</div>
              </FormRow>
              <FormRow label="Requester" description="Ticket requester information">
                <div className="space-y-1">
                  <div className="text-[12px] text-foreground">{ticket.requester_name || "-"}</div>
                  <div className="text-[12px] text-foreground-light">{ticket.requester_email}</div>
                </div>
              </FormRow>
              <FormRow label="Category / Channel" description="Used for routing and analytics">
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-foreground-light">
                  <Badge variant="outline" size="sm">
                    {ticket.category || "-"}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {ticket.channel || "-"}
                  </Badge>
                </div>
              </FormRow>
              <FormRow label="Created At" description="Ticket creation time (UTC)">
                <div className="text-[12px] text-foreground-light">
                  {ticket.created_at ? formatDate(ticket.created_at) : "-"}
                </div>
              </FormRow>
              <FormRow label="Updated At" description="Last update">
                <div className="text-[12px] text-foreground-light">
                  {ticket.updated_at ? formatRelativeTime(ticket.updated_at) : "-"}
                </div>
              </FormRow>
              <FormRow label="Description" description="Detailed description submitted by the user" horizontal={false}>
                <div className="rounded-lg border border-border bg-surface-75 p-4 text-[12px] text-foreground-light whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </FormRow>
            </div>
          )}
        </SettingsSection>

        <div className="space-y-4 lg:space-y-6">
          <SettingsSection title="Status Workflow" description="Update status and record processing notes.">
            {!ticket ? (
              <div className="text-[12px] text-foreground-muted">
                {ticketQuery.isPending && !localMode ? "Loading..." : "No ticket data"}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-[220px_1fr] items-start">
                  <div>
                    <div className="text-[11px] text-foreground-muted mb-1">Status</div>
                    <select
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value as SupportTicketStatus)}
                      className="h-8 w-full rounded-md border border-border bg-surface-100 px-2 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="text-[11px] text-foreground-muted mb-1">Note (optional)</div>
                    <textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      rows={3}
                      placeholder="e.g. Contacted user for more info / Rolled back config / Waiting for billing verification..."
                      className={cn(
                        "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                        "text-[12px] text-foreground placeholder:text-foreground-muted",
                        "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusDraft(ticket.status);
                      setStatusNote("");
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    loading={updateStatusMutation.isPending}
                    loadingText="Updating..."
                    onClick={() => setConfirmStatusOpen(true)}
                  >
                    Update Status
                  </Button>
                </div>

                {ticket.status_note ? (
                  <div className="rounded-lg border border-border bg-surface-75 p-4">
                    <div className="text-[11px] text-foreground-muted mb-1">Latest Note</div>
                    <div className="text-[12px] text-foreground-light whitespace-pre-wrap">
                      {ticket.status_note}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </SettingsSection>

          <SettingsSection
            title="SLA Tracking & Escalation Policy"
            description="Track deadlines for first response, progress updates, and resolution, with escalation alerts."
          >
            {!ticket ? (
              <div className="text-[12px] text-foreground-muted">
                {ticketQuery.isPending && !localMode ? "Loading..." : "No ticket data"}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {SLA_STAGE_ORDER.map((stage) => {
                    const dueAt = slaDue?.[stage] || null;
                    const status = getSlaStatus(dueAt, now);
                    return (
                      <div key={stage} className="rounded-lg border border-border bg-surface-75 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-foreground-muted" />
                            <div className="text-[12px] font-medium text-foreground">
                              {SLA_LABELS[stage]}
                            </div>
                          </div>
                          <Badge variant={status.variant} size="sm">
                            {status.label}
                          </Badge>
                        </div>
                        <div className="mt-2 text-[12px] text-foreground-light">{status.detail}</div>
                        <div className="mt-3 text-[11px] text-foreground-muted">
                          Due: {dueAt ? formatDateTime(dueAt) : "-"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-lg border border-border bg-surface-75 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-foreground-muted" />
                    <div className="text-[12px] font-medium text-foreground">Escalation Policy</div>
                  </div>
                  <div className="space-y-2">
                    {escalationSteps.length === 0 ? (
                      <div className="text-[12px] text-foreground-muted">No SLA escalation rules</div>
                    ) : (
                      escalationSteps.map((rule) => {
                        const badgeVariant: "secondary" | "error" | "outline" = !rule.dueAt
                          ? "secondary"
                          : rule.triggered
                          ? "error"
                          : "outline";
                        const badgeLabel = !rule.dueAt
                          ? "Not Configured"
                          : rule.triggered
                          ? "Triggered"
                          : "Pending";
                        return (
                          <div key={rule.key} className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[12px] text-foreground-light">
                                {rule.label} {rule.owner}
                              </div>
                              <div className="text-[11px] text-foreground-muted">
                                Trigger time: {rule.dueAt ? formatDateTime(rule.dueAt) : "-"}
                              </div>
                            </div>
                            <Badge variant={badgeVariant} size="sm">
                              {badgeLabel}
                            </Badge>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="mt-3 text-[11px] text-foreground-muted">
                    {nextEscalation
                      ? `Next escalation: ${nextEscalation.label} ${nextEscalation.owner} (${nextEscalation.countdown})`
                      : "No pending escalations or SLA not configured"}
                  </div>
                </div>
              </div>
            )}
          </SettingsSection>
        </div>
      </div>

      <SettingsSection
        title="Comments & Internal Notes"
        description="Distinguish between public comments and internal notes (defaults to internal)."
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => commentsQuery.refetch()}
              disabled={localMode}
            >
              Refresh Comments
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] items-start">
          <div className="rounded-lg border border-border bg-surface-75 p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-foreground-muted" />
              <div className="text-[12px] font-medium text-foreground">Add Comment</div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[11px] text-foreground-muted mb-1">Author Name</div>
                <Input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  inputSize="sm"
                  placeholder="Admin"
                />
              </div>

              <ToggleRow
                label="Internal Note"
                description="When enabled, only visible to admins; when disabled, treated as a public reply."
                checked={isInternal}
                onCheckedChange={setIsInternal}
              />

              <div>
                <div className="text-[11px] text-foreground-muted mb-1">Content</div>
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  rows={4}
                  placeholder="Enter comment..."
                  className={cn(
                    "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                    "text-[12px] text-foreground placeholder:text-foreground-muted",
                    "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                  )}
                />
              </div>

              <Button
                size="sm"
                className="w-full"
                leftIcon={<Send className="w-4 h-4" />}
                loading={createCommentMutation.isPending}
                loadingText="Sending..."
                onClick={() => createCommentMutation.mutate()}
                disabled={!ticket}
              >
                Send
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {commentsQuery.isPending && !localMode ? (
              <div className="text-[12px] text-foreground-muted">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="rounded-lg border border-border bg-surface-75 p-6 text-center text-[12px] text-foreground-muted">
                No comments
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border border-border bg-surface-75 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium text-foreground truncate">
                        {comment.author_name || "Admin"}
                      </div>
                      <div className="text-[11px] text-foreground-muted">
                        {formatRelativeTime(comment.created_at)}
                      </div>
                    </div>
                    <Badge
                      variant={comment.is_internal ? "secondary" : "info"}
                      size="sm"
                    >
                      {comment.is_internal ? "Internal" : "Public"}
                    </Badge>
                  </div>
                  <div className="mt-3 text-[12px] text-foreground-light whitespace-pre-wrap">
                    {comment.body}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SettingsSection>

      <AlertDialog
        open={confirmStatusOpen}
        onOpenChange={setConfirmStatusOpen}
        type="info"
        title="Confirm status update?"
        description={`Status will be updated to: ${STATUS_LABELS[statusDraft]}. Note: ${statusNote.trim() || "(none)"}`}
        confirmText="Confirm"
        cancelText="Cancel"
        loading={updateStatusMutation.isPending}
        onConfirm={() => updateStatusMutation.mutate()}
      />
    </PageContainer>
  );
}

