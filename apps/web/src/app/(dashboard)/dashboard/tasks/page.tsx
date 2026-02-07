"use client";

/**
 * TaskManagePage
 * ManageandTrackpersonTaskandTodo
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, ButtonGroup } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
 ListTodo,
 Search,
 Plus,
 MoreHorizontal,
 ArrowUpDown,
 Clock,
 Trash2,
 CheckCircle2,
 Circle,
 AlertCircle,
 Calendar,
 Flag,
 Tag,
 RefreshCw,
 Filter,
 ChevronRight,
 Edit,
 Copy,
 Archive,
 Play,
 Pause,
} from "lucide-react";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";

// TaskStatusConfig
const statusConfig = {
 todo: {
 label: "Todo",
 variant: "secondary" as const,
 icon: Circle,
 color: "text-foreground-muted",
 bgColor: "bg-surface-200",
 borderColor: "border-border",
 },
 in_progress: {
 label: "In Progress",
 variant: "warning" as const,
 icon: Play,
 color: "text-warning",
 bgColor: "bg-warning-200/60",
 borderColor: "border-warning/30",
 },
 completed: {
 label: "Completed",
 variant: "success" as const,
 icon: CheckCircle2,
 color: "text-brand-500",
 bgColor: "bg-brand-200/60",
 borderColor: "border-brand-400/40",
 },
 paused: {
 label: "Paused",
 variant: "outline" as const,
 icon: Pause,
 color: "text-foreground-muted",
 bgColor: "bg-surface-200",
 borderColor: "border-border",
 },
};

// PriorityConfig
const priorityConfig = {
 high: {
 label: "",
 color: "text-destructive",
 bgColor: "bg-destructive-200/60",
 borderColor: "border-destructive/30",
 },
 medium: {
 label: "",
 color: "text-warning",
 bgColor: "bg-warning-200/60",
 borderColor: "border-warning/30",
 },
 low: {
 label: "",
 color: "text-foreground-muted",
 bgColor: "bg-surface-200",
 borderColor: "border-border",
 },
};

type TaskStatus = keyof typeof statusConfig;
type TaskPriority = keyof typeof priorityConfig;

// MockTaskData
const mockTasks = [
 {
 id: "task-1",
 title: "DoneWorkflowDocumentWrite",
 description: "WriteAutomationWorkflow'sUsageDocumentandBest PracticesGuide",
 status: "in_progress" as TaskStatus,
 priority: "high" as TaskPriority,
 tags: ["Document", "Workflow"],
 dueDate: "2026-02-05",
 createdAt: "2026-02-01T10:00:00",
 updatedAt: "2026-02-03T14:30:00",
 workflowId: "wf-1",
 progress: 60,
 },
 {
 id: "task-2",
 title: "Confignew's Agent Model",
 description: "asSupportAssistantConfignew's GPT-4 ModelandProceedTest",
 status: "todo" as TaskStatus,
 priority: "high" as TaskPriority,
 tags: ["Agent", "Config"],
 dueDate: "2026-02-04",
 createdAt: "2026-02-02T09:00:00",
 updatedAt: "2026-02-02T09:00:00",
 workflowId: null,
 progress: 0,
 },
 {
 id: "task-3",
 title: "ReviewTeamSubmit'sTemplate",
 description: "ReviewandApproveTeamMemberSubmit's 5 newTemplate",
 status: "todo" as TaskStatus,
 priority: "medium" as TaskPriority,
 tags: ["Review", "Template"],
 dueDate: "2026-02-06",
 createdAt: "2026-02-01T14:00:00",
 updatedAt: "2026-02-01T14:00:00",
 workflowId: null,
 progress: 0,
 },
 {
 id: "task-4",
 title: "optimalDataSyncFlow",
 description: "AnalyticsandoptimalExistingDataSyncWorkflow'scan",
 status: "in_progress" as TaskStatus,
 priority: "medium" as TaskPriority,
 tags: ["optimal", "Workflow"],
 dueDate: "2026-02-07",
 createdAt: "2026-01-30T11:00:00",
 updatedAt: "2026-02-02T16:00:00",
 workflowId: "wf-2",
 progress: 35,
 },
 {
 id: "task-5",
 title: "Update API IntegrationDocument",
 description: "UpdateThird-party API Integration'sTechnologyDocument",
 status: "completed" as TaskStatus,
 priority: "low" as TaskPriority,
 tags: ["Document", "API"],
 dueDate: "2026-02-02",
 createdAt: "2026-01-28T10:00:00",
 updatedAt: "2026-02-02T12:00:00",
 workflowId: null,
 progress: 100,
 },
 {
 id: "task-6",
 title: "ProcessUserFeedback",
 description: "OrganizeandReplycurrentweeksto'sUserFeedback",
 status: "paused" as TaskStatus,
 priority: "low" as TaskPriority,
 tags: ["Feedback", "User"],
 dueDate: "2026-02-08",
 createdAt: "2026-02-01T08:00:00",
 updatedAt: "2026-02-01T15:00:00",
 workflowId: null,
 progress: 20,
 },
 {
 id: "task-7",
 title: "SettingsMonitorAlert",
 description: "askeyWorkflowConfigExecuteFailedAlertNotifications",
 status: "completed" as TaskStatus,
 priority: "high" as TaskPriority,
 tags: ["Monitor", "Alert"],
 dueDate: "2026-02-01",
 createdAt: "2026-01-29T09:00:00",
 updatedAt: "2026-02-01T10:00:00",
 workflowId: "wf-3",
 progress: 100,
 },
 {
 id: "task-8",
 title: "PrepareweeksData",
 description: "totalcurrentweeks'sWorkflowExecuteDataandkeyMetrics",
 status: "todo" as TaskStatus,
 priority: "medium" as TaskPriority,
 tags: ["Report", "Data"],
 dueDate: "2026-02-07",
 createdAt: "2026-02-03T08:00:00",
 updatedAt: "2026-02-03T08:00:00",
 workflowId: null,
 progress: 0,
 },
];

type SortKey = "dueDate" | "priority" | "status" | "createdAt" | "updatedAt";
type ViewMode = "all" | "todo" | "in_progress" | "completed";

const sortOptions: { value: SortKey; label: string }[] = [
 { value: "dueDate", label: "DeadlineDate" },
 { value: "priority", label: "Priority" },
 { value: "status", label: "Status" },
 { value: "updatedAt", label: "RecentUpdate" },
 { value: "createdAt", label: "Created At" },
];

// FormatDate
function formatDate(dateString: string) {
 const date = new Date(dateString);
 const now = new Date();
 const diffMs = date.getTime() - now.getTime();
 const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

 if (diffDays < -1) return `Expired ${Math.abs(diffDays)} days`;
 if (diffDays === -1) return "Yesterdayto";
 if (diffDays === 0) return "Todayto";
 if (diffDays === 1) return "Tomorrowto";
 if (diffDays < 7) return `${diffDays} daysafter`;
 return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

// FormatTime
function formatTimestamp(dateString: string) {
 const date = new Date(dateString);
 const now = new Date();
 const diffMs = now.getTime() - date.getTime();
 const diffMins = Math.floor(diffMs / (1000 * 60));
 const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
 const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

 if (diffMins < 1) return "Just now";
 if (diffMins < 60) return `${diffMins} minbefore`;
 if (diffHours < 24) return `${diffHours} hbefore`;
 if (diffDays === 1) return "Yesterday";
 if (diffDays < 7) return `${diffDays} daysbefore`;
 return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

// CheckisnoExpired
function isOverdue(dueDate: string, status: TaskStatus) {
 if (status === "completed") return false;
 const due = new Date(dueDate);
 const now = new Date();
 return due < now;
}

export default function TasksPage() {
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedStatus, setSelectedStatus] = useState<string>("all");
 const [selectedPriority, setSelectedPriority] = useState<string>("all");
 const [sortBy, setSortBy] = useState<SortKey>("dueDate");
 const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
 const [tasks, setTasks] = useState(mockTasks);

 const activeView: ViewMode =
 selectedStatus === "all"
 ? "all"
 : selectedStatus === "todo"
 ? "todo"
 : selectedStatus === "in_progress"
 ? "in_progress"
 : "completed";

 // FilterandSort
 const visibleTasks = useMemo(() => {
 const filtered = tasks.filter((task) => {
 const matchesSearch =
 task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
 task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
 const matchesStatus = selectedStatus === "all" || task.status === selectedStatus;
 const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority;
 return matchesSearch && matchesStatus && matchesPriority;
 });

 const priorityOrder = { high: 0, medium: 1, low: 2 };
 const statusOrder = { in_progress: 0, todo: 1, paused: 2, completed: 3 };

 return [...filtered].sort((a, b) => {
 switch (sortBy) {
 case "priority":
 return priorityOrder[a.priority] - priorityOrder[b.priority];
 case "status":
 return statusOrder[a.status] - statusOrder[b.status];
 case "updatedAt":
 return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
 case "createdAt":
 return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
 case "dueDate":
 default:
 return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
 }
 });
 }, [tasks, searchQuery, selectedStatus, selectedPriority, sortBy]);

 // SwitchSelect
 const toggleSelect = (id: string) => {
 const newSelected = new Set(selectedItems);
 if (newSelected.has(id)) {
 newSelected.delete(id);
 } else {
 newSelected.add(id);
 }
 setSelectedItems(newSelected);
 };

 // Select All
 const toggleSelectAll = () => {
 if (selectedItems.size === visibleTasks.length) {
 setSelectedItems(new Set());
 } else {
 setSelectedItems(new Set(visibleTasks.map((t) => t.id)));
 }
 };

 // UpdateTaskStatus
 const updateTaskStatus = (id: string, status: TaskStatus) => {
 setTasks((prev) =>
 prev.map((task) =>
 task.id === id
 ? {
 ...task,
 status,
 progress: status === "completed" ? 100 : task.progress,
 updatedAt: new Date().toISOString(),
 }
 : task
 )
 );
 };

 // DeleteTask
 const deleteTask = (id: string) => {
 setTasks((prev) => prev.filter((task) => task.id !== id));
 selectedItems.delete(id);
 setSelectedItems(new Set(selectedItems));
 };

 // BatchDelete
 const bulkDelete = () => {
 setTasks((prev) => prev.filter((task) => !selectedItems.has(task.id)));
 setSelectedItems(new Set());
 };

 // BatchDone
 const bulkComplete = () => {
 setTasks((prev) =>
 prev.map((task) =>
 selectedItems.has(task.id)
 ? { ...task, status: "completed" as TaskStatus, progress: 100, updatedAt: new Date().toISOString() }
 : task
 )
 );
 setSelectedItems(new Set());
 };

 // StatisticsData
 const stats = {
 total: tasks.length,
 todo: tasks.filter((t) => t.status === "todo").length,
 inProgress: tasks.filter((t) => t.status === "in_progress").length,
 completed: tasks.filter((t) => t.status === "completed").length,
 overdue: tasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
 highPriority: tasks.filter((t) => t.priority === "high" && t.status !== "completed").length,
 };

 const hasSelection = selectedItems.size > 0;

 const statCards = [
 {
 label: "allsectionTask",
 value: stats.total,
 helper: `${stats.completed} Completed`,
 icon: ListTodo,
 iconClassName: "bg-brand-200/60 border-brand-400/40 text-brand-500",
 },
 {
 label: "Todo",
 value: stats.todo,
 helper: "etcPending",
 icon: Circle,
 iconClassName: "bg-surface-200 border-border text-foreground-light",
 },
 {
 label: "In Progress",
 value: stats.inProgress,
 helper: "Processing",
 icon: Play,
 iconClassName: "bg-warning-200/60 border-warning/30 text-warning",
 },
 {
 label: "ExpiredTask",
 value: stats.overdue,
 helper: "needneedFollow",
 icon: AlertCircle,
 iconClassName:
 stats.overdue > 0
 ? "bg-destructive-200/60 border-destructive/30 text-destructive"
 : "bg-surface-200 border-border text-foreground-light",
 },
 ];

 const viewTabs = [
 { value: "all", label: "allsection", count: stats.total },
 { value: "todo", label: "Todo", count: stats.todo },
 { value: "in_progress", label: "In Progress", count: stats.inProgress },
 { value: "completed", label: "Completed", count: stats.completed },
 ] as const;

 return (
 <PageContainer>
 <div className="space-y-6">
 {/* PageHeader */}
 <div className="space-y-3">
 <p className="page-caption">Tasks</p>
 <PageHeader
 title="TaskManage"
 description="ManageandTrackyou'sTodo"
 actions={
 <div className="flex items-center gap-2">
 <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
 CreateTask
 </Button>
 </div>
 }
 >
 <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
 <span className="inline-flex items-center gap-1.5">
 <ListTodo className="w-3.5 h-3.5" />
 {stats.total} Task
 </span>
 <span className="inline-flex items-center gap-1.5">
 <Flag className="w-3.5 h-3.5" />
 {stats.highPriority} Priority
 </span>
 {stats.overdue > 0 && (
 <span className="inline-flex items-center gap-1.5 text-destructive">
 <AlertCircle className="w-3.5 h-3.5" />
 {stats.overdue} Expired
 </span>
 )}
 </div>
 </PageHeader>
 </div>

 {/* StatisticsCard */}
 <section className="page-section">
 <div className="page-grid grid-cols-2 lg:grid-cols-4">
 {statCards.map((stat) => {
 const StatIcon = stat.icon;
 return (
 <Card
 key={stat.label}
 variant="stats"
 hover="border"
 padding="sm"
 className="flex items-center justify-between"
 >
 <div>
 <p className="text-xs text-foreground-muted">{stat.label}</p>
 <p className="text-stat-number text-foreground tabular-nums">{stat.value}</p>
 <p className="text-[11px] text-foreground-muted">{stat.helper}</p>
 </div>
 <div
 className={cn(
 "h-9 w-9 rounded-md border flex items-center justify-center",
 stat.iconClassName
 )}
 >
 <StatIcon className="w-4 h-4" />
 </div>
 </Card>
 );
 })}
 </div>
 </section>

 {/* Filter */}
 <section className="page-panel p-4 space-y-4">
 <div className="flex flex-wrap items-center gap-3">
 <div className="relative flex-1 min-w-[220px] max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
 <Input
 variant="dark"
 placeholder="SearchTask..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 h-9 bg-surface-200 border border-border text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
 />
 </div>

 <Select value={selectedPriority} onValueChange={setSelectedPriority}>
 <SelectTrigger className="w-[120px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
 <SelectValue placeholder="Priority" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">allsectionPriority</SelectItem>
 <SelectItem value="high">Priority</SelectItem>
 <SelectItem value="medium">Priority</SelectItem>
 <SelectItem value="low">Priority</SelectItem>
 </SelectContent>
 </Select>

 <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortKey)}>
 <SelectTrigger className="w-[140px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
 <div className="flex items-center gap-2">
 <ArrowUpDown className="w-4 h-4 text-foreground-muted" />
 <SelectValue placeholder="Sort" />
 </div>
 </SelectTrigger>
 <SelectContent>
 {sortOptions.map((option) => (
 <SelectItem key={option.value} value={option.value}>
 {option.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>

 <ButtonGroup attached className="flex-wrap">
 {viewTabs.map((view) => (
 <Button
 key={view.value}
 variant={selectedStatus === view.value ? "secondary" : "outline"}
 size="sm"
 onClick={() => setSelectedStatus(view.value)}
 className={cn(selectedStatus === view.value && "bg-surface-200 border-border-strong")}
 >
 {view.label}
 <span className="ml-1 text-[11px] text-foreground-muted tabular-nums">{view.count}</span>
 </Button>
 ))}
 </ButtonGroup>
 </div>

 <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
 <span>Display {visibleTasks.length} / {tasks.length}</span>
 {selectedPriority !== "all" && (
 <Badge variant="outline" size="xs">
 Priority: {priorityConfig[selectedPriority as TaskPriority]?.label}
 </Badge>
 )}
 </div>
 </section>

 {/* BatchAction */}
 {hasSelection && (
 <section className="page-panel border-brand-400/40 bg-brand-200/20">
 <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
 <div className="flex items-center gap-2 text-[13px] text-foreground">
 <Badge variant="primary" size="sm">
 {selectedItems.size}
 </Badge>
 alreadySelect {selectedItems.size} Task
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={bulkComplete}
 leftIcon={<CheckCircle2 className="w-4 h-4" />}
 >
 MarkDone
 </Button>
 <Button variant="destructive" size="sm" onClick={bulkDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
 Delete
 </Button>
 <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
 Deselect
 </Button>
 </div>
 </div>
 </section>
 )}

 {/* TaskList */}
 <section className="page-panel overflow-hidden">
 <div className="page-panel-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <p className="page-panel-title">TaskList</p>
 <p className="page-panel-description"> {visibleTasks.length} Task</p>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
 Refresh
 </Button>
 </div>
 </div>

 <div className="border-t border-border">
 <div className="grid items-center gap-4 px-4 py-2.5 border-b border-border bg-surface-75/80 text-table-header grid-cols-[24px_minmax(0,1fr)_80px] md:grid-cols-[24px_minmax(0,1fr)_90px_100px_100px_80px]">
 <Checkbox
 checked={selectedItems.size === visibleTasks.length && visibleTasks.length > 0}
 onCheckedChange={toggleSelectAll}
 />
 <span className="text-left">Task</span>
 <span className="hidden md:block text-center">Status</span>
 <span className="hidden md:block text-center">Priority</span>
 <span className="hidden md:block text-center">DeadlineDate</span>
 <span className="text-right">Action</span>
 </div>

 {visibleTasks.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 text-center">
 <div className="w-14 h-14 rounded-md bg-surface-200 border border-border flex items-center justify-center mb-4">
 <ListTodo className="w-6 h-6 text-foreground-muted" />
 </div>
 <h3 className="text-base font-medium text-foreground mb-2">NoTask</h3>
 <p className="text-[13px] text-foreground-light mb-4 max-w-sm">
 {searchQuery ? "TryotherheSearchCondition": "CreatenewTaskStartManageyou'sWork"}
 </p>
 <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
 CreateTask
 </Button>
 </div>
 ) : (
 <div className="divide-y divide-border">
 {visibleTasks.map((task) => {
 const statusCfg = statusConfig[task.status];
 const priorityCfg = priorityConfig[task.priority];
 const StatusIcon = statusCfg.icon;
 const isSelected = selectedItems.has(task.id);
 const overdue = isOverdue(task.dueDate, task.status);

 return (
 <div
 key={task.id}
 className={cn(
 "grid items-center gap-4 px-4 py-4 transition-supabase grid-cols-[24px_minmax(0,1fr)_80px] md:grid-cols-[24px_minmax(0,1fr)_90px_100px_100px_80px]",
 isSelected ? "bg-brand-200/20" : "hover:bg-surface-75/60"
 )}
 >
 <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(task.id)} />

 <div className="min-w-0 flex items-start gap-3">
 <button
 onClick={() =>
 updateTaskStatus(task.id, task.status === "completed" ? "todo" : "completed")
 }
 className={cn(
 "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
 task.status === "completed"
 ? "bg-brand-500 border-brand-500"
 : "border-foreground-muted hover:border-brand-500"
 )}
 >
 {task.status === "completed" && <CheckCircle2 className="w-3 h-3 text-white" />}
 </button>
 <div className="min-w-0">
 <h3
 className={cn(
 "text-sm font-medium truncate",
 task.status === "completed"
 ? "text-foreground-muted line-through"
 : "text-foreground"
 )}
 >
 {task.title}
 </h3>
 <p className="text-[12px] text-foreground-light truncate">{task.description}</p>
 <div className="flex flex-wrap items-center gap-2 mt-1">
 {task.tags.map((tag) => (
 <Badge key={tag} variant="outline" size="xs">
 {tag}
 </Badge>
 ))}
 {task.workflowId && (
 <Link
 href={`/dashboard/workflows/${task.workflowId}`}
 className="text-[11px] text-brand-500 hover:underline"
 >
 AssociateWorkflow
 </Link>
 )}
 </div>
 </div>
 </div>

 <div className="hidden md:flex justify-center">
 <Badge variant={statusCfg.variant} size="sm">
 {statusCfg.label}
 </Badge>
 </div>

 <div className="hidden md:flex justify-center">
 <div className="flex items-center gap-1">
 <Flag className={cn("w-3 h-3", priorityCfg.color)} />
 <span className={cn("text-[12px]", priorityCfg.color)}>{priorityCfg.label}</span>
 </div>
 </div>

 <div className="hidden md:flex justify-center">
 <span
 className={cn(
 "text-[13px]",
 overdue ? "text-destructive" : "text-foreground-light"
 )}
 >
 {formatDate(task.dueDate)}
 </span>
 </div>

 <div className="flex items-center justify-end gap-1">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon-xs" className="text-foreground-muted">
 <MoreHorizontal className="w-4 h-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent
 align="end"
 className="w-48 rounded-lg bg-surface-100 border-border shadow-2xl"
 >
 <DropdownMenuItem className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200">
 <Edit className="w-4 h-4 mr-2" />
 Edit
 </DropdownMenuItem>
 <DropdownMenuItem className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200">
 <Copy className="w-4 h-4 mr-2" />
 Copy
 </DropdownMenuItem>
 <DropdownMenuSeparator className="bg-border" />
 {task.status !== "completed" && (
 <DropdownMenuItem
 className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200"
 onClick={() => updateTaskStatus(task.id, "completed")}
 >
 <CheckCircle2 className="w-4 h-4 mr-2" />
 MarkDone
 </DropdownMenuItem>
 )}
 {task.status === "todo" && (
 <DropdownMenuItem
 className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200"
 onClick={() => updateTaskStatus(task.id, "in_progress")}
 >
 <Play className="w-4 h-4 mr-2" />
 StartProcess
 </DropdownMenuItem>
 )}
 {task.status === "in_progress" && (
 <DropdownMenuItem
 className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200"
 onClick={() => updateTaskStatus(task.id, "paused")}
 >
 <Pause className="w-4 h-4 mr-2" />
 Pause
 </DropdownMenuItem>
 )}
 <DropdownMenuSeparator className="bg-border" />
 <DropdownMenuItem
 className="text-[13px] text-destructive-400 focus:text-destructive focus:bg-destructive-200"
 onClick={() => deleteTask(task.id)}
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Delete
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </section>
 </div>
 </PageContainer>
 );
}
