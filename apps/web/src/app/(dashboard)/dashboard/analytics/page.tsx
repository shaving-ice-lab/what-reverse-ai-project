"use client";

/**
 * Usage Statistics Analytics Page - Supabase Dashboard Style
 * Analytics page with dual sidebar navigation
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

// Sidebar Navigation Structure
const navGroups = [
 {
 title: "OVERVIEW",
 items: [
 { id: "overview", label: "Overview", href: "#overview" },
      { id: "highlights", label: "Usage Snapshot", href: "#highlights" },
 ],
 },
 {
 title: "ANALYTICS",
 items: [
      { id: "trends", label: "Usage Trends", href: "#trends" },
      { id: "distribution", label: "Model Distribution", href: "#distribution" },
      { id: "breakdown", label: "Usage Breakdown", href: "#breakdown" },
 ],
 },
 {
 title: "DETAILS",
 items: [
      { id: "features", label: "Feature Ranking", href: "#features" },
      { id: "daily", label: "Daily Statistics", href: "#daily" },
      { id: "activities", label: "Recent Activity", href: "#activities" },
 ],
 },
 {
 title: "INSIGHTS",
    items: [{ id: "tips", label: "Optimization Tips", href: "#tips" }],
 },
];

// Time Range Options
const timeRanges = [
 { id: "7d", label: "Recent 7 days" },
 { id: "30d", label: "Recent 30 days" },
 { id: "90d", label: "Recent 90 days" },
 { id: "12m", label: "Recent 12 months" },
];

// Mock Statistics Data
const overviewStats = [
 {
 id: "conversations",
    label: "Total Conversations",
 value: "2,847",
 change: 12.5,
 trend: "up" as const,
 sparkline: [30, 45, 38, 52, 48, 65, 72],
 },
 {
 id: "workflows",
    label: "Workflow Runs",
 value: "1,256",
 change: 8.3,
 trend: "up" as const,
 sparkline: [20, 35, 28, 42, 38, 55, 62],
 },
 {
 id: "agents",
 label: "Active Agents",
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

// Usage Trend Data
const usageTrendData = [
 { label: "Jan", value: 1200 },
 { label: "Feb", value: 1450 },
 { label: "Mar", value: 1380 },
 { label: "Apr", value: 1650 },
 { label: "May", value: 1820 },
 { label: "Jun", value: 2100 },
 { label: "Jul", value: 2350 },
];

// Token Usage Distribution
const tokenDistribution = [
 { label: "GPT-4", value: 45, color: "text-brand-500" },
 { label: "Claude 3", value: 30, color: "text-foreground-light" },
 { label: "GPT-3.5", value: 15, color: "text-foreground-muted" },
 { label: "Other", value: 10, color: "text-foreground-lighter" },
];

// Features Usage Ranking
const featureUsage = [
 { name: "Smart Conversation", usage: 2847, change: 12.5 },
 { name: "Workflow Automation", usage: 1256, change: 8.3 },
 { name: "Document Analytics", usage: 892, change: 15.2 },
 { name: "Code Generation", usage: 654, change: -3.1 },
 { name: "Data Processing", usage: 423, change: 22.8 },
];

// Daily usage data
const dailyUsage = [
 { day: "Mon", conversations: 420, workflows: 180 },
 { day: "Tue", conversations: 380, workflows: 165 },
 { day: "Wed", conversations: 450, workflows: 210 },
 { day: "Thu", conversations: 520, workflows: 245 },
 { day: "Fri", conversations: 480, workflows: 220 },
 { day: "Sat", conversations: 280, workflows: 120 },
 { day: "Sun", conversations: 250, workflows: 95 },
];

// Recent Activity
const recentActivities = [
 { type: "conversation", title: "Product Requirements Discussion", time: "5 min ago", tokens: 1250 },
 { type: "workflow", title: "Email Auto Categorization", time: "12 min ago", tokens: 850 },
 { type: "agent", title: "Writing Assistant Conversation", time: "25 min ago", tokens: 2100 },
 { type: "conversation", title: "Technical Plan Review", time: "1h ago", tokens: 1800 },
 { type: "workflow", title: "Data Sync Task", time: "2h ago", tokens: 450 },
] as const;

const optimizationTips = [
 {
    title: "Use GPT-3.5 for Simple Tasks",
    description: "Could save up to 25% on token consumption",
    impact: "Cost Savings",
 },
 {
    title: "Enable Workflow Caching",
    description: "Reduce recalculations and improve speed by 40%",
    impact: "Performance",
 },
 {
    title: "Optimize Prompt Length",
    description: "Streamlined prompts can save 15% in costs",
    impact: "Efficiency",
 },
];

const usageHighlights = [
 { label: "Monthly Cost", value: "¥1,284", change: 12.4 },
 { label: "Active Days", value: "19/30", change: 4.3 },
 { label: "Automation Savings", value: "¥312", change: -8.1 },
];

const usageBudget = {
 used: 1284,
 limit: 2000,
};

const breakdownTabs = [
 {
 id: "conversations",
 label: "Conversation",
    description: "Distribution of conversation requests across scenarios",
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
      { label: "Auto Summary", value: 18 },
 { label: "time", value: 12 },
 ],
 kpis: [
      { label: "Avg Response", value: "2.4s", change: -6.4 },
 { label: "Satisfaction", value: "92%", change: 1.8 },
      { label: "Usage Rate", value: "38%", change: 4.1 },
 ],
 },
 {
 id: "workflows",
 label: "Workflow",
    description: "Automation task trigger and completion status",
 bars: [
 { label: "Marketing", value: 320 },
 { label: "Data", value: 280 },
 { label: "Report", value: 210 },
 { label: "Support", value: 160 },
 { label: "", value: 110 },
 ],
 segments: [
      { label: "Successful", value: 86 },
      { label: "Pending Approval", value: 9 },
      { label: "Failed/Retry", value: 5 },
 ],
 kpis: [
      { label: "Avg Duration", value: "3.1m", change: -12.2 },
 { label: "Success Rate", value: "94%", change: 2.7 },
      { label: "Time Saved", value: "18h", change: 6.9 },
 ],
 },
 {
 id: "costs",
 label: "Cost",
    description: "Token usage and cost drivers by source",
 bars: [
 { label: "GPT-4", value: 540 },
 { label: "Claude 3", value: 360 },
 { label: "GPT-3.5", value: 210 },
      { label: "Other", value: 120 },
 ],
 segments: [
      { label: "On-demand", value: 44 },
      { label: "Batch Tasks", value: 31 },
 { label: "Cache", value: 17 },
      { label: "Work hours", value: 8 },
 ],
 kpis: [
      { label: "Cost per Request", value: "¥0.42", change: -4.8 },
      { label: "Monthly Budget", value: "64%", change: 8.3 },
      { label: "Potential Savings", value: "¥128", change: -6.1 },
 ],
 },
];

// Activity Type Style
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

 // Sidebar Content
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
 {/* Page Header */}
 <div className="space-y-1">
    <h1 className="text-xl font-medium text-foreground">Usage Statistics</h1>
    <p className="text-[13px] text-foreground-light">
          Track your usage, costs, and workflow performance
 </p>
 </div>

 {/* Toolbar */}
 <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
 <div className="flex items-center gap-2 text-xs text-foreground-muted">
 <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          <span>Real-time monitoring</span>
          <span className="text-foreground-lighter">·</span>
          <span>Updated 2 min ago</span>
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

 {/* Usage Snapshot */}
 <section id="highlights" className="space-y-3">
        <CategoryHeader>Usage Snapshot</CategoryHeader>
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

 {/* Overview Statistics */}
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

 {/* Usage Trend */}
 <section id="trends" className="space-y-3">
 <div className="flex items-center justify-between">
          <CategoryHeader>Usage Trends</CategoryHeader>
 <div className="flex items-center gap-3 text-[11px] text-foreground-muted">
 <span className="flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
 Conversation
 </span>
            <span>Average {averageUsage.toLocaleString()} / month</span>
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
                Peak
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

 {/* Model Distribution */}
 <section id="distribution" className="space-y-3">
        <CategoryHeader>Model Distribution</CategoryHeader>
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
                <span>Monthly Budget</span>
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

 {/* Usage Breakdown */}
 <section id="breakdown" className="space-y-3">
        <CategoryHeader>Usage Breakdown</CategoryHeader>
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

 {/* Features ranking and daily statistics */}
 <div className="grid lg:grid-cols-2 gap-4">
 {/* Features ranking */}
 <section id="features" className="space-y-3">
          <CategoryHeader>Feature Ranking</CategoryHeader>
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

 {/* Daily statistics */}
 <section id="daily" className="space-y-3">
          <CategoryHeader>Daily Statistics</CategoryHeader>
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
                  Daily Conversations
 </p>
 <p className="text-sm font-medium text-foreground tabular-nums">
 {avgConversations}
 </p>
 </div>
 <div className="rounded-md bg-surface-75 px-3 py-2">
 <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
                  Daily Workflows
 </p>
 <p className="text-sm font-medium text-foreground tabular-nums">
 {avgWorkflows}
 </p>
 </div>
 <div className="rounded-md bg-surface-75 px-3 py-2">
 <p className="text-[11px] text-foreground-muted uppercase tracking-wide">
                  Peak Day
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

 {/* Recent Activity */}
 <section id="activities" className="space-y-3">
        <CategoryHeader>Recent Activity</CategoryHeader>
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

 {/* Optimization Suggestions */}
 <section id="tips" className="space-y-3">
        <CategoryHeader>Optimization Tips</CategoryHeader>
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
            <span>Estimated savings of 15% - 25% on costs</span>
 <Button
 variant="outline"
 size="sm"
 className="h-8 text-[12px] border-brand-500/50 text-brand-500 hover:bg-brand-500/10"
 >
              View Detailed Suggestions
 </Button>
 </div>
 </div>
 </section>
 </div>
 </PageWithSidebar>
 );
}
