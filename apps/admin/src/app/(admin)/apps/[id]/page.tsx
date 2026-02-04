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
  published: "已发布",
  draft: "草稿",
  deprecated: "已废弃",
  archived: "已归档",
  suspended: "已暂停",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  published: "success",
  draft: "warning",
  deprecated: "secondary",
  archived: "secondary",
  suspended: "destructive",
};

const VERSION_STATUS_LABELS: Record<string, string> = {
  stable: "稳定版",
  candidate: "候选版",
  deprecated: "已废弃",
};

const DOMAIN_STATUS_LABELS: Record<string, string> = {
  verified: "已验证",
  active: "已启用",
  pending: "待验证",
  blocked: "已拦截",
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
  { id: "rev-1", reviewer_id: "user-1", reviewer_email: "reviewer@agentflow.ai", decision: "approved", notes: "符合上架要求", created_at: "2026-01-15T08:00:00Z" },
  { id: "rev-2", reviewer_id: "user-2", reviewer_email: "admin@agentflow.ai", decision: "pending", notes: "等待补充文档", created_at: "2026-02-01T08:00:00Z" },
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
      toast.success("版本已回滚");
      setRollbackVersionOpen(null);
      setRollbackReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
    },
    onError: () => toast.error("回滚失败"),
  });

  const promoteVersionMutation = useMutation({
    mutationFn: (versionId: string) => adminApi.apps.promoteVersion(appId, versionId, { target_status: "stable" }),
    onSuccess: () => {
      toast.success("版本已提升为稳定版");
      setPromoteVersionOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
    },
    onError: () => toast.error("提升失败"),
  });

  const submitReviewMutation = useMutation({
    mutationFn: () => adminApi.apps.submitReview(appId, { decision: reviewDecision, notes: reviewNotes }),
    onSuccess: () => {
      toast.success(`审核${reviewDecision === "approved" ? "通过" : "拒绝"}已提交`);
      setSubmitReviewOpen(false);
      setReviewNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
    },
    onError: () => toast.error("提交审核失败"),
  });

  const updatePolicyMutation = useMutation({
    mutationFn: () => adminApi.apps.updateAccessPolicy(appId, {
      access_mode: policyAccessMode,
      require_captcha: policyRequireCaptcha,
    }),
    onSuccess: () => {
      toast.success("访问策略已更新");
      setUpdatePolicyOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
    },
    onError: () => toast.error("更新失败"),
  });

  const addDomainMutation = useMutation({
    mutationFn: () => adminApi.apps.addDomain(appId, { domain: newDomain }),
    onSuccess: () => {
      toast.success("域名已添加");
      setAddDomainOpen(false);
      setNewDomain("");
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
    },
    onError: () => toast.error("添加域名失败"),
  });

  const removeDomainMutation = useMutation({
    mutationFn: (domainId: string) => adminApi.apps.removeDomain(appId, domainId),
    onSuccess: () => {
      toast.success("域名已移除");
      setRemoveDomainOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
    },
    onError: () => toast.error("移除失败"),
  });

  const retryWebhookMutation = useMutation({
    mutationFn: ({ webhookId, logId }: { webhookId: string; logId: string }) =>
      adminApi.apps.retryWebhook(appId, webhookId, logId),
    onSuccess: () => {
      toast.success("Webhook 已重试");
      setRetryWebhookOpen(null);
    },
    onError: () => toast.error("重试失败"),
  });

  if (!appId) {
    return (
      <PageContainer>
        <PageHeader title="应用详情" description="无效的应用 ID" icon={<Activity className="w-4 h-4" />} />
      </PageContainer>
    );
  }

  const statusLabel = app?.status ? STATUS_LABELS[app.status] || app.status : "-";
  const statusVariant = app?.status ? STATUS_VARIANTS[app.status] || "warning" : "warning";

  return (
    <PageContainer>
      <PageHeader
        title={app?.name || "应用详情"}
        description={
          app
            ? `${app.slug} · ${app.id}`
            : localMode
            ? "未找到对应的本地应用数据"
            : "正在加载应用数据..."
        }
        icon={<Activity className="w-4 h-4" />}
        backHref="/apps"
        backLabel="返回应用列表"
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
                  已发布
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  未发布
                </Badge>
              )}
            </div>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSubmitReviewOpen(true)}>
              提交审核
            </Button>
            <Button size="sm" disabled>
              下架应用
            </Button>
          </div>
        }
      />

      {/* Dialogs */}
      <ConfirmDialog
        open={Boolean(rollbackVersionOpen)}
        onOpenChange={(open) => !open && setRollbackVersionOpen(null)}
        title="回滚版本"
        description="确认要将应用回滚到此版本吗？"
        confirmLabel="确认回滚"
        onConfirm={() => rollbackVersionOpen && rollbackVersionMutation.mutate(rollbackVersionOpen)}
        isLoading={rollbackVersionMutation.isPending}
        variant="warning"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">回滚原因（必填）</label>
            <Input
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="请输入回滚原因..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(promoteVersionOpen)}
        onOpenChange={(open) => !open && setPromoteVersionOpen(null)}
        title="提升版本"
        description="将此版本提升为稳定版本。"
        confirmLabel="确认提升"
        onConfirm={() => promoteVersionOpen && promoteVersionMutation.mutate(promoteVersionOpen)}
        isLoading={promoteVersionMutation.isPending}
      />

      <ConfirmDialog
        open={submitReviewOpen}
        onOpenChange={setSubmitReviewOpen}
        title="提交上架审核"
        description="对该应用的市场上架申请进行审核。"
        confirmLabel="提交审核"
        onConfirm={() => submitReviewMutation.mutate()}
        isLoading={submitReviewMutation.isPending}
        variant={reviewDecision === "rejected" ? "danger" : "default"}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-[12px] text-foreground">审核决定</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={reviewDecision === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setReviewDecision("approved")}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                通过
              </Button>
              <Button
                type="button"
                variant={reviewDecision === "rejected" ? "destructive" : "outline"}
                size="sm"
                onClick={() => setReviewDecision("rejected")}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                拒绝
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">审核备注</label>
            <Input
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="请输入审核备注..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={updatePolicyOpen}
        onOpenChange={setUpdatePolicyOpen}
        title="更新访问策略"
        description="配置应用的访问控制策略。"
        confirmLabel="保存"
        onConfirm={() => updatePolicyMutation.mutate()}
        isLoading={updatePolicyMutation.isPending}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-[12px] text-foreground">访问模式</label>
            <div className="flex gap-2">
              {["public", "private", "restricted"].map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  variant={policyAccessMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPolicyAccessMode(mode)}
                >
                  {mode === "public" ? "公开" : mode === "private" ? "私有" : "受限"}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-foreground">验证码保护</div>
              <div className="text-[11px] text-foreground-muted">访问时需要验证码</div>
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
        title="添加域名"
        description="为应用绑定自定义域名。"
        confirmLabel="添加"
        onConfirm={() => addDomainMutation.mutate()}
        isLoading={addDomainMutation.isPending}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">域名</label>
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
        title="移除域名"
        description="确认要移除该域名绑定吗？"
        confirmLabel="确认移除"
        onConfirm={() => removeDomainOpen && removeDomainMutation.mutate(removeDomainOpen)}
        isLoading={removeDomainMutation.isPending}
        variant="danger"
      />

      <ConfirmDialog
        open={Boolean(retryWebhookOpen)}
        onOpenChange={(open) => !open && setRetryWebhookOpen(null)}
        title="重试 Webhook"
        description="重新发送此 Webhook 投递。"
        confirmLabel="确认重试"
        onConfirm={() => retryWebhookOpen && retryWebhookMutation.mutate(retryWebhookOpen)}
        isLoading={retryWebhookMutation.isPending}
      />

      <div className="page-grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <SettingsSection title="基础信息" description="应用元数据与归属信息。">
          {!app ? (
            <div className="text-[12px] text-foreground-muted">
              {appQuery.isPending && !localMode ? "正在加载..." : "暂无应用数据"}
            </div>
          ) : (
            <div className="space-y-1">
              <FormRow label="应用 ID" description="系统唯一标识">
                <div className="text-[12px] text-foreground">{app.id}</div>
              </FormRow>
              <FormRow label="Slug" description="应用访问标识">
                <div className="text-[12px] text-foreground-light">{app.slug}</div>
              </FormRow>
              <FormRow label="所属 Workspace" description="应用归属工作空间">
                <Link
                  href={`/workspaces/${app.workspace_id}`}
                  className="text-[12px] text-foreground hover:text-brand-500 transition-colors"
                >
                  {app.workspace?.name || app.workspace_id}
                </Link>
              </FormRow>
              <FormRow label="Owner" description="应用负责人">
                <Link
                  href={`/users/${app.owner_user_id}`}
                  className="text-[12px] text-foreground hover:text-brand-500 transition-colors"
                >
                  {app.owner?.email || app.owner_user_id}
                </Link>
              </FormRow>
              <FormRow label="状态" description="当前发布状态">
                <Badge variant={statusVariant} size="sm">
                  {statusLabel}
                </Badge>
              </FormRow>
              <FormRow label="定价模型" description="应用计费方式">
                <div className="text-[12px] text-foreground-light">{app.pricing_type}</div>
              </FormRow>
              <FormRow label="发布时间" description="首次发布上线时间">
                <div className="text-[12px] text-foreground-light">
                  {app.published_at ? formatDate(app.published_at) : "-"}
                </div>
              </FormRow>
            </div>
          )}
        </SettingsSection>

        {/* Market Ratings */}
        <SettingsSection
          title="市场评分"
          description="用户评价与评分分布。"
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
                  {mockRatings.total_reviews} 条评价
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
        title="版本与发布流程"
        description="应用版本管理与发布状态。"
        icon={<History className="w-4 h-4" />}
      >
        {versions.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">暂无版本记录</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>版本</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>说明</TableHead>
                <TableHead>发布时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => {
                const rawStatus = (version as { status?: string }).status;
                const isCurrent = currentVersionId && version.id === currentVersionId;
                const statusLabel = rawStatus
                  ? VERSION_STATUS_LABELS[rawStatus] || rawStatus
                  : isCurrent
                  ? "当前版本"
                  : "历史版本";
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
                            提升
                          </Button>
                        )}
                        {!isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRollbackVersionOpen(version.id)}
                          >
                            回滚
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
        title="市场上架审核"
        description="应用上架审核记录与决策。"
        icon={<Shield className="w-4 h-4" />}
        footer={
          <Button variant="outline" size="sm" onClick={() => setSubmitReviewOpen(true)}>
            新增审核
          </Button>
        }
      >
        {mockReviews.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">暂无审核记录</div>
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
                    {review.decision === "approved" ? "通过" : review.decision === "rejected" ? "拒绝" : "待审核"}
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
        title="访问策略"
        description="访问控制与安全策略配置。"
        icon={<Settings className="w-4 h-4" />}
        footer={
          <Button variant="outline" size="sm" onClick={() => setUpdatePolicyOpen(true)}>
            编辑策略
          </Button>
        }
      >
        {!app ? (
          <div className="text-[12px] text-foreground-muted">暂无策略数据</div>
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
                  {policy.enabled ? "启用" : "停用"}
                </Badge>
              </div>
            ))}
          </div>
        ) : accessPolicy ? (
          <div className="space-y-1">
            <FormRow label="访问模式" description="App 的访问控制等级">
              <Badge variant="outline" size="sm">{accessPolicy.access_mode}</Badge>
            </FormRow>
            <FormRow label="数据等级" description="默认数据分级策略">
              <Badge variant="secondary" size="sm">{accessPolicy.data_classification}</Badge>
            </FormRow>
            <FormRow label="验证码" description="访问时是否强制验证码">
              <Badge variant={accessPolicy.require_captcha ? "warning" : "secondary"} size="sm">
                {accessPolicy.require_captcha ? "启用" : "关闭"}
              </Badge>
            </FormRow>
          </div>
        ) : (
          <div className="text-[12px] text-foreground-muted">暂无访问策略</div>
        )}
      </SettingsSection>

      {/* Domain Binding */}
      <SettingsSection
        title="域名绑定"
        description="自定义域名与访问入口。"
        icon={<Globe className="w-4 h-4" />}
        footer={
          <Button variant="outline" size="sm" onClick={() => setAddDomainOpen(true)}>
            添加域名
          </Button>
        }
      >
        {domains.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">暂无域名配置</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>域名</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>SSL</TableHead>
                <TableHead className="text-right">操作</TableHead>
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
                      <Badge variant="info" size="sm" className="mt-1">主域名</Badge>
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
                        验证
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
        title="Webhook 管理"
        description="Webhook 配置与投递日志。"
        icon={<Webhook className="w-4 h-4" />}
      >
        {mockWebhooks.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">暂无 Webhook 配置</div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>事件</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
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
                        {webhook.status === "active" ? "活跃" : "停用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewWebhookLogsOpen(webhook.id)}
                      >
                        查看日志
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {viewWebhookLogsOpen && (
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[12px] font-medium text-foreground">投递日志</div>
                  <Button variant="ghost" size="sm" onClick={() => setViewWebhookLogsOpen(null)}>
                    关闭
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>事件</TableHead>
                      <TableHead>状态码</TableHead>
                      <TableHead>响应时间</TableHead>
                      <TableHead>时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
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
                              重试
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
