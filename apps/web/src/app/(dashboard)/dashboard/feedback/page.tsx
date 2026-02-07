"use client";

/**
 * FeedbackSuggestionPage - Supabase Style
 * UserFeedback, FeaturesSuggestion, Bug Report
 */

import { type ElementType, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
 AlertCircle,
 ArrowUp,
 Bug,
 CheckCircle2,
 Circle,
 Clock,
 Eye,
 Filter,
 HelpCircle,
 Image,
 Lightbulb,
 Loader2,
 MessageSquare,
 MessageSquarePlus,
 Paperclip,
 Plus,
 Search,
 Send,
 Star,
 ThumbsUp,
 TrendingUp,
 X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// FeedbackType
const feedbackTypes = [
 {
 id: "feature",
 label: "FeaturesSuggestion",
 icon: Lightbulb,
 color: "text-warning",
 bgColor: "bg-warning-200",
 dot: "bg-warning",
 description: "newFeaturesorFlowImproveSuggestion",
 },
 {
 id: "bug",
 label: "Bug Report",
 icon: Bug,
 color: "text-destructive",
 bgColor: "bg-destructive-200",
 dot: "bg-destructive-400",
 description: "ReportSystemIssueorException",
 },
 {
 id: "question",
 label: "UsageIssue",
 icon: HelpCircle,
 color: "text-brand-500",
 bgColor: "bg-brand-200",
 dot: "bg-brand-500",
 description: "Usagepast's",
 },
 {
 id: "other",
 label: "otherheFeedback",
 icon: MessageSquarePlus,
 color: "text-foreground-light",
 bgColor: "bg-surface-200",
 dot: "bg-foreground-muted",
 description: "ExperienceorotherheSuggestion",
 },
];

// StatusConfig
const statusConfig = {
 open: {
 label: "Pending",
 color: "text-foreground-light",
 bg: "bg-surface-200",
 dot: "bg-foreground-muted",
 icon: Circle,
 },
 in_progress: {
 label: "Processing",
 color: "text-warning",
 bg: "bg-warning-200",
 dot: "bg-warning",
 icon: Loader2,
 },
 resolved: {
 label: "alreadyResolve",
 color: "text-brand-500",
 bg: "bg-brand-200",
 dot: "bg-brand-500",
 icon: CheckCircle2,
 },
 closed: {
 label: "alreadyClose",
 color: "text-foreground-muted",
 bg: "bg-surface-200",
 dot: "bg-foreground-muted",
 icon: X,
 },
} as const;

// PopularSuggestion
const popularSuggestions = [
 {
 id: "1",
 title: "SupportmoremultipleThird-partyIntegration",
 description: "HopecanIntegration Notion, Airtable, FeishuetcmoremultipleTool",
 type: "feature",
 votes: 156,
 comments: 23,
 status: "in_progress",
 createdAt: "2026-01-15",
 },
 {
 id: "2",
 title: "IncreaseWorkflowVersionControl",
 description: "canSaveandRollbackWorkflow'sVersion History",
 type: "feature",
 votes: 128,
 comments: 18,
 status: "open",
 createdAt: "2026-01-20",
 },
 {
 id: "3",
 title: "Moveendpoint App Support",
 description: "Hopehas iOS and Android NativeApp",
 type: "feature",
 votes: 98,
 comments: 12,
 status: "open",
 createdAt: "2026-01-18",
 },
 {
 id: "4",
 title: "Custom AI ModelParameter",
 description: "canAdjust temperature, top_p etcModelParameter",
 type: "feature",
 votes: 87,
 comments: 9,
 status: "resolved",
 createdAt: "2026-01-10",
 },
 {
 id: "5",
 title: "BatchImportExportFeatures",
 description: "SupportBatchImportExportWorkflowand Agent",
 type: "feature",
 votes: 76,
 comments: 15,
 status: "open",
 createdAt: "2026-01-22",
 },
];

// I'sFeedback
const myFeedback = [
 {
 id: "f1",
 title: "WorkflowExecuteLogsnotDetailed",
 description: "HopecanseetoeachNode'sDetailedExecuteInfoandDuration",
 type: "feature",
 status: "in_progress",
 votes: 12,
 comments: 3,
 createdAt: "2026-01-25",
 reply: "Thank youyou'sSuggestion!WecurrentlyatDevelopmentmoreDetailed'sExecuteLogsFeatures, EstimateddownVersiononline.",
 },
 {
 id: "f2",
 title: "Agent ResponseTimeout",
 description: "atUsage Agent timeAppearResponseTimeout'sSituation",
 type: "bug",
 status: "resolved",
 votes: 5,
 comments: 2,
 createdAt: "2026-01-20",
 reply: "IssuealreadyFix, WeoptimalServiceResponse TimeandIncreaseTimeoutRetryMechanism.",
 },
];

const typeFilterOptions = [
 { id: "all", label: "allsectionType", dot: "bg-foreground-muted" },
 ...feedbackTypes.map((type) => ({
 id: type.id,
 label: type.label,
 icon: type.icon,
 dot: type.dot,
 })),
];

const statusFilterOptions = [
 { id: "all", label: "allsectionStatus", dot: "bg-foreground-muted" },
 ...Object.entries(statusConfig).map(([id, config]) => ({
 id,
 label: config.label,
 icon: config.icon,
 dot: config.dot,
 })),
];

type FilterPillProps = {
 label: string;
 active: boolean;
 onClick: () => void;
 icon?: ElementType;
 dotClassName?: string;
};

function FilterPill({ label, active, onClick, icon: Icon, dotClassName }: FilterPillProps) {
 return (
 <button
 type="button"
 onClick={onClick}
 aria-pressed={active}
 className={cn(
 "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] transition-supabase",
 active
 ? "border-border-strong bg-surface-200 text-foreground"
 : "border-border bg-surface-100/40 text-foreground-light hover:text-foreground hover:border-border-strong hover:bg-surface-200/70"
 )}
 >
 {dotClassName && <span className={cn("h-2 w-2 rounded-full", dotClassName)} />}
 {Icon && <Icon className="w-3.5 h-3.5" />}
 <span>{label}</span>
 </button>
 );
}

export default function FeedbackPage() {
 const [activeTab, setActiveTab] = useState("popular");
 const [selectedType, setSelectedType] = useState<string | null>(null);
 const [feedbackTitle, setFeedbackTitle] = useState("");
 const [feedbackContent, setFeedbackContent] = useState("");
 const [searchQuery, setSearchQuery] = useState("");
 const [votedItems, setVotedItems] = useState<Set<string>>(new Set());
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [showForm, setShowForm] = useState(false);
 const [typeFilter, setTypeFilter] = useState("all");
 const [statusFilter, setStatusFilter] = useState("all");

 const normalizedQuery = searchQuery.trim().toLowerCase();

 const filteredSuggestions = useMemo(() => {
 return popularSuggestions.filter((item) => {
 const matchesSearch =
 !normalizedQuery ||
 item.title.toLowerCase().includes(normalizedQuery) ||
 item.description.toLowerCase().includes(normalizedQuery);
 const matchesType = typeFilter === "all" || item.type === typeFilter;
 const matchesStatus = statusFilter === "all" || item.status === statusFilter;
 return matchesSearch && matchesType && matchesStatus;
 });
 }, [normalizedQuery, typeFilter, statusFilter]);

 const filteredMine = useMemo(() => {
 return myFeedback.filter((item) => {
 const matchesSearch =
 !normalizedQuery ||
 item.title.toLowerCase().includes(normalizedQuery) ||
 item.description.toLowerCase().includes(normalizedQuery);
 const matchesType = typeFilter === "all" || item.type === typeFilter;
 const matchesStatus = statusFilter === "all" || item.status === statusFilter;
 return matchesSearch && matchesType && matchesStatus;
 });
 }, [normalizedQuery, typeFilter, statusFilter]);

 const openCount = popularSuggestions.filter(
 (item) => item.status === "open" || item.status === "in_progress"
 ).length;
 const resolvedCount = popularSuggestions.filter((item) => item.status === "resolved").length;
 const closedCount = popularSuggestions.filter((item) => item.status === "closed").length;
 const totalVotes = popularSuggestions.reduce(
 (acc, item) => acc + item.votes + (votedItems.has(item.id) ? 1 : 0),
 0
 );

 const filtersActive =
 typeFilter !== "all" || statusFilter !== "all" || normalizedQuery.length > 0;

 const resetFilters = () => {
 setTypeFilter("all");
 setStatusFilter("all");
 setSearchQuery("");
 };

 const resetForm = () => {
 setShowForm(false);
 setSelectedType(null);
 setFeedbackTitle("");
 setFeedbackContent("");
 };

 // Vote
 const handleVote = (id: string) => {
 const newVoted = new Set(votedItems);
 if (newVoted.has(id)) {
 newVoted.delete(id);
 } else {
 newVoted.add(id);
 }
 setVotedItems(newVoted);
 };

 // SubmitFeedback
 const handleSubmit = async () => {
 if (!selectedType || !feedbackTitle || !feedbackContent) return;
 setIsSubmitting(true);
 await new Promise((resolve) => setTimeout(resolve, 1500));
 setIsSubmitting(false);
 resetForm();
 setActiveTab("mine");
 };

 return (
 <div className="page-section p-6">
 <div className="page-header">
 <div>
 <p className="page-caption">Feedback</p>
 <div className="flex flex-wrap items-center gap-2">
 <h1 className="page-title flex items-center gap-2">
 <MessageSquarePlus className="w-5 h-5 text-brand-500" />
 Feedbackcenter
 </h1>
 <Badge
 variant="secondary"
 className="bg-surface-200 text-foreground-muted text-[10px] uppercase tracking-wider"
 >
 Beta
 </Badge>
 </div>
 <p className="page-description">SubmitSuggestion, ReportIssueandTrackProcessProgress</p>
 <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
 <span className="flex items-center gap-1">
 <Clock className="w-3.5 h-3.5" />
 AverageResponse 2-3 days
 </span>
 <span className="flex items-center gap-1">
 <ThumbsUp className="w-3.5 h-3.5" />
 VoteImpactPriority
 </span>
 <span className="flex items-center gap-1">
 <MessageSquare className="w-3.5 h-3.5" />
 eachSuggestionSupportDiscussion
 </span>
 </div>
 </div>
 <div className="page-toolbar">
 <Button
 variant="outline"
 size="sm"
 className="h-8 border-border text-foreground-light hover:text-foreground"
 >
 <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
 Feedbackthen
 </Button>
 <Button
 size="sm"
 className="h-8 bg-brand-500 text-background hover:bg-brand-600"
 onClick={() => setShowForm(true)}
 >
 <Plus className="w-3.5 h-3.5 mr-1.5" />
 SubmitFeedback
 </Button>
 </div>
 </div>

 <div className="page-panel">
 <div className="page-panel-header flex items-center justify-between">
 <div>
 <h2 className="page-panel-title">FeedbackOverview</h2>
 <p className="page-panel-description">SubmitandVote'sReal-timeData</p>
 </div>
 <Badge
 variant="secondary"
 className="bg-surface-200 text-foreground-muted text-[11px]"
 >
 {openCount} Pending
 </Badge>
 </div>
 <div className="p-6">
 <div className="page-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
 <div className="rounded-md border border-border bg-surface-75/60 p-4 transition-supabase hover:border-border-strong">
 <div className="flex items-center justify-between">
 <span className="page-caption">OpenSuggestion</span>
 <TrendingUp className="w-4 h-4 text-foreground-muted" />
 </div>
 <div className="mt-2 text-stat-number text-foreground">{openCount}</div>
 <p className="text-xs text-foreground-light">PendingandProcessing</p>
 </div>
 <div className="rounded-md border border-border bg-surface-75/60 p-4 transition-supabase hover:border-border-strong">
 <div className="flex items-center justify-between">
 <span className="page-caption">alreadyResolve</span>
 <CheckCircle2 className="w-4 h-4 text-foreground-muted" />
 </div>
 <div className="mt-2 text-stat-number text-foreground">{resolvedCount + closedCount}</div>
 <p className="text-xs text-foreground-light">alreadyCloseandalreadyResolve</p>
 </div>
 <div className="rounded-md border border-border bg-surface-75/60 p-4 transition-supabase hover:border-border-strong">
 <div className="flex items-center justify-between">
 <span className="page-caption">totalVote</span>
 <ThumbsUp className="w-4 h-4 text-foreground-muted" />
 </div>
 <div className="mt-2 text-stat-number text-foreground">{totalVotes}</div>
 <p className="text-xs text-foreground-light">CommunityFollowMetrics</p>
 </div>
 <div className="rounded-md border border-border bg-surface-75/60 p-4 transition-supabase hover:border-border-strong">
 <div className="flex items-center justify-between">
 <span className="page-caption">I'sFeedback</span>
 <Star className="w-4 h-4 text-foreground-muted" />
 </div>
 <div className="mt-2 text-stat-number text-foreground">{myFeedback.length}</div>
 <p className="text-xs text-foreground-light">alreadySubmit'sFeedback</p>
 </div>
 </div>
 </div>
 </div>

 <div className="page-grid xl:grid-cols-[360px_minmax(0,1fr)]">
 <div className="space-y-6">
 <div className="page-panel">
 <div className="page-panel-header">
 <div className="flex items-center justify-between">
 <h2 className="page-panel-title">SubmitFeedback</h2>
 <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[10px] tracking-wider">
 PriorityEvaluate
 </Badge>
 </div>
 <p className="page-panel-description">Clear'sDescriptioncanmoreEnterProcessQueue</p>
 </div>
 <div className="p-5 space-y-5">
 {showForm ? (
 <>
 <div className="space-y-3">
 <label className="text-xs font-medium text-foreground">SelectFeedbackType</label>
 <div className="grid grid-cols-2 gap-3">
 {feedbackTypes.map((type) => {
 const Icon = type.icon;
 return (
 <button
 key={type.id}
 type="button"
 onClick={() => setSelectedType(type.id)}
 aria-pressed={selectedType === type.id}
 className={cn(
 "rounded-md border p-3 text-left transition-supabase",
 selectedType === type.id
 ? "border-brand-400 bg-brand-200/40"
 : "border-border bg-surface-75/40 hover:border-border-strong hover:bg-surface-200"
 )}
 >
 <div className="flex items-center gap-2">
 <div
 className={cn(
 "w-9 h-9 rounded-md flex items-center justify-center",
 type.bgColor
 )}
 >
 <Icon className={cn("w-4 h-4", type.color)} />
 </div>
 <div>
 <div className="text-[13px] font-medium text-foreground">{type.label}</div>
 <div className="text-xs text-foreground-muted">{type.description}</div>
 </div>
 </div>
 </button>
 );
 })}
 </div>
 </div>

 <div className="space-y-4">
 <div>
 <label className="text-xs font-medium text-foreground">Title</label>
 <Input
 placeholder="needDescriptionyou'sFeedback..."
 value={feedbackTitle}
 onChange={(e) => setFeedbackTitle(e.target.value)}
 className="mt-2 h-9 bg-surface-200 border-border text-foreground placeholder:text-foreground-muted focus:border-brand-400"
 />
 </div>
 <div>
 <label className="text-xs font-medium text-foreground">DetailedDescription</label>
 <textarea
 placeholder="PleaseDetailedDescriptionyou'sSuggestionorto'sIssue..."
 value={feedbackContent}
 onChange={(e) => setFeedbackContent(e.target.value)}
 rows={6}
 className="mt-2 w-full px-4 py-3 rounded-md bg-surface-200 border border-border focus:border-brand-400 focus:ring-1 focus:ring-brand-500 outline-none resize-none text-foreground placeholder:text-foreground-muted"
 />
 </div>
 </div>

 <div className="rounded-md border border-border bg-surface-75/50 p-3">
 <div className="flex items-center justify-between gap-3">
 <div>
 <div className="text-xs font-medium text-foreground">AttachmentandScreenshot</div>
 <div className="text-xs text-foreground-muted mt-1">Support PNG, JPG andLogsFile</div>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline" size="xs" className="border-border text-foreground-light">
 <Image className="w-3.5 h-3.5 mr-1" />
 AddScreenshot
 </Button>
 <Button variant="outline" size="xs" className="border-border text-foreground-light">
 <Paperclip className="w-3.5 h-3.5 mr-1" />
 AddAttachment
 </Button>
 </div>
 </div>
 </div>

 <div className="flex items-center justify-end gap-2">
 <Button variant="outline" size="sm" onClick={resetForm} className="border-border">
 Cancel
 </Button>
 <Button
 size="sm"
 onClick={handleSubmit}
 disabled={!selectedType || !feedbackTitle || !feedbackContent || isSubmitting}
 className="bg-brand-500 hover:bg-brand-600 text-background"
 >
 {isSubmitting ? (
 <>
 <Loader2 className="w-4 h-4 mr-1 animate-spin" />
 Submit...
 </>
 ) : (
 <>
 <Send className="w-4 h-4 mr-1" />
 SubmitFeedback
 </>
 )}
 </Button>
 </div>
 </>
 ) : (
 <div className="space-y-4">
 <div className="rounded-md border border-border bg-surface-75/60 p-4">
 <div className="flex items-center gap-2 text-sm font-medium text-foreground">
 <MessageSquarePlus className="w-4 h-4 text-brand-500" />
 QuickSubmit
 </div>
 <p className="text-xs text-foreground-muted mt-2">
 SelectFeedbackTypeafternowcanQuickStart, Clear'sIssueDescriptionEasyby.
 </p>
 </div>
 <div className="grid grid-cols-2 gap-2">
 {feedbackTypes.map((type) => {
 const Icon = type.icon;
 return (
 <button
 key={type.id}
 type="button"
 onClick={() => {
 setSelectedType(type.id);
 setShowForm(true);
 }}
 className="rounded-md border border-border bg-surface-100 px-3 py-2 text-left text-xs text-foreground-light hover:text-foreground hover:border-border-strong hover:bg-surface-200 transition-supabase"
 >
 <div className="flex items-center gap-2">
 <Icon className={cn("w-3.5 h-3.5", type.color)} />
 <span>{type.label}</span>
 </div>
 </button>
 );
 })}
 </div>
 <Button
 variant="outline"
 size="sm"
 className="w-full border-border text-foreground-light hover:text-foreground"
 onClick={() => setShowForm(true)}
 >
 Fill inCompleteFeedback
 </Button>
 </div>
 )}
 </div>
 </div>

 <div className="page-panel">
 <div className="page-panel-header">
 <h3 className="page-panel-title">Feedbackthen</h3>
 <p className="page-panel-description">letSuggestionmorebyTeam</p>
 </div>
 <div className="p-5 space-y-3 text-[13px] text-foreground-light">
 <div className="flex items-start gap-2">
 <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5" />
 <div>
 DescriptionBackgroundandTarget, letWeIssueOccur'sScenario.
 </div>
 </div>
 <div className="flex items-start gap-2">
 <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
 <div>
 ifresultisBug, PleaseProvideTriggerStepand/ActualResult.
 </div>
 </div>
 <div className="flex items-start gap-2">
 <MessageSquare className="w-4 h-4 text-foreground-muted mt-0.5" />
 <div>
 ReasonableUsageVoteandComment, letFeedbackmoreEasybyseeto.
 </div>
 </div>
 </div>
 </div>

 <div className="page-panel">
 <div className="page-panel-header">
 <h3 className="page-panel-title">StatusDescription</h3>
 <p className="page-panel-description">FeedbackProcess'seach1</p>
 </div>
 <div className="p-5 grid gap-3">
 {Object.entries(statusConfig).map(([key, status]) => {
 const StatusIcon = status.icon;
 return (
 <div
 key={key}
 className="flex items-center justify-between rounded-md border border-border bg-surface-100 px-3 py-2"
 >
 <div className="flex items-center gap-2">
 <span className={cn("h-2 w-2 rounded-full", status.dot)} />
 <span className="text-[13px] text-foreground">{status.label}</span>
 </div>
 <Badge variant="secondary" className={cn(status.bg, status.color)}>
 <StatusIcon className={cn("w-3 h-3 mr-1", key === "in_progress" && "animate-spin")} />
 {status.label}
 </Badge>
 </div>
 );
 })}
 </div>
 </div>

 <div className="page-panel">
 <div className="page-panel-header">
 <h3 className="page-panel-title">needneedUrgentHelp?</h3>
 <p className="page-panel-description">toBlockIssuePleaseContactSupportTeam</p>
 </div>
 <div className="p-5 grid gap-2">
 <Link href="/help">
 <Button variant="outline" size="sm" className="w-full border-border text-foreground-light hover:text-foreground">
 <HelpCircle className="w-4 h-4 mr-1.5" />
 Help Center
 </Button>
 </Link>
 <Button variant="outline" size="sm" className="w-full border-border text-foreground-light hover:text-foreground">
 <MessageSquare className="w-4 h-4 mr-1.5" />
 OnlineSupport
 </Button>
 </div>
 </div>
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab} className="page-panel">
 <div className="page-panel-header">
 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div>
 <h2 className="page-panel-title">FeedbackList</h2>
 <p className="page-panel-description">CommunitySuggestionandI'sFeedbackProgress</p>
 </div>
 <TabsList variant="segment" size="sm" showIndicator className="w-full md:w-auto">
 <TabsTrigger
 value="popular"
 variant="segment"
 icon={<TrendingUp className="w-4 h-4" />}
 badge={
 <span className="rounded-full bg-surface-200 px-2 py-0.5 text-[10px] text-foreground-muted">
 {popularSuggestions.length}
 </span>
 }
 >
 PopularSuggestion
 </TabsTrigger>
 <TabsTrigger
 value="mine"
 variant="segment"
 icon={<Star className="w-4 h-4" />}
 badge={
 <span className="rounded-full bg-surface-200 px-2 py-0.5 text-[10px] text-foreground-muted">
 {myFeedback.length}
 </span>
 }
 >
 I'sFeedback
 </TabsTrigger>
 </TabsList>
 </div>
 </div>

 <div className="p-5 space-y-4">
 <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
 <div className="relative w-full xl:max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
 <Input
 placeholder="SearchFeedbackTitleorDescription..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 h-9 bg-surface-200 border-border text-foreground placeholder:text-foreground-muted focus:border-brand-400"
 />
 </div>
 {filtersActive && (
 <Button
 variant="ghost"
 size="sm"
 onClick={resetFilters}
 className="self-start xl:self-auto text-foreground-light hover:text-foreground"
 >
 ClearFilter
 </Button>
 )}
 </div>

 <div className="space-y-3">
 <div className="flex flex-wrap items-center gap-2">
 <span className="page-caption">Type</span>
 {typeFilterOptions.map((option) => (
 <FilterPill
 key={option.id}
 label={option.label}
 icon={option.icon}
 dotClassName={option.dot}
 active={typeFilter === option.id}
 onClick={() => setTypeFilter(option.id)}
 />
 ))}
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <span className="page-caption">Status</span>
 {statusFilterOptions.map((option) => (
 <FilterPill
 key={option.id}
 label={option.label}
 icon={option.icon}
 dotClassName={option.dot}
 active={statusFilter === option.id}
 onClick={() => setStatusFilter(option.id)}
 />
 ))}
 </div>
 </div>

 <TabsContent value="popular" className="mt-0 space-y-3">
 {filteredSuggestions.length === 0 ? (
 <div className="flex flex-col items-center justify-center rounded-md border border-border bg-surface-75/60 py-16">
 <div className="w-12 h-12 rounded-md bg-surface-200 flex items-center justify-center mb-4">
 <Lightbulb className="w-5 h-5 text-foreground-muted" />
 </div>
 <h3 className="text-sm font-medium text-foreground mb-2">NotoRelatedSuggestion</h3>
 <p className="text-xs text-foreground-light">TryAdjustSearchorFilterCondition</p>
 </div>
 ) : (
 filteredSuggestions.map((item) => {
 const typeConfig = feedbackTypes.find((t) => t.id === item.type);
 const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.open;
 const Icon = typeConfig?.icon || Lightbulb;
 const StatusIcon = status.icon;
 const hasVoted = votedItems.has(item.id);

 return (
 <div
 key={item.id}
 className="flex gap-4 p-4 rounded-md bg-surface-100 border border-border hover:border-border-strong hover:bg-surface-75/60 transition-supabase"
 >
 <button
 type="button"
 onClick={() => handleVote(item.id)}
 className={cn(
 "flex flex-col items-center justify-center w-14 h-14 rounded-md border shrink-0 transition-supabase",
 hasVoted
 ? "bg-brand-200 border-brand-400 text-brand-500"
 : "bg-surface-75 border-border text-foreground-muted hover:border-border-strong hover:text-foreground"
 )}
 >
 <ArrowUp className="w-4 h-4" />
 <span className="text-[12px] font-semibold">
 {item.votes + (hasVoted ? 1 : 0)}
 </span>
 </button>

 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2 mb-2">
 <div className="flex flex-wrap items-center gap-2">
 <Badge
 variant="secondary"
 className={cn("text-[11px] px-2 py-0.5", typeConfig?.bgColor, typeConfig?.color)}
 >
 <Icon className="w-3 h-3 mr-1" />
 {typeConfig?.label}
 </Badge>
 <Badge
 variant="secondary"
 className={cn("text-[11px] px-2 py-0.5", status.bg, status.color)}
 >
 <StatusIcon
 className={cn("w-3 h-3 mr-1", item.status === "in_progress" && "animate-spin")}
 />
 {status.label}
 </Badge>
 </div>
 <span className="text-xs text-foreground-muted shrink-0">{item.createdAt}</span>
 </div>

 <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
 <p className="text-[13px] text-foreground-light mb-3">{item.description}</p>

 <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
 <span className="flex items-center gap-1">
 <MessageSquare className="w-4 h-4" />
 {item.comments} Comment
 </span>
 <span className="flex items-center gap-1">
 <Eye className="w-4 h-4" />
 {item.votes * 12} timesBrowse
 </span>
 <span className="flex items-center gap-1">
 <TrendingUp className="w-4 h-4" />
 Popularity +{Math.round(item.votes / 10)}
 </span>
 </div>
 </div>
 </div>
 );
 })
 )}
 </TabsContent>

 <TabsContent value="mine" className="mt-0 space-y-3">
 {filteredMine.length === 0 ? (
 <div className="flex flex-col items-center justify-center rounded-md border border-border bg-surface-75/60 py-16">
 <div className="w-12 h-12 rounded-md bg-surface-200 flex items-center justify-center mb-4">
 <MessageSquarePlus className="w-5 h-5 text-foreground-muted" />
 </div>
 <h3 className="text-sm font-medium text-foreground mb-2">Not yetSubmitFeedback</h3>
 <p className="text-xs text-foreground-light mb-4">Shareyou'sSuggestionHelpWeImproveProduct</p>
 <Button onClick={() => setShowForm(true)} size="sm" className="bg-brand-500 hover:bg-brand-600 text-background">
 <Plus className="w-4 h-4 mr-1" />
 Submit#1Feedback
 </Button>
 </div>
 ) : (
 filteredMine.map((item) => {
 const typeConfig = feedbackTypes.find((t) => t.id === item.type);
 const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.open;
 const Icon = typeConfig?.icon || Lightbulb;
 const StatusIcon = status.icon;

 return (
 <div key={item.id} className="rounded-md border border-border bg-surface-100 p-4">
 <div className="flex items-start justify-between gap-2 mb-3">
 <div className="flex flex-wrap items-center gap-2">
 <Badge
 variant="secondary"
 className={cn("text-[11px] px-2 py-0.5", typeConfig?.bgColor, typeConfig?.color)}
 >
 <Icon className="w-3 h-3 mr-1" />
 {typeConfig?.label}
 </Badge>
 <Badge variant="secondary" className={cn("text-[11px] px-2 py-0.5", status.bg, status.color)}>
 <StatusIcon
 className={cn("w-3 h-3 mr-1", item.status === "in_progress" && "animate-spin")}
 />
 {status.label}
 </Badge>
 </div>
 <span className="text-xs text-foreground-muted">{item.createdAt}</span>
 </div>

 <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
 <p className="text-[13px] text-foreground-light">{item.description}</p>

 {item.reply && (
 <div className="mt-4 rounded-md border border-border bg-surface-75/80 p-3">
 <div className="flex items-center gap-2 mb-2">
 <CheckCircle2 className="w-4 h-4 text-brand-500" />
 <span className="text-[13px] font-medium text-foreground">methodReply</span>
 </div>
 <p className="text-[13px] text-foreground-light">{item.reply}</p>
 </div>
 )}

 <div className="flex items-center gap-4 mt-4 text-xs text-foreground-muted">
 <span className="flex items-center gap-1">
 <ThumbsUp className="w-4 h-4" />
 {item.votes} personSupport
 </span>
 <span className="flex items-center gap-1">
 <MessageSquare className="w-4 h-4" />
 {item.comments} Comment
 </span>
 </div>
 </div>
 );
 })
 )}
 </TabsContent>
 </div>
 </Tabs>
 </div>
 </div>
 );
}
