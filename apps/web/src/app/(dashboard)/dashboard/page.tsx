"use client";

/**
 * Dashboard Home - Supabase itemSettingsStyle
 * MinimalTextPriorityDesign, Follow STYLE-TERMINAL-PIXEL.md Standard
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
 Zap,
 Plus,
 TrendingUp,
 TrendingDown,
 Clock,
 CheckCircle2,
 XCircle,
 Play,
 Activity,
 ChevronRight,
 LayoutGrid,
 Bot,
 Settings,
 BarChart3,
 Server,
 Database,
 Cpu,
 PenTool,
 FileText,
 Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import {
 PageContainer,
 PageHeader,
 SettingsSection,
 PageWithSidebar,
} from "@/components/dashboard/page-layout";
import {
 dashboardApi,
 type DashboardData,
 type WorkflowSummary,
 type ExecutionSummary,
 formatQuickStats,
 getExecutionStatusText,
} from "@/lib/api/dashboard";

// ===== EdgeNavigationComponent =====
function DashboardNav({ activeSection }: { activeSection: string }) {
 const navItems = [
 { id: "overview", label: "Overview", href: "#overview" },
 { id: "status", label: "itemStatus", href: "#status" },
 { id: "actions", label: "Quick Actions", href: "#actions" },
 { id: "recent", label: "RecentDynamic", href: "#recent" },
 { id: "usage", label: "ResourceUsage", href: "#usage" },
 ];

 return (
 <nav className="space-y-1">
 {navItems.map((item) => (
 <a
 key={item.id}
 href={item.href}
 className={cn(
 "block px-3 py-2 text-[12px] font-medium rounded-md transition-colors",
 activeSection === item.id
 ? "bg-surface-100/70 text-foreground"
 : "text-foreground-light hover:text-foreground hover:bg-surface-100/60"
 )}
 >
 {item.label}
 </a>
 ))}
 </nav>
 );
}

// ===== mainPageComponent =====
export default function DashboardPage() {
 const { user } = useAuthStore();
 const [isLoading, setIsLoading] = useState(true);
 const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
 const [activeSection, setActiveSection] = useState("overview");

 // Fetch Dashboard Data
 useEffect(() => {
 const fetchData = async () => {
 try {
 setIsLoading(true);
 const response = await dashboardApi.getDashboardData();
 if (response.success) {
 setDashboardData(response.data);
 }
 } catch (error) {
 console.error("Failed to fetch dashboard data:", error);
 } finally {
 setIsLoading(false);
 }
 };
 fetchData();
 }, []);

 // ScrollListen
 useEffect(() => {
 const handleScroll = () => {
 const sections = ["overview", "status", "actions", "recent", "usage"];
 for (const id of sections) {
 const el = document.getElementById(id);
 if (el) {
 const rect = el.getBoundingClientRect();
 if (rect.top <= 100 && rect.bottom > 100) {
 setActiveSection(id);
 break;
 }
 }
 }
 };
 window.addEventListener("scroll", handleScroll, { passive: true });
 return () => window.removeEventListener("scroll", handleScroll);
 }, []);

 // Fetch
 const getGreeting = () => {
 const hour = new Date().getHours();
 if (hour < 6) return "";
 if (hour < 12) return "on";
 if (hour < 14) return "";
 if (hour < 18) return "down";
 return "on";
 };

 const stats = dashboardData?.quick_stats;
 const formattedStats = stats ? formatQuickStats(stats) : null;

 return (
 <PageWithSidebar
 sidebarWidth="narrow"
 sidebarTitle="Dashboard"
 sidebar={<DashboardNav activeSection={activeSection} />}
 >
 <PageContainer>
 {/* PageHeader */}
 <PageHeader
 title={`${getGreeting()}, ${user?.displayName || user?.username || "User"}`}
 description="itemOverviewandWorkflowStatus"
 actions={
 <div className="flex items-center gap-2">
 <Button size="sm" asChild>
 <Link href="/dashboard/workflows/new">
 <Plus className="w-3.5 h-3.5" />
 CreateWorkflow
 </Link>
 </Button>
 </div>
 }
 />

 {/* keyMetrics */}
 <section id="overview" className="scroll-mt-6">
 <SettingsSection
 title="keyMetrics"
 description="WorkflowandExecuteOverviewData"
 >
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <MetricItem
 label="WorkflowTotal"
 value={formattedStats?.totalWorkflows ?? 0}
 subtext={`${formattedStats?.activeWorkflows ?? 0} Active`}
 trend={formattedStats?.workflowsGrowth}
 isLoading={isLoading}
 />
 <MetricItem
 label="TodayExecute"
 value={formattedStats?.runsToday ?? 0}
 subtext={`currentweeks ${formattedStats?.runsThisWeek ?? 0} times`}
 trend={formattedStats?.executionsGrowth}
 isLoading={isLoading}
 />
 <MetricItem
 label="Success Rate"
 value={`${(formattedStats?.successRate ?? 0).toFixed(1)}%`}
 subtext={`${formattedStats?.totalExecutions ?? 0} timesExecute`}
 trend={formattedStats?.successRateChange}
 isLoading={isLoading}
 />
 <MetricItem
 label="AverageResponse"
 value={`${formattedStats?.avgResponseTimeMs ?? 0}ms`}
 subtext="Response Time"
 isLoading={isLoading}
 />
 </div>
 </SettingsSection>
 </section>

 {/* itemStatus */}
 <section id="status" className="scroll-mt-6 mt-6">
 <SettingsSection
 title="itemStatus"
 description="SystemRunStatusandResourceMonitor"
 >
 <div className="space-y-4">
 {/* SystemStatus */}
 <StatusRow
 label="SystemStatus"
 description="AllServiceRunNormal"
 status={dashboardData?.system_health?.overall_status || "healthy"}
 isLoading={isLoading}
 />
 
 {/* RunQueue */}
 <StatusRow
 label="RunQueue"
 description={`${dashboardData?.running_queue?.total_running ?? 0} TaskRun, ${dashboardData?.running_queue?.total_pending ?? 0} etcpending`}
 status={dashboardData?.running_queue?.queue_health || "healthy"}
 isLoading={isLoading}
 />

 {/* SystemMetrics */}
 {dashboardData?.system_health?.metrics && (
 <div className="pt-4 border-t border-border">
 <div className="grid grid-cols-3 gap-4">
 <SystemMetric
 icon={Cpu}
 label="CPU"
 value={`${dashboardData.system_health.metrics.cpu_usage.toFixed(1)}%`}
 />
 <SystemMetric
 icon={Database}
 label="in"
 value={`${dashboardData.system_health.metrics.memory_usage.toFixed(1)}%`}
 />
 <SystemMetric
 icon={Server}
 label="Latency"
 value={`${dashboardData.system_health.metrics.avg_latency_ms}ms`}
 />
 </div>
 </div>
 )}
 </div>
 </SettingsSection>
 </section>

 {/* Quick Actions */}
 <section id="actions" className="scroll-mt-6 mt-6">
 <SettingsSection
 title="Quick Actions"
 description="useFeaturesEntry"
 >
 <div className="space-y-1">
 <ActionRow
 href="/dashboard/workflows/new"
 label="CreateWorkflow"
 description="BuildAutomationTaskFlow"
 />
 <ActionRow
 href="/dashboard/template-gallery"
 label="Template Gallery"
 description="fromPresetTemplateQuickStart"
 />
 <ActionRow
 href="/dashboard/creative/generate"
 label="GenerateContent"
 description="AI AuxiliaryCopyCreative"
 />
 <ActionRow
 href="/dashboard/my-agents"
 label="I's Agent"
 description="ManagePublished's Agent"
 />
 </div>
 </SettingsSection>
 </section>

 {/* RecentDynamic */}
 <section id="recent" className="scroll-mt-6 mt-6">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* RecentWorkflow */}
 <SettingsSection
 title="RecentWorkflow"
 description="RecentCreateorEdit'sWorkflow"
 compact
 >
 {isLoading ? (
 <LoadingRows count={3} />
 ) : dashboardData?.recent_workflows && dashboardData.recent_workflows.length > 0 ? (
 <div className="space-y-1">
 {dashboardData.recent_workflows.slice(0, 5).map((workflow) => (
 <WorkflowRow key={workflow.id} workflow={workflow} />
 ))}
 </div>
 ) : (
 <EmptyMessage
 text="NoneWorkflow"
 action={{ label: "CreateWorkflow", href: "/dashboard/workflows/new" }}
 />
 )}
 {dashboardData?.recent_workflows && dashboardData.recent_workflows.length > 0 && (
 <div className="pt-3 border-t border-border mt-3">
 <Link
 href="/dashboard/workflows"
 className="text-[12px] text-foreground-light hover:text-foreground transition-colors flex items-center gap-1"
 >
 View allWorkflow
 <ChevronRight className="w-3 h-3" />
 </Link>
 </div>
 )}
 </SettingsSection>

 {/* RecentExecute */}
 <SettingsSection
 title="RecentExecute"
 description="Recent'sWorkflowExecuteRecord"
 compact
 >
 {isLoading ? (
 <LoadingRows count={3} />
 ) : dashboardData?.recent_executions && dashboardData.recent_executions.length > 0 ? (
 <div className="space-y-1">
 {dashboardData.recent_executions.slice(0, 5).map((execution) => (
 <ExecutionRow key={execution.id} execution={execution} />
 ))}
 </div>
 ) : (
 <EmptyMessage text="NoneExecuteRecord" />
 )}
 {dashboardData?.recent_executions && dashboardData.recent_executions.length > 0 && (
 <div className="pt-3 border-t border-border mt-3">
 <Link
 href="/dashboard/executions"
 className="text-[12px] text-foreground-light hover:text-foreground transition-colors flex items-center gap-1"
 >
 View allExecuteRecord
 <ChevronRight className="w-3 h-3" />
 </Link>
 </div>
 )}
 </SettingsSection>
 </div>
 </section>

 {/* ResourceUsage */}
 <section id="usage" className="scroll-mt-6 mt-6">
 <SettingsSection
 title="ResourceUsage"
 description="Token and API CallStatistics"
 >
 <div className="space-y-4">
 {/* Token Usage */}
 {dashboardData?.token_usage && (
 <UsageBar
 label="Token Usage"
 used={dashboardData.token_usage.used_this_month}
 limit={dashboardData.token_usage.limit}
 unit="tokens"
 />
 )}
 
 {/* API Call */}
 {dashboardData?.api_usage_stats && (
 <div className="pt-4 border-t border-border">
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <UsageMetric
 label="TodayCall"
 value={dashboardData.api_usage_stats.calls_today}
 />
 <UsageMetric
 label="currentweeksCall"
 value={dashboardData.api_usage_stats.calls_this_week}
 />
 <UsageMetric
 label="AverageLatency"
 value={`${dashboardData.api_usage_stats.avg_latency_ms}ms`}
 />
 <UsageMetric
 label="QuotaUsage"
 value={`${dashboardData.api_usage_stats.usage_percent.toFixed(1)}%`}
 highlight={dashboardData.api_usage_stats.usage_percent > 80}
 />
 </div>
 </div>
 )}
 </div>
 </SettingsSection>
 </section>

 {/* Footerbetween */}
 <div className="h-12" />
 </PageContainer>
 </PageWithSidebar>
 );
}

// ===== Component =====

// Metrics
interface MetricItemProps {
 label: string;
 value: string | number;
 subtext?: string;
 trend?: number;
 isLoading?: boolean;
}

function MetricItem({ label, value, subtext, trend, isLoading }: MetricItemProps) {
 if (isLoading) {
 return (
 <div className="p-4 rounded-md border border-border bg-surface-75">
 <div className="animate-pulse space-y-2">
 <div className="h-3 w-16 bg-surface-200 rounded" />
 <div className="h-6 w-20 bg-surface-200 rounded" />
 <div className="h-3 w-24 bg-surface-200 rounded" />
 </div>
 </div>
 );
 }

 return (
 <div className="p-4 rounded-md border border-border bg-surface-75 hover:border-border-strong transition-colors">
 <div className="text-[11px] text-foreground-muted uppercase tracking-wide mb-1">
 {label}
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-xl font-semibold text-foreground">{value}</span>
 {trend !== undefined && trend !== 0 && (
 <span
 className={cn(
 "inline-flex items-center gap-0.5 text-[10px] font-medium",
 trend > 0 ? "text-brand-500" : "text-destructive"
 )}
 >
 {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
 {Math.abs(trend).toFixed(1)}%
 </span>
 )}
 </div>
 {subtext && <div className="text-[11px] text-foreground-muted mt-1">{subtext}</div>}
 </div>
 );
}

// Statusrow
interface StatusRowProps {
 label: string;
 description: string;
 status: "healthy" | "degraded" | "down" | string;
 isLoading?: boolean;
}

function StatusRow({ label, description, status, isLoading }: StatusRowProps) {
 const statusConfig = {
 healthy: { color: "bg-brand-500", text: "Normal" },
 degraded: { color: "bg-warning", text: "Exception" },
 down: { color: "bg-destructive", text: "Fault" },
 busy: { color: "bg-warning", text: "" },
 overloaded: { color: "bg-destructive", text: "past" },
 };
 const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.healthy;

 if (isLoading) {
 return (
 <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
 <div className="animate-pulse space-y-1">
 <div className="h-3 w-20 bg-surface-200 rounded" />
 <div className="h-3 w-32 bg-surface-200 rounded" />
 </div>
 <div className="h-4 w-12 bg-surface-200 rounded animate-pulse" />
 </div>
 );
 }

 return (
 <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
 <div>
 <div className="text-[12px] font-medium text-foreground">{label}</div>
 <div className="text-[11px] text-foreground-muted">{description}</div>
 </div>
 <div className="flex items-center gap-1.5">
 <div className={cn("w-2 h-2 rounded-full", config.color)} />
 <span className="text-[11px] text-foreground-muted">{config.text}</span>
 </div>
 </div>
 );
}

// SystemMetrics
interface SystemMetricProps {
 icon: React.ElementType;
 label: string;
 value: string;
}

function SystemMetric({ icon: Icon, label, value }: SystemMetricProps) {
 return (
 <div className="flex items-center gap-2">
 <Icon className="w-4 h-4 text-foreground-muted" />
 <div>
 <div className="text-[10px] text-foreground-muted uppercase">{label}</div>
 <div className="text-[12px] font-medium text-foreground">{value}</div>
 </div>
 </div>
 );
}

// Actionrow
interface ActionRowProps {
 href: string;
 label: string;
 description: string;
}

function ActionRow({ href, label, description }: ActionRowProps) {
 return (
 <Link
 href={href}
 className="flex items-center justify-between py-3 px-3 -mx-3 rounded-md hover:bg-surface-100/60 transition-colors group"
 >
 <div>
 <div className="text-[12px] font-medium text-foreground">{label}</div>
 <div className="text-[11px] text-foreground-muted">{description}</div>
 </div>
 <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground transition-colors" />
 </Link>
 );
}

// Workflowrow
function WorkflowRow({ workflow }: { workflow: WorkflowSummary }) {
 const statusColors: Record<string, string> = {
 active: "text-brand-500",
 published: "text-foreground-muted",
 draft: "text-foreground-muted",
 archived: "text-warning",
 };

 return (
 <Link
 href={`/dashboard/workflows/${workflow.id}`}
 className="flex items-center justify-between py-2 px-3 -mx-3 rounded-md hover:bg-surface-100/60 transition-colors group"
 >
 <div className="flex-1 min-w-0">
 <div className="text-[12px] font-medium text-foreground truncate">{workflow.name}</div>
 <div className="text-[11px] text-foreground-muted">
 {workflow.run_count} timesRun
 {workflow.success_rate > 0 && ` · ${workflow.success_rate.toFixed(0)}% Success`}
 </div>
 </div>
 <span className={cn("text-[10px] font-medium", statusColors[workflow.status] || "text-foreground-muted")}>
 {workflow.status === "active" ? "Active": workflow.status === "draft" ? "Draft": workflow.status}
 </span>
 </Link>
 );
}

// Executerow
function ExecutionRow({ execution }: { execution: ExecutionSummary }) {
 const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
 completed: { icon: CheckCircle2, color: "text-brand-500" },
 failed: { icon: XCircle, color: "text-destructive" },
 running: { icon: Loader2, color: "text-foreground-muted" },
 pending: { icon: Clock, color: "text-foreground-muted" },
 };
 const config = statusConfig[execution.status] || statusConfig.pending;
 const Icon = config.icon;

 return (
 <Link
 href={`/executions/${execution.id}`}
 className="flex items-center justify-between py-2 px-3 -mx-3 rounded-md hover:bg-surface-100/60 transition-colors group"
 >
 <div className="flex items-center gap-2 flex-1 min-w-0">
 <Icon className={cn("w-4 h-4 shrink-0", config.color, execution.status === "running" && "animate-spin")} />
 <div className="min-w-0">
 <div className="text-[12px] font-medium text-foreground truncate">{execution.workflow_name}</div>
 <div className="text-[11px] text-foreground-muted">
 {getExecutionStatusText(execution.status)}
 {execution.duration_ms && ` · ${execution.duration_ms}ms`}
 </div>
 </div>
 </div>
 <span className="text-[10px] text-foreground-muted shrink-0">{execution.time_ago}</span>
 </Link>
 );
}

// Usage
interface UsageBarProps {
 label: string;
 used: number;
 limit: number;
 unit?: string;
}

function UsageBar({ label, used, limit, unit = "" }: UsageBarProps) {
 const percent = limit > 0 ? (used / limit) * 100 : 0;
 const color = percent > 80 ? "bg-destructive" : percent > 50 ? "bg-warning" : "bg-brand-500";

 return (
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-[12px] font-medium text-foreground">{label}</span>
 <span className="text-[11px] text-foreground-muted">
 {(used / 1000).toFixed(1)}K / {(limit / 1000).toFixed(0)}K {unit}
 </span>
 </div>
 <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
 <div
 className={cn("h-full rounded-full transition-all", color)}
 style={{ width: `${Math.min(percent, 100)}%` }}
 />
 </div>
 <div className="text-[10px] text-foreground-muted mt-1">
 {percent.toFixed(1)}% alreadyUsage
 </div>
 </div>
 );
}

// UsageMetrics
interface UsageMetricProps {
 label: string;
 value: string | number;
 highlight?: boolean;
}

function UsageMetric({ label, value, highlight }: UsageMetricProps) {
 return (
 <div>
 <div className="text-[10px] text-foreground-muted uppercase tracking-wide">{label}</div>
 <div className={cn("text-sm font-medium", highlight ? "text-warning" : "text-foreground")}>
 {value}
 </div>
 </div>
 );
}

// Loadrow
function LoadingRows({ count = 3 }: { count?: number }) {
 return (
 <div className="space-y-2">
 {Array.from({ length: count }).map((_, i) => (
 <div key={i} className="h-12 bg-surface-200 rounded-md animate-pulse" />
 ))}
 </div>
 );
}

// Empty StateMessage
interface EmptyMessageProps {
 text: string;
 action?: { label: string; href: string };
}

function EmptyMessage({ text, action }: EmptyMessageProps) {
 return (
 <div className="py-6 text-center">
 <p className="text-[12px] text-foreground-muted mb-2">{text}</p>
 {action && (
 <Link
 href={action.href}
 className="inline-flex items-center gap-1 text-[12px] text-brand-500 hover:text-brand-600 transition-colors"
 >
 <Plus className="w-3 h-3" />
 {action.label}
 </Link>
 )}
 </div>
 );
}
