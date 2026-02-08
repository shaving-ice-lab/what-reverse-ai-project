"use client";

/**
 * Creator Data Analytics Page
 *
 * Supabase Style: Minimal, Professional, Data Visualization
 */

import { useState } from "react";
import {
 BarChart3,
 TrendingUp,

 TrendingDown,

 Users,

 Eye,

 Star,

 Download,

 Calendar,

 Filter,

 RefreshCw,

 ChevronDown,

 ArrowUpRight,

 Zap,

 Clock,

 Target,

 Award,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";

// Time Range Options

const timeRanges = [

 { id: "7d", label: "Recent 7 days" },

 { id: "30d", label: "Recent 30 days" },

 { id: "90d", label: "Recent 90 days" },

  { id: "1y", label: "Recent 1 year" },

];

// Overview Statistics

const overviewStats = [

 {
 label: "Total Views",

 value: "125,678",

 change: "+12.5%",

 trend: "up",

 icon: Eye,

    description: "Increased by 14,230",

 },

 {
 label: "Unique Visitors",

 value: "45,892",

 change: "+8.3%",

 trend: "up",

 icon: Users,

    description: "Increased by 3,521",

 },

 {
 label: "Average rating",

 value: "4.8",

 change: "+0.2",

 trend: "up",

 icon: Star,

 description: " 2,345 Reviews",

 },

 {
    label: "Usage Count",

    value: "89,234",

    change: "+15.7%",

    trend: "up",

    icon: Zap,

    description: "Increased by 12,156",

 },

];

// Popular Works

const topWorks = [

 {
 id: "1",

 title: "Smart support assistant template",

 type: "Template",

 views: 12580,

 uses: 3456,

 rating: 4.9,

 trend: "+23%",

 },

 {
 id: "2",

 title: "Data sync workflow",

 type: "Workflow",

 views: 8920,

 uses: 2134,

 rating: 4.8,

 trend: "+18%",

 },

 {
 id: "3",

 title: "Email auto-reply agent",

 type: "Agent",

 views: 7650,

 uses: 1890,

 rating: 4.7,

 trend: "+15%",

 },

 {
 id: "4",

 title: "Report generation template",

 type: "Template",

 views: 6234,

 uses: 1567,

 rating: 4.6,

 trend: "+12%",

 },

 {
 id: "5",

 title: "Social media management workflow",

 type: "Workflow",

 views: 5890,

 uses: 1234,

 rating: 4.5,

 trend: "+10%",

 },

];

// Traffic Sources

const trafficSources = [

 { source: "Search", percentage: 35, color: "bg-brand-500" },

 { source: "Recommended", percentage: 28, color: "bg-brand-400" },

  { source: "Category Browse", percentage: 22, color: "bg-surface-300" },

  { source: "Direct Access", percentage: 10, color: "bg-brand-400" },

 { source: "Other", percentage: 5, color: "bg-surface-200" },

];

// Daily data

const dailyData = [

 { date: "01-24", views: 4520, uses: 1230, revenue: 245 },

 { date: "01-25", views: 5120, uses: 1450, revenue: 312 },

 { date: "01-26", views: 4890, uses: 1320, revenue: 278 },

 { date: "01-27", views: 6230, uses: 1780, revenue: 456 },

 { date: "01-28", views: 5670, uses: 1560, revenue: 389 },

 { date: "01-29", views: 7120, uses: 1920, revenue: 523 },

 { date: "01-30", views: 7890, uses: 2150, revenue: 612 },

];

// Target

const goals = [

 { label: "Monthly browse target", current: 125678, target: 150000, unit: "times" },

 { label: "Add user target", current: 3521, target: 5000, unit: "person" },

 { label: "Earnings target", current: 2815, target: 4000, unit: "" },

];

export default function CreatorAnalyticsPage() {
 const [selectedRange, setSelectedRange] = useState("30d");

 const [activeMetric, setActiveMetric] = useState<"views" | "uses" | "revenue">("views");

 // Get chart max value

 const maxValue = Math.max(...dailyData.map((d) => d[activeMetric]));

 return (
 <PageContainer>
 <div className="max-w-6xl mx-auto space-y-6">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md bg-brand-200/60 flex items-center justify-center">
 <BarChart3 className="w-4 h-4 text-brand-500" />
 </div>
 <div className="page-caption">Creator</div>
 </div>
 <PageHeader
 title="Data analytics"
 backHref="/dashboard/creator"
 backLabel="Back"
 actions={(
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1 p-1 rounded-md bg-surface-200">
 {timeRanges.map((range) => (
 <button
 key={range.id}
 onClick={() => setSelectedRange(range.id)}
 className={cn(
 "px-3 py-1.5 rounded-md text-[13px] font-medium transition-all",
 selectedRange === range.id
 ? "bg-surface-100 text-foreground shadow-sm"
 : "text-foreground-muted hover:text-foreground"
 )}
 >
 {range.label}
 </button>
 ))}
 </div>
 <Button variant="outline" size="sm" className="border-border text-foreground-light">
 <Download className="w-4 h-4 mr-2" />
              Export Report
 </Button>
 </div>
 )}
 />

 {/* Content */}

 <div className="space-y-6">

 {/* Overview Stats */}

 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

 {overviewStats.map((stat) => (
 <div

 key={stat.label}

 className="page-panel p-6"

 >

 <div className="flex items-center justify-between mb-3">

 <stat.icon className="w-4 h-4 text-brand-500" />

 <span className={cn(
 "flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md",

 stat.trend === "up"

 ? "bg-brand-200 text-brand-500"

 : "bg-destructive-200 text-destructive"

 )}>

 {stat.trend === "up" ? (
 <TrendingUp className="w-3 h-3" />

 ) : (
 <TrendingDown className="w-3 h-3" />

 )}

 {stat.change}

 </span>

 </div>

 <div className="text-xl font-semibold text-foreground mb-1">

 {stat.value}

 </div>

 <div className="text-[13px] text-foreground-light">

 {stat.label}

 </div>

 <div className="text-xs text-foreground-muted mt-2">

 {stat.description}

 </div>

 </div>

 ))}

 </div>

 <div className="grid lg:grid-cols-3 gap-6 mb-8">

 {/* Chart */}

 <div className="lg:col-span-2 page-panel p-6">

 <div className="flex items-center justify-between mb-6">

 <h3 className="page-panel-title">Trend analytics</h3>

 <div className="flex items-center gap-1 p-1 rounded-md bg-surface-200">

 {[

 { id: "views" as const, label: "Browse" },

                { id: "uses" as const, label: "Usage Count" },

 { id: "revenue" as const, label: "Earnings" },

 ].map((metric) => (
 <button

 key={metric.id}

 onClick={() => setActiveMetric(metric.id)}

 className={cn(
 "px-3 py-1 rounded-md text-xs font-medium transition-all",

 activeMetric === metric.id

 ? "bg-surface-100 text-foreground shadow-sm"

 : "text-foreground-muted hover:text-foreground"

 )}

 >

 {metric.label}

 </button>

 ))}

 </div>

 </div>

 {/* Simple Bar Chart */}

 <div className="space-y-3">

 {dailyData.map((data) => (
 <div key={data.date} className="flex items-center gap-4">

 <span className="text-xs text-foreground-muted w-12">

 {data.date}

 </span>

 <div className="flex-1 h-6 bg-surface-200 rounded-full overflow-hidden">

 <div

 className="h-full bg-brand-500 rounded-full transition-all"

 style={{ width: `${(data[activeMetric] / maxValue) * 100}%` }}

 />

 </div>

 <span className="text-[13px] font-medium text-foreground w-16 text-right">

 {activeMetric === "revenue" ? `${data[activeMetric]}` : data[activeMetric].toLocaleString()}

 </span>

 </div>

 ))}

 </div>

 </div>

 {/* Traffic Sources */}

 <div className="page-panel p-6">

 <h3 className="page-panel-title mb-6">Source</h3>

 <div className="space-y-4">

 {trafficSources.map((source) => (
 <div key={source.source}>

 <div className="flex items-center justify-between mb-2">

 <span className="text-[13px] text-foreground">{source.source}</span>

 <span className="text-[13px] font-medium text-foreground">

 {source.percentage}%

 </span>

 </div>

 <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">

 <div

 className={cn("h-full rounded-full", source.color)}

 style={{ width: `${source.percentage}%` }}

 />

 </div>

 </div>

 ))}

 </div>

 </div>

 </div>

 <div className="grid lg:grid-cols-2 gap-6">

 {/* Top Works */}

 <div className="page-panel p-6">

 <div className="flex items-center justify-between mb-6">

 <h3 className="page-panel-title">Popular work</h3>

 <Button variant="ghost" size="sm" className="text-foreground-light">

 View all

 <ArrowUpRight className="w-4 h-4 ml-1" />

 </Button>

 </div>

 <div className="space-y-4">

 {topWorks.map((work, index) => (
 <div

 key={work.id}

 className="flex items-center gap-4 p-3 rounded-md hover:bg-surface-75 transition-colors"

 >

 <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center text-[13px] font-bold text-foreground-muted">

 {index + 1}

 </div>

 <div className="flex-1 min-w-0">

 <div className="text-[13px] font-medium text-foreground truncate">

 {work.title}

 </div>

 <div className="text-xs text-foreground-muted">

 {work.type}

 </div>

 </div>

 <div className="text-right">

 <div className="text-[13px] font-medium text-foreground">

                {work.views.toLocaleString()} views

 </div>

 <div className="text-xs text-brand-500">{work.trend}</div>

 </div>

 </div>

 ))}

 </div>

 </div>

 {/* Goals Progress */}

 <div className="page-panel p-6">

 <div className="flex items-center justify-between mb-6">

 <h3 className="page-panel-title">Target</h3>

              <span className="text-xs text-foreground-muted">Current month</span>

 </div>

 <div className="space-y-6">

 {goals.map((goal) => {
 const percentage = Math.min((goal.current / goal.target) * 100, 100);

 return (
 <div key={goal.label}>

 <div className="flex items-center justify-between mb-2">

 <span className="text-[13px] text-foreground">{goal.label}</span>

 <span className="text-xs text-foreground-muted">

 {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}

 </span>

 </div>

 <div className="h-2 bg-surface-200 rounded-full overflow-hidden">

 <div

 className={cn(
 "h-full rounded-full transition-all",

 percentage >= 100 ? "bg-brand-500" : percentage >= 70 ? "bg-brand-500" : "bg-brand-400"

 )}

 style={{ width: `${percentage}%` }}

 />

 </div>

 <div className="text-xs text-foreground-muted mt-1">

 Done {percentage.toFixed(1)}%

 </div>

 </div>

 );

 })}

 </div>

 {/* Tips */}

 <div className="mt-6 p-4 rounded-md bg-brand-200/60 border border-brand-500/30">

 <div className="flex items-start gap-3">

 <Target className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />

 <div>

                  <h4 className="text-[13px] font-medium text-foreground mb-1">Optimization Suggestion</h4>

 <p className="text-xs text-foreground-light">

 Your template usage increased this week. Publish new work to get more exposure.

 </p>

 </div>

 </div>

 </div>

 </div>

 </div>

 {/* Insights */}

 <div className="mt-8 page-panel p-6">

 <h3 className="page-panel-title mb-6">Data insights</h3>

 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

 {[

 {
 icon: Clock,

              title: "Peak publish time",

              value: "Wed 10:00 AM",

 description: "Time when published work gets most views",

 },

 {
 icon: Users,

 title: "User retention rate",

 value: "68.5%",

 description: "Compare your past work usage with other users",

 },

 {
 icon: Star,

 title: "Reviews response rate",

 value: "92%",

 description: "Your reply to user reviews (comparison example)",

 },

 {
 icon: Award,

 title: "Creative user ranking",

 value: "Top 5%",

 description: "Your ranking among all creative users",

 },

 ].map((insight) => (
 <div key={insight.title} className="p-4 rounded-md bg-surface-75">

 <insight.icon className="w-4 h-4 text-brand-500 mb-3" />

 <div className="text-base font-semibold text-foreground mb-1">

 {insight.value}

 </div>

 <div className="text-[13px] font-medium text-foreground mb-1">

 {insight.title}

 </div>

 <div className="text-xs text-foreground-muted">

 {insight.description}

 </div>

 </div>

 ))}

 </div>

 </div>

 </div>

 </div>
 </PageContainer>

 );
}

