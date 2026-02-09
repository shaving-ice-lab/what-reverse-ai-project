"use client";

/**
 * App Run Monitor Page - Supabase Style
 * RunLogsList, MetricsOverview, StatusFilter
 */

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
 Activity,
 Clock,
 CheckCircle2,
 XCircle,
 AlertCircle,
 Loader2,
 RefreshCw,
 ChevronLeft,
 ChevronRight,
 Search,
 Filter,
 Play,
 Pause,
 BarChart3,
 Zap,
 Bot,
 TrendingUp,
 TrendingDown,
 Calendar,
 Timer,
 ShieldCheck,
 ListChecks,
 ClipboardCheck,
 Users,
 Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
 PageContainer,
 PageHeader,
 PageWithSidebar,
 SettingsSection,
 SidebarNavItem,
 SidebarNavGroup,
} from "@/components/dashboard/page-layout";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 appApi,
 type App,
 type AppExecution,
 type AppMetrics,
} from "@/lib/api/workspace";
import { workspaceApi, type Workspace } from "@/lib/api/workspace";
import { AppAccessGate } from "@/components/permissions/app-access-gate";
import { buildWorkspacePermissions, resolveWorkspaceRoleFromUser } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";
import {
 regressionTestCases,
 reviewSamplingStrategy,
 type RegressionTestCase,
} from "@/lib/mock-data";

// ExecuteStatusConfig
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
 pending: { label: "Pending", color: "text-foreground-muted", bgColor: "bg-surface-200", icon: Clock },
 running: { label: "Run", color: "text-brand-500", bgColor: "bg-brand-200", icon: Loader2 },
 completed: { label: "Completed", color: "text-brand-500", bgColor: "bg-brand-200", icon: CheckCircle2 },
 failed: { label: "Failed", color: "text-destructive", bgColor: "bg-destructive-200", icon: XCircle },
 cancelled: { label: "Cancelled", color: "text-warning", bgColor: "bg-warning-200", icon: AlertCircle },
};

const timeRangeOptions = [
 { value: "all", label: "All Time" },
 { value: "24h", label: "24 hours" },
 { value: "7d", label: "7 days" },
 { value: "30d", label: "30 days" },
 { value: "90d", label: "90 days" },
];

const nodeTypeOptions = [
 { value: "all", label: "All Node Types" },
 { value: "input", label: "Input Node" },
 { value: "llm", label: "Model Node" },
 { value: "output", label: "Output Node" },
 { value: "webhook", label: "Webhook" },
 { value: "storage", label: "Storage/Database" },
 { value: "workflow", label: "Flow Node" },
];

type QualityMetricStatus = "good" | "warn" | "risk";

type QualityMetric = {
 id: string;
 label: string;
 description: string;
 value: number;
 target: number;
 unit: string;
 trend: "up" | "down";
 status: QualityMetricStatus;
 icon: React.ElementType;
};

const qualityStatusConfig: Record<
 QualityMetricStatus,
 { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
 good: { label: "Meet Target", color: "text-brand-500", bgColor: "bg-brand-200", icon: CheckCircle2 },
 warn: { label: "Warning", color: "text-warning", bgColor: "bg-warning-200", icon: AlertCircle },
 risk: { label: "Needs Optimization", color: "text-destructive", bgColor: "bg-destructive-200", icon: XCircle },
};

const clampScore = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const getQualityStatus = (value: number, target: number): QualityMetricStatus => {
 if (value >= target) return "good";
 if (value >= target - 5) return "warn";
 return "risk";
};

const buildQualityMetrics = (metrics: AppMetrics | null, executions: AppExecution[]) => {
 const totalExecutions = metrics?.total_executions ?? executions.length;
 const hasSamples = totalExecutions > 0;
 const baseScore =
 hasSamples && metrics?.success_rate !== undefined
 ? Math.round(metrics.success_rate * 100)
 : 92;
 const score = (delta: number) => clampScore(baseScore + delta, 60, 99);

 const rows = [
 {
 id: "coherence",
   label: "Content Coherence",
   description: "Context and Structure Completeness",
 value: score(-1),
 target: 90,
 unit: "",
 icon: Bot,
 },
 {
 id: "factual",
   label: "Factual Accuracy",
   description: "Fact Validation and Usage Match",
 value: score(-3),
 target: 88,
 unit: "",
 icon: BarChart3,
 },
 {
 id: "readability",
   label: "Readability Rating",
   description: "Clarity and Format Standards",
 value: score(2),
 target: 92,
 unit: "",
 icon: Activity,
 },
 {
 id: "safety",
   label: "Security Compliance",
   description: "Security Rules and Filter Effectiveness",
 value: score(1),
 target: 95,
 unit: "",
 icon: ShieldCheck,
 },
 ];

 return {
 summary: {
 sampleCount: totalExecutions,
 days: 7,
 hasSamples,
 },
 metrics: rows.map((row) => ({
 ...row,
 status: getQualityStatus(row.value, row.target),
 trend: row.value >= row.target ? "up" : "down",
 })),
 };
};

type RegressionSummary = {
 total: number;
 passed: number;
 failed: number;
 needsReview: number;
 flaky: number;
 passRate: number;
 lastRunAt?: string;
 tagCoverage: number;
};

const regressionStatusConfig: Record<
 RegressionTestCase["status"],
 { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
 pass: { label: "Passed", color: "text-brand-500", bgColor: "bg-brand-200", icon: CheckCircle2 },
 fail: { label: "Failed", color: "text-destructive", bgColor: "bg-destructive-200", icon: XCircle },
 needs_review: { label: "Pending Review", color: "text-warning", bgColor: "bg-warning-200", icon: AlertCircle },
 flaky: { label: "Unstable", color: "text-foreground-muted", bgColor: "bg-surface-200", icon: Clock },
};

const reviewPriorityConfig = {
 high: { label: "High", color: "text-destructive", bgColor: "bg-destructive-200" },
 medium: { label: "Medium", color: "text-warning", bgColor: "bg-warning-200" },
 low: { label: "Low", color: "text-foreground-muted", bgColor: "bg-surface-200" },
} as const;

const reviewStatusConfig = {
 active: { label: "Active", color: "text-brand-500", bgColor: "bg-brand-200" },
 paused: { label: "Paused", color: "text-foreground-muted", bgColor: "bg-surface-200" },
} as const;

const nodeStatusSamples = [
 { id: "input", label: "Input Validation", status: "completed", detail: "Field Validation Normal" },
 { id: "llm", label: "Model Call", status: "running", detail: "Average Response 2.4s" },
 { id: "storage", label: "Storage Write", status: "completed", detail: "Write Success Rate 99.1%" },
 { id: "webhook", label: "Callback/Webhook", status: "pending", detail: "Awaiting External Confirmation" },
];

const summarizeRegressionCases = (cases: RegressionTestCase[]): RegressionSummary => {
 const total = cases.length;
 const passed = cases.filter((item) => item.status === "pass").length;
 const failed = cases.filter((item) => item.status === "fail").length;
 const needsReview = cases.filter((item) => item.status === "needs_review").length;
 const flaky = cases.filter((item) => item.status === "flaky").length;
 const passRate = total > 0 ? passed / total : 0;
 const lastRunAt = cases.reduce<string | undefined>((latest, item) => {
 if (!latest) return item.lastRunAt;
 return new Date(item.lastRunAt).getTime() > new Date(latest).getTime()
 ? item.lastRunAt
 : latest;
 }, undefined);
 const tagCoverage = new Set(cases.flatMap((item) => item.tags)).size;

 return {
 total,
 passed,
 failed,
 needsReview,
 flaky,
 passRate,
 lastRunAt,
 tagCoverage,
 };
};

// EdgeNavigation
function AppNav({ appId, activeTab }: { appId: string; activeTab: string }) {
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

type MonitoringPageProps = {
 workspaceId: string;
 appId: string;
};

export function MonitoringPageContent({ workspaceId, appId }: MonitoringPageProps) {
 const router = useRouter();
 const { user } = useAuthStore();
 const workspaceRole = resolveWorkspaceRoleFromUser(user?.role);
 const permissions = buildWorkspacePermissions(workspaceRole);

 const [workspace, setWorkspace] = useState<Workspace | null>(null);
 const [app, setApp] = useState<App | null>(null);
 const [executions, setExecutions] = useState<AppExecution[]>([]);
 const [metrics, setMetrics] = useState<AppMetrics | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [cancelingExecutionId, setCancelingExecutionId] = useState<string | null>(null);
 const [actionError, setActionError] = useState<string | null>(null);

 // Filter
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [executionQuery, setExecutionQuery] = useState("");
 const [timeRangeFilter, setTimeRangeFilter] = useState("all");
 const [nodeTypeFilter, setNodeTypeFilter] = useState("all");
 const [page, setPage] = useState(1);
 const [total, setTotal] = useState(0);
 const pageSize = 20;

 const [regressionStatusFilter, setRegressionStatusFilter] = useState<string>("all");
 const [regressionQuery, setRegressionQuery] = useState("");

 const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);

 // LoadData
 useEffect(() => {
 loadData();
 }, [workspaceId, appId, statusFilter, page]);

 const loadData = async () => {
 try {
 setIsLoading(true);
 const [ws, appData, executionsData, metricsData] = await Promise.all([
 workspaceApi.get(workspaceId),
 appApi.get(appId),
 appApi.getExecutions(appId, {
 status: statusFilter !== "all" ? statusFilter : undefined,
 page,
 page_size: pageSize,
 }),
 appApi.getMetrics(appId, 7),
 ]);
 setWorkspace(ws);
 setApp(appData);
 setExecutions(executionsData.items);
 setTotal(executionsData.total);
 setMetrics(metricsData);
 } catch (error) {
 console.error("Failed to load data:", error);
 } finally {
 setIsLoading(false);
 }
 };

 // Refresh
 const handleRefresh = async () => {
 setIsRefreshing(true);
 setActionError(null);
 await loadData();
 setIsRefreshing(false);
 };

 const handleCancelExecution = async (executionId: string) => {
 if (!executionId || cancelingExecutionId) return;
 try {
 setActionError(null);
 setCancelingExecutionId(executionId);
 await appApi.cancelExecution(executionId);
 await loadData();
 } catch (error) {
 console.error("Failed to cancel execution:", error);
   setActionError("Failed to cancel execution. Please try again later.");
 } finally {
 setCancelingExecutionId(null);
 }
 };

 // FetchStatusConfig
 const getStatusConfig = (status: string) => {
 return statusConfig[status] || statusConfig.pending;
 };

 // Formattime
 const formatDuration = (ms?: number) => {
 if (!ms) return "-";
 if (ms < 1000) return `${ms}ms`;
 if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
 return `${(ms / 60000).toFixed(1)}m`;
 };

 // FormatTime
 const formatTime = (dateStr?: string) => {
 if (!dateStr) return "-";
 const date = new Date(dateStr);
 const now = new Date();
 const diff = now.getTime() - date.getTime();
 
 if (diff < 60000) return "Just now";
 if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
   if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
   return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
 };

 const parseTimestamp = (value?: string) => {
 if (!value) return 0;
 const parsed = Date.parse(value);
 return Number.isNaN(parsed) ? 0 : parsed;
 };

 const resolveTriggerType = (execution: AppExecution) => {
 if (execution.session_id) return "API";
 return "Manual";
 };

 const resolveNodeType = (execution: AppExecution) => {
 const input = execution.inputs as { node_type?: string } | undefined;
 const output = execution.outputs as { node_type?: string } | undefined;
 return input?.node_type || output?.node_type || "workflow";
 };

 const buildNodeStatusFlow = (execution: AppExecution) => {
 if (execution.status === "completed") {
 return nodeStatusSamples.map((node) => ({ ...node, status: "completed" }));
 }
 if (execution.status === "failed") {
 return nodeStatusSamples.map((node, index) => ({
 ...node,
 status: index === nodeStatusSamples.length - 1 ? "failed" : "completed",
 detail:
 index === nodeStatusSamples.length - 1
       ? execution.error_message || "Failed to Execute Node"
 : node.detail,
 }));
 }
 if (execution.status === "running") {
 return nodeStatusSamples.map((node, index) => ({
 ...node,
 status: index === 1 ? "running" : index < 1 ? "completed" : "pending",
 }));
 }
 return nodeStatusSamples.map((node) => ({ ...node, status: "pending" }));
 };

 const buildExecutionLogs = (execution: AppExecution) => {
   const logs = [
     `Execution ID: ${execution.id}`,
     `Trigger Method: ${resolveTriggerType(execution)}`,
     `Start Time: ${execution.started_at ? formatTime(execution.started_at): "Not Recorded"}`,
     `End Time: ${execution.completed_at ? formatTime(execution.completed_at): "Not Recorded"}`,
   ];
   if (execution.error_message) {
     logs.push(`Error Logs: ${execution.error_message}`);
   }
 return logs;
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

 const qualityOverview = buildQualityMetrics(metrics, executions);
 const qualityDescription = qualityOverview.summary.hasSamples
   ? `Last ${qualityOverview.summary.days} days · ${qualityOverview.summary.sampleCount} executions sampled`
: "No executions sampled yet. Showing defaults.";
 const regressionSummary = summarizeRegressionCases(regressionTestCases);
 const normalizedRegressionQuery = regressionQuery.trim().toLowerCase();
 const filteredRegressionCases = useMemo(() => {
 return regressionTestCases.filter((item) => {
 const matchesStatus =
 regressionStatusFilter === "all" || item.status === regressionStatusFilter;
 const matchesQuery =
 normalizedRegressionQuery.length === 0 ||
 item.title.toLowerCase().includes(normalizedRegressionQuery) ||
 item.prompt.toLowerCase().includes(normalizedRegressionQuery) ||
 item.rubric.toLowerCase().includes(normalizedRegressionQuery) ||
 item.tags.some((tag) => tag.toLowerCase().includes(normalizedRegressionQuery));
 return matchesStatus && matchesQuery;
 });
 }, [regressionStatusFilter, normalizedRegressionQuery]);
 const samplingSlaRange = useMemo(() => {
 const slaValues = reviewSamplingStrategy.rules.map((rule) => rule.slaHours);
 if (slaValues.length === 0) return { min: 0, max: 0 };
 return {
 min: Math.min(...slaValues),
 max: Math.max(...slaValues),
 };
 }, []);
 const activeSamplingRules = useMemo(
 () => reviewSamplingStrategy.rules.filter((rule) => rule.status === "active"),
 []
 );
 const totalPages = Math.ceil(total / pageSize);
 const recentExecutions = executions.slice(0, 4);

 const normalizedExecutionQuery = executionQuery.trim().toLowerCase();
 const filteredExecutions = useMemo(() => {
 return executions.filter((execution) => {
 const matchesQuery =
 normalizedExecutionQuery.length === 0 ||
 execution.id.toLowerCase().includes(normalizedExecutionQuery) ||
 (execution.error_message || "").toLowerCase().includes(normalizedExecutionQuery);
 const matchesNodeType =
 nodeTypeFilter === "all" || resolveNodeType(execution) === nodeTypeFilter;
 const timeRangeDays =
 timeRangeFilter === "24h"
 ? 1
 : timeRangeFilter === "7d"
 ? 7
 : timeRangeFilter === "30d"
 ? 30
 : timeRangeFilter === "90d"
 ? 90
 : null;
 if (timeRangeDays) {
 const createdAt = parseTimestamp(execution.created_at);
 if (!createdAt) return false;
 if (Date.now() - createdAt > timeRangeDays * 86400000) return false;
 }
 return matchesQuery && matchesNodeType;
 });
 }, [executions, normalizedExecutionQuery, nodeTypeFilter, timeRangeFilter]);

 useEffect(() => {
 if (filteredExecutions.length === 0) {
 setActiveExecutionId(null);
 return;
 }
 if (!activeExecutionId || !filteredExecutions.some((item) => item.id === activeExecutionId)) {
 setActiveExecutionId(filteredExecutions[0].id);
 }
 }, [filteredExecutions, activeExecutionId]);

 const activeExecution = filteredExecutions.find((item) => item.id === activeExecutionId) || null;
 const activeNodeFlow = activeExecution ? buildNodeStatusFlow(activeExecution) : [];
 const errorRate =
 metrics && metrics.total_executions
 ? metrics.failure_count / metrics.total_executions
 : executions.length
 ? executions.filter((execution) => execution.status === "failed").length / executions.length
 : 0;

 return (
 <AppAccessGate
 app={app}
 permissions={permissions}
 required={["workspace_view_metrics"]}
 backHref="/dashboard/apps"
 >
 <PageWithSidebar
 sidebarWidth="narrow"
 sidebarTitle={app?.name || "App"}
 sidebar={<AppNav appId={appId} activeTab="monitoring" />}
 >
 <PageContainer>
 {/* PageHeader */}
 <PageHeader
           title="Run Monitor"
 eyebrow={app?.name}
 backHref="/dashboard/apps"
           backLabel="Back to App List"
 actions={
 <Button
 variant="outline"
 size="sm"
 onClick={handleRefresh}
 disabled={isRefreshing}
 >
 <RefreshCw className={cn("w-4 h-4 mr-1.5", isRefreshing && "animate-spin")} />
 Refresh
 </Button>
 }
 />

 {/* MetricsOverview */}
 <SettingsSection
           title="Run Metrics"
 description="Execution statistics for the last 7 days"
 compact
 >
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <MetricCard
               label="Total Executions"
 value={metrics?.total_executions || 0}
 icon={<Zap className="w-4 h-4" />}
 />
 <MetricCard
 label="Success Rate"
 value={`${((metrics?.success_rate || 0) * 100).toFixed(1)}%`}
 icon={<CheckCircle2 className="w-4 h-4" />}
 highlight={metrics?.success_rate !== undefined && metrics.success_rate < 0.9}
 />
 <MetricCard
               label="Average Response Time"
 value={formatDuration(metrics?.avg_duration_ms)}
 icon={<Timer className="w-4 h-4" />}
 />
 <MetricCard
               label="Error Rate"
 value={`${(errorRate * 100).toFixed(1)}%`}
 icon={<AlertCircle className="w-4 h-4" />}
 highlight={errorRate > 0.1}
 />
 </div>
 </SettingsSection>

 <SettingsSection title="AI Metrics" description={qualityDescription} compact>
 <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
 <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
 <div className="col-span-4">Metrics</div>
             <div className="col-span-3">Current Value</div>
 <div className="col-span-3">Target</div>
 <div className="col-span-2">Status</div>
 </div>
 {qualityOverview.metrics.map((metric) => {
 const status = qualityStatusConfig[metric.status];
 const StatusIcon = status.icon;
 const MetricIcon = metric.icon;
 const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown;

 return (
 <div
 key={metric.id}
 className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-75 transition-colors"
 >
 <div className="col-span-4 flex items-start gap-3">
 <div className="w-8 h-8 rounded-md border border-border bg-surface-75 flex items-center justify-center">
 <MetricIcon className="w-4 h-4 text-foreground-muted" />
 </div>
 <div>
 <div className="text-[12px] font-medium text-foreground">{metric.label}</div>
 <div className="text-[11px] text-foreground-muted">{metric.description}</div>
 </div>
 </div>
 <div className="col-span-3">
 <div className="text-[14px] font-semibold text-foreground">
 {metric.value}
 {metric.unit}
 </div>
 <div className="text-[11px] text-foreground-muted">
                     {qualityOverview.summary.hasSamples
                       ? `Sampled from ${qualityOverview.summary.sampleCount} executions`
: "Default"}
 </div>
 </div>
 <div className="col-span-3 flex items-center">
 <span className="text-[12px] text-foreground-light">
 ≥ {metric.target}
 {metric.unit}
 </span>
 </div>
 <div className="col-span-2 flex items-center gap-2">
 <Badge
 variant="secondary"
 className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
 >
 <StatusIcon className="w-3 h-3" />
 {status.label}
 </Badge>
 <span
 className={cn(
 "inline-flex items-center text-[10px] font-medium",
 metric.trend === "up" ? "text-brand-500" : "text-warning"
 )}
 >
 <TrendIcon className="w-3 h-3 mr-0.5" />
                   {metric.trend === "up" ? "Rising": "Declining"}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-foreground-muted">
 <span className="flex items-center gap-1">
 <Calendar className="w-3 h-3" />
 {qualityOverview.summary.hasSamples ? `Last ${qualityOverview.summary.days} days`: "Default"}
 </span>
 <span className="flex items-center gap-1">
 <BarChart3 className="w-3 h-3" />
               Rating Range 0-100
 </span>
 <span className="flex items-center gap-1">
 <Bot className="w-3 h-3" />
               Sample Rating and Rule Validation
 </span>
 </div>
 </SettingsSection>

 <SettingsSection
           title="Regression Test"
           description={`Test Cases · Covering ${regressionSummary.tagCoverage} Scenarios`}
 compact
 >
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <MetricCard
               label="Total Test Cases"
 value={regressionSummary.total}
 icon={<ListChecks className="w-4 h-4" />}
 />
 <MetricCard
               label="Pass Rate"
 value={`${(regressionSummary.passRate * 100).toFixed(1)}%`}
 icon={<CheckCircle2 className="w-4 h-4" />}
 highlight={regressionSummary.passRate < 0.9}
 />
 <MetricCard
               label="Failed Test Cases"
 value={regressionSummary.failed}
 icon={<XCircle className="w-4 h-4" />}
 highlight={regressionSummary.failed > 0}
 />
 <MetricCard
               label="Last Execution"
 value={regressionSummary.lastRunAt ? formatTime(regressionSummary.lastRunAt) : "-"}
 icon={<Calendar className="w-4 h-4" />}
 />
 </div>

 <div className="mt-4">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
 <Input
                   placeholder="Search test case title or tags..."
 value={regressionQuery}
 onChange={(event) => setRegressionQuery(event.target.value)}
 className="pl-9 h-9 w-[220px] bg-surface-200 border-border text-foreground placeholder:text-foreground-muted focus:border-brand-400"
 />
 </div>
 <Select value={regressionStatusFilter} onValueChange={setRegressionStatusFilter}>
 <SelectTrigger className="w-[140px] h-9 bg-surface-75 border-border">
 <SelectValue placeholder="Status filter" />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 <SelectItem value="all">All Statuses</SelectItem>
 {Object.entries(regressionStatusConfig).map(([key, config]) => (
 <SelectItem key={key} value={key}>
 {config.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="text-[12px] text-foreground-muted">
                 {filteredRegressionCases.length} test cases
 </div>
 </div>

 <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
 <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
                 <div className="col-span-4">Test Case</div>
                 <div className="col-span-3">Validation</div>
 <div className="col-span-2">Tags</div>
 <div className="col-span-2">Result</div>
 <div className="col-span-1">Recent</div>
 </div>

 {filteredRegressionCases.length === 0 ? (
 <div className="py-10 text-center text-[13px] text-foreground-muted">
 No matching regression test cases
 </div>
 ) : (
 filteredRegressionCases.map((item) => {
 const status = regressionStatusConfig[item.status];
 const StatusIcon = status.icon;
 const scoreTone =
 item.score >= 90
 ? "text-brand-500"
 : item.score >= 85
 ? "text-warning"
 : "text-destructive";
 const displayTags = item.tags.slice(0, 2);
 const extraTags = item.tags.length - displayTags.length;

 return (
 <div
 key={item.id}
 className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-75 transition-colors"
 >
 <div className="col-span-4">
 <div className="text-[12px] font-medium text-foreground">{item.title}</div>
 <div className="text-[11px] text-foreground-muted line-clamp-2">
 {item.prompt}
 </div>
 <div className="text-[10px] text-foreground-muted mt-1">
 Owner: {item.owner}
 </div>
 </div>
 <div className="col-span-3">
 <div className="text-[11px] text-foreground-light line-clamp-2">
 {item.rubric}
 </div>
 <div className="text-[10px] text-foreground-muted mt-1 line-clamp-1">
 Expect: {item.expected}
 </div>
 </div>
 <div className="col-span-2 flex flex-wrap items-center gap-1">
 {displayTags.map((tag) => (
 <Badge
 key={tag}
 variant="secondary"
 className="text-[10px] bg-surface-200 text-foreground-muted"
 >
 {tag}
 </Badge>
 ))}
 {extraTags > 0 && (
 <Badge
 variant="secondary"
 className="text-[10px] bg-surface-200 text-foreground-muted"
 >
 +{extraTags}
 </Badge>
 )}
 </div>
 <div className="col-span-2 flex flex-col gap-1">
 <Badge
 variant="secondary"
 className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
 >
 <StatusIcon className="w-3 h-3" />
 {status.label}
 </Badge>
 <span className={cn("text-[11px] font-medium", scoreTone)}>
 {item.score} 
 </span>
 </div>
 <div className="col-span-1 text-[11px] text-foreground-muted">
 {formatTime(item.lastRunAt)}
 </div>
 </div>
 );
 })
 )}
 </div>
 <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-foreground-muted">
 <span className="flex items-center gap-1">
 <ListChecks className="w-3 h-3" />
               Test cases support versioning and management.
 </span>
 <span className="flex items-center gap-1">
 <BarChart3 className="w-3 h-3" />
               Rating based on rule validation and sample review.
 </span>
 </div>
 </div>
 </SettingsSection>

 <SettingsSection
           title="Human Review Sampling Policy"
           description={`Active Policies · Last Updated ${formatTime(reviewSamplingStrategy.lastUpdated)}`}
 compact
 >
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <MetricCard
               label="Base Sample Rate"
 value={`${Math.round(reviewSamplingStrategy.baseRate * 100)}%`}
 icon={<Target className="w-4 h-4" />}
 />
 <MetricCard
               label="Daily Sample Limit"
 value={`${reviewSamplingStrategy.dailyMin}-${reviewSamplingStrategy.dailyMax}`}
 icon={<Filter className="w-4 h-4" />}
 />
 <MetricCard
 label="SLA Range"
 value={`${samplingSlaRange.min}-${samplingSlaRange.max}h`}
 icon={<Clock className="w-4 h-4" />}
 />
 <MetricCard
               label="Active Rules"
 value={`${activeSamplingRules.length}/${reviewSamplingStrategy.rules.length}`}
 icon={<ClipboardCheck className="w-4 h-4" />}
 />
 </div>

 <div className="mt-4 grid lg:grid-cols-[1.1fr_1fr] gap-4">
 <div className="rounded-md bg-surface-100 border border-border p-4">
 <div className="text-[11px] text-foreground-muted uppercase tracking-wider mb-3">
                 Sample Triggers
 </div>
 <div className="space-y-3">
 {reviewSamplingStrategy.triggers.map((trigger) => (
 <div key={trigger.id} className="flex items-start gap-3">
 <div className="w-8 h-8 rounded-md bg-surface-75 border border-border flex items-center justify-center">
 <AlertCircle className="w-4 h-4 text-warning" />
 </div>
 <div>
 <div className="text-[12px] font-medium text-foreground">{trigger.label}</div>
 <div className="text-[11px] text-foreground-muted">{trigger.description}</div>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="rounded-md bg-surface-100 border border-border p-4">
 <div className="text-[11px] text-foreground-muted uppercase tracking-wider mb-3">
                 Coverage Matrix
 </div>
 <div className="space-y-3">
 {reviewSamplingStrategy.coverage.map((item) => (
 <div key={item.id} className="space-y-1">
 <div className="flex items-center justify-between text-[12px]">
 <span className="text-foreground">{item.label}</span>
 <span className="text-foreground-light tabular-nums">
 {Math.round(item.rate * 100)}%
 </span>
 </div>
 <div className="h-1.5 rounded-full bg-surface-300 overflow-hidden">
 <div
 className="h-full bg-brand-500"
 style={{ width: `${Math.min(item.rate * 100, 100)}%` }}
 />
 </div>
 <div className="text-[10px] text-foreground-muted">{item.goal}</div>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="mt-4 rounded-md bg-surface-100 border border-border overflow-hidden">
 <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
 <div className="col-span-4">Scenario / Trigger</div>
             <div className="col-span-2">Sample Rate</div>
 <div className="col-span-3">Priority / Status</div>
 <div className="col-span-1">SLA</div>
             <div className="col-span-2">Reviewer</div>
 </div>
 {reviewSamplingStrategy.rules.map((rule) => {
 const priority = reviewPriorityConfig[rule.priority];
 const status = reviewStatusConfig[rule.status];

 return (
 <div
 key={rule.id}
 className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-75 transition-colors"
 >
 <div className="col-span-4">
 <div className="text-[12px] font-medium text-foreground">{rule.scenario}</div>
 <div className="text-[11px] text-foreground-muted">{rule.trigger}</div>
 {rule.notes && (
 <div className="text-[10px] text-warning mt-1">{rule.notes}</div>
 )}
 </div>
 <div className="col-span-2 flex items-center">
 <span className="text-[12px] text-foreground-light tabular-nums">
 {Math.round(rule.sampleRate * 100)}%
 </span>
 </div>
 <div className="col-span-3 flex items-center gap-2">
 <Badge
 variant="secondary"
 className={cn("text-[10px]", priority.bgColor, priority.color)}
 >
 {priority.label}
 </Badge>
 <Badge
 variant="secondary"
 className={cn("text-[10px]", status.bgColor, status.color)}
 >
 {status.label}
 </Badge>
 </div>
 <div className="col-span-1 flex items-center">
 <span className="text-[12px] text-foreground-light tabular-nums">
 {rule.slaHours}h
 </span>
 </div>
 <div className="col-span-2 text-[11px] text-foreground-muted">
 {rule.reviewers.join(" / ")}
 </div>
 </div>
 );
 })}
 </div>

 <div className="mt-4 rounded-md bg-surface-75/60 border border-border p-4">
 <div className="text-[11px] text-foreground-muted uppercase tracking-wider mb-3">
                 Review Checklist
 </div>
 <div className="grid md:grid-cols-2 gap-2">
 {reviewSamplingStrategy.checklist.map((item) => (
 <div key={item.id} className="flex items-center gap-2 text-[12px] text-foreground-light">
 <span
 className={cn(
 "h-2 w-2 rounded-full",
 item.required ? "bg-brand-500" : "bg-surface-300"
 )}
 />
 <span>{item.label}</span>
 {item.required && (
 <Badge
 variant="secondary"
 className="text-[10px] bg-brand-200 text-brand-500"
                   >
                     Required
                   </Badge>
 )}
 </div>
 ))}
 </div>
 </div>

 <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-foreground-muted">
 <span className="flex items-center gap-1">
 <Users className="w-3 h-3" />
 Owner: {reviewSamplingStrategy.owner}
 </span>
 <span className="flex items-center gap-1">
 <ShieldCheck className="w-3 h-3" />
               Escalation Threshold: {Math.round(reviewSamplingStrategy.escalationThreshold * 100)}%
 </span>
 <span className="flex items-center gap-1">
 <Target className="w-3 h-3" />
               Confidence Gate: {Math.round(reviewSamplingStrategy.confidenceGate * 100)}%
 </span>
 </div>
 </SettingsSection>

 <SettingsSection
           title="Execution Logs"
           description="Recent execution log summary and error tips"
 compact
 >
 {recentExecutions.length === 0 ? (
 <div className="py-6 text-center text-[12px] text-foreground-muted">
               No execution logs. Trigger a run first to view detailed records.
 </div>
 ) : (
 <div className="space-y-3">
 {recentExecutions.map((execution) => {
 const status = getStatusConfig(execution.status);
 const StatusIcon = status.icon;
 return (
 <div
 key={execution.id}
 className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface-75 px-4 py-3"
 >
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <Badge
 variant="secondary"
 className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
 >
 <StatusIcon className="w-3 h-3" />
 {status.label}
 </Badge>
 <span className="text-[12px] text-foreground-light font-mono">
 {execution.id.slice(0, 10)}...
 </span>
 </div>
 <div className="mt-2 text-[11px] text-foreground-muted">
                   {execution.error_message || "Execution normal. No error logs."}
 </div>
 </div>
 <div className="text-[11px] text-foreground-light">
 {formatDuration(execution.duration_ms)}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </SettingsSection>

 <SettingsSection
           title="Node Status"
           description="Key node health and latest execution status."
 compact
 >
 <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
 <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
 <div className="col-span-4">Node</div>
 <div className="col-span-3">Status</div>
 <div className="col-span-5">Description</div>
 </div>
 {nodeStatusSamples.map((node) => {
 const status = getStatusConfig(node.status);
 const StatusIcon = status.icon;
 return (
 <div
 key={node.id}
 className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-75 transition-colors"
 >
 <div className="col-span-4 text-[12px] text-foreground">{node.label}</div>
 <div className="col-span-3 flex items-center">
 <Badge
 variant="secondary"
 className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
 >
 <StatusIcon className="w-3 h-3" />
 {status.label}
 </Badge>
 </div>
 <div className="col-span-5 text-[11px] text-foreground-muted">
 {node.detail}
 </div>
 </div>
 );
 })}
 </div>
 </SettingsSection>

             {/* Execution List */}
 <div className="mt-6">
 {/* Toolbar */}
 <div className="flex items-center justify-between mb-4">
 <div className="flex flex-wrap items-center gap-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
 <Input
                   placeholder="Search execution ID or error info..."
 value={executionQuery}
 onChange={(event) => setExecutionQuery(event.target.value)}
 className="pl-9 h-9 w-[240px] bg-surface-200 border-border text-foreground placeholder:text-foreground-muted focus:border-brand-400"
 />
 </div>
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger className="w-[140px] h-9 bg-surface-75 border-border">
 <SelectValue placeholder="Status filter" />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 <SelectItem value="all">All Statuses</SelectItem>
 {Object.entries(statusConfig).map(([key, config]) => (
 <SelectItem key={key} value={key}>
 {config.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 <Select value={nodeTypeFilter} onValueChange={setNodeTypeFilter}>
 <SelectTrigger className="w-[150px] h-9 bg-surface-75 border-border">
 <SelectValue placeholder="Node type" />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 {nodeTypeOptions.map((option) => (
 <SelectItem key={option.value} value={option.value}>
 {option.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
 <SelectTrigger className="w-[150px] h-9 bg-surface-75 border-border">
 <SelectValue placeholder="Time range" />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 {timeRangeOptions.map((option) => (
 <SelectItem key={option.value} value={option.value}>
 {option.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="text-[12px] text-foreground-muted">
                 Current page {filteredExecutions.length} · Total {total} 
 </div>
 </div>

 {actionError && (
 <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
 {actionError}
 </div>
 )}

 {/* List */}
 <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
 {/* head */}
 <div className="grid grid-cols-[1.6fr_1fr_1fr_2.2fr_1fr_1.4fr] gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
               <div>Execution ID</div>
               <div>Status</div>
               <div>Duration</div>
               <div>Error</div>
               <div>Trigger Type</div>
 <div>Time</div>
 </div>

               {/* Execution Records */}
 {filteredExecutions.length === 0 ? (
 <div className="py-12 text-center text-[13px] text-foreground-muted">
                   No Execution Records
 </div>
 ) : (
 filteredExecutions.map((execution) => {
 const status = getStatusConfig(execution.status);
 const StatusIcon = status.icon;
 const isActive = execution.id === activeExecutionId;

 return (
 <div
 key={execution.id}
 className={cn(
 "grid grid-cols-[1.6fr_1fr_1fr_2.2fr_1fr_1.4fr] gap-4 px-4 py-3 border-b border-border last:border-b-0 transition-colors cursor-pointer",
 isActive ? "bg-surface-75" : "hover:bg-surface-75"
 )}
 onClick={() => setActiveExecutionId(execution.id)}
 >
                     {/* Execution ID */}
 <div>
 <span className="text-[12px] font-mono text-foreground-light">
 {execution.id.slice(0, 8)}...
 </span>
 </div>

 {/* Status */}
 <div className="flex items-center">
 <Badge
 variant="secondary"
 className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
 >
 <StatusIcon className={cn("w-3 h-3", execution.status === "running" && "animate-spin")} />
 {status.label}
 </Badge>
 </div>

 {/* time */}
 <div className="flex items-center">
 <span className="text-[12px] text-foreground-light">
 {formatDuration(execution.duration_ms)}
 </span>
 </div>

 {/* Error */}
 <div className="flex items-center text-[11px] text-foreground-muted line-clamp-2">
 {execution.error_message || "—"}
 </div>

                     {/* Trigger Method and Actions */}
 <div className="flex items-center gap-2">
 <span className="text-[12px] text-foreground-muted">
 {resolveTriggerType(execution)}
 </span>
 {(execution.status === "running" || execution.status === "pending") && (
 <Button
 variant="outline"
 size="sm"
 className="h-7 px-2 text-[10px]"
 disabled={cancelingExecutionId === execution.id}
 onClick={() => handleCancelExecution(execution.id)}
 >
 {cancelingExecutionId === execution.id ? (
 <Loader2 className="w-3 h-3 animate-spin" />
 ) : (
 <Pause className="w-3 h-3" />
 )}
 <span className="ml-1">Stop</span>
 </Button>
 )}
 </div>

 {/* Time */}
 <div className="flex items-center">
 <span className="text-[12px] text-foreground-light">
 {formatTime(execution.created_at)}
 </span>
 </div>
 </div>
 );
 })
 )}
 </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="flex items-center justify-between mt-4">
 <div className="text-[12px] text-foreground-muted">
 Page {page} of {totalPages}
 </div>
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(page - 1)}
 disabled={page <= 1}
 className="h-8"
 >
 <ChevronLeft className="w-4 h-4" />
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(page + 1)}
 disabled={page >= totalPages}
 className="h-8"
 >
 <ChevronRight className="w-4 h-4" />
 </Button>
 </div>
 </div>
 )}

 <SettingsSection
           title="Execution Details"
           description="Node Status, Logs, and Input/Output Snapshots"
 compact
 >
 {!activeExecution ? (
 <div className="py-6 text-center text-[12px] text-foreground-muted">
                 Please select an execution record to view details.
 </div>
 ) : (
 <div className="space-y-4">
 <div className="grid gap-3 md:grid-cols-4">
 <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
 <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                       Execution ID
                       </div>
                       <div className="mt-1 text-[12px] text-foreground font-mono">
 {activeExecution.id.slice(0, 12)}...
 </div>
 </div>
 <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
 <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
 Status
 </div>
 <div className="mt-1">
 {(() => {
 const status = getStatusConfig(activeExecution.status);
 const StatusIcon = status.icon;
 return (
 <Badge
 variant="secondary"
 className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
 >
 <StatusIcon className="w-3 h-3" />
 {status.label}
 </Badge>
 );
 })()}
 </div>
 </div>
 <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
 <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                       Trigger Type
                       </div>
                       <div className="mt-1 text-[12px] text-foreground">
                         {resolveTriggerType(activeExecution)}
 </div>
 </div>
 <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
 <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
 Duration
 </div>
 <div className="mt-1 text-[12px] text-foreground">
 {formatDuration(activeExecution.duration_ms)}
 </div>
 </div>
 </div>

 <div className="grid gap-4 lg:grid-cols-2">
 <div className="rounded-md border border-border bg-surface-75 p-4">
 <div className="text-[12px] font-medium text-foreground mb-2">
                     Node Status
                     </div>
                     <div className="space-y-2">
                       {activeNodeFlow.map((node) => {
 const status = getStatusConfig(node.status);
 const StatusIcon = status.icon;
 return (
 <div key={node.id} className="flex items-center justify-between gap-3">
 <div className="text-[12px] text-foreground">{node.label}</div>
 <div className="flex items-center gap-2">
 <Badge
 variant="secondary"
 className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
 >
 <StatusIcon className="w-3 h-3" />
 {status.label}
 </Badge>
 <span className="text-[11px] text-foreground-muted">{node.detail}</span>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 <div className="rounded-md border border-border bg-surface-75 p-4">
 <div className="text-[12px] font-medium text-foreground mb-2">
                     Execution Logs
                     </div>
                     <div className="space-y-2 text-[11px] text-foreground-muted">
 {buildExecutionLogs(activeExecution).map((line) => (
 <div key={line}>{line}</div>
 ))}
 {activeExecution.error_message && (
 <div className="text-destructive">Error: {activeExecution.error_message}</div>
 )}
 </div>
 </div>
 </div>

 <div className="grid gap-4 lg:grid-cols-2">
 <div className="rounded-md border border-border bg-surface-75 p-4">
 <div className="text-[12px] font-medium text-foreground mb-2">
                     Input Snapshot
 </div>
 <pre className="rounded-md bg-surface-200/70 border border-border px-3 py-2 text-[11px] text-foreground-muted whitespace-pre-wrap font-mono">
 {JSON.stringify(activeExecution.inputs || {}, null, 2)}
 </pre>
 </div>
 <div className="rounded-md border border-border bg-surface-75 p-4">
 <div className="text-[12px] font-medium text-foreground mb-2">
                     Output Snapshot
 </div>
 <pre className="rounded-md bg-surface-200/70 border border-border px-3 py-2 text-[11px] text-foreground-muted whitespace-pre-wrap font-mono">
 {JSON.stringify(activeExecution.outputs || {}, null, 2)}
 </pre>
 </div>
 </div>
 </div>
 )}
 </SettingsSection>
 </div>
 </PageContainer>
 </PageWithSidebar>
 </AppAccessGate>
 );
}

// MetricsCardComponent
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
 <div className="p-4 rounded-md bg-surface-75">
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

export default function MonitoringPage() {
 const params = useParams();
 const workspaceId = Array.isArray(params?.workspaceId)
 ? params.workspaceId[0]
 : (params?.workspaceId as string | undefined);
 const appId = Array.isArray(params?.appId) ? params.appId[0] : (params?.appId as string | undefined);

 if (!workspaceId || !appId) {
 return null;
 }

 return <MonitoringPageContent workspaceId={workspaceId} appId={appId} />;
}
