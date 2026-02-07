"use client";

/**
 * I'sAgentPage
 * Supabase Settings Style: Left sideNavigation + Right sideContentLayout
 * Follow STYLE-TERMINAL-PIXEL.md MinimalTextStyleStandard
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
 Bot,
 Plus,
 Search,
 MoreVertical,
 Play,
 Pause,
 Edit,
 Trash2,
 Copy,
 Settings,
 Zap,
 Clock,
 CheckCircle,
 AlertTriangle,
 MessageSquare,
 Code,
 Database,
 Globe,
 ExternalLink,
 List,
 LayoutGrid,
} from "lucide-react";
import { Button, ButtonGroup } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, BadgeGroup } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
 EmptyState,
 PageContainer,
 PageHeader,
 PageWithSidebar,
 SidebarNavGroup,
 SidebarNavItem,
} from "@/components/dashboard/page-layout";
import { LegacyEntryBanner } from "@/components/dashboard/legacy-entry-banner";

// ===== TypeDefinition =====
type AgentStatus = "active" | "paused" | "error" | "draft";

type Agent = {
 id: string;
 name: string;
 description: string;
 status: AgentStatus;
 model: string;
 type: string;
 createdAt: string;
 updatedAt: string;
 lastRun: string;
 totalRuns: number;
 successRate: number;
 tags: string[];
};

// ===== MockData =====
const agents: Agent[] = [
 {
 id: "agent-1",
 name: "SupportSmartAssistant",
 description: "AutoReplyCustomerConsulting, ProcessFAQ, SmartpersonSupport",
 status: "active",
 model: "GPT-4",
 type: "customer-service",
 createdAt: "2026-01-15",
 updatedAt: "2026-01-30",
 lastRun: "2 minbefore",
 totalRuns: 15234,
 successRate: 98.5,
 tags: ["Support", "AutoReply", "Smart"],
 },
 {
 id: "agent-2",
 name: "DataAnalyticsAssistant",
 description: "AutoAnalyticsSalesData, GenerateReport, SendeachdaySummary",
 status: "active",
 model: "GPT-4",
 type: "data-analysis",
 createdAt: "2026-01-10",
 updatedAt: "2026-01-29",
 lastRun: "1 hbefore",
 totalRuns: 892,
 successRate: 99.2,
 tags: ["DataAnalytics", "ReportGenerate", "ScheduledTask"],
 },
 {
 id: "agent-3",
 name: "CodeReviewBot",
 description: "AutoReview Pull Request, CheckCodeStandard, ProvideImproveSuggestion",
 status: "paused",
 model: "Claude 3",
 type: "code-review",
 createdAt: "2026-01-08",
 updatedAt: "2026-01-24",
 lastRun: "3 daysbefore",
 totalRuns: 456,
 successRate: 97.8,
 tags: ["GitHub", "CodeReview", "CI/CD"],
 },
 {
 id: "agent-4",
 name: "ContentCreativeAssistant",
 description: "Based onThemeGenerateBlogArticle, Social MediaContentandMarketing Copy",
 status: "error",
 model: "GPT-4",
 type: "content-creation",
 createdAt: "2026-01-05",
 updatedAt: "2026-01-25",
 lastRun: "5 hbefore",
 totalRuns: 234,
 successRate: 92.3,
 tags: ["ContentGenerate", "Marketing", "Social Media"],
 },
 {
 id: "agent-5",
 name: "willSummaryGenerate",
 description: "AutowillContent, Generatewillneedandrow",
 status: "draft",
 model: "Whisper + GPT-4",
 type: "meeting",
 createdAt: "2026-01-20",
 updatedAt: "2026-01-28",
 lastRun: "not yetRun",
 totalRuns: 0,
 successRate: 0,
 tags: ["will", "", "Summary"],
 },
];

// ===== ConstantConfig =====
const statusMeta = {
 active: { label: "Run", variant: "success", icon: CheckCircle, dot: "bg-brand-500" },
 paused: { label: "Paused", variant: "warning", icon: Pause, dot: "bg-warning-400" },
 error: { label: "Exception", variant: "error", icon: AlertTriangle, dot: "bg-destructive-400" },
 draft: { label: "Draft", variant: "secondary", icon: Edit, dot: "bg-surface-400" },
} as const;

const sortOptions = [
 { id: "recent", label: "RecentUpdate" },
 { id: "success", label: "Success Rate" },
 { id: "runs", label: "Executetimescount" },
 { id: "name", label: "Name" },
] as const;

type SortOption = (typeof sortOptions)[number]["id"];

const typeLabelMap: Record<string, string> = {
 "customer-service": "Support",
 "data-analysis": "DataAnalytics",
 "code-review": "CodeReview",
 "content-creation": "ContentCreative",
 meeting: "will",
};

// ===== Toolcount =====
const formatDate = (value: string) => value.replace(/-/g, ".");
const getTypeLabel = (type: string) => typeLabelMap[type] ?? "use";

const getPerformanceBarClass = (status: AgentStatus) => {
 if (status === "error") return "bg-destructive-400";
 if (status === "paused") return "bg-warning-400";
 if (status === "draft") return "bg-surface-400";
 return "bg-brand-500";
};

const getTypeIcon = (type: string) => {
 switch (type) {
 case "customer-service":
 return MessageSquare;
 case "data-analysis":
 return Database;
 case "code-review":
 return Code;
 case "content-creation":
 return Edit;
 case "meeting":
 return Globe;
 default:
 return Bot;
 }
};

// ===== SidebarNavigationComponent =====
interface StatusNavItemProps {
 label: string;
 count: number;
 dotClass?: string;
 active?: boolean;
 onClick: () => void;
}

function StatusNavItem({ label, count, dotClass, active, onClick }: StatusNavItemProps) {
 return (
 <button
 onClick={onClick}
 className={cn(
 "flex w-full items-center justify-between h-8 px-3 rounded-md text-[12px] font-medium transition-colors",
 active
 ? "bg-surface-100/70 text-foreground"
 : "text-foreground-light hover:text-foreground hover:bg-surface-100/60"
 )}
 >
 <span className="flex items-center gap-2">
 {dotClass && <span className={cn("h-2 w-2 rounded-full", dotClass)} />}
 {label}
 </span>
 <span
 className={cn(
 "text-[11px] tabular-nums",
 active ? "text-foreground" : "text-foreground-muted"
 )}
 >
 {count}
 </span>
 </button>
 );
}

// ===== mainPageComponent =====
export default function MyAgentsPage() {
 const [searchQuery, setSearchQuery] = useState("");
 const [statusFilter, setStatusFilter] = useState<AgentStatus | "all">("all");
 const [activeMenu, setActiveMenu] = useState<string | null>(null);
 const [viewMode, setViewMode] = useState<"list" | "grid">("list");
 const [sortBy, setSortBy] = useState<SortOption>("recent");
 const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

 // ===== DataCalculate =====
 const statusCounts = useMemo(() => {
 return agents.reduce(
 (acc, agent) => {
 acc[agent.status] += 1;
 return acc;
 },
 { active: 0, paused: 0, error: 0, draft: 0 }
 );
 }, []);

 const filteredAgents = useMemo(() => {
 const normalizedQuery = searchQuery.trim().toLowerCase();
 return agents.filter((agent) => {
 const matchesSearch =
 !normalizedQuery ||
 agent.name.toLowerCase().includes(normalizedQuery) ||
 agent.description.toLowerCase().includes(normalizedQuery) ||
 agent.model.toLowerCase().includes(normalizedQuery) ||
 agent.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
 const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
 return matchesSearch && matchesStatus;
 });
 }, [searchQuery, statusFilter]);

 const sortedAgents = useMemo(() => {
 const list = [...filteredAgents];
 switch (sortBy) {
 case "success":
 return list.sort((a, b) => b.successRate - a.successRate);
 case "runs":
 return list.sort((a, b) => b.totalRuns - a.totalRuns);
 case "name":
 return list.sort((a, b) => a.name.localeCompare(b.name));
 case "recent":
 default:
 return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
 }
 }, [filteredAgents, sortBy]);

 // ===== SelectLogic =====
 const selectedSet = useMemo(() => new Set(selectedAgents), [selectedAgents]);
 const selectedVisibleCount = sortedAgents.filter((agent) =>
 selectedSet.has(agent.id)
 ).length;
 const allVisibleSelected =
 sortedAgents.length > 0 && selectedVisibleCount === sortedAgents.length;
 const someVisibleSelected =
 selectedVisibleCount > 0 && selectedVisibleCount < sortedAgents.length;

 const toggleSelectAll = (checked: boolean | "indeterminate") => {
 if (checked === true) {
 setSelectedAgents(sortedAgents.map((agent) => agent.id));
 return;
 }
 setSelectedAgents([]);
 };

 const toggleSelectAgent = (agentId: string, checked: boolean | "indeterminate") => {
 setSelectedAgents((prev) => {
 const next = new Set(prev);
 if (checked === true) {
 next.add(agentId);
 } else {
 next.delete(agentId);
 }
 return Array.from(next);
 });
 };

 const hasFilters = searchQuery.trim() !== "" || statusFilter !== "all";

 // ===== SidebarRender =====
 const sidebar = (
 <div className="space-y-6">
 {/* StatusCategoryNavigation */}
 <SidebarNavGroup title="AGENTS">
 <StatusNavItem
 label="allsectionAgent"
 count={agents.length}
 active={statusFilter === "all"}
 onClick={() => setStatusFilter("all")}
 />
 <StatusNavItem
 label="Run"
 count={statusCounts.active}
 dotClass={statusMeta.active.dot}
 active={statusFilter === "active"}
 onClick={() => setStatusFilter("active")}
 />
 <StatusNavItem
 label="Paused"
 count={statusCounts.paused}
 dotClass={statusMeta.paused.dot}
 active={statusFilter === "paused"}
 onClick={() => setStatusFilter("paused")}
 />
 <StatusNavItem
 label="Exception"
 count={statusCounts.error}
 dotClass={statusMeta.error.dot}
 active={statusFilter === "error"}
 onClick={() => setStatusFilter("error")}
 />
 <StatusNavItem
 label="Draft"
 count={statusCounts.draft}
 dotClass={statusMeta.draft.dot}
 active={statusFilter === "draft"}
 onClick={() => setStatusFilter("draft")}
 />
 </SidebarNavGroup>

 {/* QuickAction */}
 <SidebarNavGroup title="QuickAction">
 <Link href="/dashboard/my-agents/new" className="block">
 <Button
 variant="ghost"
 size="sm"
 leftIcon={<Plus className="h-3.5 w-3.5" />}
 className="w-full justify-start h-8 text-[12px] font-medium text-foreground-light hover:text-foreground"
 >
 CreateAgent
 </Button>
 </Link>
 </SidebarNavGroup>
 </div>
 );

 return (
 <PageWithSidebar
 sidebarWidth="narrow"
 sidebarTitle="Agents"
 sidebar={sidebar}
 >
 <PageContainer>
 <LegacyEntryBanner type="agent" />
 {/* PageHeader */}
 <PageHeader
 title="I'sAgent"
 description="ManageAllAutomationAgent, RunStatusandExecutePerformance"
 actions={
 <Button
 variant="outline"
 size="sm"
 leftIcon={<Settings className="h-4 w-4" />}
 >
 BatchManage
 </Button>
 }
 />

 {/* Toolbar */}
 <div className="flex flex-wrap items-center gap-3">
 <Input
 value={searchQuery}
 onChange={(event) => setSearchQuery(event.target.value)}
 placeholder="SearchAgent, TagsorModel..."
 leftIcon={<Search className="h-4 w-4" />}
 variant="search"
 inputSize="sm"
 className="w-full sm:w-[240px]"
 />

 <div className="ml-auto flex items-center gap-2">
 <span className="hidden md:inline text-[12px] text-foreground-muted">Sort</span>
 <select
 value={sortBy}
 onChange={(event) => setSortBy(event.target.value as SortOption)}
 className="h-8 rounded-md border border-border bg-surface-100 px-2.5 text-[12px] text-foreground-light focus:border-brand-500 focus:outline-none transition-colors"
 >
 {sortOptions.map((option) => (
 <option key={option.id} value={option.id}>
 {option.label}
 </option>
 ))}
 </select>

 <ButtonGroup attached>
 <Button
 variant={viewMode === "list" ? "secondary" : "ghost"}
 size="icon-sm"
 onClick={() => setViewMode("list")}
 >
 <List className="h-4 w-4" />
 </Button>
 <Button
 variant={viewMode === "grid" ? "secondary" : "ghost"}
 size="icon-sm"
 onClick={() => setViewMode("grid")}
 >
 <LayoutGrid className="h-4 w-4" />
 </Button>
 </ButtonGroup>
 </div>
 </div>

 {/* Resultcount */}
 <div className="flex items-center justify-between text-[11px] text-foreground-muted">
 <span>
 Display {sortedAgents.length} / {agents.length} Agent
 </span>
 {statusFilter !== "all" && (
 <button
 onClick={() => setStatusFilter("all")}
 className="text-foreground-light hover:text-foreground transition-colors"
 >
 ClearFilter
 </button>
 )}
 </div>

 {/* BatchAction */}
 {selectedVisibleCount > 0 && (
 <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-md border border-border bg-surface-75/80 text-[12px]">
 <div className="flex items-center gap-2 text-foreground-light">
 <Badge variant="secondary" size="xs">
 alreadyselect {selectedVisibleCount} 
 </Badge>
 <span>canProceedBatchAction</span>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="secondary" size="xs" leftIcon={<Pause className="h-3.5 w-3.5" />}>
 Pause
 </Button>
 <Button variant="secondary" size="xs" leftIcon={<Play className="h-3.5 w-3.5" />}>
 Launch
 </Button>
 <Button variant="outline" size="xs" leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
 Delete
 </Button>
 <Button variant="ghost" size="xs" onClick={() => setSelectedAgents([])}>
 ClearSelect
 </Button>
 </div>
 </div>
 )}

 {/* AgentList/Grid */}
 {sortedAgents.length > 0 ? (
 viewMode === "list" ? (
 <AgentListView
 agents={sortedAgents}
 selectedSet={selectedSet}
 allVisibleSelected={allVisibleSelected}
 someVisibleSelected={someVisibleSelected}
 toggleSelectAll={toggleSelectAll}
 toggleSelectAgent={toggleSelectAgent}
 activeMenu={activeMenu}
 setActiveMenu={setActiveMenu}
 />
 ) : (
 <AgentGridView
 agents={sortedAgents}
 activeMenu={activeMenu}
 setActiveMenu={setActiveMenu}
 />
 )
 ) : (
 <EmptyState
 icon={<Bot className="h-5 w-5" />}
 title={hasFilters ? "NotoMatch'sAgent": "Not yetCreateAgent"}
 description={
 hasFilters
 ? "TryUsageotherheKeywordsorFilterCondition"
: "Createyou's#1 AI Agent, StartAutomationJourney."
 }
 action={
 hasFilters
 ? {
 label: "ClearFilter",
 onClick: () => {
 setSearchQuery("");
 setStatusFilter("all");
 },
 }
: { label: "CreateAgent", href: "/dashboard/my-agents/new" }
 }
 />
 )}
 </PageContainer>
 </PageWithSidebar>
 );
}

// ===== ListViewComponent =====
interface AgentListViewProps {
 agents: Agent[];
 selectedSet: Set<string>;
 allVisibleSelected: boolean;
 someVisibleSelected: boolean;
 toggleSelectAll: (checked: boolean | "indeterminate") => void;
 toggleSelectAgent: (agentId: string, checked: boolean | "indeterminate") => void;
 activeMenu: string | null;
 setActiveMenu: (id: string | null) => void;
}

function AgentListView({
 agents,
 selectedSet,
 allVisibleSelected,
 someVisibleSelected,
 toggleSelectAll,
 toggleSelectAgent,
 activeMenu,
 setActiveMenu,
}: AgentListViewProps) {
 return (
 <div className="rounded-md border border-border overflow-hidden">
 {/* head */}
 <div className="grid grid-cols-[auto_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b border-border bg-surface-75/80 pl-4 pr-5 py-2.5 text-[11px] font-medium text-foreground-muted uppercase tracking-wide border-l-2 border-l-transparent">
 <div className="flex items-center">
 <Checkbox
 checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
 onCheckedChange={toggleSelectAll}
 aria-label="SelectAllAgent"
 />
 </div>
 <span>Agent</span>
 <span>Status</span>
 <span>ExecutePerformance</span>
 <span className="text-right">Action</span>
 </div>

 {/* List */}
 <div className="divide-y divide-border">
 {agents.map((agent) => {
 const statusInfo = statusMeta[agent.status];
 const StatusIcon = statusInfo.icon;
 const TypeIcon = getTypeIcon(agent.type);
 const performanceBarClass = getPerformanceBarClass(agent.status);
 const isSelected = selectedSet.has(agent.id);

 return (
 <div
 key={agent.id}
 className={cn(
 "group grid grid-cols-[auto_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-l-2 pl-4 pr-5 py-3.5 transition-colors hover:bg-surface-75/60 hover:border-l-brand-500",
 agent.status === "error" && "border-l-destructive-400",
 agent.status === "paused" && "border-l-warning-400",
 agent.status === "draft" && "border-l-surface-400",
 agent.status === "active" && "border-l-brand-500/60",
 isSelected && "bg-surface-75/70"
 )}
 >
 {/* Select */}
 <div className="flex items-start pt-0.5">
 <Checkbox
 checked={isSelected}
 onCheckedChange={(checked) => toggleSelectAgent(agent.id, checked)}
 aria-label={`Select ${agent.name}`}
 />
 </div>

 {/* AgentInfo */}
 <div className="flex min-w-0 gap-3">
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-200">
 <TypeIcon className="h-4 w-4 text-foreground-light" />
 </div>
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <Link
 href={`/dashboard/my-agents/${agent.id}`}
 className="text-[13px] font-medium text-foreground hover:text-foreground-light transition-colors"
 >
 {agent.name}
 </Link>
 <Badge variant="outline" size="xs">
 {agent.model}
 </Badge>
 <Badge variant="secondary" size="xs">
 {getTypeLabel(agent.type)}
 </Badge>
 </div>
 <p className="mt-0.5 text-[12px] text-foreground-light line-clamp-1">
 {agent.description}
 </p>
 <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
 <span className="font-mono">ID {agent.id}</span>
 <span className="h-1 w-1 rounded-full bg-foreground-muted/70" />
 <span>Create {formatDate(agent.createdAt)}</span>
 </div>
 <BadgeGroup max={3} className="mt-1.5">
 {agent.tags.map((tag) => (
 <Badge key={tag} variant="secondary" size="xs">
 {tag}
 </Badge>
 ))}
 </BadgeGroup>
 </div>
 </div>

 {/* Status */}
 <div className="space-y-1.5">
 <Badge
 variant={statusInfo.variant}
 size="xs"
 icon={<StatusIcon className="h-3 w-3" />}
 >
 {statusInfo.label}
 </Badge>
 <div className="text-[11px] text-foreground-muted">
 Update {formatDate(agent.updatedAt)}
 </div>
 </div>

 {/* ExecutePerformance */}
 <div className="space-y-1.5 text-[11px] text-foreground-light">
 <div className="flex items-center gap-1.5">
 <Zap className="h-3 w-3" />
 {agent.totalRuns.toLocaleString()} times
 </div>
 <div className="flex items-center gap-1.5">
 <CheckCircle className="h-3 w-3" />
 {agent.successRate}%
 </div>
 <div className="h-1 rounded-full bg-surface-300">
 <div
 className={cn("h-1 rounded-full", performanceBarClass)}
 style={{ width: `${agent.successRate}%` }}
 />
 </div>
 <div className="flex items-center gap-1.5">
 <Clock className="h-3 w-3" />
 {agent.lastRun}
 </div>
 </div>

 {/* Action */}
 <div className="flex items-center justify-end">
 <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
 <AgentActionButton status={agent.status} />
 <Button variant="ghost" size="icon-sm" asChild>
 <Link href={`/dashboard/my-agents/${agent.id}/edit`}>
 <Settings className="h-3.5 w-3.5" />
 </Link>
 </Button>
 <AgentMenu
 agentId={agent.id}
 activeMenu={activeMenu}
 setActiveMenu={setActiveMenu}
 />
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}

// ===== GridViewComponent =====
interface AgentGridViewProps {
 agents: Agent[];
 activeMenu: string | null;
 setActiveMenu: (id: string | null) => void;
}

function AgentGridView({ agents, activeMenu, setActiveMenu }: AgentGridViewProps) {
 return (
 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
 {agents.map((agent) => {
 const statusInfo = statusMeta[agent.status];
 const StatusIcon = statusInfo.icon;
 const TypeIcon = getTypeIcon(agent.type);
 const performanceBarClass = getPerformanceBarClass(agent.status);

 return (
 <div
 key={agent.id}
 className="group rounded-md border border-border bg-surface-100/50 p-4 transition-all hover:border-border-strong"
 >
 {/* Header */}
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
 <TypeIcon className="h-4 w-4 text-foreground-light" />
 </div>
 <div>
 <Link
 href={`/dashboard/my-agents/${agent.id}`}
 className="text-[13px] font-medium text-foreground hover:text-foreground-light transition-colors"
 >
 {agent.name}
 </Link>
 <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
 <Badge variant="outline" size="xs">
 {agent.model}
 </Badge>
 <Badge variant="secondary" size="xs">
 {getTypeLabel(agent.type)}
 </Badge>
 </div>
 </div>
 </div>
 <Badge
 variant={statusInfo.variant}
 size="xs"
 icon={<StatusIcon className="h-3 w-3" />}
 >
 {statusInfo.label}
 </Badge>
 </div>

 {/* Description */}
 <p className="mt-2.5 text-[12px] text-foreground-light line-clamp-2">
 {agent.description}
 </p>

 {/* Tags */}
 <BadgeGroup max={3} className="mt-2.5">
 {agent.tags.map((tag) => (
 <Badge key={tag} variant="secondary" size="xs">
 {tag}
 </Badge>
 ))}
 </BadgeGroup>

 {/* Statistics */}
 <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-foreground-light">
 <div className="rounded-md border border-border bg-surface-100/70 p-2">
 <Zap className="mb-0.5 h-3 w-3" />
 <div className="text-foreground font-medium">{agent.totalRuns.toLocaleString()}</div>
 <div className="text-[10px] text-foreground-muted">Execute</div>
 </div>
 <div className="rounded-md border border-border bg-surface-100/70 p-2">
 <CheckCircle className="mb-0.5 h-3 w-3" />
 <div className="text-foreground font-medium">{agent.successRate}%</div>
 <div className="text-[10px] text-foreground-muted">Success Rate</div>
 <div className="mt-1 h-1 rounded-full bg-surface-300">
 <div
 className={cn("h-1 rounded-full", performanceBarClass)}
 style={{ width: `${agent.successRate}%` }}
 />
 </div>
 </div>
 <div className="rounded-md border border-border bg-surface-100/70 p-2">
 <Clock className="mb-0.5 h-3 w-3" />
 <div className="text-foreground font-medium">{agent.lastRun}</div>
 <div className="text-[10px] text-foreground-muted">ontimesRun</div>
 </div>
 </div>

 {/* FooterAction */}
 <div className="mt-3 flex items-center justify-between text-[11px] text-foreground-muted">
 <span>Update {formatDate(agent.updatedAt)}</span>
 <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
 <AgentActionButton status={agent.status} />
 <Button variant="ghost" size="icon-sm" asChild>
 <Link href={`/dashboard/my-agents/${agent.id}/edit`}>
 <Settings className="h-3.5 w-3.5" />
 </Link>
 </Button>
 <AgentMenu
 agentId={agent.id}
 activeMenu={activeMenu}
 setActiveMenu={setActiveMenu}
 />
 </div>
 </div>
 </div>
 );
 })}
 </div>
 );
}

// ===== AgentActionButton =====
function AgentActionButton({ status }: { status: AgentStatus }) {
 switch (status) {
 case "active":
 return (
 <Button variant="secondary" size="xs" leftIcon={<Pause className="h-3 w-3" />}>
 Pause
 </Button>
 );
 case "paused":
 return (
 <Button variant="secondary" size="xs" leftIcon={<Play className="h-3 w-3" />}>
 Launch
 </Button>
 );
 case "draft":
 return (
 <Button variant="outline" size="xs" leftIcon={<Edit className="h-3 w-3" />}>
 Improve
 </Button>
 );
 case "error":
 return (
 <Button variant="outline" size="xs" leftIcon={<AlertTriangle className="h-3 w-3" />}>
 Diagnose
 </Button>
 );
 default:
 return null;
 }
}

// ===== AgentMenu =====
interface AgentMenuProps {
 agentId: string;
 activeMenu: string | null;
 setActiveMenu: (id: string | null) => void;
}

function AgentMenu({ agentId, activeMenu, setActiveMenu }: AgentMenuProps) {
 return (
 <div className="relative">
 <Button
 variant="ghost"
 size="icon-sm"
 onClick={() => setActiveMenu(activeMenu === agentId ? null : agentId)}
 >
 <MoreVertical className="h-3.5 w-3.5" />
 </Button>

 {activeMenu === agentId && (
 <div className="absolute right-0 top-full mt-1 w-40 rounded-md border border-border bg-surface-100 p-1 z-20 shadow-lg">
 <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-foreground-light hover:bg-surface-200 hover:text-foreground transition-colors">
 <Copy className="h-3.5 w-3.5" />
 Copy
 </button>
 <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-foreground-light hover:bg-surface-200 hover:text-foreground transition-colors">
 <ExternalLink className="h-3.5 w-3.5" />
 ViewLogs
 </button>
 <div className="mx-2 my-1 h-px bg-border-muted" />
 <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-destructive hover:bg-destructive-200 transition-colors">
 <Trash2 className="h-3.5 w-3.5" />
 Delete
 </button>
 </div>
 )}
 </div>
 );
}
