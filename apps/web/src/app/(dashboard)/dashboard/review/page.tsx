"use client";

/**
 * Review Queue Page
 * Supabase Style: Minimal, Clear, Professional
 *
 * Features: 
 * - Display pending review item list
 * - Filter by status, type, and priority
 * - Support batch review actions
 * - Real-time statistics data showcase
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
 Shield,
 Search,
 RefreshCw,
 CheckCircle,
 XCircle,
 Clock,
 Loader2,
 AlertTriangle,
 ArrowRight,
 ChevronLeft,
 ChevronRight,
 AlertCircle,
 Bot,
 Layers,
 FileText,
 User,
 MessageSquare,
 Eye,
 CheckCheck,
 X,
 Zap,
 ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { 
 PageContainer, 
 PageHeader, 
 EmptyState,
} from "@/components/dashboard/page-layout";
import { TabNav } from "@/components/dashboard/supabase-ui";
import { reviewApi } from "@/lib/api/review";
import type { 
 ReviewQueueItem, 
 ReviewStatus, 
 ReviewItemType, 
 ReviewPriority,
 ReviewStats,
} from "@/types/review";
import { cn } from "@/lib/utils";

// Status Config
const statusConfig: Record<
 ReviewStatus,
 { label: string; icon: typeof CheckCircle; badge: "success" | "warning" | "destructive" | "secondary" }
> = {
 pending: { label: "Pending Review", icon: Clock, badge: "warning" },
 in_review: { label: "In Review", icon: Loader2, badge: "secondary" },
approved: { label: "Approved", icon: CheckCircle, badge: "success" },
  rejected: { label: "Rejected", icon: XCircle, badge: "destructive" },
 revision: { label: "Needs Edit", icon: AlertTriangle, badge: "warning" },
 cancelled: { label: "Cancelled", icon: X, badge: "secondary" },
};

// Item Type Config
const itemTypeConfig: Record<ReviewItemType, { label: string; icon: typeof Bot; color: string }> = {
 agent: { label: "Agent", icon: Bot, color: "text-foreground-light" },
 workflow: { label: "Workflow", icon: Layers, color: "text-brand-500" },
 template: { label: "Template", icon: FileText, color: "text-foreground-light" },
 user: { label: "User", icon: User, color: "text-brand-500" },
 content: { label: "Content", icon: MessageSquare, color: "text-foreground-light" },
};

// Priority Config
const priorityConfig: Record<
 ReviewPriority,
 { label: string; icon: typeof Zap; badge: "secondary" | "warning" | "destructive" }
> = {
 low: { label: "Low", icon: ArrowRight, badge: "secondary" },
 normal: { label: "Normal", icon: ArrowRight, badge: "secondary" },
 high: { label: "High", icon: ArrowUp, badge: "warning" },
 urgent: { label: "Urgent", icon: Zap, badge: "destructive" },
};

export default function ReviewQueuePage() {
 const router = useRouter();
 const { confirm, ConfirmDialog } = useConfirmDialog();
 
 // Status
 const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [total, setTotal] = useState(0);
 const [stats, setStats] = useState<ReviewStats | null>(null);
 
 // Filter
 const [search, setSearch] = useState("");
 const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");
 const [itemTypeFilter, setItemTypeFilter] = useState<ReviewItemType | "all">("all");
 const [priorityFilter, setPriorityFilter] = useState<ReviewPriority | "all">("all");
 const [page, setPage] = useState(1);
 const [pageSize] = useState(20);
 
 // Batch Selection
 const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
 const [isBatchMode, setIsBatchMode] = useState(false);
 
 // Action Status
 const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

 const totalPages = Math.ceil(total / pageSize);

 // Load Review List
 const loadReviews = useCallback(async () => {
 setIsLoading(true);
 setError(null);
 
 try {
 const response = await reviewApi.list({
 status: statusFilter !== "all" ? statusFilter : undefined,
 itemType: itemTypeFilter !== "all" ? itemTypeFilter : undefined,
 priority: priorityFilter !== "all" ? priorityFilter : undefined,
 page,
 pageSize,
 });
 
 let data = response.data || [];
 
 // Client-side search
 if (search) {
 data = data.filter(r => 
 r.title.toLowerCase().includes(search.toLowerCase()) ||
 r.id.toLowerCase().includes(search.toLowerCase()) ||
 r.submitter?.username?.toLowerCase().includes(search.toLowerCase())
 );
 }
 
 setReviews(data);
 setTotal(response.meta?.total || data.length);
 } catch (err) {
 setError(err instanceof Error ? err.message : "Load failed.");
 } finally {
 setIsLoading(false);
 }
 }, [statusFilter, itemTypeFilter, priorityFilter, page, pageSize, search]);

  // Load Statistics Data
 const loadStats = useCallback(async () => {
 try {
 const response = await reviewApi.getStats();
 setStats(response.data);
 } catch (err) {
 console.error("Failed to load statistics:", err);
 }
 }, []);

  // Initial Load
 useEffect(() => {
 loadReviews();
 loadStats();
 }, [loadReviews, loadStats]);

  // Batch Approve
  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = await confirm({
      title: "Batch approve",
      description: `Approve ${selectedIds.size} selected review item(s)?`,
      confirmText: "Confirm Approve",
 cancelText: "Cancel",
 });
 
 if (!confirmed) return;
 
 const ids = Array.from(selectedIds);
 setProcessingIds(new Set(ids));
 
 try {
 await reviewApi.batchReview(ids, { action: "approve" });
 setSelectedIds(new Set());
 setIsBatchMode(false);
 loadReviews();
 loadStats();
 } catch (err) {
 console.error("Batch approve failed:", err);
 } finally {
 setProcessingIds(new Set());
 }
 };

  // Batch Reject
  const handleBatchReject = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = await confirm({
      title: "Batch reject",
      description: `Reject ${selectedIds.size} selected review item(s)?`,
      confirmText: "Confirm Reject",
 cancelText: "Cancel",
 variant: "destructive",
 });
 
 if (!confirmed) return;
 
 const ids = Array.from(selectedIds);
 setProcessingIds(new Set(ids));
 
 try {
 await reviewApi.batchReview(ids, { action: "reject" });
 setSelectedIds(new Set());
 setIsBatchMode(false);
 loadReviews();
 loadStats();
 } catch (err) {
 console.error("Batch reject failed:", err);
 } finally {
 setProcessingIds(new Set());
 }
 };

  // Toggle Selection
 const toggleSelect = (id: string) => {
 const newSelected = new Set(selectedIds);
 if (newSelected.has(id)) {
 newSelected.delete(id);
 } else {
 newSelected.add(id);
 }
 setSelectedIds(newSelected);
 };

  // Select All / Deselect All
 const toggleSelectAll = () => {
 if (selectedIds.size === reviews.length) {
 setSelectedIds(new Set());
 } else {
 setSelectedIds(new Set(reviews.map(r => r.id)));
 }
 };

 const handleStatusChange = (value: string) => {
 setStatusFilter(value as ReviewStatus | "all");
 setPage(1);
 };

 const hasFilters = Boolean(
 search ||
 statusFilter !== "all" ||
 itemTypeFilter !== "all" ||
 priorityFilter !== "all"
 );

 const statCards = [
 {
 key: "pending",
 label: "Pending Review",
 value: stats?.pending || 0,
 icon: Clock,
 valueClassName: "text-foreground",
 },
 {
 key: "inReview",
 label: "In Review",
 value: stats?.inReview || 0,
 icon: Loader2,
 valueClassName: "text-foreground",
 },
 {
 key: "approved",
 label: "Approved",
 value: stats?.approved || 0,
 icon: CheckCircle,
 valueClassName: "text-brand-500",
 },
 {
 key: "rejected",
 label: "Rejected",
 value: stats?.rejected || 0,
 icon: XCircle,
 valueClassName: "text-foreground",
 },
 {
 key: "total",
 label: "Total",
 value: stats?.total || 0,
 icon: Shield,
 valueClassName: "text-foreground",
 },
 ];

 const statusTabs = [
 { label: "All", value: "all", count: stats?.total },
 { label: "Pending Review", value: "pending", count: stats?.pending },
 { label: "In Review", value: "in_review", count: stats?.inReview },
 { label: "Approved", value: "approved", count: stats?.approved },
 { label: "Rejected", value: "rejected", count: stats?.rejected },
 { label: "Needs Edit", value: "revision", count: stats?.revision },
 ];

 return (
 <PageContainer className="space-y-6">
 <ConfirmDialog />

 <PageHeader
 eyebrow="Moderation"
 icon={<Shield className="w-4 h-4" />}
 title="Review Queue"
 description="Manage and review pending agents, workflows and templates"
 badge={(
 <Badge variant="secondary" size="sm">
 {total} 
 </Badge>
 )}
 actions={
 isBatchMode ? (
 <div className="flex flex-wrap items-center gap-2">
 <span className="text-[12px] text-foreground-light">
 Selected {selectedIds.size} items
 </span>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => {
 setIsBatchMode(false);
 setSelectedIds(new Set());
 }}
 >
 Cancel
 </Button>
 <Button
 variant="outline-primary"
 size="sm"
 onClick={handleBatchApprove}
 disabled={selectedIds.size === 0 || processingIds.size > 0}
 className="gap-1.5"
 >
 <CheckCheck className="w-4 h-4" />
            Batch Approve
 </Button>
 <Button
 variant="destructive"
 size="sm"
 onClick={handleBatchReject}
 disabled={selectedIds.size === 0 || processingIds.size > 0}
 className="gap-1.5"
 >
 <XCircle className="w-4 h-4" />
            Batch Reject
 </Button>
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => setIsBatchMode(true)}
 className="gap-1.5"
 >
 <CheckCheck className="w-4 h-4" />
 Batch Actions
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 loadReviews();
 loadStats();
 }}
 disabled={isLoading}
 className="gap-1.5"
 >
 <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
 Refresh
 </Button>
 </div>
 )
 }
 />

 <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
 {statCards.map((stat) => {
 const Icon = stat.icon;
 return (
 <Card key={stat.key} padding="sm" hover="border" className="min-h-[86px]">
 <div className="space-y-1">
 <div className={cn("text-xl font-semibold font-mono", stat.valueClassName)}>
 {stat.value}
 </div>
 <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
 <Icon className="w-3 h-3" />
 {stat.label}
 </div>
 </div>
 </Card>
 );
 })}
 </div>

 <TabNav
 tabs={statusTabs}
 activeTab={statusFilter}
 onChange={handleStatusChange}
 />

 <Card
 variant="panel"
 padding="sm"
 className="flex flex-col gap-3 lg:flex-row lg:items-center"
 >
 <Input
 type="text"
 placeholder="Search title, ID or submitter..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 variant="search"
 inputSize="default"
 leftIcon={<Search className="w-4 h-4" />}
 className="w-full lg:max-w-sm"
 />
 <div className="flex flex-wrap items-center gap-2">
 <Select value={itemTypeFilter} onValueChange={(v) => setItemTypeFilter(v as ReviewItemType | "all")}>
 <SelectTrigger className="h-9 w-[140px]">
 <SelectValue placeholder="Type" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Types</SelectItem>
 <SelectItem value="agent">Agent</SelectItem>
 <SelectItem value="workflow">Workflow</SelectItem>
 <SelectItem value="template">Template</SelectItem>
 <SelectItem value="content">Content</SelectItem>
 </SelectContent>
 </Select>
 <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as ReviewPriority | "all")}>
 <SelectTrigger className="h-9 w-[140px]">
 <SelectValue placeholder="Priority" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Priorities</SelectItem>
 <SelectItem value="urgent">Urgent</SelectItem>
 <SelectItem value="high">High</SelectItem>
 <SelectItem value="normal">Normal</SelectItem>
 <SelectItem value="low">Low</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </Card>

 <div className="space-y-3">
 {error && (
 <EmptyState
 icon={<AlertCircle className="w-5 h-5" />}
 title="Load failed"
 description={error}
 action={{ label: "Retry", onClick: loadReviews }}
 />
 )}

 {isLoading && !error && (
 <div className="space-y-3">
 {Array.from({ length: 8 }).map((_, i) => (
 <Card key={i} padding="sm" className="animate-pulse">
 <div className="flex items-center gap-4">
 <div className="w-9 h-9 rounded-md bg-surface-200" />
 <div className="flex-1 space-y-2">
 <div className="h-4 bg-surface-200 rounded w-1/4" />
 <div className="h-3 bg-surface-200 rounded w-1/3" />
 </div>
 <div className="h-6 bg-surface-200 rounded w-20" />
 </div>
 </Card>
 ))}
 </div>
 )}

 {!isLoading && !error && reviews.length === 0 && (
 <EmptyState
 icon={<Shield className="w-5 h-5" />}
 title={hasFilters ? "No matching review items" : "No review items"}
 description={
 hasFilters
 ? "Try adjusting filter"
: "When you submit an agent or workflow for review, items will appear here"
 }
 />
 )}

 {!isLoading && !error && reviews.length > 0 && (
 <>
 {isBatchMode && (
 <Card variant="muted" padding="sm" className="flex items-center gap-3">
 <Checkbox
 checked={selectedIds.size === reviews.length && reviews.length > 0}
 onCheckedChange={toggleSelectAll}
 />
 <span className="text-[13px] text-foreground-light">
        {selectedIds.size === reviews.length ? "Deselect All" : "Select All on This Page"}
 </span>
 </Card>
 )}

 <div className="space-y-3">
 {reviews.map((review) => {
 const status = statusConfig[review.status];
 const itemType = itemTypeConfig[review.itemType];
 const priority = priorityConfig[review.priority];
 const StatusIcon = status.icon;
 const ItemTypeIcon = itemType.icon;
 const PriorityIcon = priority.icon;
 const isSelected = selectedIds.has(review.id);
 const isProcessing = processingIds.has(review.id);

 return (
 <Card
 key={review.id}
 padding="sm"
 hover="interactive"
 interactive
 className={cn(
 "group",
 isSelected && "border-brand-400/60 bg-brand-200/40"
 )}
 onClick={() => {
 if (isBatchMode) {
 toggleSelect(review.id);
 } else {
 router.push(`/review/${review.id}`);
 }
 }}
 >
 <div className="flex items-center gap-4">
 {isBatchMode && (
 <div onClick={(e) => e.stopPropagation()}>
 <Checkbox
 checked={isSelected}
 onCheckedChange={() => toggleSelect(review.id)}
 disabled={isProcessing}
 />
 </div>
 )}

 <div className="w-9 h-9 rounded-md bg-surface-200 border border-border flex items-center justify-center shrink-0">
 <ItemTypeIcon className={cn("w-4 h-4", itemType.color)} />
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <h3 className="text-[13px] font-medium text-foreground truncate group-hover:text-brand-500 transition-colors">
 {review.title}
 </h3>
 {review.priority !== "normal" && (
 <Badge variant={priority.badge} size="xs" className="gap-1">
 <PriorityIcon className="w-3 h-3" />
 {priority.label}
 </Badge>
 )}
 <Badge variant={status.badge} size="xs" className="gap-1">
 <StatusIcon
 className={cn("w-3 h-3", review.status === "in_review" && "animate-spin")}
 />
 {status.label}
 </Badge>
 </div>
 <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
 <span className="flex items-center gap-1">
 <ItemTypeIcon className="w-3 h-3" />
 {itemType.label}
 </span>
 <span className="flex items-center gap-1">
 <User className="w-3 h-3" />
                {review.submitter?.username || "Unknown User"}
 </span>
 <span className="flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {formatDistanceToNow(new Date(review.submittedAt), { addSuffix: true, locale: zhCN })}
 </span>
 {review.revisionCount > 0 && (
 <span className="flex items-center gap-1 text-warning">
 <AlertTriangle className="w-3 h-3" />
                Submission #{review.revisionCount + 1}
 </span>
 )}
 </div>
 {review.description && (
 <p className="text-xs text-foreground-muted mt-1 truncate">
 {review.description}
 </p>
 )}
 </div>

 {!isBatchMode && (
 <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
 <Button
 variant="ghost"
 size="sm"
 className="h-8"
 onClick={() => router.push(`/review/${review.id}`)}
 >
 <Eye className="w-4 h-4 mr-1" />
 View
 </Button>
 </div>
 )}
 </div>
 </Card>
 );
 })}
 </div>

 {totalPages > 1 && (
 <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
 <p className="text-[13px] text-foreground-light">
 {total} records, page {page} / {totalPages}
 </p>
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(p => Math.max(1, p - 1))}
 disabled={page <= 1}
 >
 <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
 disabled={page >= totalPages}
 >
                Next
 <ChevronRight className="w-4 h-4 ml-1" />
 </Button>
 </div>
 </div>
 )}
 </>
 )}
 </div>
 </PageContainer>
 );
}
