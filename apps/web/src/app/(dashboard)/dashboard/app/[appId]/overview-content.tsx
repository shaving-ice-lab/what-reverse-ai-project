"use client";

/**
 * App Details Page - Supabase Style
 * Overview / Status / Metrics Summary
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
} from "@/lib/api/workspace";
import { workspaceApi, type Workspace } from "@/lib/api/workspace";
import { buildWorkspacePermissions, resolveWorkspaceRoleFromUser } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";

// StatusConfig
const statusConfig: Record<
 string,
 { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
 draft: { label: "Draft", color: "text-foreground-muted", bgColor: "bg-surface-200", icon: Clock },
 published: { label: "Published", color: "text-brand-500", bgColor: "bg-brand-200", icon: CheckCircle2 },
  deprecated: { label: "Deprecated", color: "text-warning", bgColor: "bg-warning-200", icon: AlertCircle },
 archived: { label: "Archived", color: "text-foreground-muted", bgColor: "bg-surface-200", icon: Archive },
};

const accessModeConfig: Record<
 string,
 { label: string; description: string; icon: React.ElementType }
> = {
  private: { label: "Private Access", description: "Only workspace members can access", icon: Lock },
  public_auth: { label: "Public Access (Sign-in Required)", description: "Signed-in users can access", icon: Users },
  public_anonymous: { label: "Public Access (Anonymous)", description: "Anyone can access", icon: Globe },
};

// EdgeNavigation
function AppNav({
 appId,
 activeTab,
}: {
 appId: string;
 activeTab: string;
}) {
 const navItems = [
 { id: "overview", label: "Overview", href: `/dashboard/app/${appId}` },
 { id: "builder", label: "Build", href: `/dashboard/app/${appId}/builder` },
 { id: "publish", label: "Publish Settings", href: `/dashboard/app/${appId}/publish` },
 { id: "versions", label: "Version History", href: `/dashboard/app/${appId}/versions` },
 { id: "monitoring", label: "Monitor", href: `/dashboard/app/${appId}/monitoring` },
 { id: "domains", label: "Domain", href: `/dashboard/app/${appId}/domains` },
 ];

 return (
 <SidebarNavGroup title="App">
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

type AppOverviewPageProps = {
 workspaceId: string;
 appId: string;
};

export function AppOverviewPageContent({ workspaceId, appId }: AppOverviewPageProps) {
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
 setLoadError("Load failed. Please try again later.");
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
 const domainSummary = domainCount ? `${domainCount} Domain` : "Unbound";
 const domainHint = primaryDomain ? `Primary Domain: ${primaryDomain}` : "Bind a custom domain to enhance brand recognition";
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
 permissions={permissions}
 required={["workspace_edit"]}
 backHref="/dashboard/apps"
 >
 <PageWithSidebar
 sidebarWidth="narrow"
 sidebarTitle={app?.name || "App"}
 sidebar={<AppNav appId={appId} activeTab="overview" />}
 >
 <PageContainer>
 <PageHeader
 title="App Overview"
 eyebrow={workspace?.name}
 description={app?.description || "View app basic information, status summary, and run metrics."}
 backHref="/dashboard/apps"
 backLabel="Back to App List"
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
 Refresh
 </Button>
 <Button size="sm" asChild>
 <Link href={`/dashboard/app/${appId}/builder`}>
 <Rocket className="w-4 h-4 mr-1.5" />
 Open Builder
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

 <SettingsSection title="Overview" description="Basic app information and status summary" compact>
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
 {app?.description || "No description"}
 </div>
 </div>
 </div>

 <div className="grid sm:grid-cols-2 gap-3">
 <InfoItem label="App ID" value={app?.id} mono />
 <InfoItem label="Owner" value={app?.owner_user_id || "-"} mono />
 <InfoItem label="Created At" value={formatDateTime(app?.created_at)} />
 <InfoItem label="Last Updated" value={formatDateTime(app?.updated_at)} />
 <InfoItem label="Workspace" value={workspace?.name || "-"} />
 <InfoItem label="Subscription Plan" value={workspace?.plan || "standard"} />
 </div>
 </div>

 <div className="space-y-4">
 <div className="grid gap-3">
 <SummaryCard
 label="Current Status"
 value={
 <Badge
 variant="secondary"
 className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
 >
 <StatusIcon className="w-3 h-3" />
 {status.label}
 </Badge>
 }
 description={app?.published_at ? `Published at ${formatDateTime(app.published_at)}` : "Unpublished"}
 icon={<StatusIcon className="w-3.5 h-3.5" />}
 />
 <SummaryCard
 label="Access"
 value={access.label}
 description={access.description}
 icon={<AccessIcon className="w-3.5 h-3.5" />}
 />
 <SummaryCard
 label="Current Version"
 value={app?.current_version?.version || "v0.0.0"}
 description={app?.current_version?.changelog || "No Version Description"}
 icon={<BarChart3 className="w-3.5 h-3.5" />}
 />
 <SummaryCard
 label="Recent Run"
 value={lastRunLabel}
 description={latestExecutionAt ? "From latest execution": "No execution records"}
 icon={<Clock className="w-3.5 h-3.5" />}
 />
 <SummaryCard
 label="Run Entry"
 value={
 runtimeEntryUrl ? (
 <Link
 href={runtimeEntryUrl}
 className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-600"
 >
 Open Runtime Page
 <ExternalLink className="w-3 h-3" />
 </Link>
 ) : (
 "Pending Configuration"
 )
 }
 description="Run entry based on workspace / app slug"
 icon={<Globe className="w-3.5 h-3.5" />}
 />
 </div>

 <div className="rounded-md bg-surface-75 border border-border p-4">
 <div className="text-[11px] text-foreground-muted uppercase tracking-wider">
 Quick Actions
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 <Button variant="outline" size="sm" asChild>
 <Link href={`/dashboard/app/${appId}/builder`}>
 <Edit3 className="w-3.5 h-3.5 mr-1.5" />
 Edit App
 </Link>
 </Button>
 <Button variant="outline" size="sm" asChild>
 <Link href={`/dashboard/app/${appId}/monitoring`}>
 <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
 View Run Monitor
 </Link>
 </Button>
 <Button variant="outline" size="sm" asChild>
 <Link href={`/dashboard/app/${appId}/publish`}>
 <Rocket className="w-3.5 h-3.5 mr-1.5" />
 Publish
 </Link>
 </Button>
 <Button variant="outline" size="sm" asChild>
 <Link href={`/dashboard/app/${appId}/domains`}>
 <Globe className="w-3.5 h-3.5 mr-1.5" />
 Bind Domain
 </Link>
 </Button>
 <Button variant="outline" size="sm" asChild>
 <Link href={`/dashboard/app/${appId}/versions`}>
 <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
 Version History
 </Link>
 </Button>
 {runtimeEntryUrl && (
 <Button variant="outline" size="sm" asChild>
 <Link href={runtimeEntryUrl}>
 <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
 Access Runtime Page
 </Link>
 </Button>
 )}
 </div>
 <div className="mt-2 text-[11px] text-foreground-muted">
 After updating the workflow in the Builder page, you can view run monitoring and external access points here.
 </div>
 </div>
 </div>
 </div>
 </SettingsSection>

 <SettingsSection
title="Access Policy and Domain"
            description="Configure access and rate limiting policies for external access."
 compact
 >
 <div className="grid md:grid-cols-3 gap-4">
 <SummaryCard
 label="Access Policy"
 value={access.label}
 description={access.description}
 icon={<AccessIcon className="w-3.5 h-3.5" />}
 />
 <SummaryCard
label="Anonymous Access"
                value={anonymousEnabled ? "Enabled": "Not Enabled"}
                description={anonymousEnabled ? "No sign-in needed to access": "Sign-in required, or only members can access"}
 icon={<Users className="w-3.5 h-3.5" />}
 />
 <SummaryCard
 label="Bound Domains"
 value={domainSummary}
 description={domainHint}
 icon={<Globe className="w-3.5 h-3.5" />}
 />
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 <Button variant="outline" size="sm" asChild>
 <Link href={`/dashboard/app/${appId}/publish`}>
 <Rocket className="w-3.5 h-3.5 mr-1.5" />
 Access Policy Settings
 </Link>
 </Button>
 <Button variant="outline" size="sm" asChild>
 <Link href={`/dashboard/app/${appId}/domains`}>
 <Globe className="w-3.5 h-3.5 mr-1.5" />
 Manage Domains
 </Link>
 </Button>
 </div>
 </SettingsSection>

 <SettingsSection
title="Version and Changes"
            description="Current version, change log, and rollback entry."
 compact
 >
 <div className="grid md:grid-cols-3 gap-3">
 <InfoItem label="Current Version" value={versionLabel} mono />
 <InfoItem
 label="Last Published"
 value={app?.published_at ? formatDateTime(app.published_at) : "Unpublished"}
 />
 <InfoItem
 label="Version Created"
 value={app?.current_version?.created_at?.slice(0, 10) || "No Record"}
 />
 </div>
 <div className="mt-3 rounded-md border border-border bg-surface-75 px-4 py-3 text-[11px] text-foreground-muted">
 {app?.current_version?.changelog || "No version change description. We recommend adding a change log when publishing."}
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 <Button variant="outline" size="sm" asChild>
 <Link href={`/dashboard/app/${appId}/versions`}>
 <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
 View Version History
 </Link>
 </Button>
 <Button variant="outline" size="sm" asChild>
 <Link href={`/dashboard/app/${appId}/builder`}>
 <Rocket className="w-3.5 h-3.5 mr-1.5" />
 Continue Building
 </Link>
 </Button>
 </div>
 </SettingsSection>

 <SettingsSection
title="Usage and Run Metrics"
            description="Last 7 days execution statistics and resource consumption."
 compact
 >
 <div className="grid md:grid-cols-4 gap-3 mb-4">
 <InfoItem label="Requests" value={String(runCount)} />
 <InfoItem label="Token Usage" value={tokenUsageLabel} />
 <InfoItem label="Error Rate" value={errorRateLabel} />
 <InfoItem label="Response Time" value={avgDurationLabel} />
 </div>
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <MetricCard
 label="Requests"
 value={metrics?.total_executions ?? 0}
 icon={<Zap className="w-4 h-4" />}
 />
 <MetricCard
 label="Error Rate"
 value={metrics ? `${(errorRate * 100).toFixed(1)}%` : "0%"}
 icon={<AlertCircle className="w-4 h-4" />}
 highlight={metrics?.total_executions ? errorRate > 0.1 : false}
 />
 <MetricCard
 label="Average Response Time"
 value={avgDurationLabel}
 icon={<Timer className="w-4 h-4" />}
 />
 <MetricCard
 label="Token Consumption"
 value={tokenUsageLabel}
 icon={<ActivityIcon />}
 />
 </div>
 {!metrics && (
 <div className="mt-3 text-[11px] text-foreground-muted">
 Metrics unavailable. Defaults shown as 0. View real-time data on the Run Monitor page.
 </div>
 )}
 </SettingsSection>
 </PageContainer>
 </PageWithSidebar>
 </AppAccessGate>
 );
}

export default function AppOverviewPage() {
 const params = useParams();
 const workspaceId = Array.isArray(params?.workspaceId)
 ? params.workspaceId[0]
 : (params?.workspaceId as string | undefined);
 const appId = Array.isArray(params?.appId) ? params.appId[0] : (params?.appId as string | undefined);

 if (!workspaceId || !appId) {
 return null;
 }

 return <AppOverviewPageContent workspaceId={workspaceId} appId={appId} />;
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
