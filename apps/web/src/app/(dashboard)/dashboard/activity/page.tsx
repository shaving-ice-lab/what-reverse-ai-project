"use client";

/**
 * Activity Logs Page - Supabase Style
 * Record and showcase user activity history
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
 Activity,
 AlertTriangle,
 Bot,
 Calendar,
 CheckCircle,
 ChevronDown,
 Clock,
 CreditCard,
 Download,
 Edit3,
 Filter,
 Key,
 LogIn,
 LogOut,
 MessageSquare,
 MoreHorizontal,
 Play,
 Plus,
 RefreshCw,
 Search,
 Settings,
 Share2,
 Trash2,
 Upload,
 User,
 XCircle,
} from "lucide-react";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";

// Activity Type Config
const activityTypes = {
 workflow_created: {
 icon: Plus,
    label: "Create Workflow",
 badgeVariant: "primary",
 iconColor: "text-brand-500",
 bgColor: "bg-brand-200/70",
 },
 workflow_executed: {
 icon: Play,
    label: "Execute Workflow",
 badgeVariant: "primary",
 iconColor: "text-brand-500",
 bgColor: "bg-brand-200/70",
 },
 workflow_edited: {
 icon: Edit3,
    label: "Edit Workflow",
 badgeVariant: "warning",
 iconColor: "text-warning",
 bgColor: "bg-warning-200/70",
 },
 workflow_deleted: {
 icon: Trash2,
    label: "Delete Workflow",
 badgeVariant: "error",
 iconColor: "text-destructive",
 bgColor: "bg-destructive-200/70",
 },
 agent_created: {
 icon: Bot,
 label: "Create Agent",
 badgeVariant: "primary",
 iconColor: "text-brand-500",
 bgColor: "bg-brand-200/70",
 },
 agent_edited: {
 icon: Edit3,
 label: "Edit Agent",
 badgeVariant: "secondary",
 iconColor: "text-foreground-light",
 bgColor: "bg-surface-200",
 },
 conversation_started: {
 icon: MessageSquare,
    label: "Start Conversation",
 badgeVariant: "primary",
 iconColor: "text-brand-500",
 bgColor: "bg-brand-200/70",
 },
 file_uploaded: {
 icon: Upload,
    label: "Upload File",
 badgeVariant: "primary",
 iconColor: "text-brand-500",
 bgColor: "bg-brand-200/70",
 },
 file_deleted: {
 icon: Trash2,
    label: "Delete File",
 badgeVariant: "error",
 iconColor: "text-destructive",
 bgColor: "bg-destructive-200/70",
 },
 api_key_created: {
 icon: Key,
 label: "Create API Key",
 badgeVariant: "warning",
 iconColor: "text-warning",
 bgColor: "bg-warning-200/70",
 },
 settings_updated: {
 icon: Settings,
    label: "Update Settings",
 badgeVariant: "secondary",
 iconColor: "text-foreground-muted",
 bgColor: "bg-surface-200",
 },
 login: {
 icon: LogIn,
 label: "Sign In",
 badgeVariant: "primary",
 iconColor: "text-brand-500",
 bgColor: "bg-brand-200/70",
 },
 logout: {
 icon: LogOut,
 label: "Sign Out",
 badgeVariant: "secondary",
 iconColor: "text-foreground-muted",
 bgColor: "bg-surface-200",
 },
 payment: {
 icon: CreditCard,
 label: "Payment",
 badgeVariant: "primary",
 iconColor: "text-brand-500",
 bgColor: "bg-brand-200/70",
 },
 share: {
 icon: Share2,
 label: "Share",
 badgeVariant: "primary",
 iconColor: "text-brand-500",
 bgColor: "bg-brand-200/70",
 },
} as const;

const statusConfig = {
 success: {
 label: "Success",
 variant: "success",
 icon: CheckCircle,
 },
 error: {
 label: "Failed",
 variant: "error",
 icon: XCircle,
 },
 warning: {
 label: "Warning",
 variant: "warning",
 icon: AlertTriangle,
 },
} as const;

const detailLabels: Record<string, string> = {
 duration: "Duration",
 records: "Record Count",
 model: "Model",
 messages: "Messages",
 nodes: "Nodes",
 triggers: "Trigger",
 error: "Error",
 changes: "Change",
 size: "Size",
 type: "Type",
 provider: "Provider",
 ip: "IP",
 device: "Device",
 amount: "Amount",
 plan: "Plan",
 capabilities: "Capabilities",
};

type ActivityStatus = keyof typeof statusConfig;
type ActivityType = keyof typeof activityTypes;

type ActivityItem = {
 id: string;
 type: ActivityType;
 title: string;
 description: string;
 user: { name: string; avatar: string | null };
 timestamp: string;
 timeAgo: string;
 status: ActivityStatus;
 details?: Record<string, string | number>;
};

// Activity Data
const activities: ActivityItem[] = [
 {
 id: "1",
 type: "workflow_executed",
    title: "Execute Workflow: Customer Feedback Auto-Processing",
    description: "Workflow executed successfully, processed 15 feedback items",
 user: { name: "", avatar: null },
 timestamp: "2026-01-31T10:30:00Z",
    timeAgo: "5 min ago",
 status: "success",
 details: { duration: "12s", records: 15 },
 },
 {
 id: "2",
 type: "conversation_started",
    title: "Started New Conversation",
    description: "Started a new conversation using the GPT-4 model",
 user: { name: "", avatar: null },
 timestamp: "2026-01-31T10:15:00Z",
    timeAgo: "20 min ago",
 status: "success",
 details: { model: "GPT-4", messages: 8 },
 },
 {
 id: "3",
 type: "workflow_created",
    title: "Create Workflow: Email Auto Categorization",
    description: "Created a new automation workflow",
 user: { name: "Li Hua", avatar: null },
 timestamp: "2026-01-31T09:45:00Z",
    timeAgo: "50 min ago",
 status: "success",
 details: { nodes: 6, triggers: 1 },
 },
 {
 id: "4",
 type: "workflow_executed",
    title: "Execute Workflow: Data Sync",
    description: "Workflow execution failed: API connection timeout",
 user: { name: "", avatar: null },
 timestamp: "2026-01-31T09:30:00Z",
    timeAgo: "1h ago",
 status: "error",
 details: { error: "Connection timeout" },
 },
 {
 id: "5",
 type: "agent_created",
    title: "Create Agent: Writing Assistant",
    description: "Created a new AI agent",
 user: { name: "Wang Fang", avatar: null },
 timestamp: "2026-01-31T09:00:00Z",
    timeAgo: "1.5h ago",
 status: "success",
 details: { model: "GPT-4", capabilities: 3 },
 },
 {
 id: "6",
 type: "file_uploaded",
    title: "Upload File: ProductRequirementsDocument.pdf",
    description: "Uploaded a new file to the knowledge base",
 user: { name: "", avatar: null },
 timestamp: "2026-01-31T08:30:00Z",
    timeAgo: "2h ago",
    status: "success",
    details: { size: "2.4 MB", type: "PDF" },
 },
 {
 id: "7",
 type: "api_key_created",
 title: "Create API Key",
    description: "Created a new API key for OpenAI service",
 user: { name: "", avatar: null },
 timestamp: "2026-01-31T08:00:00Z",
    timeAgo: "2.5h ago",
    status: "success",
    details: { provider: "OpenAI" },
 },
 {
 id: "8",
 type: "login",
    title: "System Sign In",
 description: "from Chrome/Windows Sign In",
 user: { name: "", avatar: null },
 timestamp: "2026-01-31T07:55:00Z",
    timeAgo: "2.5h ago",
    status: "success",
    details: { ip: "192.168.1.xxx", device: "Chrome/Windows" },
 },
 {
 id: "9",
 type: "workflow_edited",
    title: "Edit Workflow: Customer Feedback Auto-Processing",
    description: "Updated trigger conditions and processing logic",
 user: { name: "Li Hua", avatar: null },
 timestamp: "2026-01-30T18:30:00Z",
 timeAgo: "Yesterday 18:30",
 status: "success",
 details: { changes: 3 },
 },
 {
 id: "10",
 type: "payment",
    title: "Subscription Renewal",
    description: "Professional plan monthly subscription auto-renewed successfully",
 user: { name: "", avatar: null },
 timestamp: "2026-01-30T00:00:00Z",
 timeAgo: "Yesterday 00:00",
 status: "success",
    details: { amount: "¥99", plan: "Professional" },
 },
];

// Filter Options
const filterOptions = [
 { id: "all", label: "All Activities" },
 { id: "workflow", label: "Workflow" },
 { id: "agent", label: "Agent" },
 { id: "conversation", label: "Conversation" },
 { id: "file", label: "File" },
 { id: "security", label: "Security" },
];

// Time Range Options
const timeRanges = [
 { id: "today", label: "Today" },
 { id: "7d", label: "Recent 7 days" },
 { id: "30d", label: "Recent 30 days" },
 { id: "all", label: "All" },
];

export default function ActivityPage() {
 const [searchQuery, setSearchQuery] = useState("");
 const [filterType, setFilterType] = useState("all");
 const [timeRange, setTimeRange] = useState("7d");
 const [isLoading, setIsLoading] = useState(false);

 const handleRefresh = () => {
 setIsLoading(true);
 setTimeout(() => setIsLoading(false), 1000);
 };

 const handleResetFilters = () => {
 setSearchQuery("");
 setFilterType("all");
 setTimeRange("7d");
 };

 const timeRangeLabel = useMemo(() => {
 return timeRanges.find((range) => range.id === timeRange)?.label ?? "Recent 7 days";
 }, [timeRange]);

 const filterLabel = useMemo(() => {
 return filterOptions.find((option) => option.id === filterType)?.label ?? "All Activities";
 }, [filterType]);

 // Get Activity Config
 const getActivityConfig = (type: ActivityType) => {
 return activityTypes[type] || activityTypes.settings_updated;
 };

 // Filter Activities
 const filteredActivities = useMemo(() => {
 const query = searchQuery.trim().toLowerCase();
 const now = new Date();
 const rangeStart = new Date(now);

 if (timeRange === "today") {
 rangeStart.setHours(0, 0, 0, 0);
 } else if (timeRange === "7d") {
 rangeStart.setDate(rangeStart.getDate() - 7);
 rangeStart.setHours(0, 0, 0, 0);
 } else if (timeRange === "30d") {
 rangeStart.setDate(rangeStart.getDate() - 30);
 rangeStart.setHours(0, 0, 0, 0);
 }

 return activities.filter((activity) => {
 const matchesSearch =
 !query ||
 activity.title.toLowerCase().includes(query) ||
 activity.description.toLowerCase().includes(query);

 const matchesFilter =
 filterType === "all" ||
 (filterType === "workflow" && activity.type.includes("workflow")) ||
 (filterType === "agent" && activity.type.includes("agent")) ||
 (filterType === "conversation" && activity.type.includes("conversation")) ||
 (filterType === "file" && activity.type.includes("file")) ||
 (filterType === "security" &&
 (activity.type === "login" ||
 activity.type === "logout" ||
 activity.type === "api_key_created"));

 const activityDate = new Date(activity.timestamp);
 const matchesTime = timeRange === "all" ? true : activityDate >= rangeStart;

 return matchesSearch && matchesFilter && matchesTime;
 });
 }, [searchQuery, filterType, timeRange]);

 const sortedActivities = useMemo(() => {
 return [...filteredActivities].sort(
 (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
 );
 }, [filteredActivities]);

 // Group by Date
 const groupedActivities = useMemo(() => {
 const groups = new Map<string, { label: string; items: ActivityItem[] }>();

 sortedActivities.forEach((activity) => {
 const date = new Date(activity.timestamp);
 const key = date.toISOString().slice(0, 10);
 const label = date.toLocaleDateString("zh-CN", {
 year: "numeric",
 month: "long",
 day: "numeric",
 });

 if (!groups.has(key)) {
 groups.set(key, { label, items: [] });
 }

 groups.get(key)?.items.push(activity);
 });

 return Array.from(groups.entries()).map(([key, value]) => ({
 key,
 ...value,
 }));
 }, [sortedActivities]);

 const activityStats = useMemo(() => {
 return filteredActivities.reduce(
 (acc, activity) => {
 acc.total += 1;
 if (activity.status === "success") {
 acc.success += 1;
 }
 if (activity.status === "warning") {
 acc.warning += 1;
 }
 if (activity.status === "error") {
 acc.error += 1;
 }
 return acc;
 },
 { total: 0, success: 0, warning: 0, error: 0 }
 );
 }, [filteredActivities]);

 const uniqueUsers = useMemo(() => {
 return new Set(filteredActivities.map((activity) => activity.user.name)).size;
 }, [filteredActivities]);

 const successRate = activityStats.total
 ? Math.round((activityStats.success / activityStats.total) * 100)
 : 0;
 const riskTotal = activityStats.warning + activityStats.error;
 const warningRate = riskTotal ? Math.round((activityStats.warning / riskTotal) * 100) : 0;
 const errorRate = riskTotal ? 100 - warningRate : 0;

 const latestActivity = sortedActivities[0];
  const latestActivityLabel = latestActivity ? latestActivity.timeAgo: "No records";

 return (
 <PageContainer>
 <div className="space-y-6">
 <PageHeader
          title="Activity Logs"
          description="Track all account actions and system events. Quickly filter by time and type."
 actions={(
 <div className="flex items-center gap-2">
 <Button
 variant="ghost"
 size="sm"
 onClick={handleRefresh}
 loading={isLoading}
 loadingText="Refresh"
 leftIcon={<RefreshCw className="w-4 h-4" />}
 >
 Refresh
 </Button>
 <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
 Export
 </Button>
 </div>
 )}
 >
 <div className="space-y-2">
 <div className="flex flex-wrap items-center gap-2">
 <Badge variant="secondary" size="xs">
 {timeRangeLabel}
 </Badge>
 <Badge
 variant="outline"
 size="xs"
 className="border-brand-400/40 bg-brand-200/30 text-brand-500"
 dot
 dotColor="var(--color-brand-500)"
 >
 Real-time
 </Badge>
 </div>
 <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
 <div className="flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5" />
            Last update: {latestActivityLabel}
 </div>
 <div className="flex items-center gap-1.5">
 <User className="w-3.5 h-3.5" />
 Active Users: {uniqueUsers}
 </div>
 <div className="flex items-center gap-1.5">
 <Filter className="w-3.5 h-3.5" />
            Current filter: {filterLabel}
 </div>
 </div>
 </div>
 </PageHeader>

 <div className="page-divider" />

 <div className="page-grid sm:grid-cols-2 xl:grid-cols-4">
 <div className="page-panel p-4">
          <p className="text-xs text-foreground-muted">Total Activities</p>
 <p className="mt-2 text-stat-number text-foreground tabular-nums">
 {activityStats.total}
 </p>
          <p className="mt-2 text-xs text-foreground-muted">Filter range: {timeRangeLabel}</p>
 </div>
 <div className="page-panel p-4">
 <p className="text-xs text-foreground-muted">Success Rate</p>
 <p className="mt-2 text-stat-number text-foreground tabular-nums">
 {successRate}%
 </p>
 <p className="mt-2 text-xs text-foreground-muted">Success {activityStats.success} </p>
 <div className="mt-3 h-1.5 rounded-full bg-surface-300 overflow-hidden">
 <div className="h-full bg-brand-500" style={{ width: `${successRate}%` }} />
 </div>
 </div>
 <div className="page-panel p-4">
          <p className="text-xs text-foreground-muted">Risk Events</p>
 <p className="mt-2 text-stat-number text-foreground tabular-nums">
 {activityStats.warning + activityStats.error}
 </p>
 <p className="mt-2 text-xs text-foreground-muted">
 Warning {activityStats.warning} · Failed {activityStats.error}
 </p>
 <div className="mt-3 flex h-1.5 rounded-full overflow-hidden bg-surface-300">
 <div className="h-full bg-warning" style={{ width: `${warningRate}%` }} />
 <div className="h-full bg-destructive" style={{ width: `${errorRate}%` }} />
 </div>
 </div>
 <div className="page-panel p-4">
 <p className="text-xs text-foreground-muted">Active Users</p>
 <p className="mt-2 text-stat-number text-foreground tabular-nums">{uniqueUsers}</p>
          <p className="mt-2 text-xs text-foreground-muted">Participated this week</p>
 </div>
 </div>

 <div className="page-section">
 {/* Filter */}
 <div className="page-panel">
 <div className="page-panel-header flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div>
 <p className="page-panel-title">Filter</p>
            <p className="page-panel-description">Quickly find records by keywords, type, and time range</p>
 </div>
 <Button variant="ghost" size="sm" onClick={handleResetFilters}>
            Reset Filters
 </Button>
 </div>
 <div className="p-6 space-y-4">
 <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
 <div className="flex-1 min-w-[240px]">
 <Input
 variant="search"
              placeholder="Search activities, descriptions, or keywords..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 leftIcon={<Search className="w-4 h-4" />}
 className="w-full"
 />
 </div>
 <div className="flex flex-wrap items-center gap-2">
 {filterOptions.map((option) => (
 <Button
 key={option.id}
 size="sm"
 variant={filterType === option.id ? "default" : "outline"}
 onClick={() => setFilterType(option.id)}
 >
 {option.label}
 </Button>
 ))}
 </div>
 <div className="flex items-center gap-2">
 <Select value={timeRange} onValueChange={setTimeRange}>
 <SelectTrigger className="w-[160px] h-9 bg-surface-100 border-border text-[12px] text-foreground-light">
 <Calendar className="w-4 h-4 mr-2 text-foreground-muted" />
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 {timeRanges.map((range) => (
 <SelectItem key={range.id} value={range.id}>
 {range.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
            <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
              Advanced Filter
 </Button>
 </div>
 </div>
 </div>
 </div>

 {/* Activity List */}
 <div className="page-panel">
 <div className="page-panel-header flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div>
            <p className="page-panel-title">Activity List</p>
            <p className="page-panel-description">{filteredActivities.length} Records</p>
 </div>
 <div className="flex items-center gap-2 text-xs text-foreground-muted">
 <Badge variant="success" size="xs">
 Success {activityStats.success}
 </Badge>
 <Badge variant="warning" size="xs">
 Warning {activityStats.warning}
 </Badge>
 <Badge variant="error" size="xs">
 Failed {activityStats.error}
 </Badge>
 </div>
 </div>

 {groupedActivities.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 text-center">
 <div className="w-12 h-12 rounded-md bg-surface-200 border border-border flex items-center justify-center mb-4">
 <Activity className="w-5 h-5 text-foreground-muted" />
 </div>
              <h3 className="text-base font-medium text-foreground mb-2">No Activity Records</h3>
              <p className="text-[13px] text-foreground-light">
                {searchQuery ? "Try different search keywords or adjust filter criteria": "Your activity will be displayed here"}
 </p>
 </div>
 ) : (
 <>
 <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,140px)] gap-4 px-6 py-2 page-caption bg-surface-75 border-b border-border">
 <span>Event</span>
 <span>Status</span>
              <span>Actor</span>
 <span className="text-right">Time</span>
 </div>
 <div className="divide-y divide-border">
 {groupedActivities.map((group) => (
 <div key={group.key}>
 <div className="flex items-center justify-between px-6 py-3 bg-surface-75 border-b border-border">
 <span className="page-caption">{group.label}</span>
 <span className="text-xs text-foreground-muted">{group.items.length} </span>
 </div>
 <div className="divide-y divide-border">
 {group.items.map((activity) => {
 const config = getActivityConfig(activity.type);
 const ActivityIcon = config.icon;
 const status = statusConfig[activity.status];
 const StatusIcon = status.icon;

 return (
 <div
 key={activity.id}
 className="group px-6 py-4 hover:bg-surface-75/60 transition-colors"
 >
 <div className="page-grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,140px)]">
 <div className="flex items-start gap-3 min-w-0">
 <div
 className={cn(
 "w-9 h-9 rounded-md border border-border flex items-center justify-center shrink-0",
 config.bgColor
 )}
 >
 <ActivityIcon className={cn("w-4 h-4", config.iconColor)} />
 </div>
 <div className="space-y-2 min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <h4 className="text-sm font-medium text-foreground">
 {activity.title}
 </h4>
 <Badge variant={config.badgeVariant} size="xs">
 {config.label}
 </Badge>
 </div>
 <p className="text-[13px] text-foreground-light">
 {activity.description}
 </p>
 {activity.details && (
 <div className="flex flex-wrap items-center gap-2">
 {Object.entries(activity.details).map(([key, value]) => {
 const label = detailLabels[key] || key;
 const isError = key === "error";

 return (
 <div
 key={key}
 className={cn(
 "flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
 isError
 ? "border-destructive/40 bg-destructive-200 text-destructive"
 : "border-border bg-surface-200 text-foreground-light"
 )}
 >
 <span
 className={cn(
 "text-foreground-muted",
 isError && "text-destructive/80"
 )}
 >
 {label}
 </span>
 <span
 className={cn(
 "font-medium tabular-nums",
 isError ? "text-destructive" : "text-foreground"
 )}
 >
 {String(value)}
 </span>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant={status.variant} size="xs" className="gap-1 min-w-[72px] justify-center">
 <StatusIcon className="w-3 h-3" />
 {status.label}
 </Badge>
 </div>
 <div className="flex items-center gap-2">
 <Avatar className="w-6 h-6">
 <AvatarFallback className="text-[11px] bg-brand-200 text-brand-500">
 {activity.user.name.slice(0, 1)}
 </AvatarFallback>
 </Avatar>
 <span className="text-xs text-foreground-muted">{activity.user.name}</span>
 </div>
 <div className="flex items-center justify-between md:justify-end gap-2">
 <div className="flex items-center gap-1.5 text-xs text-foreground-muted tabular-nums">
 <Clock className="w-3.5 h-3.5" />
 {activity.timeAgo}
 </div>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="icon-xs"
 className="text-foreground-muted hover:text-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
 >
 <MoreHorizontal className="w-4 h-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent
 align="end"
 className="bg-surface-100 border-border"
 >
 <DropdownMenuItem className="text-[13px] text-foreground-light hover:text-foreground hover:bg-surface-200">
                  View Details
 </DropdownMenuItem>
 <DropdownMenuItem className="text-[13px] text-foreground-light hover:text-foreground hover:bg-surface-200">
                  Copy
 </DropdownMenuItem>
 <DropdownMenuItem className="text-[13px] text-foreground-light hover:text-foreground hover:bg-surface-200">
                  Export Record
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 </>
 )}
 </div>

 {/* Load more */}
 {filteredActivities.length > 0 && (
 <div className="flex justify-center">
 <Button variant="outline" size="sm" rightIcon={<ChevronDown className="w-4 h-4" />}>
 Load more
 </Button>
 </div>
 )}
 </div>
 </div>
 </PageContainer>
 );
}
