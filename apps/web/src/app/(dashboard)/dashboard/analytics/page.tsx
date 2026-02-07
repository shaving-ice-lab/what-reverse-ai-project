"use client";

/**
 * UsageStatisticsAnalyticsPage - Supabase Dashboard Style
 * 2SidebarNavigation'sAnalyticsPage
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
 PageWithSidebar,
 SidebarNavGroup,
 SidebarNavItem,
 CategoryHeader,
} from "@/components/dashboard/page-layout";
import {
 Tabs,
 TabsList,
 TabsTrigger,
 TabsContent,
} from "@/components/ui/tabs";
import {
 ArrowDownRight,
 ArrowUpRight,
 Calendar,
 ChevronDown,
 Coins,
 Download,
 RefreshCw,
} from "lucide-react";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 SimpleBarChart,
 ComparisonBar,
 SimpleLineChart,
 SimplePieChart,
 Sparkline,
} from "@/components/charts/simple-charts";

// SidebarNavigationStructure
const navGroups = [
 {
 title: "OVERVIEW",
 items: [
 { id: "overview", label: "Overview", href: "#overview" },
 { id: "highlights", label: "UsageSnapshot", href: "#highlights" },
 ],
 },
 {
 title: "ANALYTICS",
 items: [
 { id: "trends", label: "UsageTrend", href: "#trends" },
 { id: "distribution", label: "ModelDistribution", href: "#distribution" },
 { id: "breakdown", label: "UsageDecompose", href: "#breakdown" },
 ],
 },
 {
 title: "DETAILS",
 items: [
 { id: "features", label: "FeaturesRanking", href: "#features" },
 { id: "daily", label: "eachdayStatistics", href: "#daily" },
 { id: "activities", label: "RecentActivity", href: "#activities" },
 ],
 },
 {
 title: "INSIGHTS",
 items: [{ id: "tips", label: "optimalSuggestion", href: "#tips" }],
 },
];

// TimeRangeOption
const timeRanges = [
 { id: "7d", label: "Recent 7 days" },
 { id: "30d", label: "Recent 30 days" },
 { id: "90d", label: "Recent 90 days" },
 { id: "12m", label: "Recent 12 months" },
];

// MockStatisticsData - version
const overviewStats = [
 {
 id: "conversations",
 label: "ConversationTotal",
 value: "2,847",
 change: 12.5,
 trend: "up" as const,
 sparkline: [30, 45, 38, 52, 48, 65, 72],
 },
 {
 id: "workflows",
 label: "WorkflowRun",
 value: "1,256",
 change: 8.3,
 trend: "up" as const,
 sparkline: [20, 35, 28, 42, 38, 55, 62],
 },
 {
 id: "agents",
 label: "Active Agent",
 value: "23",
 change: -2.1,
 trend: "down" as const,
 sparkline: [15, 18, 22, 19, 25, 23, 21],
 },
 {
 id: "tokens",
 label: "Token Consumption",
 value: "1.2M",
 change: 15.7,
 trend: "up" as const,
 sparkline: [45, 52, 48, 65, 72, 85, 92],
 },
];

// UsageTrendData
const usageTrendData = [
 { label: "1months", value: 1200 },
 { label: "2months", value: 1450 },
 { label: "3months", value: 1380 },
 { label: "4months", value: 1650 },
 { label: "5months", value: 1820 },
 { label: "6months", value: 2100 },
 { label: "7months", value: 2350 },
];

// Token UsageDistribution
const tokenDistribution = [
 { label: "GPT-4", value: 45, color: "text-brand-500" },
 { label: "Claude 3", value: 30, color: "text-foreground-light" },
 { label: "GPT-3.5", value: 15, color: "text-foreground-muted" },
 { label: "otherhe", value: 10, color: "text-foreground-lighter" },
];

// FeaturesUsageRanking
const featureUsage = [
 { name: "SmartConversation", usage: 2847, change: 12.5 },
 { name: "WorkflowAutomation", usage: 1256, change: 8.3 },
 { name: "DocumentAnalytics", usage: 892, change: 15.2 },
 { name: "CodeGenerate", usage: 654, change: -3.1 },
 { name: "DataProcess", usage: 423, change: 22.8 },
];

// eachdayUsageData
const dailyUsage = [
 { day: "weeks1", conversations: 420, workflows: 180 },
 { day: "weeks2", conversations: 380, workflows: 165 },
 { day: "weeks3", conversations: 450, workflows: 210 },
 { day: "weeks4", conversations: 520, workflows: 245 },
 { day: "weeks5", conversations: 480, workflows: 220 },
 { day: "weeks6", conversations: 280, workflows: 120 },
 { day: "weeksday", conversations: 250, workflows: 95 },
];

// RecentActivity
const recentActivities = [
 { type: "conversation", title: "ProductRequirementsDiscussion", time: "5minbefore", tokens: 1250 },
 { type: "workflow", title: "EmailAutoCategory", time: "12minbefore", tokens: 850 },
 { type: "agent", title: "WritingAssistantConversation", time: "25minbefore", tokens: 2100 },
 { type: "conversation", title: "TechnologyPlanReview", time: "1hbefore", tokens: 1800 },
 { type: "workflow", title: "DataSyncTask", time: "2hbefore", tokens: 450 },
] as const;

const optimizationTips = [
 {
 title: "Usage GPT-3.5 ProcessSimpleTask",
 description: "EstimatedcanSave 25% Token Consumption",
 impact: "Costoptimal",
 },
 {
 title: "EnableWorkflowCache",
 description: "fewre-Calculate, Improve 40% Speed",
 impact: "canImprove",
 },
 {
 title: "optimalPromptLength",
 description: "StreamlinePromptcanSave 15% Cost",
 impact: "rateImprove",
 },
];

const usageHighlights = [
 { label: "currentmonthsCost", value: "¥1,284", change: 12.4 },
 { label: "Activedayscount", value: "19/30", change: 4.3 },
 { label: "AutomationSave", value: "¥312", change: -8.1 },
];

const usageBudget = {
 used: 1284,
 limit: 2000,
};

const breakdownTabs = [
 {
 id: "conversations",
 label: "Conversation",
 description: "ConversationRequestatnotScenario'sDistribution",
 bars: [
 { label: "Product", value: 520 },
 { label: "Writing", value: 420 },
 { label: "Code", value: 360 },
 { label: "Data", value: 280 },
 { label: "Research", value: 210 },
 ],
 segments: [
 { label: "will", value: 42 },
 { label: "will", value: 28 },
 { label: "AutoSummary", value: 18 },
 { label: "time", value: 12 },
 ],
 kpis: [
 { label: "AverageResponse", value: "2.4s", change: -6.4 },
 { label: "Satisfaction", value: "92%", change: 1.8 },
 { label: "userate", value: "38%", change: 4.1 },
 ],
 },
 {
 id: "workflows",
 label: "Workflow",
 description: "AutomationTask'sTriggerandDoneSituation",
 bars: [
 { label: "Marketing", value: 320 },
 { label: "Data", value: 280 },
 { label: "Report", value: 210 },
 { label: "Support", value: 160 },
 { label: "", value: 110 },
 ],
 segments: [
 { label: "SuccessExecute", value: 86 },
 { label: "etcpendingApproval", value: 9 },
 { label: "FailedRetry", value: 5 },
 ],
 kpis: [
 { label: "AverageDuration", value: "3.1m", change: -12.2 },
 { label: "Success Rate", value: "94%", change: 2.7 },
 { label: "Savetime", value: "18h", change: 6.9 },
 ],
 },
 {
 id: "costs",
 label: "Cost",
 description: "Token UsageandCostDrivenSource",
 bars: [
 { label: "GPT-4", value: 540 },
 { label: "Claude 3", value: 360 },
 { label: "GPT-3.5", value: 210 },
 { label: "otherhe", value: 120 },
 ],
 segments: [
 { label: "Costwill", value: 44 },
 { label: "BatchTask", value: 31 },
 { label: "Cache", value: 17 },
 { label: "Worktime", value: 8 },
 ],
 kpis: [
 { label: "timesCost", value: "¥0.42", change: -4.8 },
 { label: "currentmonthsBudget", value: "64%", change: 8.3 },
 { label: "canSave", value: "¥128", change: -6.1 },
 ],
 },
];

// ActivityTypestyle
const activityTypeLabels = {
 conversation: "Conversation",
 workflow: "Workflow",
 agent: "Agent",
} as const;

export default function AnalyticsPage() {
 const [timeRange, setTimeRange] = useState("30d");
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [activeSection, setActiveSection] = useState("overview");

 const handleRefresh = () => {
 setIsRefreshing(true);
 setTimeout(() => setIsRefreshing(false), 1000);
 };

 const selectedRange = timeRanges.find((range) => range.id === timeRange);

 const peakPoint = usageTrendData.reduce((max, item) =>
 item.value > max.value ? item : max
 );
 const averageUsage = Math.round(
 usageTrendData.reduce((sum, item) => sum + item.value, 0) /
 usageTrendData.length
 );
 const growthRate =
 ((usageTrendData[usageTrendData.length - 1].value -
 usageTrendData[0].value) /
 usageTrendData[0].value) *
 100;

 const avgConversations = Math.round(
 dailyUsage.reduce((sum, item) => sum + item.conversations, 0) /
 dailyUsage.length
 );
 const avgWorkflows = Math.round(
 dailyUsage.reduce((sum, item) => sum + item.workflows, 0) / dailyUsage.length
 );
 const totalConversations = dailyUsage.reduce(
 (sum, item) => sum + item.conversations,
 0
 );
 const totalWorkflows = dailyUsage.reduce(
 (sum, item) => sum + item.workflows,
 0
 );
 const peakDay = dailyUsage.reduce((max, item) =>
 item.conversations > max.conversations ? item : max
 );

 // SidebarContent
 const sidebar = (
 <nav className="space-y-1">
 {navGroups.map((group) => (
 <SidebarNavGroup key={group.title} title={group.title}>
 {group.items.map((item) => (
 <SidebarNavItem
 key={item.id}
 href={item.href}
 label={item.label}
 active={activeSection === item.id}
 />
 ))}
 </SidebarNavGroup>
 ))}
 </nav>
 );

 return (
 <PageWithSidebar
 sidebar={sidebar}
 sidebarTitle="Analytics"
 sidebarWidth="narrow"
 >
 <div className="space-y-6 max-w-[960px]">
 {/* PageHeader */}
 <div className="space-y-1">
 <h1 className="text-xl font-medium text-foreground">UsageStatistics</h1>
 <p className="text-[13px] text-foreground-light">
 Trackyou'sUsageSituation, CostandWorkflowrate
 </p>
 </div>

 {/* Toolbar */}
 <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
 <div className="flex items-center gap-2 text-xs text-foreground-muted">
 <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
 <span>Real-timeMonitor</span>
 <span className="text-foreground-lighter">·</span>
 <span>Updateat 2 minbefore</span>
 </div>
 <div className="flex items-center gap-2">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 className="h-8 gap-1.5 text-[12px] border-border text-foreground-light hover:text-foreground hover:bg-surface-100/60"
 >
 <Calendar className="w-3.5 h-3.5" />
 {selectedRange?.label}
 <ChevronDown className="w-3.5 h-3.5" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent
 align="end"
 className="bg-surface-100 border-border"
 >
 {timeRanges.map((range) => (
 <DropdownMenuItem
 key={range.id}
 onClick={() => setTimeRange(range.id)}
 className="text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-100/60"
 >
 {range.label}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>

 <Button
 variant="outline"
 size="sm"
 onClick={handleRefresh}
 className="h-8 gap-1.5 text-[12px] border-border text-foreground-light hover:text-foreground hover:bg-surface-100/60"
 >
 <RefreshCw
 className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")}
 />
 Refresh
 </Button>

 <Button
 variant="outline"
 size="sm"
 className="h-8 gap-1.5 text-[12px] border-border text-foreground-light hover:text-foreground hover:bg-surface-100/60"
 >
 <Download className="w-3.5 h-3.5" />
 Export
 </Button>
 </div>
 </div>

 {/* UsageSnapshot */}
 <section id="highlights" className="space-y-3">
 <CategoryHeader>UsageSnapshot</CategoryHeader>
 <div className="rounded-md border border-border bg-surface-100 p-4">
 <div className="grid grid-cols-3 gap-0 divide-x divide-border">
 {usageHighlights.map((item) => (
 <div key={item.label} className="px-4 first:pl-0 last:pr-0">
 <p className="text-[11px] text-foreground-muted uppercase tracking-wide mb-1">
 {item.label}
 </p>
 <div className="flex items-center justify-between">
 <p className="text-sm font-medium text-foreground tabular-nums">
 {item.value}
 </p>
 <span
 className={cn(
 "text-[11px] tabular-nums",
 item.change >= 0
 ? "text-brand-500"
 : "text-destructive"
 )}
 >
 {item.change >= 0 ? "+" : ""}
 {item.change}%
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* OverviewStatistics */}
 <section id="overview" className="space-y-3">
 <CategoryHeader>Overview</CategoryHeader>
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
 {overviewStats.map((stat) => {
 const TrendIcon =
 stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
 return (
 <div
 key={stat.id}
 className="rounded-md border border-border bg-surface-100 p-4 transition-colors hover:border-border-strong"
 >
 <div className="flex items-start justify-between mb-3">
 <div>
 <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
 {stat.label}
 </p>
 <p className="text-lg font-semibold text-foreground tabular-nums mt-0.5">
 {stat.value}
 </p>
 </div>
 <span
 className={cn(
 "flex items-center text-[11px] tabular-nums",
 stat.trend === "up"
 ? "text-brand-500"
 : "text-destructive"
 )}
 >
 <TrendIcon className="w-3 h-3" />
 {Math.abs(stat.change)}%
 </span>
 </div>
 <Sparkline
 data={stat.sparkline}
 color="stroke-brand-500"
 width={100}
 height={24}
 showDot={false}
 className="opacity-70"
 />
 </div>
 );
 })}
 </div>
 </section>

 {/* UsageTrend */}
 <section id="trends" className="space-y-3">
 <div className="flex items-center justify-between">
 <CategoryHeader>UsageTrend</CategoryHeader>
 <div className="flex items-center gap-3 text-[11px] text-foreground-muted">
 <span className="flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
 Conversation
 </span>
 <span>Average {averageUsage.toLocaleString()} / months</span>
 </div>
 </div>
 <div className="rounded-md border border-border bg-surface-100 p-5">
 <SimpleLineChart
 data={usageTrendData}
 height={220}
 strokeColor="stroke-brand-500"
 fillColor="fill-brand-500/10"
 showDots={false}
 showGrid
 />
 <div className="mt-4 grid grid-cols-3 gap-3">
 <div className="rounded-md bg-surface-75 px-3 py-2">
 <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
 value
 </p>
 <p className="text-sm font-medium text-foreground tabular-nums">
 {peakPoint.value.toLocaleString()} · {peakPoint.label}
 </p>
 </div>
 <div className="rounded-md bg-surface-75 px-3 py-2">
 <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
 Growth
 </p>
 <p
 className={cn(
 "text-sm font-medium tabular-nums",
 growthRate >= 0 ? "text-brand-500" : "text-destructive"
 )}
 >
 {growthRate >= 0 ? "+" : ""}
 {growthRate.toFixed(1)}%
 </p>
 </div>
 <div className="rounded-md bg-surface-75 px-3 py-2">
 <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
 Recent
 </p>
 <p className="text-sm font-medium text-foreground tabular-nums">
 {usageTrendData[usageTrendData.length - 1].value.toLocaleString()}
 </p>
 </div>
 </div>
 </div>
 </section>

 {/* ModelDistribution */}
 <section id="distribution" className="space-y-3">
 <CategoryHeader>ModelDistribution</CategoryHeader>
 <div className="rounded-md border border-border bg-surface-100 p-5">
 <div className="grid lg:grid-cols-2 gap-6">
 <div className="flex justify-center">
 <SimplePieChart
 data={tokenDistribution}
 size={160}
 donut
 showLegend={false}
 />
 </div>
 <div className="space-y-3">
 {tokenDistribution.map((item) => (
 <div
 key={item.label}
 className="flex items-center justify-between text-[12px]"
 >
 <span className="flex items-center gap-2 text-foreground">
 <span
 className={cn(
 "w-2 h-2 rounded-full bg-current",
 item.color
 )}
 />
 {item.label}
 </span>
 <span className="text-foreground-light tabular-nums">
 {item.value}%
 </span>
 </div>
 ))}
 <div className="pt-3 mt-3 border-t border-border">
 <div className="flex items-center justify-between text-[11px] text-foreground-muted mb-2">
 <span>currentmonthsBudget</span>
 <span className="tabular-nums">
 ¥{usageBudget.used} / ¥{usageBudget.limit}
 </span>
 </div>
 <div className="h-1.5 rounded-full bg-surface-300 overflow-hidden">
 <div
 className="h-full bg-brand-500"
 style={{
 width: `${Math.min(
 (usageBudget.used / usageBudget.limit) * 100,
 100
 )}%`,
 }}
 />
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* UsageDecompose */}
 <section id="breakdown" className="space-y-3">
 <CategoryHeader>UsageDecompose</CategoryHeader>
 <Tabs defaultValue="conversations" className="w-full">
 <div className="rounded-md border border-border bg-surface-100">
 <div className="px-5 pt-4 pb-0 border-b border-border">
 <TabsList
 variant="underline"
 size="sm"
 className="w-full justify-start"
 >
 {breakdownTabs.map((tab) => (
 <TabsTrigger
 key={tab.id}
 value={tab.id}
 variant="underline"
 className="text-[12px]"
 >
 {tab.label}
 </TabsTrigger>
 ))}
 </TabsList>
 </div>
 <div className="p-5">
 {breakdownTabs.map((tab) => (
 <TabsContent key={tab.id} value={tab.id} className="mt-0">
 <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
 <div>
 <p className="text-[12px] text-foreground-light mb-3">
 {tab.description}
 </p>
 <SimpleBarChart
 data={tab.bars.map((item) => ({
 ...item,
 color: "bg-brand-500",
 }))}
 height={160}
 showValues={false}
 />
 <div className="mt-4 grid grid-cols-3 gap-3">
 {tab.kpis.map((kpi) => (
 <div
 key={kpi.label}
 className="rounded-md bg-surface-75 px-3 py-2"
 >
 <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
 {kpi.label}
 </p>
 <div className="flex items-center justify-between mt-0.5">
 <span className="text-sm font-medium text-foreground tabular-nums">
 {kpi.value}
 </span>
 <span
 className={cn(
 "text-[10px] tabular-nums",
 kpi.change >= 0
 ? "text-brand-500"
 : "text-destructive"
 )}
 >
 {kpi.change >= 0 ? "+" : ""}
 {kpi.change}%
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 <div className="space-y-2">
 <p className="text-[11px] text-foreground-muted uppercase tracking-wide mb-2">
 compare
 </p>
 {tab.segments.map((segment) => (
 <div
 key={segment.label}
 className="rounded-md bg-surface-75 px-3 py-2"
 >
 <div className="flex items-center justify-between text-[12px] text-foreground-light mb-1.5">
 <span>{segment.label}</span>
 <span className="tabular-nums">{segment.value}%</span>
 </div>
 <div className="h-1 rounded-full bg-surface-300 overflow-hidden">
 <div
 className="h-full bg-brand-500"
 style={{ width: `${segment.value}%` }}
 />
 </div>
 </div>
 ))}
 </div>
 </div>
 </TabsContent>
 ))}
 </div>
 </div>
 </Tabs>
 </section>

 {/* FeaturesRankingandeachdayStatistics */}
 <div className="grid lg:grid-cols-2 gap-4">
 {/* FeaturesRanking */}
 <section id="features" className="space-y-3">
 <CategoryHeader>FeaturesRanking</CategoryHeader>
 <div className="rounded-md border border-border bg-surface-100">
 <div className="px-4 py-2.5 border-b border-border flex items-center justify-between text-[11px] text-foreground-muted uppercase tracking-wide">
 <span>Features</span>
 <span></span>
 </div>
 <div className="divide-y divide-border">
 {featureUsage.map((feature, index) => (
 <div
 key={feature.name}
 className="flex items-center gap-3 px-4 py-3 hover:bg-surface-100/60 transition-colors"
 >
 <span className="w-5 text-[11px] text-foreground-muted text-center tabular-nums">
 {index + 1}
 </span>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between mb-1">
 <span className="text-[12px] font-medium text-foreground truncate">
 {feature.name}
 </span>
 <span className="text-[11px] text-foreground-light tabular-nums ml-2">
 {feature.usage.toLocaleString()}
 </span>
 </div>
 <div className="h-1 bg-surface-300 rounded-full overflow-hidden">
 <div
 className="h-full bg-brand-500 rounded-full"
 style={{
 width: `${(feature.usage / featureUsage[0].usage) * 100}%`,
 }}
 />
 </div>
 </div>
 <span
 className={cn(
 "text-[11px] tabular-nums",
 feature.change >= 0
 ? "text-brand-500"
 : "text-destructive"
 )}
 >
 {feature.change >= 0 ? "+" : ""}
 {feature.change}%
 </span>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* eachdayStatistics */}
 <section id="daily" className="space-y-3">
 <CategoryHeader>eachdayStatistics</CategoryHeader>
 <div className="rounded-md border border-border bg-surface-100 p-5">
 <SimpleBarChart
 data={dailyUsage.map((item) => ({
 label: item.day,
 value: item.conversations,
 color: "bg-brand-500",
 }))}
 height={180}
 showValues={false}
 />
 <div className="mt-4 grid grid-cols-3 gap-3">
 <div className="rounded-md bg-surface-75 px-3 py-2">
 <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
 dayConversation
 </p>
 <p className="text-sm font-medium text-foreground tabular-nums">
 {avgConversations}
 </p>
 </div>
 <div className="rounded-md bg-surface-75 px-3 py-2">
 <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
 dayWorkflow
 </p>
 <p className="text-sm font-medium text-foreground tabular-nums">
 {avgWorkflows}
 </p>
 </div>
 <div className="rounded-md bg-surface-75 px-3 py-2">
 <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
 valueday
 </p>
 <p className="text-sm font-medium text-foreground tabular-nums">
 {peakDay.day}
 </p>
 </div>
 </div>
 <div className="mt-4 pt-3 border-t border-border">
 <ComparisonBar
 value1={totalConversations}
 value2={totalWorkflows}
 label1="Conversation"
 label2="Workflow"
 color1="bg-brand-500"
 color2="bg-surface-300"
 />
 </div>
 </div>
 </section>
 </div>

 {/* RecentActivity */}
 <section id="activities" className="space-y-3">
 <CategoryHeader>RecentActivity</CategoryHeader>
 <div className="rounded-md border border-border bg-surface-100">
 <div className="px-4 py-2.5 border-b border-border flex items-center justify-between text-[11px] text-foreground-muted uppercase tracking-wide">
 <span>Activity</span>
 <span>Token Consumption</span>
 </div>
 <div className="divide-y divide-border">
 {recentActivities.map((activity, index) => (
 <div
 key={index}
 className="flex items-center justify-between px-4 py-3 hover:bg-surface-100/60 transition-colors"
 >
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-1 h-8 rounded-full bg-brand-500/60" />
 <div className="min-w-0">
 <p className="text-[12px] font-medium text-foreground truncate">
 {activity.title}
 </p>
 <p className="text-[11px] text-foreground-muted">
 {activityTypeLabels[activity.type]} · {activity.time}
 </p>
 </div>
 </div>
 <span className="text-[12px] text-foreground-light tabular-nums flex items-center gap-1">
 <Coins className="w-3 h-3" />
 {activity.tokens.toLocaleString()}
 </span>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* optimalSuggestion */}
 <section id="tips" className="space-y-3">
 <CategoryHeader>optimalSuggestion</CategoryHeader>
 <div className="rounded-md border border-border bg-surface-100 p-5">
 <div className="grid md:grid-cols-3 gap-4">
 {optimizationTips.map((tip) => (
 <div
 key={tip.title}
 className="rounded-md border border-border/70 bg-surface-75 p-4"
 >
 <p className="text-[11px] text-foreground-muted uppercase tracking-wide mb-2">
 {tip.impact}
 </p>
 <p className="text-[13px] font-medium text-foreground mb-1">
 {tip.title}
 </p>
 <p className="text-[12px] text-foreground-light">
 {tip.description}
 </p>
 </div>
 ))}
 </div>
 <div className="mt-4 flex items-center justify-between text-[12px] text-foreground-light pt-4 border-t border-border">
 <span>EstimatedcanSave 15% - 25% Cost</span>
 <Button
 variant="outline"
 size="sm"
 className="h-8 text-[12px] border-brand-500/50 text-brand-500 hover:bg-brand-500/10"
 >
 ViewDetailedSuggestion
 </Button>
 </div>
 </div>
 </section>
 </div>
 </PageWithSidebar>
 );
}
