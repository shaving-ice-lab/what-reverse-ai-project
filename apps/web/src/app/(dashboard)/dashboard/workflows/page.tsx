"use client";

/**
 * WorkflowListPage
 * Supabase Settings Style: EdgeNavigation + Right sideContentPanelLayout
 * Reference STYLE-TERMINAL-PIXEL.md MinimalTextstyleStandard
 */

import { useState } from "react";
import Link from "next/link";
import {
 Activity,
 ArrowUpDown,
 Download,
 Zap,
 Plus,
 Search,
 MoreVertical,
 Play,
 Pause,
 Edit,
 Trash2,
 Copy,
 Clock,
 CheckCircle,
 AlertTriangle,
 LayoutGrid,
 List,
 Folder,
 Star,
 ChevronDown,
} from "lucide-react";
import {
 PageWithSidebar,
 SidebarNavItem,
 SidebarNavGroup,
 CategoryHeader,
} from "@/components/dashboard/page-layout";
import { LegacyEntryBanner } from "@/components/dashboard/legacy-entry-banner";
import { Button, ButtonGroup } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// WorkflowStatus
type WorkflowStatus = "active" | "paused" | "error" | "draft";
type SortBy = "updated" | "name" | "runs" | "success";

// WorkflowData
const workflows = [
 {
 id: "wf-1",
 name: "CustomerFeedbackAutoProcess",
 description: "AutoCollectandAnalyticsCustomerFeedback, GenerateReportandNotificationsRelatedTeam",
 status: "active" as WorkflowStatus,
 trigger: "Webhook",
 createdAt: "2026-01-15",
 updatedAt: "2 hbefore",
 lastRun: "5 minbefore",
 totalRuns: 1256,
 successRate: 98.5,
 folder: "CustomerService",
 starred: true,
 tags: ["Automation", "CustomerService", "Report"],
 },
 {
 id: "wf-2",
 name: "eachdaySalesDatatotal",
 description: "eachdaysAutototalSalesData, GeneratecanvisualReportConcurrencyEmail",
 status: "active" as WorkflowStatus,
 trigger: "ScheduledTrigger (eachdays 09:00)",
 createdAt: "2026-01-10",
 updatedAt: "1 daysbefore",
 lastRun: "Today 09:00",
 totalRuns: 45,
 successRate: 100,
 folder: "DataAnalytics",
 starred: true,
 tags: ["Data", "Report", "Scheduled"],
 },
 {
 id: "wf-3",
 name: "GitHub Issue AutoCategory",
 description: "Usage AI AutoAnalyticsnew Issue andAddTagsandAllocateOwner",
 status: "active" as WorkflowStatus,
 trigger: "GitHub Webhook",
 createdAt: "2026-01-08",
 updatedAt: "3 hbefore",
 lastRun: "1 hbefore",
 totalRuns: 234,
 successRate: 95.7,
 folder: "Development",
 starred: false,
 tags: ["GitHub", "AI", "Automation"],
 },
 {
 id: "wf-4",
 name: "newEmployeeenterFlow",
 description: "AutomationnewEmployeeenterFlow, IncludeAccountCreate, PermissionAllocateandNotifications",
 status: "paused" as WorkflowStatus,
 trigger: "ManualTrigger",
 createdAt: "2026-01-05",
 updatedAt: "1 weeksbefore",
 lastRun: "2 weeksbefore",
 totalRuns: 23,
 successRate: 100,
 folder: "personpowerResource",
 starred: false,
 tags: ["HR", "enter", "Automation"],
 },
 {
 id: "wf-5",
 name: "Social MediaContentPublish",
 description: "ScheduledPublishSocial MediaContenttomultiplePlatform",
 status: "error" as WorkflowStatus,
 trigger: "ScheduledTrigger",
 createdAt: "2026-01-03",
 updatedAt: "6 hbefore",
 lastRun: "6 hbefore",
 totalRuns: 89,
 successRate: 87.6,
 folder: "Marketing",
 starred: false,
 tags: ["Social Media", "Marketing", "Scheduled"],
 },
 {
 id: "wf-6",
 name: "OrderProcessAutomation",
 description: "newOrderAutoVerify, ProcessConcurrencyConfirmEmail",
 status: "draft" as WorkflowStatus,
 trigger: "Webhook",
 createdAt: "2026-01-20",
 updatedAt: "Just now",
 lastRun: "not yetRun",
 totalRuns: 0,
 successRate: 0,
 folder: "E-commerce",
 starred: false,
 tags: ["E-commerce", "Order", "Automation"],
 },
];

// FolderList
const folders = [
 { name: "allsection", count: workflows.length },
 { name: "CustomerService", count: 1 },
 { name: "DataAnalytics", count: 1 },
 { name: "Development", count: 1 },
 { name: "personpowerResource", count: 1 },
 { name: "Marketing", count: 1 },
 { name: "E-commerce", count: 1 },
];

// FetchStatusInfo
const getStatusInfo = (status: WorkflowStatus) => {
 switch (status) {
 case "active":
 return {
 label: "Run",
 color: "text-brand-500",
 bg: "bg-brand-200/70",
 border: "border-brand-400/40",
 icon: CheckCircle,
 };
 case "paused":
 return {
 label: "Paused",
 color: "text-warning",
 bg: "bg-warning-200/70",
 border: "border-warning/30",
 icon: Pause,
 };
 case "error":
 return {
 label: "Exception",
 color: "text-destructive",
 bg: "bg-destructive-200/70",
 border: "border-destructive/30",
 icon: AlertTriangle,
 };
 case "draft":
 return {
 label: "Draft",
 color: "text-foreground-muted",
 bg: "bg-surface-200",
 border: "border-border",
 icon: Edit,
 };
 }
};

const getRelativeMinutes = (value: string) => {
 if (!value) return Number.MAX_SAFE_INTEGER;
 if (value.includes("Just now")) return 0;
 const minuteMatch = value.match(/(\d+)\s*min?before/);
 if (minuteMatch) return Number.parseInt(minuteMatch[1], 10);
 const hourMatch = value.match(/(\d+)\s*hbefore/);
 if (hourMatch) return Number.parseInt(hourMatch[1], 10) * 60;
 const dayMatch = value.match(/(\d+)\s*daysbefore/);
 if (dayMatch) return Number.parseInt(dayMatch[1], 10) * 24 * 60;
 const weekMatch = value.match(/(\d+)\s*weeksbefore/);
 if (weekMatch) return Number.parseInt(weekMatch[1], 10) * 7 * 24 * 60;
 return Number.MAX_SAFE_INTEGER;
};

// SidebarNavigationComponent
function WorkflowSidebar({
 statusFilter,
 setStatusFilter,
 selectedFolder,
 setSelectedFolder,
 stats,
}: {
 statusFilter: WorkflowStatus | "all";
 setStatusFilter: (status: WorkflowStatus | "all") => void;
 selectedFolder: string;
 setSelectedFolder: (folder: string) => void;
 stats: {
 total: number;
 active: number;
 paused: number;
 error: number;
 draft: number;
 };
}) {
 return (
 <div className="space-y-1">
 {/* StatusFilter */}
 <SidebarNavGroup title="Status">
 <button
 onClick={() => setStatusFilter("all")}
 className={cn(
 "w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium transition-colors",
 statusFilter === "all"
 ? "bg-surface-100/70 text-foreground"
 : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
 )}
 >
 <span>allsectionWorkflow</span>
 <span className="text-[11px] text-foreground-muted">{stats.total}</span>
 </button>
 <button
 onClick={() => setStatusFilter("active")}
 className={cn(
 "w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium transition-colors",
 statusFilter === "active"
 ? "bg-surface-100/70 text-foreground"
 : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
 )}
 >
 <span className="flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
 Run
 </span>
 <span className="text-[11px] text-foreground-muted">{stats.active}</span>
 </button>
 <button
 onClick={() => setStatusFilter("paused")}
 className={cn(
 "w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium transition-colors",
 statusFilter === "paused"
 ? "bg-surface-100/70 text-foreground"
 : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
 )}
 >
 <span className="flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-warning" />
 Paused
 </span>
 <span className="text-[11px] text-foreground-muted">{stats.paused}</span>
 </button>
 <button
 onClick={() => setStatusFilter("error")}
 className={cn(
 "w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium transition-colors",
 statusFilter === "error"
 ? "bg-surface-100/70 text-foreground"
 : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
 )}
 >
 <span className="flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
 Exception
 </span>
 <span className="text-[11px] text-foreground-muted">{stats.error}</span>
 </button>
 <button
 onClick={() => setStatusFilter("draft")}
 className={cn(
 "w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium transition-colors",
 statusFilter === "draft"
 ? "bg-surface-100/70 text-foreground"
 : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
 )}
 >
 <span className="flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
 Draft
 </span>
 <span className="text-[11px] text-foreground-muted">{stats.draft}</span>
 </button>
 </SidebarNavGroup>

 {/* Separatorline */}
 <div className="h-px bg-border my-3" />

 {/* FolderFilter */}
 <SidebarNavGroup title="Folder">
 {folders.map((folder) => (
 <button
 key={folder.name}
 onClick={() => setSelectedFolder(folder.name)}
 className={cn(
 "w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium transition-colors",
 selectedFolder === folder.name
 ? "bg-surface-100/70 text-foreground"
 : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
 )}
 >
 <span>{folder.name}</span>
 <span className="text-[11px] text-foreground-muted">{folder.count}</span>
 </button>
 ))}
 </SidebarNavGroup>

 {/* CreateFolder */}
 <button className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[12px] text-foreground-muted hover:text-foreground hover:bg-surface-100/60 transition-colors mt-2">
 <Plus className="w-3.5 h-3.5" />
 CreateFolder
 </button>
 </div>
 );
}

export default function WorkflowsPage() {
 const [searchQuery, setSearchQuery] = useState("");
 const [statusFilter, setStatusFilter] = useState<WorkflowStatus | "all">("all");
 const [selectedFolder, setSelectedFolder] = useState("allsection");
 const [viewMode, setViewMode] = useState<"grid" | "list">("list");
 const [sortBy, setSortBy] = useState<SortBy>("updated");

 // FilterWorkflow
 const filteredWorkflows = workflows.filter((wf) => {
 const matchesSearch =
 wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 wf.description.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesStatus = statusFilter === "all" || wf.status === statusFilter;
 const matchesFolder = selectedFolder === "allsection" || wf.folder === selectedFolder;
 return matchesSearch && matchesStatus && matchesFolder;
 });

 // StatisticsData
 const totalRuns = workflows.reduce((sum, w) => sum + w.totalRuns, 0);
 const weightedSuccess = workflows.reduce(
 (sum, w) => sum + w.totalRuns * w.successRate,
 0
 );
 const stats = {
 total: workflows.length,
 active: workflows.filter((w) => w.status === "active").length,
 paused: workflows.filter((w) => w.status === "paused").length,
 error: workflows.filter((w) => w.status === "error").length,
 draft: workflows.filter((w) => w.status === "draft").length,
 starred: workflows.filter((w) => w.starred).length,
 totalRuns,
 avgSuccessRate: totalRuns ? weightedSuccess / totalRuns : 0,
 };

 const sortOptions: Array<{ value: SortBy; label: string }> = [
 { value: "updated", label: "RecentUpdate" },
 { value: "name", label: "Name" },
 { value: "runs", label: "Runtimescount" },
 { value: "success", label: "Success Rate" },
 ];

 const sortedWorkflows = [...filteredWorkflows].sort((a, b) => {
 switch (sortBy) {
 case "name":
 return a.name.localeCompare(b.name, "zh-Hans-CN");
 case "runs":
 return b.totalRuns - a.totalRuns;
 case "success":
 return b.successRate - a.successRate;
 case "updated":
 default:
 return getRelativeMinutes(a.updatedAt) - getRelativeMinutes(b.updatedAt);
 }
 });

 const mostRecentWorkflow = [...workflows].sort(
 (a, b) => getRelativeMinutes(a.updatedAt) - getRelativeMinutes(b.updatedAt)
 )[0];
 const recentStatusInfo = mostRecentWorkflow
 ? getStatusInfo(mostRecentWorkflow.status)
 : null;

 return (
 <PageWithSidebar
 sidebarTitle="Workflow"
 sidebarWidth="narrow"
 sidebar={
 <WorkflowSidebar
 statusFilter={statusFilter}
 setStatusFilter={setStatusFilter}
 selectedFolder={selectedFolder}
 setSelectedFolder={setSelectedFolder}
 stats={stats}
 />
 }
 >
 <div className="space-y-6 max-w-[960px]">
 <LegacyEntryBanner type="workflow" />
 {/* PageHeader */}
 <div className="flex items-start justify-between">
 <div>
 <h1 className="text-[18px] font-semibold text-foreground">WorkflowManage</h1>
 <p className="text-[12px] text-foreground-light mt-1">
 ManageandMonitorAllAutomationWorkflow
 </p>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>
 Import
 </Button>
 <Button size="sm" asChild>
 <Link href="/dashboard/workflows/new">
 <Plus className="h-3.5 w-3.5" />
 CreateWorkflow
 </Link>
 </Button>
 </div>
 </div>

 {/* OverviewPanel */}
 <div className="page-panel">
 <div className="page-panel-header">
 <h2 className="page-panel-title">Overview</h2>
 <p className="page-panel-description">keyMetricsandRecentUpdate</p>
 </div>
 <div className="p-4">
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
 <div className="p-3 rounded-md border border-border bg-surface-75/60">
 <p className="text-[11px] text-foreground-muted mb-1">totalWorkflow</p>
 <p className="text-lg font-semibold text-foreground">{stats.total}</p>
 <p className="text-[11px] text-foreground-muted">{stats.starred} alreadyFavorite</p>
 </div>
 <div className="p-3 rounded-md border border-border bg-surface-75/60">
 <p className="text-[11px] text-foreground-muted mb-1">Run</p>
 <p className="text-lg font-semibold text-foreground">{stats.active}</p>
 <p className="text-[11px] text-foreground-muted">{stats.paused} Paused</p>
 </div>
 <div className="p-3 rounded-md border border-border bg-surface-75/60">
 <p className="text-[11px] text-foreground-muted mb-1">Executetimescount</p>
 <p className="text-lg font-semibold text-foreground">{stats.totalRuns.toLocaleString()}</p>
 <p className="text-[11px] text-foreground-muted">CumulativeRun</p>
 </div>
 <div className="p-3 rounded-md border border-border bg-surface-75/60">
 <p className="text-[11px] text-foreground-muted mb-1">AverageSuccess Rate</p>
 <p className="text-lg font-semibold text-brand-500">{stats.avgSuccessRate.toFixed(1)}%</p>
 <p className="text-[11px] text-foreground-muted">{stats.error} Exception</p>
 </div>
 </div>

 {/* RecentUpdate */}
 {mostRecentWorkflow && (
 <div className="pt-4 border-t border-border">
 <div className="flex items-center justify-between mb-3">
 <span className="text-[11px] font-medium text-foreground-muted uppercase tracking-wide">RecentUpdate</span>
 <span className="text-[11px] text-foreground-muted">{mostRecentWorkflow.updatedAt}</span>
 </div>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-8 h-8 rounded-md bg-surface-200/80 border border-border flex items-center justify-center shrink-0">
 <Zap className="w-3.5 h-3.5 text-foreground-light" />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 {mostRecentWorkflow.starred && (
 <Star className="w-3.5 h-3.5 text-warning fill-current" />
 )}
 <Link
 href={`/dashboard/workflows/${mostRecentWorkflow.id}`}
 className="text-[13px] font-medium text-foreground hover:text-brand-500 transition-colors truncate"
 >
 {mostRecentWorkflow.name}
 </Link>
 {recentStatusInfo && (
 <span
 className={cn(
 "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
 recentStatusInfo.bg,
 recentStatusInfo.color,
 recentStatusInfo.border
 )}
 >
 {recentStatusInfo.label}
 </span>
 )}
 </div>
 <p className="text-[11px] text-foreground-light truncate">
 {mostRecentWorkflow.description}
 </p>
 </div>
 </div>
 <Button variant="outline" size="sm" asChild className="shrink-0 ml-4">
 <Link href={`/editor/${mostRecentWorkflow.id}`}>Edit</Link>
 </Button>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* WorkflowListPanel */}
 <div className="page-panel">
 <div className="page-panel-header flex items-center justify-between">
 <div>
 <h2 className="page-panel-title">Workflow</h2>
 <p className="page-panel-description">
 {sortedWorkflows.length} Workflow
 {statusFilter !== "all" && ` · ${getStatusInfo(statusFilter).label}`}
 {selectedFolder !== "allsection" && ` · ${selectedFolder}`}
 </p>
 </div>
 <div className="flex items-center gap-2">
 <ButtonGroup
 attached
 className="border border-border rounded-md overflow-hidden bg-surface-200/60"
 >
 <Button
 variant="ghost"
 size="sm"
 className={cn(
 "rounded-none h-7 px-2",
 viewMode === "list"
 ? "bg-surface-200 text-foreground"
 : "text-foreground-muted hover:text-foreground"
 )}
 onClick={() => setViewMode("list")}
 >
 <List className="w-3.5 h-3.5" />
 </Button>
 <Button
 variant="ghost"
 size="sm"
 className={cn(
 "rounded-none h-7 px-2",
 viewMode === "grid"
 ? "bg-surface-200 text-foreground"
 : "text-foreground-muted hover:text-foreground"
 )}
 onClick={() => setViewMode("grid")}
 >
 <LayoutGrid className="w-3.5 h-3.5" />
 </Button>
 </ButtonGroup>
 </div>
 </div>

 {/* Toolbar */}
 <div className="px-4 py-3 border-b border-border flex items-center gap-3">
 <Input
 placeholder="SearchWorkflow..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 variant="search"
 inputSize="sm"
 leftIcon={<Search className="h-3.5 w-3.5" />}
 className="max-w-[240px]"
 />
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 rightIcon={<ChevronDown className="h-3 w-3" />}
 className="h-8"
 >
 {sortOptions.find((option) => option.value === sortBy)?.label}
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent
 align="start"
 className="w-36 bg-surface-100 border border-border rounded-md"
 >
 {sortOptions.map((option) => (
 <DropdownMenuItem
 key={option.value}
 onClick={() => setSortBy(option.value)}
 className={cn(
 "px-3 py-1.5 text-[12px] rounded-md mx-1 cursor-pointer",
 sortBy === option.value
 ? "bg-surface-200 text-foreground"
 : "text-foreground-light hover:bg-surface-200 hover:text-foreground"
 )}
 >
 {option.label}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

 {/* ListView */}
 {sortedWorkflows.length > 0 && viewMode === "list" && (
 <div>
 {/* head */}
 <div className="hidden lg:grid grid-cols-[1fr_100px_100px_80px_80px] gap-4 px-4 py-2 border-b border-border text-[11px] font-medium text-foreground-muted uppercase tracking-wide">
 <span>Workflow</span>
 <span>Triggermethod</span>
 <span>RecentRun</span>
 <span>Runtimescount</span>
 <span className="text-right">Action</span>
 </div>
 {/* List */}
 <div className="divide-y divide-border">
 {sortedWorkflows.map((workflow) => {
 const statusInfo = getStatusInfo(workflow.status);
 return (
 <div
 key={workflow.id}
 className="group grid grid-cols-1 lg:grid-cols-[1fr_100px_100px_80px_80px] gap-4 px-4 py-3 hover:bg-surface-75/50 transition-colors"
 >
 {/* WorkflowInfo */}
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-8 h-8 rounded-md bg-surface-200/80 border border-border flex items-center justify-center shrink-0">
 <Zap className="w-3.5 h-3.5 text-foreground-light" />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 {workflow.starred && (
 <Star className="w-3.5 h-3.5 text-warning fill-current shrink-0" />
 )}
 <Link
 href={`/dashboard/workflows/${workflow.id}`}
 className="text-[13px] font-medium text-foreground hover:text-brand-500 transition-colors truncate"
 >
 {workflow.name}
 </Link>
 <span
 className={cn(
 "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0",
 statusInfo.bg,
 statusInfo.color,
 statusInfo.border
 )}
 >
 {statusInfo.label}
 </span>
 </div>
 <p className="text-[11px] text-foreground-light truncate">
 {workflow.description}
 </p>
 </div>
 </div>

 {/* Triggermethod */}
 <div className="hidden lg:flex items-center text-[11px] text-foreground-light">
 {workflow.trigger.includes("Scheduled") ? "Scheduled": workflow.trigger}
 </div>

 {/* RecentRun */}
 <div className="hidden lg:flex items-center text-[11px] text-foreground-light">
 {workflow.lastRun}
 </div>

 {/* Runtimescount */}
 <div className="hidden lg:flex items-center text-[11px] text-foreground-light">
 {workflow.totalRuns}
 </div>

 {/* Action */}
 <div className="flex items-center justify-end gap-1">
 <Button
 variant="ghost"
 size="icon-sm"
 className="text-foreground-muted hover:text-foreground h-7 w-7"
 asChild
 >
 <Link href={`/editor/${workflow.id}`} aria-label="EditWorkflow">
 <Edit className="w-3.5 h-3.5" />
 </Link>
 </Button>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="icon-sm"
 className="text-foreground-muted hover:text-foreground h-7 w-7"
 aria-label="moremultipleAction"
 >
 <MoreVertical className="w-3.5 h-3.5" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent
 align="end"
 className="w-36 bg-surface-100 border border-border rounded-md"
 >
 {workflow.status === "active" ? (
 <DropdownMenuItem className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:bg-surface-200 hover:text-foreground rounded-md mx-1 cursor-pointer">
 <Pause className="w-3.5 h-3.5" />
 Pause
 </DropdownMenuItem>
 ) : workflow.status !== "draft" ? (
 <DropdownMenuItem className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:bg-surface-200 hover:text-foreground rounded-md mx-1 cursor-pointer">
 <Play className="w-3.5 h-3.5" />
 Enable
 </DropdownMenuItem>
 ) : null}
 <DropdownMenuItem className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:bg-surface-200 hover:text-foreground rounded-md mx-1 cursor-pointer">
 <Copy className="w-3.5 h-3.5" />
 Copy
 </DropdownMenuItem>
 <DropdownMenuItem className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:bg-surface-200 hover:text-foreground rounded-md mx-1 cursor-pointer">
 <Star className="w-3.5 h-3.5" />
 {workflow.starred ? "Unfavorite": "Favorite"}
 </DropdownMenuItem>
 <DropdownMenuSeparator className="bg-border mx-2" />
 <DropdownMenuItem className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-destructive hover:bg-destructive-200 hover:text-destructive rounded-md mx-1 cursor-pointer">
 <Trash2 className="w-3.5 h-3.5" />
 Delete
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

 {/* MoveendpointInfo */}
 <div className="flex flex-wrap items-center gap-3 text-[11px] text-foreground-muted lg:hidden">
 <span>{workflow.trigger.includes("Scheduled") ? "Scheduled": workflow.trigger}</span>
 <span>{workflow.lastRun}</span>
 <span>{workflow.totalRuns} timesRun</span>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* GridView */}
 {sortedWorkflows.length > 0 && viewMode === "grid" && (
 <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {sortedWorkflows.map((workflow) => {
 const statusInfo = getStatusInfo(workflow.status);
 return (
 <Link
 key={workflow.id}
 href={`/dashboard/workflows/${workflow.id}`}
 className="block p-4 rounded-lg border border-border bg-surface-75/60 hover:border-border-strong hover:bg-surface-100/80 transition-colors group"
 >
 <div className="flex items-start justify-between mb-3">
 <div className="w-8 h-8 rounded-md bg-surface-200/80 border border-border flex items-center justify-center">
 <Zap className="w-3.5 h-3.5 text-foreground-light" />
 </div>
 <span
 className={cn(
 "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
 statusInfo.bg,
 statusInfo.color,
 statusInfo.border
 )}
 >
 {statusInfo.label}
 </span>
 </div>
 <h3 className="text-[13px] font-medium text-foreground mb-1 group-hover:text-brand-500 transition-colors flex items-center gap-2">
 {workflow.starred && (
 <Star className="w-3.5 h-3.5 text-warning fill-current" />
 )}
 <span className="truncate">{workflow.name}</span>
 </h3>
 <p className="text-[11px] text-foreground-light mb-3 line-clamp-2">
 {workflow.description}
 </p>
 <div className="flex items-center justify-between text-[10px] text-foreground-muted">
 <span>{workflow.totalRuns} timesRun</span>
 <span>{workflow.updatedAt}</span>
 </div>
 </Link>
 );
 })}
 </div>
 )}

 {/* Empty State */}
 {sortedWorkflows.length === 0 && (
 <div className="px-4 py-12 text-center">
 <div className="w-12 h-12 rounded-md bg-surface-200/80 border border-border flex items-center justify-center mx-auto mb-4">
 <Zap className="w-5 h-5 text-foreground-muted" />
 </div>
 <h3 className="text-[13px] font-medium text-foreground mb-1">
 {searchQuery || statusFilter !== "all"
 ? "NotoMatch'sWorkflow"
: "Not yetCreateWorkflow"}
 </h3>
 <p className="text-[11px] text-foreground-light mb-4 max-w-xs mx-auto">
 {searchQuery || statusFilter !== "all"
 ? "TryUsageotherheKeywordsorFilterCondition"
: "Createyou's#1Workflow, StartAutomationJourney"}
 </p>
 {searchQuery || statusFilter !== "all" ? (
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 setSearchQuery("");
 setStatusFilter("all");
 setSelectedFolder("allsection");
 }}
 >
 ClearFilter
 </Button>
 ) : (
 <Button size="sm" asChild>
 <Link href="/dashboard/workflows/new">
 <Plus className="mr-1.5 w-3.5 h-3.5" />
 CreateWorkflow
 </Link>
 </Button>
 )}
 </div>
 )}
 </div>
 </div>
 </PageWithSidebar>
 );
}
