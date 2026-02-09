"use client";

/**
 * Ticket Management - Supabase Style
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
 AlertTriangle,
 CheckCircle2,
 Clock,
 Filter,
 LifeBuoy,
 RefreshCw,
 Search,
 Ticket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supportApi, type SupportTicket } from "@/lib/api/support";
import {
 PageContainer,
 PageHeader,
 PageWithSidebar,
 SidebarNavGroup,
 SidebarNavItem,
} from "@/components/dashboard/page-layout";

const statusOptions = [
 { id: "all", label: "All Status" },
 { id: "open", label: "Pending" },
 { id: "in_progress", label: "Processing" },
 { id: "waiting_on_customer", label: "Waiting for User" },
 { id: "resolved", label: "Resolved" },
 { id: "closed", label: "Closed" },
];

const priorityOptions = [
 { id: "all", label: "All Priorities" },
 { id: "critical", label: "Critical" },
 { id: "high", label: "High" },
 { id: "normal", label: "Normal" },
 { id: "low", label: "Low" },
];

const supportSidebarLinks = [
 { id: "overview", label: "Overview", icon: LifeBuoy },
 { id: "tickets", label: "Ticket List", icon: Ticket },
];

const statusStyleMap: Record<string, { label: string; bg: string; color: string; dot: string }> = {
 open: { label: "Pending", bg: "bg-surface-200", color: "text-foreground-light", dot: "bg-foreground-muted" },
 in_progress: { label: "Processing", bg: "bg-warning-200", color: "text-warning", dot: "bg-warning" },
 waiting_on_customer: { label: "Waiting for User", bg: "bg-brand-200/60", color: "text-brand-500", dot: "bg-brand-500" },
 resolved: { label: "Resolved", bg: "bg-brand-200", color: "text-brand-500", dot: "bg-brand-500" },
 closed: { label: "Closed", bg: "bg-surface-200", color: "text-foreground-muted", dot: "bg-foreground-muted" },
};

const priorityStyleMap: Record<string, { label: string; bg: string; color: string }> = {
 critical: { label: "Urgent", bg: "bg-destructive-200", color: "text-destructive" },
  high: { label: "High", bg: "bg-warning-200", color: "text-warning" },
  normal: { label: "Normal", bg: "bg-brand-200", color: "text-brand-500" },
  low: { label: "Low", bg: "bg-surface-200", color: "text-foreground-muted" },
};

const pageSize = 15;

const formatDate = (value?: string) => {
 if (!value) return "-";
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return "-";
 return new Intl.DateTimeFormat("zh-CN", {
 dateStyle: "medium",
 timeStyle: "short",
 }).format(date);
};

type StatusHistoryItem = {
 from?: string;
 to?: string;
 note?: string;
 at?: string;
 actor_user_id?: string;
};

const parseStatusHistory = (ticket?: SupportTicket | null): StatusHistoryItem[] => {
 const raw = ticket?.metadata?.status_history;
 if (!Array.isArray(raw)) return [];
 return raw
 .map((item) => {
 if (!item || typeof item !== "object") return null;
 const entry = item as Record<string, unknown>;
 return {
 from: entry.from as string | undefined,
 to: entry.to as string | undefined,
 note: entry.note as string | undefined,
 at: entry.at as string | undefined,
 actor_user_id: entry.actor_user_id as string | undefined,
 };
 })
 .filter(Boolean) as StatusHistoryItem[];
};

export default function SupportTicketsPage() {
 const [tickets, setTickets] = useState<SupportTicket[]>([]);
 const [total, setTotal] = useState(0);
 const [page, setPage] = useState(1);
 const [statusFilter, setStatusFilter] = useState("all");
 const [priorityFilter, setPriorityFilter] = useState("all");
 const [searchQuery, setSearchQuery] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);

 const [editingId, setEditingId] = useState<string | null>(null);
 const [statusDraft, setStatusDraft] = useState("open");
 const [noteDraft, setNoteDraft] = useState("");
 const [isUpdating, setIsUpdating] = useState(false);

 const loadTickets = useCallback(async () => {
 setIsLoading(true);
 setErrorMessage(null);
 try {
 const response = await supportApi.adminListTickets({
 status: statusFilter === "all" ? undefined : statusFilter,
 priority: priorityFilter === "all" ? undefined : priorityFilter,
 search: searchQuery || undefined,
 page,
 page_size: pageSize,
 });
 setTickets(response.items ?? []);
 setTotal(response.total ?? 0);
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to load support tickets");
 } finally {
 setIsLoading(false);
 }
 }, [page, priorityFilter, searchQuery, statusFilter]);

 useEffect(() => {
 loadTickets();
 }, [loadTickets]);

 const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

 const openCount = tickets.filter((ticket) => ticket.status === "open").length;
 const inProgressCount = tickets.filter((ticket) => ticket.status === "in_progress").length;
 const waitingCount = tickets.filter((ticket) => ticket.status === "waiting_on_customer").length;
 const resolvedCount = tickets.filter((ticket) => ticket.status === "resolved").length;
 const activeStatusLabel =
 statusOptions.find((option) => option.id === statusFilter)?.label || "All Status";
 const activePriorityLabel =
 priorityOptions.find((option) => option.id === priorityFilter)?.label || "All Priorities";

 const sidebar = (
 <div className="space-y-4">
 <SidebarNavGroup title="Navigation">
 {supportSidebarLinks.map((item) => {
 const Icon = item.icon;
 return (
 <SidebarNavItem
 key={item.id}
 href={`#${item.id}`}
 label={item.label}
 icon={<Icon className="w-3.5 h-3.5" />}
 />
 );
 })}
 </SidebarNavGroup>

 <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-2">
 <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
 Search Tickets
 </div>
 <div className="relative">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
 <Input
 placeholder="Search number, title or email"
 value={searchQuery}
 onChange={(e) => {
 setSearchQuery(e.target.value);
 setPage(1);
 }}
 className="pl-8 h-8 bg-surface-75 border-border text-foreground placeholder:text-foreground-muted focus:border-brand-400"
 />
 </div>
 <div className="text-[10px] text-foreground-muted">
 {activeStatusLabel} · {activePriorityLabel}
 </div>
 </div>

 <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-3">
 <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
 Filter Conditions
 </div>
 <div className="space-y-2">
 <label className="text-[11px] text-foreground-muted">Status</label>
 <select
 value={statusFilter}
 onChange={(e) => {
 setStatusFilter(e.target.value);
 setPage(1);
 }}
 className="h-9 w-full rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
 >
 {statusOptions.map((option) => (
 <option key={option.id} value={option.id}>
 {option.label}
 </option>
 ))}
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-[11px] text-foreground-muted">Priority</label>
 <select
 value={priorityFilter}
 onChange={(e) => {
 setPriorityFilter(e.target.value);
 setPage(1);
 }}
 className="h-9 w-full rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
 >
 {priorityOptions.map((option) => (
 <option key={option.id} value={option.id}>
 {option.label}
 </option>
 ))}
 </select>
 </div>
 <div className="flex items-center justify-between text-[10px] text-foreground-muted">
 <span>Current Page</span>
 <span>
 {page} / {totalPages}
 </span>
 </div>
 </div>

 <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-[11px] uppercase tracking-wider text-foreground-muted">
 Status Distribution
 </span>
 <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[10px]">
 {total} 
 </Badge>
 </div>
 <div className="grid grid-cols-2 gap-2 text-[11px]">
 <div className="rounded-md border border-border bg-surface-75 px-2 py-2">
 <div className="text-foreground-muted">Pending</div>
 <div className="text-foreground font-semibold">{openCount}</div>
 </div>
 <div className="rounded-md border border-border bg-surface-75 px-2 py-2">
 <div className="text-foreground-muted">Processing</div>
 <div className="text-foreground font-semibold">{inProgressCount}</div>
 </div>
 <div className="rounded-md border border-border bg-surface-75 px-2 py-2">
 <div className="text-foreground-muted">Waiting for User</div>
 <div className="text-foreground font-semibold">{waitingCount}</div>
 </div>
 <div className="rounded-md border border-border bg-surface-75 px-2 py-2">
 <div className="text-foreground-muted">Resolved</div>
 <div className="text-foreground font-semibold">{resolvedCount}</div>
 </div>
 </div>
 </div>
 </div>
 );

 const beginEdit = (ticket: SupportTicket) => {
 setEditingId(ticket.id);
 setStatusDraft(ticket.status);
 setNoteDraft(ticket.status_note || "");
 };

 const cancelEdit = () => {
 setEditingId(null);
 setStatusDraft("open");
 setNoteDraft("");
 };

 const submitStatusUpdate = async (ticketId: string) => {
 setIsUpdating(true);
 try {
 const response = await supportApi.adminUpdateStatus(ticketId, {
 status: statusDraft,
 note: noteDraft || undefined,
 });
 setTickets((prev) =>
 prev.map((ticket) => (ticket.id === ticketId ? response.ticket : ticket))
 );
 cancelEdit();
 } catch (error) {
 setErrorMessage((error as Error).message || "Failed to Update");
 } finally {
 setIsUpdating(false);
 }
 };

 return (
 <PageWithSidebar sidebarTitle="Support" sidebarWidth="narrow" sidebar={sidebar}>
 <PageContainer>
 <div className="space-y-6">
 <PageHeader
 title="Ticket Management"
 eyebrow="Support"
 description="Track customer feedback and support responses"
 icon={<LifeBuoy className="w-4 h-4" />}
 actions={
 <Button
 variant="outline"
 size="sm"
 className="h-8 border-border text-foreground-light hover:text-foreground"
 onClick={() => loadTickets()}
 disabled={isLoading}
 >
 <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isLoading && "animate-spin")} />
 Refresh
 </Button>
 }
 />

 <section id="overview" className="page-panel">
 <div className="page-panel-header flex items-center justify-between">
 <div>
 <h2 className="page-panel-title">Current process overview</h2>
 <p className="page-panel-description">Ticket status distribution on this page</p>
 </div>
 <Badge variant="secondary" className="bg-surface-200 text-foreground-muted text-[11px]">
 {total} Tickets
 </Badge>
 </div>
 <div className="p-6">
 <div className="page-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
 <div className="rounded-md border border-border bg-surface-75/60 p-4">
 <div className="flex items-center justify-between">
 <span className="page-caption">Pending</span>
 <Ticket className="w-4 h-4 text-foreground-muted" />
 </div>
 <div className="mt-2 text-stat-number text-foreground">{openCount}</div>
 </div>
 <div className="rounded-md border border-border bg-surface-75/60 p-4">
 <div className="flex items-center justify-between">
 <span className="page-caption">Processing</span>
 <Clock className="w-4 h-4 text-foreground-muted" />
 </div>
 <div className="mt-2 text-stat-number text-foreground">{inProgressCount}</div>
 </div>
 <div className="rounded-md border border-border bg-surface-75/60 p-4">
 <div className="flex items-center justify-between">
 <span className="page-caption">Waiting for User</span>
 <AlertTriangle className="w-4 h-4 text-foreground-muted" />
 </div>
 <div className="mt-2 text-stat-number text-foreground">{waitingCount}</div>
 </div>
 <div className="rounded-md border border-border bg-surface-75/60 p-4">
 <div className="flex items-center justify-between">
 <span className="page-caption">Resolved</span>
 <CheckCircle2 className="w-4 h-4 text-foreground-muted" />
 </div>
 <div className="mt-2 text-stat-number text-foreground">{resolvedCount}</div>
 </div>
 </div>
 </div>
 </section>

 <section id="tickets" className="page-panel">
 <div className="page-panel-header">
 <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
 <div>
 <h2 className="page-panel-title">Ticket list</h2>
 <p className="page-panel-description">Filter, view, and update process progress</p>
 </div>
 <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
 <Filter className="w-3.5 h-3.5" />
 <span>{activeStatusLabel}</span>
 <span>·</span>
 <span>{activePriorityLabel}</span>
 </div>
 </div>
 </div>

 <div className="p-5 space-y-4">
 {errorMessage && (
 <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
 {errorMessage}
 </div>
 )}

 {isLoading ? (
 <div className="rounded-md border border-border bg-surface-75/60 py-16 text-center text-sm text-foreground-muted">
 Loading tickets...
 </div>
 ) : tickets.length === 0 ? (
 <div className="rounded-md border border-border bg-surface-75/60 py-16 text-center text-sm text-foreground-muted">
 No tickets match the criteria
 </div>
 ) : (
 tickets.map((ticket) => {
 const statusStyle = statusStyleMap[ticket.status] || statusStyleMap.open;
 const priorityStyle = priorityStyleMap[ticket.priority] || priorityStyleMap.normal;
 const slaDue =
 ticket.sla_response_due_at && new Date(ticket.sla_response_due_at).getTime() < Date.now();
 const isEditing = editingId === ticket.id;
 const history = parseStatusHistory(ticket);
 const latest = history[history.length - 1];
 const historyLabel = latest?.to
 ? statusStyleMap[latest.to]?.label ?? latest.to
 : statusStyle.label;

 return (
 <div
 key={ticket.id}
 className="rounded-md border border-border bg-surface-100 p-4"
 >
 <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
 <div className="space-y-2">
 <div className="flex flex-wrap items-center gap-2">
 <Badge variant="secondary" className={cn("text-[11px] px-2 py-0.5", statusStyle.bg, statusStyle.color)}>
 <span className={cn("mr-1 inline-block h-2 w-2 rounded-full", statusStyle.dot)} />
 {statusStyle.label}
 </Badge>
 <Badge variant="secondary" className={cn("text-[11px] px-2 py-0.5", priorityStyle.bg, priorityStyle.color)}>
 {priorityStyle.label}
 </Badge>
 {slaDue && ticket.status !== "resolved" && ticket.status !== "closed" && (
 <Badge variant="secondary" className="bg-destructive-200 text-destructive text-[11px] px-2 py-0.5">
 SLA Overdue
 </Badge>
 )}
 </div>
 <Link
 href={`/support-tickets/${ticket.id}`}
 className="text-sm font-medium text-foreground hover:text-brand-500 transition-colors"
 >
 {ticket.subject}
 </Link>
 <div className="text-xs text-foreground-muted">
 Number: {ticket.reference} · Email: {ticket.requester_email}
 </div>
 <div className="text-xs text-foreground-muted">
 Created At: {formatDate(ticket.created_at)} · SLA Deadline: {formatDate(ticket.sla_response_due_at)}
 </div>
 {latest?.at && (
 <div className="text-xs text-foreground-muted">
 Recent Change: {latest.from || "Created"} → {historyLabel} · {formatDate(latest.at)}
 </div>
 )}
 {ticket.status_note && (
 <div className="text-xs text-foreground-muted">
 Latest Note: {ticket.status_note}
 </div>
 )}
 </div>
 <div className="flex flex-col gap-2">
 <Button
 variant="outline"
 size="sm"
 className="border-border text-foreground-light hover:text-foreground"
 onClick={() => (isEditing ? cancelEdit() : beginEdit(ticket))}
 >
 {isEditing ? "Cancel" : "Update Status"}
 </Button>
 </div>
 </div>

 {isEditing && (
 <div className="mt-4 rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
 <div className="flex flex-col gap-3 md:flex-row md:items-center">
 <div className="flex-1">
 <label className="text-xs font-medium text-foreground">Status</label>
 <select
 value={statusDraft}
 onChange={(e) => setStatusDraft(e.target.value)}
 className="mt-2 h-9 w-full rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
 >
 {statusOptions
 .filter((option) => option.id !== "all")
 .map((option) => (
 <option key={option.id} value={option.id}>
 {option.label}
 </option>
 ))}
 </select>
 </div>
 <div className="flex-1">
 <label className="text-xs font-medium text-foreground">Notes</label>
 <Input
 value={noteDraft}
 onChange={(e) => setNoteDraft(e.target.value)}
 placeholder="Optional"
 className="mt-2 h-9 bg-surface-200 border-border text-foreground"
 />
 </div>
 </div>
 <div className="flex items-center justify-end gap-2">
 <Button
 variant="outline"
 size="sm"
 className="border-border"
 onClick={cancelEdit}
 >
 Cancel
 </Button>
 <Button
 size="sm"
 className="bg-brand-500 hover:bg-brand-600 text-background"
 disabled={isUpdating}
 onClick={() => submitStatusUpdate(ticket.id)}
 >
 {isUpdating ? "Updating..." : "Confirm Update"}
 </Button>
 </div>
 </div>
 )}
 </div>
 );
 })
 )}

 <div className="flex items-center justify-between pt-2">
 <span className="text-xs text-foreground-muted">
                    Page {page} / {totalPages}
 </span>
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 className="border-border text-foreground-light hover:text-foreground"
 onClick={() => setPage((prev) => Math.max(1, prev - 1))}
 disabled={page <= 1}
 >
 Previous
 </Button>
 <Button
 variant="outline"
 size="sm"
 className="border-border text-foreground-light hover:text-foreground"
 onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
 disabled={page >= totalPages}
 >
 Next
 </Button>
 </div>
 </div>
 </div>
 </section>
 </div>
 </PageContainer>
 </PageWithSidebar>
 );
}
