"use client";

/**
 * App 发布设置页 - Supabase 风格
 * 访问策略 / 匿名开关 / 限流与防护
 */

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormRow,
  PageContainer,
  PageHeader,
  PageWithSidebar,
  SettingsSection,
  SidebarNavGroup,
  SidebarNavItem,
  ToggleRow,
} from "@/components/dashboard/page-layout";
import { appApi, type App, type AppAccessPolicy, type AppDomain } from "@/lib/api/app";
import { workspaceApi, type Workspace } from "@/lib/api/workspace";
import { useAuthStore } from "@/stores/useAuthStore";
import { buildWorkspacePermissions, resolveWorkspaceRoleFromUser } from "@/lib/permissions";
import { PermissionGate } from "@/components/permissions/permission-gate";

type RateLimitKey = "per_minute" | "per_hour" | "per_day";

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  draft: { label: "草稿", color: "text-foreground-muted", bgColor: "bg-surface-200", icon: Clock },
  published: { label: "已发布", color: "text-brand-500", bgColor: "bg-brand-200", icon: CheckCircle2 },
  deprecated: { label: "已下线", color: "text-warning", bgColor: "bg-warning-200", icon: AlertCircle },
  archived: { label: "已归档", color: "text-foreground-muted", bgColor: "bg-surface-200", icon: Archive },
};

const accessModeConfig: Record<
  string,
  { label: string; description: string; icon: React.ElementType }
> = {
  private: { label: "私有访问", description: "仅 workspace 成员可访问", icon: Lock },
  public_auth: { label: "公开访问（需登录）", description: "登录用户可访问", icon: Users },
  public_anonymous: { label: "公开访问（匿名）", description: "任何人可访问", icon: Globe },
};

const rateLimitLabels: Record<RateLimitKey, string> = {
  per_minute: "每分钟",
  per_hour: "每小时",
  per_day: "每日",
};

const domainStatusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  active: { label: "已生效", color: "text-brand-500", bgColor: "bg-brand-200" },
  verified: { label: "已验证", color: "text-brand-500", bgColor: "bg-brand-200" },
  verifying: { label: "验证中", color: "text-warning", bgColor: "bg-warning-200" },
  pending: { label: "待验证", color: "text-foreground-muted", bgColor: "bg-surface-200" },
  failed: { label: "验证失败", color: "text-destructive", bgColor: "bg-destructive/10" },
  blocked: { label: "已阻止", color: "text-destructive", bgColor: "bg-destructive/10" },
};

// 侧边导航
function AppNav({ workspaceId, appId, activeTab }: { workspaceId: string; appId: string; activeTab: string }) {
  const navItems = [
    { id: "overview", label: "概览", href: `/workspaces/${workspaceId}/apps/${appId}` },
    { id: "builder", label: "构建", href: `/workspaces/${workspaceId}/apps/${appId}/builder` },
    { id: "publish", label: "发布设置", href: `/workspaces/${workspaceId}/apps/${appId}/publish` },
    { id: "versions", label: "版本历史", href: `/workspaces/${workspaceId}/apps/${appId}/versions` },
    { id: "monitoring", label: "监控", href: `/workspaces/${workspaceId}/apps/${appId}/monitoring` },
    { id: "domains", label: "域名", href: `/workspaces/${workspaceId}/apps/${appId}/domains` },
  ];

  return (
    <SidebarNavGroup title="应用">
      {navItems.map((item) => (
        <SidebarNavItem
          key={item.id}
          href={item.href}
          label={item.label}
          active={activeTab === item.id}
        />
      ))}
    </SidebarNavGroup>
  );
}

export default function PublishSettingsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const appId = params.appId as string;
  const { user } = useAuthStore();
  const workspaceRole = resolveWorkspaceRoleFromUser(user?.role);
  const permissions = buildWorkspacePermissions(workspaceRole);
  const canPublish = Boolean(permissions?.app_publish);
  const canEdit = Boolean(permissions?.app_edit);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [app, setApp] = useState<App | null>(null);
  const [accessPolicy, setAccessPolicy] = useState<AppAccessPolicy | null>(null);
  const [domains, setDomains] = useState<AppDomain[]>([]);
  const [domainsError, setDomainsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [accessMode, setAccessMode] = useState<AppAccessPolicy["access_mode"]>("private");
  const [rateLimits, setRateLimits] = useState<Record<RateLimitKey, string>>({
    per_minute: "",
    per_hour: "",
    per_day: "",
  });
  const [allowedOriginsText, setAllowedOriginsText] = useState("");
  const [requireCaptcha, setRequireCaptcha] = useState(false);
  const [origin, setOrigin] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [seoSaved, setSeoSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [workspaceId, appId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setDomainsError(null);
      const [workspaceData, appData, accessPolicyData, domainsData] = await Promise.all([
        workspaceApi.get(workspaceId),
        appApi.get(appId),
        appApi.getAccessPolicy(appId).catch(() => null),
        appApi.getDomains(appId).catch(() => {
          setDomainsError("域名加载失败，请稍后重试。");
          return [];
        }),
      ]);
      setWorkspace(workspaceData);
      setApp(appData);
      setAccessPolicy(accessPolicyData);
      setDomains(domainsData);
    } catch (error) {
      console.error("Failed to load publish settings:", error);
      setLoadError("加载失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    const sourcePolicy = accessPolicy ?? app?.access_policy ?? null;
    if (!sourcePolicy) {
      setAccessMode("private");
      setRateLimits({ per_minute: "", per_hour: "", per_day: "" });
      setAllowedOriginsText("");
      setRequireCaptcha(false);
      return;
    }

    setAccessMode(sourcePolicy.access_mode || "private");
    setRateLimits({
      per_minute: sourcePolicy.rate_limit_json?.per_minute
        ? String(sourcePolicy.rate_limit_json.per_minute)
        : "",
      per_hour: sourcePolicy.rate_limit_json?.per_hour
        ? String(sourcePolicy.rate_limit_json.per_hour)
        : "",
      per_day: sourcePolicy.rate_limit_json?.per_day
        ? String(sourcePolicy.rate_limit_json.per_day)
        : "",
    });
    setAllowedOriginsText(sourcePolicy.allowed_origins?.join(", ") || "");
    setRequireCaptcha(Boolean(sourcePolicy.require_captcha));
  }, [accessPolicy, app?.access_policy]);

  const runtimeEntryUrl =
    workspace?.slug && app?.slug ? `/runtime/${workspace.slug}/${app.slug}` : null;
  const shareLink =
    origin && workspace?.slug && app?.slug ? `${origin}/runtime/${workspace.slug}/${app.slug}` : "";

  const isAnonymousAccess = accessMode === "public_anonymous";
  const accessMeta = accessModeConfig[accessMode] || accessModeConfig.private;
  const AccessIcon = accessMeta.icon;
  const hasDomains = domains.length > 0;
  const primaryDomain = domains[0]?.domain || "";
  const primaryStatus = domains[0]?.status || "pending";
  const domainStatusMeta =
    domainStatusConfig[primaryStatus] || domainStatusConfig.pending;
  const expiryDates = domains
    .map((domain) => domain.domain_expires_at || domain.ssl_expires_at)
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  const nextExpiry = expiryDates[0];
  const daysToExpiry = nextExpiry
    ? Math.ceil((nextExpiry.getTime() - Date.now()) / 86400000)
    : null;
  const expiryLabel = nextExpiry ? nextExpiry.toLocaleDateString("zh-CN") : "暂无到期信息";
  const expiryReminder =
    daysToExpiry === null
      ? "暂无续期提醒"
      : daysToExpiry <= 30
      ? `距离到期还有 ${daysToExpiry} 天，建议提前续期`
      : `距离到期还有 ${daysToExpiry} 天`;

  const resetSaveNotice = () => {
    if (saveMessage) setSaveMessage(null);
    if (saveError) setSaveError(null);
  };

  const handleAccessModeChange = (value: AppAccessPolicy["access_mode"]) => {
    resetSaveNotice();
    setAccessMode(value);
  };

  const handleAnonymousToggle = (checked: boolean) => {
    resetSaveNotice();
    if (checked) {
      setAccessMode("public_anonymous");
    } else if (accessMode === "public_anonymous") {
      setAccessMode("public_auth");
    }
  };

  const handleRateLimitChange = (key: RateLimitKey, value: string) => {
    resetSaveNotice();
    setRateLimits((prev) => ({ ...prev, [key]: value }));
  };

  const parseNumber = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return undefined;
    const numeric = Number(normalized);
    if (Number.isNaN(numeric) || numeric <= 0) return undefined;
    return Math.floor(numeric);
  };

  const buildRateLimitPayload = () => {
    const payload: NonNullable<AppAccessPolicy["rate_limit_json"]> = {
      per_minute: parseNumber(rateLimits.per_minute),
      per_hour: parseNumber(rateLimits.per_hour),
      per_day: parseNumber(rateLimits.per_day),
    };
    const hasValues = Object.values(payload).some((value) => value !== undefined);
    return hasValues ? payload : {};
  };

  const parseOrigins = (value: string) => {
    if (!value.trim()) return [];
    const items = value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
    return Array.from(new Set(items));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveMessage(null);
      const updated = await appApi.updateAccessPolicy(appId, {
        access_mode: accessMode,
        rate_limit_json: buildRateLimitPayload(),
        allowed_origins: parseOrigins(allowedOriginsText),
        require_captcha: requireCaptcha,
      });
      setAccessPolicy(updated);
      setSaveMessage("访问策略已保存。");
    } catch (error) {
      console.error("Failed to update access policy:", error);
      setSaveError("保存失败，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!app) return;
    if (!confirm("确认发布该应用吗？")) return;
    try {
      setIsPublishing(true);
      setPublishError(null);
      setPublishMessage(null);
      const updated = await appApi.publish(appId);
      setApp(updated);
      setPublishMessage("发布请求已提交。");
    } catch (error) {
      console.error("Failed to publish app:", error);
      setPublishError("发布失败，请稍后重试。");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = () => {
    setPublishError(null);
    setPublishMessage("草稿已保存，未对外发布。");
  };

  const handleCopyLink = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const statusMeta = statusConfig[app?.status || "draft"] || statusConfig.draft;
  const StatusIcon = statusMeta.icon;

  if (isLoading && !app) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
        </div>
      </PageContainer>
    );
  }

  if (!app) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <p className="text-foreground-muted">应用不存在或已删除</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageWithSidebar
      sidebarWidth="narrow"
      sidebarTitle={app?.name || "应用"}
      sidebar={<AppNav workspaceId={workspaceId} appId={appId} activeTab="publish" />}
    >
      <PageContainer>
        <PageHeader
          title="发布设置"
          eyebrow={app?.name}
          description="配置访问策略、匿名访问与限流规则，确保发布安全可控。"
          backHref={`/workspaces/${workspaceId}/apps/${appId}`}
          backLabel="返回应用概览"
          icon={<SlidersHorizontal className="w-4 h-4" />}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn("w-4 h-4 mr-1.5", isRefreshing && "animate-spin")} />
                刷新
              </Button>
              <Button size="sm" asChild>
                <Link href={`/workspaces/${workspaceId}/apps/${appId}/builder`}>
                  进入构建
                </Link>
              </Button>
              <PermissionGate permissions={permissions} required={["app_publish"]}>
                <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  发布应用
                </Button>
              </PermissionGate>
            </div>
          }
        />

        {loadError && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            {loadError}
          </div>
        )}

        <SettingsSection
          title="访问策略"
          description="设置访问范围与匿名模式，决定谁可以访问应用"
          footer={
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-foreground-muted">
                {!canPublish ? "当前角色无发布权限，仅可查看设置。" : "保存后会立即生效。"}
              </div>
              <PermissionGate permissions={permissions} required={["app_publish"]}>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  保存设置
                </Button>
              </PermissionGate>
            </div>
          }
        >
          {(saveMessage || saveError) && (
            <div
              className={cn(
                "mb-3 rounded-md border px-3 py-2 text-[12px]",
                saveError
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-brand-200/60 bg-brand-200/20 text-brand-500"
              )}
            >
              {saveError || saveMessage}
            </div>
          )}

          <div className="rounded-md border border-border bg-surface-75 p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-surface-200 border border-border flex items-center justify-center">
                <AccessIcon className="w-4 h-4 text-foreground-light" />
              </div>
              <div>
                <div className="text-[13px] font-medium text-foreground">{accessMeta.label}</div>
                <div className="text-[11px] text-foreground-muted">{accessMeta.description}</div>
              </div>
            </div>
          </div>

          <FormRow label="访问模式" description="私有/需登录/公开访问">
            <Select
              value={accessMode}
              onValueChange={(value) => handleAccessModeChange(value as AppAccessPolicy["access_mode"])}
              disabled={!canPublish}
            >
              <SelectTrigger className="h-9 bg-surface-75 border-border" disabled={!canPublish}>
                <SelectValue placeholder="选择访问模式" />
              </SelectTrigger>
              <SelectContent className="bg-surface-100 border-border">
                <SelectItem value="private">
                  <span className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    私有访问
                  </span>
                </SelectItem>
                <SelectItem value="public_auth">
                  <span className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    公开访问（需登录）
                  </span>
                </SelectItem>
                <SelectItem value="public_anonymous">
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" />
                    公开访问（匿名）
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </FormRow>

          <ToggleRow
            label="允许匿名访问"
            description="开启后将允许未登录用户直接访问"
            checked={isAnonymousAccess}
            onCheckedChange={handleAnonymousToggle}
            disabled={!canPublish || accessMode === "private"}
          />
        </SettingsSection>

        <div className="mt-6 space-y-6">
          <SettingsSection
            title="限流与访问防护"
            description="限制访问频率与来源，降低滥用风险"
          >
            <FormRow
              label="速率限制"
              description="留空表示不限制；建议公开访问时至少设置一档。"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(rateLimitLabels) as RateLimitKey[]).map((key) => (
                  <div key={key} className="space-y-1.5">
                    <Input
                      type="number"
                      min={1}
                      placeholder="例如 60"
                      value={rateLimits[key]}
                      onChange={(event) => handleRateLimitChange(key, event.target.value)}
                      disabled={!canPublish}
                    />
                    <div className="text-[11px] text-foreground-muted">{rateLimitLabels[key]}</div>
                  </div>
                ))}
              </div>
            </FormRow>

            <FormRow
              label="允许来源"
              description="限制可调用的域名来源，支持逗号或换行分隔。"
            >
              <Textarea
                placeholder="https://example.com, https://app.example.com"
                value={allowedOriginsText}
                onChange={(event) => {
                  resetSaveNotice();
                  setAllowedOriginsText(event.target.value);
                }}
                disabled={!canPublish}
              />
            </FormRow>

            <ToggleRow
              label="验证码防护"
              description="开启后，匿名访问将要求验证码以减少滥用。"
              checked={requireCaptcha}
              onCheckedChange={(checked) => {
                resetSaveNotice();
                setRequireCaptcha(checked);
              }}
              disabled={!canPublish || accessMode === "private"}
            />
          </SettingsSection>

          <SettingsSection
            title="SEO 与分享"
            description="对外访问页的标题、描述与分享链接"
            compact
          >
            <FormRow label="SEO 标题" description="用于搜索与分享展示">
              <Input
                placeholder="请输入标题"
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                disabled={!canPublish}
              />
            </FormRow>
            <FormRow label="SEO 描述" description="简要介绍应用价值">
              <Textarea
                placeholder="请输入描述"
                value={seoDesc}
                onChange={(event) => setSeoDesc(event.target.value)}
                className="min-h-[80px]"
                disabled={!canPublish}
              />
            </FormRow>
            <FormRow label="分享链接" description="对外公开访问入口">
              <div className="flex items-center gap-2">
                <Input value={shareLink} readOnly />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(shareLink)}
                  disabled={!shareLink}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {linkCopied ? "已复制" : "复制"}
                </Button>
              </div>
            </FormRow>
            <div className="mt-4 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSeoSaved(true);
                  setTimeout(() => setSeoSaved(false), 2000);
                }}
                disabled={!canPublish}
              >
                保存 SEO
              </Button>
              {seoSaved && (
                <span className="text-[11px] text-brand-500">已保存 SEO 配置</span>
              )}
            </div>
          </SettingsSection>

          <SettingsSection
            title="域名绑定摘要"
            description="查看当前域名绑定、验证进度与续期提醒"
            compact
          >
            {domainsError && (
              <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                {domainsError}
              </div>
            )}

            {!hasDomains ? (
              <div className="rounded-md border border-border bg-surface-75 p-4">
                <div className="text-[12px] text-foreground-light">尚未绑定自定义域名。</div>
                <div className="mt-2 text-[11px] text-foreground-muted">
                  绑定域名后可自定义访问入口并提升品牌可信度。
                </div>
                <div className="mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/workspaces/${workspaceId}/apps/${appId}/domains`}>
                      去绑定域名
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-border bg-surface-75 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      当前域名
                    </div>
                    <div className="mt-2 text-[12px] text-foreground">{primaryDomain}</div>
                  </div>
                  <div className="rounded-md border border-border bg-surface-75 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      验证状态
                    </div>
                    <div className="mt-2">
                      <Badge
                        variant="secondary"
                        className={cn("gap-1 text-[10px]", domainStatusMeta.bgColor, domainStatusMeta.color)}
                      >
                        {domainStatusMeta.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-surface-75 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      续期提醒
                    </div>
                    <div className="mt-2 text-[12px] text-foreground">{expiryLabel}</div>
                    <div className={cn("mt-1 text-[11px]", daysToExpiry !== null && daysToExpiry <= 30 ? "text-warning" : "text-foreground-muted")}>
                      {expiryReminder}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/workspaces/${workspaceId}/apps/${appId}/domains`}>
                      管理域名
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </SettingsSection>

          <SettingsSection
            title="发布状态"
            description="查看当前发布状态与访问入口"
            compact
          >
            {(publishMessage || publishError) && (
              <div
                className={cn(
                  "mb-3 rounded-md border px-3 py-2 text-[12px]",
                  publishError
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-brand-200/60 bg-brand-200/20 text-brand-500"
                )}
              >
                {publishError || publishMessage}
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr]">
              <div className="rounded-md border border-border bg-surface-75 p-4">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={cn("gap-1 text-[10px]", statusMeta.bgColor, statusMeta.color)}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusMeta.label}
                  </Badge>
                  <div className="text-[11px] text-foreground-muted">
                    {app?.published_at ? `发布于 ${new Date(app.published_at).toLocaleString("zh-CN")}` : "尚未发布"}
                  </div>
                </div>
                <div className="mt-3 text-[12px] text-foreground-light">
                  发布后即可对外开放访问入口，建议完成访问策略配置后再发布。
                </div>
              </div>

              <div className="rounded-md border border-border bg-surface-75 p-4">
                <div className="text-[11px] text-foreground-muted uppercase tracking-wider">
                  访问入口
                </div>
                <div className="mt-2">
                  {runtimeEntryUrl ? (
                    <Link
                      href={runtimeEntryUrl}
                      className="inline-flex items-center gap-1 text-[12px] text-brand-500 hover:text-brand-600"
                    >
                      打开运行页
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-[12px] text-foreground-muted">请先配置 workspace/app slug</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <PermissionGate permissions={permissions} required={["app_publish"]}>
                <Button onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  {app?.status === "published" ? "重新发布" : "发布应用"}
                </Button>
              </PermissionGate>
              <Button variant="outline" asChild>
                <Link href={`/workspaces/${workspaceId}/apps/${appId}/domains`}>
                  管理域名
                </Link>
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection
            title="发布动作"
            description="发布、保存草稿或取消操作"
            compact
          >
            <div className="flex flex-wrap items-center gap-2">
              <PermissionGate permissions={permissions} required={["app_publish"]}>
                <Button onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  {app?.status === "published" ? "重新发布" : "发布"}
                </Button>
              </PermissionGate>
              <PermissionGate permissions={permissions} required={["app_edit"]}>
                <Button variant="outline" onClick={handleSaveDraft} disabled={!canEdit}>
                  保存草稿
                </Button>
              </PermissionGate>
              <Button variant="ghost" asChild>
                <Link href={`/workspaces/${workspaceId}/apps/${appId}`}>取消</Link>
              </Button>
            </div>
            <div className="mt-2 text-[11px] text-foreground-muted">
              保存草稿不会对外发布，仅保留当前配置与访问策略设置。
            </div>
          </SettingsSection>
        </div>
      </PageContainer>
    </PageWithSidebar>
  );
}
