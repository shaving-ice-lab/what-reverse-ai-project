"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  History,
  RefreshCw,
  Settings,
  Shield,
  Star,
  Trash2,
  Webhook,
  XCircle,
} from "lucide-react";
import {
  FormRow,
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
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
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import {
  appAccessPolicies,
  appDomains,
  appRows,
  appVersions,
} from "@/lib/mock-data";
import type { App, AppDomain, AppVersion } from "@/types/admin";

const STATUS_LABELS: Record<string, string> = {
  published: "Published",
  draft: "Draft",
  deprecated: "Deprecated",
  archived: "Archived",
  suspended: "Suspended",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  published: "success",
  draft: "warning",
  deprecated: "secondary",
  archived: "secondary",
  suspended: "destructive",
};

const VERSION_STATUS_LABELS: Record<string, string> = {
  stable: "Stable",
  candidate: "Candidate",
  deprecated: "Deprecated",
};

const DOMAIN_STATUS_LABELS: Record<string, string> = {
  verified: "Verified",
  active: "Active",
  pending: "Pending",
  blocked: "Blocked",
};

function getParamId(params: ReturnType<typeof useParams>) {
  const raw = (params as Record<string, string | string[] | undefined>)?.id;
  if (!raw) return "";
  return Array.isArray(raw) ? raw[0] : raw;
}

// Mock data
type ReviewDecision = "approved" | "pending" | "rejected";

const mockReviews: Array<{
  id: string;
  reviewer_id: string;
  reviewer_email: string;
  decision: ReviewDecision;
  notes: string;
  created_at: string;
}> = [
  { id: "rev-1", reviewer_id: "user-1", reviewer_email: "reviewer@agentflow.ai", decision: "approved", notes: "Meets listing requirements", created_at: "2026-01-15T08:00:00Z" },
  { id: "rev-2", reviewer_id: "user-2", reviewer_email: "admin@agentflow.ai", decision: "pending", notes: "Awaiting additional documentation", created_at: "2026-02-01T08:00:00Z" },
];

const mockRatings = {
  average: 4.8,
  total_reviews: 156,
  distribution: { "5": 120, "4": 28, "3": 5, "2": 2, "1": 1 },
};

const mockWebhooks = [
  { id: "wh-1", url: "https://api.example.com/webhook", events: ["app.deployed", "app.error"], status: "active", secret_prefix: "whsec_", created_at: "2026-01-10T08:00:00Z" },
  { id: "wh-2", url: "https://slack.example.com/hooks/abc", events: ["app.published"], status: "inactive", secret_prefix: "whsec_", created_at: "2026-01-15T08:00:00Z" },
];

const mockWebhookLogs = [
  { id: "log-1", event: "app.deployed", status_code: 200, response_time_ms: 245, created_at: "2026-02-03T07:55:00Z" },
  { id: "log-2", event: "app.deployed", status_code: 500, response_time_ms: 3200, error_message: "Internal Server Error", created_at: "2026-02-03T06:30:00Z" },
  { id: "log-3", event: "app.error", status_code: 200, response_time_ms: 180, created_at: "2026-02-03T05:00:00Z" },
];

export default function AppDetailPage() {
  const localMode = isLocalModeEnabled();
  const params = useParams();
  const appId = getParamId(params);
  const queryClient = useQueryClient();

  // Dialog states
  const [rollbackVersionOpen, setRollbackVersionOpen] = useState<string | null>(null);
  const [promoteVersionOpen, setPromoteVersionOpen] = useState<string | null>(null);
  const [submitReviewOpen, setSubmitReviewOpen] = useState(false);
  const [updatePolicyOpen, setUpdatePolicyOpen] = useState(false);
  const [addDomainOpen, setAddDomainOpen] = useState(false);
  const [removeDomainOpen, setRemoveDomainOpen] = useState<string | null>(null);
  const [viewWebhookLogsOpen, setViewWebhookLogsOpen] = useState<string | null>(null);
  const [retryWebhookOpen, setRetryWebhookOpen] = useState<{ webhookId: string; logId: string } | null>(null);

  // Form states
  const [rollbackReason, setRollbackReason] = useState("");
  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [policyAccessMode, setPolicyAccessMode] = useState("public");
  const [policyRequireCaptcha, setPolicyRequireCaptcha] = useState(false);

  const appQuery = useQuery({
    queryKey: ["admin", "apps", "detail", appId],
    enabled: Boolean(appId) && !localMode,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const data = await adminApi.apps.get(appId, { page: 1, page_size: 20 });
      return data;
    },
  });

  const localApp = useMemo<App | null>(() => {
    if (!localMode) return null;
    const rows = appRows as unknown as App[];
    return rows.find((row) => row.id === appId) || null;
  }, [localMode, appId]);

  const appDetail = localMode ? null : appQuery.data || null;
  const app = localMode ? localApp : appDetail?.app || null;

  const versions = useMemo(
    () =>
      localMode
        ? (appVersions as unknown as AppVersion[]).filter((item) => item.app_id === appId)
        : appDetail?.versions || [],
    [appDetail?.versions, appId, localMode]
  );

  const domains = useMemo(
    () =>
      localMode
        ? (appDomains as unknown as AppDomain[]).filter((item) => item.app_id === appId)
        : appDetail?.domains || [],
    [appDetail?.domains, appId, localMode]
  );

  const policies = useMemo(
    () => (localMode ? appAccessPolicies.filter((item) => item.app_id === appId) : []),
    [localMode, appId]
  );

  const accessPolicy = localMode ? null : appDetail?.access_policy || null;

  const currentVersionId = app?.current_version_id || app?.current_version?.id || null;

  // Mutations
  const rollbackVersionMutation = useMutation({
    mutationFn: (versionId: string) => adminApi.apps.rollbackVersion(appId, versionId, { reason: rollbackReason }),
    onSuccess: () => {
      toast.success("Version rolled back");
      setRollbackVersionOpen(null);
      setRollbackReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
    },
    onError: () => toast.error("Rollback failed"),
  });

  const promoteVersionMutation = useMutation({
    mutationFn: (versionId: string) => adminApi.apps.promoteVersion(appId, versionId, { target_status: "stable" }),
    onSuccess: () => {
      toast.success("Version promoted to stable");
      setPromoteVersionOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
    },
    onError: () => toast.error("Promotion failed"),
  });

  const submitReviewMutation = useMutation({
    mutationFn: () => adminApi.apps.submitReview(appId, { decision: reviewDecision, notes: reviewNotes }),
    onSuccess: () => {
      toast.success(`Review ${reviewDecision === "approved" ? "approval" : "rejection"} submitted`);
      setSubmitReviewOpen(false);
      setReviewNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
    },
    onError: () => toast.error("Failed to submit review"),
  });

  const updatePolicyMutation = useMutation({
    mutationFn: () => adminApi.apps.updateAccessPolicy(appId, {
      access_mode: policyAccessMode,
      require_captcha: policyRequireCaptcha,
    }),
    onSuccess: () => {
      toast.success("Access policy updated");
      setUpdatePolicyOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
    },
    onError: () => toast.error("Update failed"),
  });

  const addDomainMutation = useMutation({
    mutationFn: () => adminApi.apps.addDomain(appId, { domain: newDomain }),
    onSuccess: () => {
      toast.success("Domain added");
      setAddDomainOpen(false);
      setNewDomain("");
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
    },
    onError: () => toast.error("Failed to add domain"),
  });

  const removeDomainMutation = useMutation({
    mutationFn: (domainId: string) => adminApi.apps.removeDomain(appId, domainId),
    onSuccess: () => {
      toast.success("Domain removed");
      setRemoveDomainOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
    },
    onError: () => toast.error("Removal failed"),
  });

  const retryWebhookMutation = useMutation({
    mutationFn: ({ webhookId, logId }: { webhookId: string; logId: string }) =>
      adminApi.apps.retryWebhook(appId, webhookId, logId),
    onSuccess: () => {
      toast.success("Webhook retried");
      setRetryWebhookOpen(null);
    },
    onError: () => toast.error("Retry failed"),
  });

  if (!appId) {
    return (
      <PageContainer>
        <PageHeader title="App Details" description="Invalid app ID" icon={<Activity className="w-4 h-4" />} />
      </PageContainer>
    );
  }

  const statusLabel = app?.status ? STATUS_LABELS[app.status] || app.status : "-";
  const statusVariant = app?.status ? STATUS_VARIANTS[app.status] || "warning" : "warning";

  return (
    <PageContainer>
      <PageHeader
        title={app?.name || "App Details"}
        description={
          app
            ? `${app.slug} · ${app.id}`
            : localMode
            ? "Local app data not found"
            : "Loading app data..."
        }
        icon={<Activity className="w-4 h-4" />}
        backHref="/apps"
        backLabel="Back to App List"
        badge={
          app ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant} size="sm">
                {statusLabel}
              </Badge>
              <Badge variant="outline" size="sm">
                {app.pricing_type}
              </Badge>
              {app.published_at ? (
                <Badge variant="secondary" size="sm">
                  Published
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  Unpublished
                </Badge>
              )}
            </div>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSubmitReviewOpen(true)}>
              Submit Review
            </Button>
            <Button size="sm" disabled>
              Unpublish App
            </Button>
          </div>
        }
      />

      {/* Dialogs */}
      <ConfirmDialog
        open={Boolean(rollbackVersionOpen)}
        onOpenChange={(open) => !open && setRollbackVersionOpen(null)}
        title="Rollback Version"
        description="Are you sure you want to rollback the app to this version?"
        confirmLabel="Confirm Rollback"
        onConfirm={() => rollbackVersionOpen && rollbackVersionMutation.mutate(rollbackVersionOpen)}
        isLoading={rollbackVersionMutation.isPending}
        variant="warning"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">Rollback Reason (required)</label>
            <Input
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="Enter rollback reason..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(promoteVersionOpen)}
        onOpenChange={(open) => !open && setPromoteVersionOpen(null)}
        title="Promote Version"
        description="Promote this version to stable."
        confirmLabel="Confirm Promotion"
        onConfirm={() => promoteVersionOpen && promoteVersionMutation.mutate(promoteVersionOpen)}
        isLoading={promoteVersionMutation.isPending}
      />

      <ConfirmDialog
        open={submitReviewOpen}
        onOpenChange={setSubmitReviewOpen}
        title="Submit Listing Review"
        description="Review this app's marketplace listing application."
        confirmLabel="Submit Review"
        onConfirm={() => submitReviewMutation.mutate()}
        isLoading={submitReviewMutation.isPending}
        variant={reviewDecision === "rejected" ? "danger" : "default"}
      >
        <div className="space-y-4 py-2">
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
      </ConfirmDialog>

      <ConfirmDialog
        open={updatePolicyOpen}
        onOpenChange={setUpdatePolicyOpen}
        title="Update Access Policy"
        description="Configure the app's access control policy."
        confirmLabel="Save"
        onConfirm={() => updatePolicyMutation.mutate()}
        isLoading={updatePolicyMutation.isPending}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-[12px] text-foreground">Access Mode</label>
            <div className="flex gap-2">
              {["public", "private", "restricted"].map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  variant={policyAccessMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPolicyAccessMode(mode)}
                >
                  {mode === "public" ? "Public" : mode === "private" ? "Private" : "Restricted"}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-foreground">CAPTCHA Protection</div>
              <div className="text-[11px] text-foreground-muted">Requires CAPTCHA on access</div>
            </div>
            <Switch
              checked={policyRequireCaptcha}
              onCheckedChange={setPolicyRequireCaptcha}
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={addDomainOpen}
        onOpenChange={setAddDomainOpen}
        title="Add Domain"
        description="Bind a custom domain to this app."
        confirmLabel="Add"
        onConfirm={() => addDomainMutation.mutate()}
        isLoading={addDomainMutation.isPending}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">Domain</label>
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(removeDomainOpen)}
        onOpenChange={(open) => !open && setRemoveDomainOpen(null)}
        title="Remove Domain"
        description="Are you sure you want to remove this domain binding?"
        confirmLabel="Confirm Removal"
        onConfirm={() => removeDomainOpen && removeDomainMutation.mutate(removeDomainOpen)}
        isLoading={removeDomainMutation.isPending}
        variant="danger"
      />

      <ConfirmDialog
        open={Boolean(retryWebhookOpen)}
        onOpenChange={(open) => !open && setRetryWebhookOpen(null)}
        title="Retry Webhook"
        description="Resend this webhook delivery."
        confirmLabel="Confirm Retry"
        onConfirm={() => retryWebhookOpen && retryWebhookMutation.mutate(retryWebhookOpen)}
        isLoading={retryWebhookMutation.isPending}
      />

      <div className="page-grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <SettingsSection title="Basic Information" description="App metadata and ownership.">
          {!app ? (
            <div className="text-[12px] text-foreground-muted">
              {appQuery.isPending && !localMode ? "Loading..." : "No app data available"}
            </div>
          ) : (
            <div className="space-y-1">
              <FormRow label="App ID" description="System unique identifier">
                <div className="text-[12px] text-foreground">{app.id}</div>
              </FormRow>
              <FormRow label="Slug" description="App access identifier">
                <div className="text-[12px] text-foreground-light">{app.slug}</div>
              </FormRow>
              <FormRow label="Workspace" description="App's parent workspace">
                <Link
                  href={`/workspaces/${app.workspace_id}`}
                  className="text-[12px] text-foreground hover:text-brand-500 transition-colors"
                >
                  {app.workspace?.name || app.workspace_id}
                </Link>
              </FormRow>
              <FormRow label="Owner" description="App owner">
                <Link
                  href={`/users/${app.owner_user_id}`}
                  className="text-[12px] text-foreground hover:text-brand-500 transition-colors"
                >
                  {app.owner?.email || app.owner_user_id}
                </Link>
              </FormRow>
              <FormRow label="Status" description="Current publish status">
                <Badge variant={statusVariant} size="sm">
                  {statusLabel}
                </Badge>
              </FormRow>
              <FormRow label="Pricing Model" description="App billing method">
                <div className="text-[12px] text-foreground-light">{app.pricing_type}</div>
              </FormRow>
              <FormRow label="Published At" description="First publish date">
                <div className="text-[12px] text-foreground-light">
                  {app.published_at ? formatDate(app.published_at) : "-"}
                </div>
              </FormRow>
            </div>
          )}
        </SettingsSection>

        {/* Market Ratings */}
        <SettingsSection
          title="Market Ratings"
          description="User reviews and rating distribution."
          icon={<Star className="w-4 h-4" />}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-foreground">{mockRatings.average}</div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-4 h-4",
                        star <= Math.round(mockRatings.average)
                          ? "text-warning-400 fill-warning-400"
                          : "text-foreground-muted"
                      )}
                    />
                  ))}
                </div>
                <div className="text-[11px] text-foreground-muted mt-1">
                  {mockRatings.total_reviews} reviews
                </div>
              </div>
            </div>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const key = rating.toString() as keyof typeof mockRatings.distribution;
                const count = mockRatings.distribution[key] || 0;
                const percent = (count / mockRatings.total_reviews) * 100;
                return (
                  <div key={rating} className="flex items-center gap-2 text-[11px]">
                    <span className="w-4 text-foreground-muted">{rating}</span>
                    <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-foreground-muted">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </SettingsSection>
      </div>

      {/* Version Management */}
      <SettingsSection
        title="Versions & Release Pipeline"
        description="App version management and release status."
        icon={<History className="w-4 h-4" />}
      >
        {versions.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">No version records</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Released</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => {
                const rawStatus = (version as { status?: string }).status;
                const isCurrent = currentVersionId && version.id === currentVersionId;
                const statusLabel = rawStatus
                  ? VERSION_STATUS_LABELS[rawStatus] || rawStatus
                  : isCurrent
                  ? "Current"
                  : "Historical";
                const statusVariant =
                  rawStatus === "stable"
                    ? "success"
                    : rawStatus === "candidate"
                    ? "warning"
                    : isCurrent
                    ? "success"
                    : "secondary";
                return (
                  <TableRow key={version.id}>
                    <TableCell>
                      <div className="text-[12px] font-medium text-foreground">
                        {version.version}
                      </div>
                      <div className="text-[11px] text-foreground-muted">{version.id}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant} size="sm">
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-light max-w-[200px] truncate">
                      {(version as { notes?: string; changelog?: string }).notes ||
                        (version as { changelog?: string }).changelog ||
                        "-"}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-muted">
                      {formatDate(
                        (version as { released_at?: string }).released_at || version.created_at
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {rawStatus !== "stable" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPromoteVersionOpen(version.id)}
                          >
                            Promote
                          </Button>
                        )}
                        {!isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRollbackVersionOpen(version.id)}
                          >
                            Rollback
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

      {/* Market Review */}
      <SettingsSection
        title="Marketplace Listing Review"
        description="App listing review records and decisions."
        icon={<Shield className="w-4 h-4" />}
        footer={
          <Button variant="outline" size="sm" onClick={() => setSubmitReviewOpen(true)}>
            New Review
          </Button>
        }
      >
        {mockReviews.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">No review records</div>
        ) : (
          <div className="space-y-3">
            {mockReviews.map((review) => (
              <div
                key={review.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface-75 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                    {review.decision === "approved" ? (
                      <CheckCircle className="w-4 h-4 text-brand-500" />
                    ) : review.decision === "rejected" ? (
                      <XCircle className="w-4 h-4 text-destructive-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-warning-400" />
                    )}
                    {review.decision === "approved" ? "Approved" : review.decision === "rejected" ? "Rejected" : "Pending"}
                  </div>
                  <div className="text-[11px] text-foreground-light mt-1">{review.notes}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-foreground-muted">{review.reviewer_email}</div>
                  <div className="text-[11px] text-foreground-muted">
                    {formatDate(review.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      {/* Access Policy */}
      <SettingsSection
        title="Access Policy"
        description="Access control and security policy configuration."
        icon={<Settings className="w-4 h-4" />}
        footer={
          <Button variant="outline" size="sm" onClick={() => setUpdatePolicyOpen(true)}>
            Edit Policy
          </Button>
        }
      >
        {!app ? (
          <div className="text-[12px] text-foreground-muted">No policy data available</div>
        ) : localMode && policies.length > 0 ? (
          <div className="space-y-3">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface-75 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-foreground">{policy.title}</div>
                  <div className="text-[11px] text-foreground-light mt-1">{policy.description}</div>
                </div>
                <Badge variant={policy.enabled ? "success" : "secondary"} size="sm">
                  {policy.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            ))}
          </div>
        ) : accessPolicy ? (
          <div className="space-y-1">
            <FormRow label="Access Mode" description="App's access control level">
              <Badge variant="outline" size="sm">{accessPolicy.access_mode}</Badge>
            </FormRow>
            <FormRow label="Data Classification" description="Default data classification policy">
              <Badge variant="secondary" size="sm">{accessPolicy.data_classification}</Badge>
            </FormRow>
            <FormRow label="CAPTCHA" description="Whether CAPTCHA is required on access">
              <Badge variant={accessPolicy.require_captcha ? "warning" : "secondary"} size="sm">
                {accessPolicy.require_captcha ? "Enabled" : "Disabled"}
              </Badge>
            </FormRow>
          </div>
        ) : (
          <div className="text-[12px] text-foreground-muted">No access policy configured</div>
        )}
      </SettingsSection>

      {/* Domain Binding */}
      <SettingsSection
        title="Domain Binding"
        description="Custom domains and access endpoints."
        icon={<Globe className="w-4 h-4" />}
        footer={
          <Button variant="outline" size="sm" onClick={() => setAddDomainOpen(true)}>
            Add Domain
          </Button>
        }
      >
        {domains.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">No domains configured</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SSL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((domain) => (
                <TableRow key={domain.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 text-[12px] text-foreground">
                      <Globe className="w-3.5 h-3.5 text-foreground-muted" />
                      {domain.domain}
                      <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 text-foreground-muted hover:text-brand-500" />
                      </a>
                    </div>
                    {(domain as { primary?: boolean }).primary && (
                      <Badge variant="info" size="sm" className="mt-1">Primary</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        domain.status === "verified" ? "success" :
                        domain.status === "pending" ? "warning" :
                        domain.status === "blocked" ? "error" : "info"
                      }
                      size="sm"
                    >
                      {DOMAIN_STATUS_LABELS[domain.status] || domain.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {domain.ssl_status || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" disabled>
                        Verify
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRemoveDomainOpen(domain.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsSection>

      {/* Webhook Management */}
      <SettingsSection
        title="Webhook Management"
        description="Webhook configuration and delivery logs."
        icon={<Webhook className="w-4 h-4" />}
      >
        {mockWebhooks.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">No webhooks configured</div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockWebhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="text-[12px] font-medium text-foreground max-w-[200px] truncate">
                      {webhook.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" size="sm">{event}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={webhook.status === "active" ? "success" : "secondary"} size="sm">
                        {webhook.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewWebhookLogsOpen(webhook.id)}
                      >
                        View Logs
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {viewWebhookLogsOpen && (
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[12px] font-medium text-foreground">Delivery Logs</div>
                  <Button variant="ghost" size="sm" onClick={() => setViewWebhookLogsOpen(null)}>
                    Close
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Status Code</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockWebhookLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-[12px] text-foreground">{log.event}</TableCell>
                        <TableCell>
                          <Badge
                            variant={log.status_code >= 200 && log.status_code < 300 ? "success" : "error"}
                            size="sm"
                          >
                            {log.status_code}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[12px] text-foreground-light">
                          {log.response_time_ms}ms
                        </TableCell>
                        <TableCell className="text-[12px] text-foreground-muted">
                          {formatRelativeTime(log.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          {log.status_code >= 400 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRetryWebhookOpen({ webhookId: viewWebhookLogsOpen, logId: log.id })}
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" />
                              Retry
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </SettingsSection>
    </PageContainer>
  );
}
