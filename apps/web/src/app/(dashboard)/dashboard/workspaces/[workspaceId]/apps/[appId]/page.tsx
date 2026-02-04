"use client";

/**
 * App 详情页 - Supabase 风格
 * 概览 / 状态 / 指标摘要
 */

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Archive,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  RefreshCw,
  Rocket,
  Timer,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  PageWithSidebar,
  SettingsSection,
  SidebarNavGroup,
  SidebarNavItem,
} from "@/components/dashboard/page-layout";
import { AppAccessGate } from "@/components/permissions/app-access-gate";
import {
  appApi,
  type App,
  type AppAccessPolicy,
  type AppMetrics,
  type AppDomain,
} from "@/lib/api/app";
import { workspaceApi, type Workspace } from "@/lib/api/workspace";
import { buildWorkspacePermissions, resolveWorkspaceRoleFromUser } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";

// 状态配置
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

// 侧边导航
function AppNav({
  workspaceId,
  appId,
  activeTab,
}: {
  workspaceId: string;
  appId: string;
  activeTab: string;
}) {
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

export default function AppOverviewPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const appId = params.appId as string;
  const { user } = useAuthStore();
  const workspaceRole = resolveWorkspaceRoleFromUser(user?.role);
  const permissions = buildWorkspacePermissions(workspaceRole);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [app, setApp] = useState<App | null>(null);
  const [metrics, setMetrics] = useState<AppMetrics | null>(null);
  const [accessPolicy, setAccessPolicy] = useState<AppAccessPolicy | null>(null);
  const [domains, setDomains] = useState<AppDomain[]>([]);
  const [latestExecutionAt, setLatestExecutionAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [workspaceId, appId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [
        workspaceData,
        appData,
        metricsData,
        accessPolicyData,
        domainsData,
        executionsData,
      ] = await Promise.all([
        workspaceApi.get(workspaceId),
        appApi.get(appId),
        appApi.getMetrics(appId, 7).catch(() => null),
        appApi.getAccessPolicy(appId).catch(() => null),
        appApi.getDomains(appId).catch(() => []),
        appApi
          .getExecutions(appId, { page: 1, page_size: 1 })
          .catch(() => ({ items: [], total: 0 })),
      ]);
      setWorkspace(workspaceData);
      setApp(appData);
      setMetrics(metricsData);
      setAccessPolicy(accessPolicyData);
      setDomains(domainsData);
      setLatestExecutionAt(executionsData.items[0]?.created_at || null);
    } catch (error) {
      console.error("Failed to load app overview:", error);
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

  const getStatusConfig = (status?: string) => {
    if (!status) return statusConfig.draft;
    return statusConfig[status] || statusConfig.draft;
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (isLoading && !app) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
        </div>
      </PageContainer>
    );
  }

  const status = getStatusConfig(app?.status);
  const StatusIcon = status.icon;
  const accessMode =
    accessPolicy?.access_mode || app?.access_policy?.access_mode || "private";
  const access = accessModeConfig[accessMode] || accessModeConfig.private;
  const AccessIcon = access.icon;
  const runtimeEntryUrl =
    workspace?.slug && app?.slug ? `/runtime/${workspace.slug}/${app.slug}` : null;
  const domainCount = domains.length;
  const primaryDomain = domains[0]?.domain || "";
  const domainSummary = domainCount ? `${domainCount} 个域名` : "未绑定";
  const domainHint = primaryDomain ? `主域名：${primaryDomain}` : "绑定自定义域名提升品牌识别";
  const versionLabel = app?.current_version?.version || "v0.0.0";
  const runCount = metrics?.total_executions ?? 0;
  const tokenUsage = metrics?.total_tokens ?? 0;
  const tokenUsageLabel = `${(tokenUsage / 1000).toFixed(1)}K`;
  const lastRunLabel = latestExecutionAt ? formatDateTime(latestExecutionAt) : "-";
  const anonymousEnabled = accessMode === "public_anonymous";
  const errorRate =
    metrics && metrics.total_executions
      ? metrics.failure_count / metrics.total_executions
      : 0;
  const errorRateLabel = metrics ? `${(errorRate * 100).toFixed(1)}%` : "-";
  const avgDurationLabel = formatDuration(metrics?.avg_duration_ms);

  return (
    <AppAccessGate
      app={app}
      workspaceId={workspaceId}
      permissions={permissions}
      required={["app_edit"]}
      backHref={`/workspaces/${workspaceId}/apps`}
    >
      <PageWithSidebar
        sidebarWidth="narrow"
        sidebarTitle={app?.name || "应用"}
        sidebar={<AppNav workspaceId={workspaceId} appId={appId} activeTab="overview" />}
      >
        <PageContainer>
        <PageHeader
          title="应用概览"
          eyebrow={workspace?.name}
          description={app?.description || "查看应用基础信息、状态摘要与运行指标。"}
          backHref={`/workspaces/${workspaceId}/apps`}
          backLabel="返回应用列表"
          badge={
            app ? (
              <Badge
                variant="secondary"
                className={cn("gap-1", status.bgColor, status.color)}
              >
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </Badge>
            ) : null
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("w-4 h-4 mr-1.5", isRefreshing && "animate-spin")} />
                刷新
              </Button>
              <Button size="sm" asChild>
                <Link href={`/workspaces/${workspaceId}/apps/${appId}/builder`}>
                  <Rocket className="w-4 h-4 mr-1.5" />
                  进入构建
                </Link>
              </Button>
            </div>
          }
        />

        {loadError && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            {loadError}
          </div>
        )}

        <SettingsSection title="概览" description="应用基础信息与状态摘要" compact>
          <div className="grid lg:grid-cols-[1.25fr_0.9fr] gap-4">
            <div className="rounded-md bg-surface-75 border border-border p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-md bg-surface-200 border border-border flex items-center justify-center text-foreground-light">
                  {app?.icon ? <span className="text-xl">{app.icon}</span> : <Bot className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-foreground">{app?.name || "-"}</div>
                  <div className="text-[12px] text-foreground-muted">
                    /{workspace?.slug || "-"}/{app?.slug || "-"}
                  </div>
                  <div className="text-[11px] text-foreground-light mt-2">
                    {app?.description || "暂无描述"}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <InfoItem label="应用 ID" value={app?.id} mono />
                <InfoItem label="负责人" value={app?.owner_user_id || "-"} mono />
                <InfoItem label="创建时间" value={formatDateTime(app?.created_at)} />
                <InfoItem label="最近更新" value={formatDateTime(app?.updated_at)} />
                <InfoItem label="Workspace" value={workspace?.name || "-"} />
                <InfoItem label="订阅方案" value={workspace?.plan || "standard"} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3">
                <SummaryCard
                  label="当前状态"
                  value={
                    <Badge
                      variant="secondary"
                      className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                  }
                  description={app?.published_at ? `发布于 ${formatDateTime(app.published_at)}` : "尚未发布"}
                  icon={<StatusIcon className="w-3.5 h-3.5" />}
                />
                <SummaryCard
                  label="访问模式"
                  value={access.label}
                  description={access.description}
                  icon={<AccessIcon className="w-3.5 h-3.5" />}
                />
                <SummaryCard
                  label="当前版本"
                  value={app?.current_version?.version || "v0.0.0"}
                  description={app?.current_version?.changelog || "暂无版本说明"}
                  icon={<BarChart3 className="w-3.5 h-3.5" />}
                />
                <SummaryCard
                  label="最近运行"
                  value={lastRunLabel}
                  description={latestExecutionAt ? "来自最近一次执行" : "暂无执行记录"}
                  icon={<Clock className="w-3.5 h-3.5" />}
                />
                <SummaryCard
                  label="运行入口"
                  value={
                    runtimeEntryUrl ? (
                      <Link
                        href={runtimeEntryUrl}
                        className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-600"
                      >
                        打开运行页
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      "待配置"
                    )
                  }
                  description="运行入口基于 workspace / app slug"
                  icon={<Globe className="w-3.5 h-3.5" />}
                />
              </div>

              <div className="rounded-md bg-surface-75 border border-border p-4">
                <div className="text-[11px] text-foreground-muted uppercase tracking-wider">
                  快捷操作
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/workspaces/${workspaceId}/apps/${appId}/builder`}>
                      <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                      编辑应用
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/workspaces/${workspaceId}/apps/${appId}/monitoring`}>
                      <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                      查看运行监控
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/workspaces/${workspaceId}/apps/${appId}/publish`}>
                      <Rocket className="w-3.5 h-3.5 mr-1.5" />
                      发布
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/workspaces/${workspaceId}/apps/${appId}/domains`}>
                      <Globe className="w-3.5 h-3.5 mr-1.5" />
                      绑定域名
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/workspaces/${workspaceId}/apps/${appId}/versions`}>
                      <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                      版本历史
                    </Link>
                  </Button>
                  {runtimeEntryUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={runtimeEntryUrl}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        访问运行页
                      </Link>
                    </Button>
                  )}
                </div>
                <div className="mt-2 text-[11px] text-foreground-muted">
                  使用构建页更新工作流后，可在此查看运行监控与对外访问入口。
                </div>
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="访问策略与域名"
          description="配置访问模式、限流策略与对外访问入口"
          compact
        >
          <div className="grid md:grid-cols-3 gap-4">
            <SummaryCard
              label="访问策略"
              value={access.label}
              description={access.description}
              icon={<AccessIcon className="w-3.5 h-3.5" />}
            />
            <SummaryCard
              label="匿名访问"
              value={anonymousEnabled ? "已开启" : "未开启"}
              description={anonymousEnabled ? "无需登录即可访问" : "需要登录或仅成员可访问"}
              icon={<Users className="w-3.5 h-3.5" />}
            />
            <SummaryCard
              label="已绑定域名"
              value={domainSummary}
              description={domainHint}
              icon={<Globe className="w-3.5 h-3.5" />}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/workspaces/${workspaceId}/apps/${appId}/publish`}>
                <Rocket className="w-3.5 h-3.5 mr-1.5" />
                访问策略设置
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/workspaces/${workspaceId}/apps/${appId}/domains`}>
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                管理域名
              </Link>
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection
          title="版本与变更"
          description="当前版本、变更记录与回滚入口"
          compact
        >
          <div className="grid md:grid-cols-3 gap-3">
            <InfoItem label="当前版本" value={versionLabel} mono />
            <InfoItem
              label="最近发布"
              value={app?.published_at ? formatDateTime(app.published_at) : "未发布"}
            />
            <InfoItem
              label="版本创建"
              value={app?.current_version?.created_at?.slice(0, 10) || "暂无记录"}
            />
          </div>
          <div className="mt-3 rounded-md border border-border bg-surface-75 px-4 py-3 text-[11px] text-foreground-muted">
            {app?.current_version?.changelog || "暂无版本变更说明，建议在发布时补充变更记录。"}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/workspaces/${workspaceId}/apps/${appId}/versions`}>
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                查看版本历史
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/workspaces/${workspaceId}/apps/${appId}/builder`}>
                <Rocket className="w-3.5 h-3.5 mr-1.5" />
                继续构建
              </Link>
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection
          title="用量与运行指标"
          description="最近 7 天执行统计、性能与资源消耗"
          compact
        >
          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <InfoItem label="请求数" value={String(runCount)} />
            <InfoItem label="Token 用量" value={tokenUsageLabel} />
            <InfoItem label="错误率" value={errorRateLabel} />
            <InfoItem label="响应时间" value={avgDurationLabel} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="请求数"
              value={metrics?.total_executions ?? 0}
              icon={<Zap className="w-4 h-4" />}
            />
            <MetricCard
              label="错误率"
              value={metrics ? `${(errorRate * 100).toFixed(1)}%` : "0%"}
              icon={<AlertCircle className="w-4 h-4" />}
              highlight={metrics?.total_executions ? errorRate > 0.1 : false}
            />
            <MetricCard
              label="平均响应时间"
              value={avgDurationLabel}
              icon={<Timer className="w-4 h-4" />}
            />
            <MetricCard
              label="Token 消耗"
              value={tokenUsageLabel}
              icon={<ActivityIcon />}
            />
          </div>
          {!metrics && (
            <div className="mt-3 text-[11px] text-foreground-muted">
              指标暂不可用，默认展示为 0，可在运行监控页查看实时数据。
            </div>
          )}
        </SettingsSection>
        </PageContainer>
      </PageWithSidebar>
    </AppAccessGate>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  description?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-md bg-surface-75 border border-border p-4">
      <div className="flex items-center gap-2 text-[11px] text-foreground-muted uppercase tracking-wider">
        <span className="text-foreground-muted">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-[13px] font-medium text-foreground">{value}</div>
      {description && (
        <div className="mt-2 text-[11px] text-foreground-muted">{description}</div>
      )}
    </div>
  );
}

function InfoItem({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-100 px-3 py-2">
      <div className="text-[10px] text-foreground-muted uppercase tracking-wider">{label}</div>
      <div className={cn("mt-1 text-[12px] text-foreground", mono && "font-mono")}>
        {value || "-"}
      </div>
    </div>
  );
}

function ActivityIcon() {
  return <Zap className="w-4 h-4" />;
}

function MetricCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="p-4 rounded-md bg-surface-75 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-foreground-muted">{icon}</div>
        <span className="text-[11px] text-foreground-light">{label}</span>
      </div>
      <div className={cn("text-xl font-semibold", highlight ? "text-warning" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}
