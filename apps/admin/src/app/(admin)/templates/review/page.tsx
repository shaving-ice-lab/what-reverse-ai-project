"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle,
  Eye,
  FileText,
  Search,
  Shield,
  XCircle,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { formatDate, formatRelativeTime } from "@/lib/utils";

interface ReviewItem {
  id: string;
  template_id: string;
  template_name: string;
  submitter_id: string;
  submitter_email: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_email: string | null;
}

// Mock data
const mockReviewQueue: ReviewItem[] = [
  {
    id: "review-1",
    template_id: "tpl-101",
    template_name: "Business Plan Generator",
    submitter_id: "user-1",
    submitter_email: "creator@example.com",
    status: "pending",
    submitted_at: "2026-02-03T06:00:00Z",
    reviewed_at: null,
    reviewer_email: null,
  },
  {
    id: "review-2",
    template_id: "tpl-102",
    template_name: "Marketing Copywriting Assistant",
    submitter_id: "user-2",
    submitter_email: "marketer@example.com",
    status: "pending",
    submitted_at: "2026-02-02T14:30:00Z",
    reviewed_at: null,
    reviewer_email: null,
  },
  {
    id: "review-3",
    template_id: "tpl-103",
    template_name: "Technical Documentation Template",
    submitter_id: "user-3",
    submitter_email: "techwriter@example.com",
    status: "approved",
    submitted_at: "2026-02-01T10:00:00Z",
    reviewed_at: "2026-02-01T15:30:00Z",
    reviewer_email: "admin@agentflow.ai",
  },
  {
    id: "review-4",
    template_id: "tpl-104",
    template_name: "Suspicious Content Template",
    submitter_id: "user-4",
    submitter_email: "suspicious@example.com",
    status: "rejected",
    submitted_at: "2026-01-30T08:00:00Z",
    reviewed_at: "2026-01-30T12:00:00Z",
    reviewer_email: "admin@agentflow.ai",
  },
];

const STATUS_OPTIONS = ["all", "pending", "approved", "rejected"] as const;
const STATUS_LABELS: Record<string, string> = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_VARIANTS: Record<string, "warning" | "success" | "destructive" | "secondary"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

export default function TemplateReviewPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("pending");
  const [reviewOpen, setReviewOpen] = useState<ReviewItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState("");

  const [localQueue, setLocalQueue] = useState(mockReviewQueue);

  const reviewQuery = useQuery({
    queryKey: ["admin", "templates", "public-review", statusFilter],
    enabled: !localMode,
    queryFn: () =>
      adminApi.templates.getPublicReviewQueue({
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  const filteredQueue: ReviewItem[] = localMode
    ? localQueue.filter((item) => statusFilter === "all" || item.status === statusFilter)
    : (reviewQuery.data?.items as ReviewItem[]) || [];

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!reviewOpen) throw new Error("No item selected");
      if (localMode) {
        setLocalQueue((prev) =>
          prev.map((item) =>
            item.id === reviewOpen.id
              ? {
                  ...item,
                  status: reviewDecision,
                  reviewed_at: new Date().toISOString(),
                  reviewer_email: "admin@agentflow.ai",
                }
              : item
          )
        );
        return { success: true };
      }
      return adminApi.templates.submitPublicReview(reviewOpen.id, {
        decision: reviewDecision,
        notes: reviewNotes,
      });
    },
    onSuccess: () => {
      toast.success(reviewDecision === "approved" ? "Template approved" : "Template rejected");
      setReviewOpen(null);
      setReviewNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin", "templates", "public-review"] });
    },
    onError: () => toast.error("Review failed"),
  });

  const pendingCount = localQueue.filter((item) => item.status === "pending").length;
  const approvedCount = localQueue.filter((item) => item.status === "approved").length;
  const rejectedCount = localQueue.filter((item) => item.status === "rejected").length;

  return (
    <PageContainer>
      <PageHeader
        title="Template Public Review"
        description="Review user-submitted public template requests."
        icon={<Shield className="w-4 h-4" />}
        backHref="/templates"
        backLabel="Back to Template List"
      />

      <div className="page-grid grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Pending"
          value={pendingCount.toString()}
          subtitle="templates"
          trend={pendingCount > 0 ? { value: pendingCount, isPositive: true } : undefined}
        />
        <StatsCard
          title="Approved"
          value={approvedCount.toString()}
          subtitle="templates"
        />
        <StatsCard
          title="Rejected"
          value={rejectedCount.toString()}
          subtitle="templates"
        />
        <StatsCard
          title="Total Reviews"
          value={localQueue.length.toString()}
          subtitle="requests"
        />
      </div>

      <SettingsSection
        title="Review Queue"
        description="Templates submitted for public listing."
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline" size="sm">
            {filteredQueue.length} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Submitter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Reviewed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQueue.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  No review requests
                </TableCell>
              </TableRow>
            ) : (
              filteredQueue.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/templates/${item.template_id}`}
                      className="text-[12px] font-medium text-foreground hover:text-brand-500"
                    >
                      {item.template_name}
                    </Link>
                    <div className="text-[11px] text-foreground-muted">{item.template_id}</div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/users/${item.submitter_id}`}
                      className="text-[12px] text-foreground-light hover:text-brand-500"
                    >
                      {item.submitter_email}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[item.status] || "secondary"} size="sm">
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatRelativeTime(item.submitted_at)}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {item.reviewed_at ? (
                      <div>
                        <div>{formatDate(item.reviewed_at)}</div>
                        <div className="text-[11px]">{item.reviewer_email}</div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReviewOpen(item);
                          setReviewDecision("approved");
                          setReviewNotes("");
                        }}
                        disabled={item.status !== "pending"}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Review
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SettingsSection>

      {/* Review Dialog */}
      <Dialog open={Boolean(reviewOpen)} onOpenChange={(open) => !open && setReviewOpen(null)}>
        <DialogContent size="lg">
          <DialogHeader icon={<FileText className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Review Public Request</DialogTitle>
            <DialogDescription>
              {reviewOpen && (
                <span className="text-foreground-light">
                  Reviewing template: {reviewOpen.template_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {reviewOpen && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid grid-cols-2 gap-4 text-[12px]">
                  <div>
                    <div className="text-foreground-muted">Template ID</div>
                    <div className="text-foreground">{reviewOpen.template_id}</div>
                  </div>
                  <div>
                    <div className="text-foreground-muted">Submitter</div>
                    <div className="text-foreground">{reviewOpen.submitter_email}</div>
                  </div>
                  <div>
                    <div className="text-foreground-muted">Submitted At</div>
                    <div className="text-foreground">{formatDate(reviewOpen.submitted_at)}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] text-foreground">Review Decision</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={reviewDecision === "approved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReviewDecision("approved")}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant={reviewDecision === "rejected" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setReviewDecision("rejected")}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] text-foreground">Review Notes</label>
                <Input
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter review notes..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(null)}>
              Cancel
            </Button>
            <Button
              variant={reviewDecision === "rejected" ? "destructive" : "default"}
              onClick={() => reviewMutation.mutate()}
              loading={reviewMutation.isPending}
              loadingText="Submitting..."
            >
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
