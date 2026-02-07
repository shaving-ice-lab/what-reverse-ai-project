"use client";

/**
 * NotificationscenterPage
 * ViewandManageAllNotificationsMessage
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonGroup } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { EmptyState, PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import { useToast } from "@/components/ui/toast";
import { notificationApi } from "@/lib/api/notification";
import type { NotificationItem as ApiNotificationItem, NotificationType } from "@/types/notification";
import {
 Bell,
 BellOff,
 Check,
 CheckCheck,
 Trash2,
 MoreHorizontal,
 Filter,
 Settings,
 MessageSquare,
 Info,
 CheckCircle2,
 Clock,
 CreditCard,
 Star,
 Search,
 ExternalLink,
 RefreshCw,
 UserPlus,
 AtSign,
 CornerUpRight,
 Heart,
} from "lucide-react";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

// NotificationsTypeConfig - Supabase Style
const notificationTypes: Record<
 NotificationType,
 {
 icon: typeof Bell;
 color: string;
 bg: string;
 label: string;
 badge: NonNullable<BadgeProps["variant"]>;
 }
> = {
 system: {
 icon: Info,
 color: "text-brand-500",
 bg: "bg-brand-200",
 label: "System",
 badge: "primary",
 },
 follow: {
 icon: UserPlus,
 color: "text-foreground-light",
 bg: "bg-surface-200",
 label: "Follow",
 badge: "secondary",
 },
 comment: {
 icon: MessageSquare,
 color: "text-foreground-light",
 bg: "bg-surface-200",
 label: "Comment",
 badge: "secondary",
 },
 reply: {
 icon: CornerUpRight,
 color: "text-foreground-light",
 bg: "bg-surface-200",
 label: "Reply",
 badge: "secondary",
 },
 like: {
 icon: Heart,
 color: "text-warning",
 bg: "bg-warning-200",
 label: "Like",
 badge: "warning",
 },
 mention: {
 icon: AtSign,
 color: "text-foreground-light",
 bg: "bg-surface-200",
 label: "@and",
 badge: "secondary",
 },
 income: {
 icon: CreditCard,
 color: "text-warning",
 bg: "bg-warning-200",
 label: "Earnings",
 badge: "warning",
 },
};
type SelectedType = NotificationType | "all";

const notificationTypeEntries = Object.entries(notificationTypes) as [
 NotificationType,
 (typeof notificationTypes)[NotificationType],
][];

interface NotificationRow {
 id: string;
 type: NotificationType;
 title: string;
 message: string;
 read: boolean;
 starred: boolean;
 createdAt: string;
 link?: string;
}

const resolveNotificationLink = (notification: ApiNotificationItem): string | undefined => {
 const link = notification.metadata?.link;
 return typeof link === "string" ? link : undefined;
};

const toNotificationRow = (notification: ApiNotificationItem): NotificationRow => ({
 id: notification.id,
 type: notification.type,
 title: notification.title,
 message: notification.content ?? "",
 read: notification.isRead,
 starred: false,
 createdAt: notification.createdAt,
 link: resolveNotificationLink(notification),
});

// FormatTime
function formatTime(dateString: string) {
 const date = new Date(dateString);
 const now = new Date();
 const diffMs = now.getTime() - date.getTime();
 const diffMins = Math.floor(diffMs / (1000 * 60));
 const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
 const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

 if (diffMins < 60) {
 return `${diffMins} minbefore`;
 } else if (diffHours < 24) {
 return `${diffHours} hbefore`;
 } else if (diffDays < 7) {
 return `${diffDays} daysbefore`;
 } else {
 return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
 }
}

export default function NotificationsPage() {
 const toast = useToast();
 const [notifications, setNotifications] = useState<NotificationRow[]>([]);
 const [selectedType, setSelectedType] = useState<SelectedType>("all");
 const [showUnreadOnly, setShowUnreadOnly] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");
 const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
 const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
 const [page, setPage] = useState(1);
 const [total, setTotal] = useState(0);
 const [hasMore, setHasMore] = useState(false);
 const [isLoading, setIsLoading] = useState(true);
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [isLoadingMore, setIsLoadingMore] = useState(false);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);

 const pageSize = 20;

 const loadNotifications = useCallback(
 async ({
 page: targetPage = 1,
 append = false,
 mode = "initial",
 }: {
 page?: number;
 append?: boolean;
 mode?: "initial" | "refresh" | "more";
 } = {}) => {
 if (mode === "more") {
 setIsLoadingMore(true);
 } else if (mode === "refresh") {
 setIsRefreshing(true);
 } else {
 setIsLoading(true);
 }
 setErrorMessage(null);

 try {
 const result = await notificationApi.list({
 page: targetPage,
 pageSize,
 type: selectedType === "all" ? undefined : selectedType,
 isRead: showUnreadOnly ? false : undefined,
 });
 const mapped = result.items.map(toNotificationRow);

 setNotifications((prev) => {
 if (!append) {
 return mapped;
 }
 const existing = new Set(prev.map((item) => item.id));
 const merged = [...prev];
 mapped.forEach((item) => {
 if (!existing.has(item.id)) {
 merged.push(item);
 }
 });
 return merged;
 });

 if (!append) {
 setSelectedItems(new Set());
 }

 const resolvedTotal = Math.max(result.meta.total, mapped.length);
 const resolvedPage = result.meta.page || targetPage;
 const resolvedPageSize = result.meta.pageSize || pageSize;
 setTotal(resolvedTotal);
 setPage(resolvedPage);
 setHasMore(resolvedPage * resolvedPageSize < resolvedTotal);
 } catch (error) {
 const message = error instanceof Error ? error.message: "FetchNotificationsFailed";
 setErrorMessage(message);
 toast.error("FetchNotificationsFailed", message);
 if (!append) {
 setNotifications([]);
 setTotal(0);
 setHasMore(false);
 }
 } finally {
 setIsLoading(false);
 setIsRefreshing(false);
 setIsLoadingMore(false);
 }
 },
 [pageSize, selectedType, showUnreadOnly, toast]
 );

 useEffect(() => {
 loadNotifications({ page: 1, append: false, mode: "initial" });
 }, [loadNotifications]);

 const refreshNotifications = useCallback(() => {
 loadNotifications({ page: 1, append: false, mode: "refresh" });
 }, [loadNotifications]);

 const loadMore = useCallback(() => {
 if (isLoadingMore || !hasMore) return;
 loadNotifications({ page: page + 1, append: true, mode: "more" });
 }, [hasMore, isLoadingMore, loadNotifications, page]);

 // FilterNotifications
 const filteredNotifications = useMemo(() => {
 const normalizedQuery = searchQuery.trim().toLowerCase();
 return notifications.filter((n) => {
 const matchesType = selectedType === "all" || n.type === selectedType;
 const matchesUnread = !showUnreadOnly || !n.read;
 const matchesQuery = normalizedQuery.length === 0
 || n.title.toLowerCase().includes(normalizedQuery)
 || n.message.toLowerCase().includes(normalizedQuery);
 return matchesType && matchesUnread && matchesQuery;
 });
 }, [notifications, selectedType, showUnreadOnly, searchQuery]);

 const sortedNotifications = useMemo(() => {
 const data = [...filteredNotifications];
 data.sort((a, b) => {
 const timeA = new Date(a.createdAt).getTime();
 const timeB = new Date(b.createdAt).getTime();
 return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
 });
 return data;
 }, [filteredNotifications, sortOrder]);

 // StatisticsData
 const resolvedTotal = Math.max(total, notifications.length);
 const stats = {
 total: resolvedTotal,
 unread: notifications.filter((n) => !n.read).length,
 starred: notifications.filter((n) => n.starred).length,
 };

 const typeCounts = useMemo<Record<SelectedType, number>>(() => {
 const counts = { all: 0 } as Record<SelectedType, number>;
 notifications.forEach((notification) => {
 counts.all += 1;
 counts[notification.type] = (counts[notification.type] ?? 0) + 1;
 });
 return counts;
 }, [notifications]);

 // Markalreadyread
 const markAsRead = async (id: string) => {
 const target = notifications.find((n) => n.id === id);
 if (!target || target.read) return;

 try {
 await notificationApi.markAsRead(id);
 setNotifications((prev) =>
 prev.map((n) => (n.id === id ? { ...n, read: true } : n))
 );
 } catch (error) {
 const message = error instanceof Error ? error.message: "MarkalreadyreadFailed";
 toast.error("MarkalreadyreadFailed", message);
 }
 };

 // Markallsectionalreadyread
 const markAllAsRead = async () => {
 if (notifications.every((n) => n.read)) return;

 try {
 await notificationApi.markAllAsRead(selectedType === "all" ? undefined : selectedType);
 setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
 setSelectedItems(new Set());
 } catch (error) {
 const message = error instanceof Error ? error.message: "MarkalreadyreadFailed";
 toast.error("MarkalreadyreadFailed", message);
 }
 };

 // SwitchFavorite
 const toggleStar = (id: string) => {
 setNotifications((prev) =>
 prev.map((n) => (n.id === id ? { ...n, starred: !n.starred } : n))
 );
 };

 // DeleteNotifications
 const deleteNotification = async (id: string) => {
 try {
 await notificationApi.delete(id);
 setNotifications((prev) => prev.filter((n) => n.id !== id));
 setSelectedItems((prev) => {
 const next = new Set(prev);
 next.delete(id);
 return next;
 });
 setTotal((prev) => Math.max(prev - 1, 0));
 } catch (error) {
 const message = error instanceof Error ? error.message: "DeleteNotificationsFailed";
 toast.error("DeleteNotificationsFailed", message);
 }
 };

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

 // BatchDelete
 const bulkDelete = async () => {
 const ids = Array.from(selectedItems);
 if (ids.length === 0) return;

 const results = await Promise.allSettled(ids.map((id) => notificationApi.delete(id)));
 const succeeded = ids.filter((_, index) => results[index].status === "fulfilled");
 const failed = ids.filter((_, index) => results[index].status === "rejected");

 if (succeeded.length > 0) {
 setNotifications((prev) => prev.filter((n) => !succeeded.includes(n.id)));
 setTotal((prev) => Math.max(prev - succeeded.length, 0));
 }
 setSelectedItems(new Set());

 if (failed.length > 0) {
 toast.error("PartialDeleteFailed", `has ${failed.length} not yetDelete`);
 }
 };

 // BatchMarkalreadyread
 const bulkMarkAsRead = async () => {
 const ids = Array.from(selectedItems);
 if (ids.length === 0) return;

 try {
 await notificationApi.markMultipleAsRead(ids);
 setNotifications((prev) =>
 prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
 );
 setSelectedItems(new Set());
 } catch (error) {
 const message = error instanceof Error ? error.message: "BatchMarkalreadyreadFailed";
 toast.error("BatchMarkalreadyreadFailed", message);
 }
 };

 const resetFilters = () => {
 setSelectedType("all");
 setShowUnreadOnly(false);
 setSearchQuery("");
 };

 const allFilteredSelected = filteredNotifications.length > 0
 && filteredNotifications.every((notification) => selectedItems.has(notification.id));
 const someFilteredSelected = filteredNotifications.some((notification) => selectedItems.has(notification.id));

 const toggleSelectAll = () => {
 setSelectedItems((prev) => {
 const next = new Set(prev);
 if (allFilteredSelected) {
 filteredNotifications.forEach((notification) => next.delete(notification.id));
 } else {
 filteredNotifications.forEach((notification) => next.add(notification.id));
 }
 return next;
 });
 };

 const typeOptions: Array<{
 value: SelectedType;
 label: string;
 icon: typeof Bell;
 color: string;
 bg: string;
 }> = [
 {
 value: "all",
 label: "allsectionNotifications",
 icon: Bell,
 color: "text-foreground-light",
 bg: "bg-surface-200",
 },
 ...notificationTypeEntries.map(([value, config]) => ({
 value,
 label: config.label,
 icon: config.icon,
 color: config.color,
 bg: config.bg,
 })),
 ];
 const trimmedQuery = searchQuery.trim();
 const displayQuery = trimmedQuery.length > 12 ? `${trimmedQuery.slice(0, 12)}...` : trimmedQuery;
 const hasActiveFilters = selectedType !== "all" || showUnreadOnly || trimmedQuery.length > 0;
 let emptyTitle = "NoneNotifications";
 let emptyDescription = "new'sNotificationswillDisplayatthisin";
 let emptyAction = hasActiveFilters ? { label: "ResetFilter", onClick: resetFilters }: undefined;

 if (isLoading) {
 emptyTitle = "Loading";
 emptyDescription = "currentlyatFetchNotifications";
 emptyAction = undefined;
 } else if (errorMessage) {
 emptyTitle = "LoadFailed";
 emptyDescription = errorMessage;
 emptyAction = { label: "Retry", onClick: refreshNotifications };
 } else if (trimmedQuery) {
 emptyTitle = "NoMatchResult";
 emptyDescription = "PleaseTrymoreKeywordsorClearFilter";
 } else if (showUnreadOnly) {
 emptyTitle = "Nonot yetreadNotifications";
 emptyDescription = "AllNotificationsallalreadyRead";
 } else if (selectedType !== "all") {
 emptyTitle = "TypeNoneNotifications";
 emptyDescription = "TrySwitchTypeorResetFilter";
 }

 return (
 <PageContainer>
 <div className="space-y-6">
 <PageHeader
 title="Notificationscenter"
 description={isLoading
 ? "currentlyatFetchNotifications..."
 : stats.unread > 0
 ? `youhas ${stats.unread} not yetreadNotifications`
: "AllNotificationsalreadyread"}
 actions={(
 <div className="flex items-center gap-2">
 {stats.unread > 0 && (
 <Button
 variant="outline"
 size="sm"
 onClick={markAllAsRead}
 leftIcon={<CheckCheck className="w-4 h-4" />}
 >
 allsectionMarkalreadyread
 </Button>
 )}
 <Link href="/dashboard/settings/notifications">
 <Button variant="outline" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
 Notification Settings
 </Button>
 </Link>
 </div>
 )}
 >
 <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
 <Badge variant="secondary" size="sm" icon={<Bell className="w-3.5 h-3.5" />}>
 not yetread {stats.unread}
 </Badge>
 <Badge variant="warning" size="sm" icon={<Star className="w-3.5 h-3.5" />}>
 Favorite {stats.starred}
 </Badge>
 <Badge variant="outline" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
 Total {stats.total}
 </Badge>
 </div>
 </PageHeader>

 <div className="page-grid grid-cols-1 md:grid-cols-3">
 <div className="page-panel p-4 md:p-5 space-y-3">
 <div className="flex items-center justify-between">
 <span className="page-caption">allsectionNotifications</span>
 <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
 <Bell className="w-4 h-4 text-foreground-light" />
 </div>
 </div>
 <div className="flex items-end gap-2">
 <span className="text-stat-large text-foreground tabular-nums">{stats.total}</span>
 <span className="text-xs text-foreground-muted pb-1"></span>
 </div>
 <p className="text-xs text-foreground-light">SystemCumulative'sNotificationstotal</p>
 </div>
 <div className="page-panel p-4 md:p-5 space-y-3">
 <div className="flex items-center justify-between">
 <span className="page-caption">not yetreadTodo</span>
 <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
 <CheckCheck className="w-4 h-4 text-brand-500" />
 </div>
 </div>
 <div className="flex items-end gap-2">
 <span className="text-stat-large text-foreground tabular-nums">{stats.unread}</span>
 <span className="text-xs text-foreground-muted pb-1"></span>
 </div>
 <p className="text-xs text-foreground-light">needneedProcess'sReminderandAlert</p>
 </div>
 <div className="page-panel p-4 md:p-5 space-y-3">
 <div className="flex items-center justify-between">
 <span className="page-caption">FavoriteFollow</span>
 <div className="w-8 h-8 rounded-md bg-warning-200 flex items-center justify-center">
 <Star className="w-4 h-4 text-warning" />
 </div>
 </div>
 <div className="flex items-end gap-2">
 <span className="text-stat-large text-foreground tabular-nums">{stats.starred}</span>
 <span className="text-xs text-foreground-muted pb-1"></span>
 </div>
 <p className="text-xs text-foreground-light">Markasre-'sNotifications</p>
 </div>
 </div>

 <div className="page-grid lg:grid-cols-[280px_minmax(0,1fr)]">
 <div className="space-y-6 lg:sticky lg:top-6 self-start">
 <div className="page-panel overflow-hidden">
 <div className="page-panel-header flex items-center justify-between">
 <div>
 <p className="page-panel-title flex items-center gap-2">
 <Filter className="w-4 h-4 text-foreground-light" />
 Filter
 </p>
 <p className="page-panel-description">byTypeandalreadyreadStatusFilterNotifications</p>
 </div>
 <Button variant="ghost" size="sm" onClick={resetFilters}>
 Reset
 </Button>
 </div>
 <div className="divide-y divide-border px-4">
 <div className="py-4">
 <p className="page-caption">Type</p>
 <div className="mt-2 space-y-1">
 {typeOptions.map((option) => {
 const isActive = selectedType === option.value;
 const Icon = option.icon;
 const badgeVariant = option.value === "all"
 ? "secondary"
 : notificationTypes[option.value].badge;

 return (
 <button
 key={option.value}
 type="button"
 onClick={() => setSelectedType(option.value)}
 aria-pressed={isActive}
 className={cn(
 "flex w-full items-center justify-between gap-3 rounded-md border px-2.5 py-2 text-left transition-colors",
 isActive
 ? "border-border-strong bg-surface-200 text-foreground"
 : "border-transparent text-foreground-light hover:bg-surface-200/70"
 )}
 >
 <span className="flex items-center gap-2.5">
 <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", option.bg)}>
 <Icon className={cn("h-4 w-4", option.color)} />
 </span>
 <span className="text-[13px]">{option.label}</span>
 </span>
 <Badge variant={badgeVariant} size="xs" className="tabular-nums">
 {typeCounts[option.value] ?? 0}
 </Badge>
 </button>
 );
 })}
 </div>
 </div>
 <div className="py-4">
 <p className="page-caption">Status</p>
 <div className="mt-2 flex flex-wrap gap-2">
 <Button
 variant={!showUnreadOnly ? "secondary" : "outline"}
 size="sm"
 leftIcon={<Bell className="w-4 h-4" />}
 onClick={() => setShowUnreadOnly(false)}
 >
 allsection
 </Button>
 <Button
 variant={showUnreadOnly ? "secondary" : "outline"}
 size="sm"
 leftIcon={<BellOff className="w-4 h-4" />}
 onClick={() => setShowUnreadOnly(true)}
 >
 onlynot yetread
 </Button>
 </div>
 </div>
 <div className="py-4">
 <div className="rounded-md border border-border bg-surface-200/50 px-3 py-2">
 <div className="flex items-center justify-between text-xs text-foreground-muted">
 <span>CurrentFilter</span>
 <span className="tabular-nums">
 {filteredNotifications.length}/{stats.total}
 </span>
 </div>
 <div className="mt-2 flex flex-wrap gap-2">
 {selectedType !== "all" && (
 <Badge variant="outline" size="xs">
 Type: {notificationTypes[selectedType as NotificationType]?.label}
 </Badge>
 )}
 {showUnreadOnly && (
 <Badge variant="warning" size="xs">
 onlynot yetread
 </Badge>
 )}
 {trimmedQuery && (
 <Badge variant="outline" size="xs">
 Keywords: {displayQuery}
 </Badge>
 )}
 {!showUnreadOnly && selectedType === "all" && !trimmedQuery && (
 <span className="text-xs text-foreground-light">allsectionNotifications</span>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 {selectedItems.size > 0 && (
 <div className="page-panel border-brand-400/40 bg-brand-200/20">
 <div className="px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div className="flex items-center gap-2 text-[13px] text-foreground">
 <Badge variant="primary" size="sm" className="tabular-nums">
 {selectedItems.size}
 </Badge>
 alreadySelect {selectedItems.size} 
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={bulkMarkAsRead}
 leftIcon={<Check className="w-4 h-4" />}
 >
 Markalreadyread
 </Button>
 <Button
 variant="destructive"
 size="sm"
 onClick={bulkDelete}
 leftIcon={<Trash2 className="w-4 h-4" />}
 >
 Delete
 </Button>
 <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
 Deselect
 </Button>
 </div>
 </div>
 </div>
 )}

 <div className="page-panel overflow-hidden">
 <div className="page-panel-header space-y-3">
 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div>
 <p className="page-panel-title">NotificationsList</p>
 <p className="page-panel-description"> {filteredNotifications.length} Notifications</p>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <Badge variant="secondary" size="sm">
 not yetread {stats.unread}
 </Badge>
 <Badge variant="warning" size="sm">
 Favorite {stats.starred}
 </Badge>
 <ButtonGroup attached>
 <Button
 variant={sortOrder === "newest" ? "secondary" : "outline"}
 size="sm"
 onClick={() => setSortOrder("newest")}
 >
 mostnew
 </Button>
 <Button
 variant={sortOrder === "oldest" ? "secondary" : "outline"}
 size="sm"
 onClick={() => setSortOrder("oldest")}
 >
 most
 </Button>
 </ButtonGroup>
 <Button
 variant="ghost"
 size="sm"
 onClick={refreshNotifications}
 disabled={isRefreshing}
 leftIcon={<RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />}
 >
 {isRefreshing ? "Refresh": "Refresh"}
 </Button>
 </div>
 </div>
 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <Input
 value={searchQuery}
 onChange={(event) => setSearchQuery(event.target.value)}
 variant="search"
 inputSize="sm"
 placeholder="SearchNotificationsTitleorContent"
 leftIcon={<Search className="h-4 w-4" />}
 className="w-full md:max-w-sm"
 />
 <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
 <label className="inline-flex items-center gap-2 text-xs text-foreground-light">
 <Checkbox
 checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
 onCheckedChange={toggleSelectAll}
 disabled={filteredNotifications.length === 0}
 aria-label="Select AllCurrentFilterResult"
 />
 Select AllCurrent
 </label>
 <Badge variant="outline" size="sm" className="tabular-nums">
 Display {filteredNotifications.length}
 </Badge>
 {trimmedQuery && (
 <Badge variant="secondary" size="sm">
 Keywords: {displayQuery}
 </Badge>
 )}
 </div>
 </div>
 </div>
 <div className="border-t border-border">
 {filteredNotifications.length === 0 ? (
 <EmptyState
 icon={<Bell className="w-5 h-5" />}
 title={emptyTitle}
 description={emptyDescription}
 action={emptyAction}
 />
 ) : (
 <div className="divide-y divide-border">
 {sortedNotifications.map((notification) => {
 const typeConfig = notificationTypes[notification.type];
 const TypeIcon = typeConfig.icon;
 const isSelected = selectedItems.has(notification.id);

 return (
 <div
 key={notification.id}
 className={cn(
 "group relative flex items-start gap-4 px-5 py-4 transition-colors",
 "hover:bg-surface-75/80",
 !notification.read && "bg-surface-75/80",
 isSelected && "bg-brand-200/30"
 )}
 >
 {!notification.read && (
 <span className="absolute left-0 top-6 h-6 w-[2px] rounded-full bg-brand-500/80" />
 )}
 <Checkbox
 checked={isSelected}
 onCheckedChange={() => toggleSelect(notification.id)}
 className="mt-1"
 aria-label={`SelectNotifications: ${notification.title}`}
 />

 <div
 className={cn(
 "flex h-9 w-9 items-center justify-center rounded-md shrink-0",
 typeConfig.bg
 )}
 >
 <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
 </div>

 <div className="min-w-0 flex-1">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <h3
 className={cn(
 "text-[13px] font-medium truncate",
 !notification.read ? "text-foreground" : "text-foreground-light"
 )}
 >
 {notification.title}
 </h3>
 {!notification.read && (
 <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
 )}
 </div>
 <p className="mt-1 text-xs text-foreground-muted line-clamp-2">
 {notification.message}
 </p>
 <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
 <span className="inline-flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {formatTime(notification.createdAt)}
 </span>
 <Badge variant={typeConfig.badge} size="xs">
 {typeConfig.label}
 </Badge>
 </div>
 </div>

 <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
 <Button
 variant="ghost"
 size="icon-xs"
 onClick={() => toggleStar(notification.id)}
 aria-label={notification.starred ? "Unfavorite": "Favorite"}
 className={cn(
 "text-foreground-muted hover:text-warning",
 notification.starred && "text-warning"
 )}
 >
 <Star className={cn("w-4 h-4", notification.starred && "fill-warning")} />
 </Button>
 {!notification.read && (
 <Button
 variant="ghost"
 size="icon-xs"
 onClick={() => markAsRead(notification.id)}
 aria-label="Markalreadyread"
 className="text-foreground-muted hover:text-foreground"
 >
 <Check className="w-4 h-4" />
 </Button>
 )}
 {notification.link && (
 <Link href={notification.link}>
 <Button
 variant="ghost"
 size="icon-xs"
 aria-label="OpenNotificationsLink"
 className="text-foreground-muted hover:text-foreground"
 >
 <ExternalLink className="w-4 h-4" />
 </Button>
 </Link>
 )}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="icon-xs"
 aria-label="moremultipleAction"
 className="text-foreground-muted hover:text-foreground"
 >
 <MoreHorizontal className="w-4 h-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-40 bg-surface-100 border-border">
 {!notification.read && (
 <DropdownMenuItem
 onClick={() => markAsRead(notification.id)}
 className="text-foreground-light hover:text-foreground hover:bg-surface-200"
 >
 <Check className="w-4 h-4 mr-2" />
 Markalreadyread
 </DropdownMenuItem>
 )}
 <DropdownMenuItem
 onClick={() => toggleStar(notification.id)}
 className="text-foreground-light hover:text-foreground hover:bg-surface-200"
 >
 <Star className="w-4 h-4 mr-2" />
 {notification.starred ? "Unfavorite": "Favorite"}
 </DropdownMenuItem>
 <DropdownMenuSeparator className="bg-border-muted" />
 <DropdownMenuItem
 className="text-destructive hover:bg-destructive-200"
 onClick={() => deleteNotification(notification.id)}
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Delete
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>

 {hasMore && (
 <div className="flex justify-center">
 <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore}>
 {isLoadingMore ? "Loading...": "Load more"}
 </Button>
 </div>
 )}
 </div>
 </div>
 </div>
 </PageContainer>
 );
}
