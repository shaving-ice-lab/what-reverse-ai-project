"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Flag,
  MessageSquare,
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
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { cn, formatRelativeTime } from "@/lib/utils";

// Mock data
const mockModerationQueue = [
  {
    id: "mod-1",
    conversation_id: "conv-123",
    message_id: "msg-456",
    content_preview: "This is a content preview containing sensitive vocabulary...",
    flags: ["profanity", "sensitive"],
    severity: "high",
    status: "pending",
    reported_at: "2026-02-03T07:30:00Z",
  },
  {
    id: "mod-2",
    conversation_id: "conv-124",
    message_id: "msg-457",
    content_preview: "Another piece of potentially violating content...",
    flags: ["spam"],
    severity: "medium",
    status: "pending",
    reported_at: "2026-02-03T06:45:00Z",
  },
  {
    id: "mod-3",
    conversation_id: "conv-125",
    message_id: "msg-458",
    content_preview: "Inappropriate content reported by users...",
    flags: ["harassment"],
    severity: "high",
    status: "escalated",
    reported_at: "2026-02-03T05:15:00Z",
  },
];

const mockModerationRules = [
  { id: "rule-1", name: "Sensitive Word Filter", pattern: "sensitive_words_list", action: "block", severity: "high", enabled: true },
  { id: "rule-2", name: "Spam Detection", pattern: "spam_patterns", action: "flag", severity: "medium", enabled: true },
  { id: "rule-3", name: "Harassment Detection", pattern: "harassment_patterns", action: "flag", severity: "high", enabled: true },
  { id: "rule-4", name: "Ad Link Filter", pattern: "ad_urls", action: "block", severity: "low", enabled: false },
];

const STATUS_OPTIONS = ["all", "pending", "approved", "rejected", "escalated"] as const;
const STATUS_LABELS: Record<string, string> = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  escalated: "Escalated",
};

const SEVERITY_VARIANTS: Record<string, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

const FLAG_LABELS: Record<string, string> = {
  profanity: "Profanity",
  sensitive: "Sensitive Content",
  spam: "Spam",
  harassment: "Harassment",
  violence: "Violent Content",
  adult: "Adult Content",
};

type ModerationItem = (typeof mockModerationQueue)[number];
type ModerationRule = (typeof mockModerationRules)[number];

export default function ConversationModerationPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("pending");
  const [reviewOpen, setReviewOpen] = useState<ModerationItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"approve" | "reject" | "escalate">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [rulesOpen, setRulesOpen] = useState(false);

  const [localQueue, setLocalQueue] = useState(mockModerationQueue);
  const [localRules, setLocalRules] = useState(mockModerationRules);

  const filteredQueue = localMode
    ? localQueue.filter((item) => statusFilter === "all" || item.status === statusFilter)
    : [];

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!reviewOpen) throw new Error("No item selected");
      if (localMode) {
        setLocalQueue((prev) =>
          prev.map((item) =>
            item.id === reviewOpen.id
              ? { ...item, status: reviewDecision === "approve" ? "approved" : reviewDecision === "reject" ? "rejected" : "escalated" }
              : item
          )
        );
        return { success: true };
      }
      return adminApi.conversations.reviewModeration(reviewOpen.id, {
        decision: reviewDecision,
        notes: reviewNotes,
      });
    },
    onSuccess: () => {
      toast.success(
        reviewDecision === "approve"
          ? "Content approved"
          : reviewDecision === "reject"
          ? "Content rejected"
          : "Content escalated"
      );
      setReviewOpen(null);
      setReviewNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin", "conversations", "moderation"] });
    },
    onError: () => toast.error("Review failed"),
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) => {
      if (localMode) {
        setLocalRules((prev) =>
          prev.map((rule) => (rule.id === ruleId ? { ...rule, enabled } : rule))
        );
        return { success: true };
      }
      return adminApi.conversations.updateModerationRule(ruleId, { enabled });
    },
    onSuccess: () => {
      toast.success("Rule updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "conversations", "moderation", "rules"] });
    },
    onError: () => toast.error("Update failed"),
  });

  const pendingCount = localQueue.filter((item) => item.status === "pending").length;
  const escalatedCount = localQueue.filter((item) => item.status === "escalated").length;

  return (
    <PageContainer>
      <PageHeader
        title="Content Moderation"
        description="Review and manage sensitive content in conversations."
        icon={<Shield className="w-4 h-4" />}
        backHref="/conversations"
        backLabel="Back to Conversations"
        actions={
          <Button variant="outline" size="sm" onClick={() => setRulesOpen(true)}>
            <Filter className="w-3.5 h-3.5 mr-1" />
            Moderation Rules
          </Button>
        }
      />

      <div className="page-grid grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Pending Review"
          value={pendingCount.toString()}
          subtitle="items"
          trend={pendingCount > 0 ? { value: pendingCount, isPositive: true } : undefined}
        />
        <StatsCard
          title="Escalated"
          value={escalatedCount.toString()}
          subtitle="Requires manual review"
        />
        <StatsCard
          title="Reviewed Today"
          value="42"
          subtitle="items"
        />
        <StatsCard
          title="Auto-filtered"
          value="128"
          subtitle="items"
        />
      </div>

      <SettingsSection
        title="Review Queue"
        description="Content requiring manual review."
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
              <TableHead>Content Preview</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported</TableHead>
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
                  No content pending review
                </TableCell>
              </TableRow>
            ) : (
              filteredQueue.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="text-[12px] text-foreground max-w-[300px] truncate">
                      {item.content_preview}
                    </div>
                    <div className="text-[11px] text-foreground-muted mt-0.5">
                      <Link
                        href={`/conversations/${item.conversation_id}`}
                        className="hover:text-brand-500"
                      >
                        {item.conversation_id}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.flags.map((flag) => (
                        <Badge key={flag} variant="outline" size="sm">
                          {FLAG_LABELS[flag] || flag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={SEVERITY_VARIANTS[item.severity] || "secondary"} size="sm">
                      {item.severity === "high" ? "High" : item.severity === "medium" ? "Medium" : "Low"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === "pending"
                          ? "warning"
                          : item.status === "approved"
                          ? "success"
                          : item.status === "rejected"
                          ? "destructive"
                          : "info"
                      }
                      size="sm"
                    >
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatRelativeTime(item.reported_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReviewOpen(item);
                          setReviewDecision("approve");
                          setReviewNotes("");
                        }}
                        disabled={item.status !== "pending" && item.status !== "escalated"}
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
          <DialogHeader icon={<Shield className="w-6 h-6" />} iconVariant="warning">
            <DialogTitle>Content Review</DialogTitle>
            <DialogDescription>
              Review flagged content and make a decision.
            </DialogDescription>
          </DialogHeader>

          {reviewOpen && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="text-[12px] font-medium text-foreground mb-2">Content Preview</div>
                <div className="text-[12px] text-foreground-light">{reviewOpen.content_preview}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="text-[12px] text-foreground-muted">Flags:</div>
                {reviewOpen.flags.map((flag) => (
                  <Badge key={flag} variant="outline" size="sm">
                    {FLAG_LABELS[flag] || flag}
                  </Badge>
                ))}
                <Badge variant={SEVERITY_VARIANTS[reviewOpen.severity]} size="sm">
                  {reviewOpen.severity === "high" ? "High Risk" : reviewOpen.severity === "medium" ? "Medium Risk" : "Low Risk"}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] text-foreground">Review Decision</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={reviewDecision === "approve" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReviewDecision("approve")}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant={reviewDecision === "reject" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setReviewDecision("reject")}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                  <Button
                    type="button"
                    variant={reviewDecision === "escalate" ? "warning" : "outline"}
                    size="sm"
                    onClick={() => setReviewDecision("escalate")}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    Escalate
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
              variant={reviewDecision === "reject" ? "destructive" : "default"}
              onClick={() => reviewMutation.mutate()}
              loading={reviewMutation.isPending}
              loadingText="Submitting..."
            >
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rules Dialog */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<Filter className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Moderation Rules Configuration</DialogTitle>
            <DialogDescription>
              Manage automatic content moderation rules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {localRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-75 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                    {rule.name}
                    <Badge variant={SEVERITY_VARIANTS[rule.severity]} size="sm">
                      {rule.severity === "high" ? "High" : rule.severity === "medium" ? "Medium" : "Low"}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-foreground-muted mt-0.5">
                    Action: {rule.action === "block" ? "Block" : "Flag"}
                  </div>
                </div>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(enabled) =>
                    toggleRuleMutation.mutate({ ruleId: rule.id, enabled })
                  }
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setRulesOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
