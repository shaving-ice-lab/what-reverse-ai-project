"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
 Shield,
 Users,
 Building2,
 LifeBuoy,
 Ban,
 CheckCircle2,
 Sparkles,
 RefreshCw,
 Crown,
 AlertTriangle,
} from "lucide-react";
import { PageContainer, PageHeader, SettingsSection } from "@/components/dashboard/page-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import {
 adminApi,
 type AdminCapability,
 type AdminUser,
 type AdminWorkspace,
} from "@/lib/api/admin";
import type { SupportTicket } from "@/lib/api/support";
import { useAuthStore } from "@/stores/useAuthStore";

type ActionTarget =
 | {
 type: "user" | "workspace";
 id: string;
 title: string;
 description: string;
 nextStatus: string;
 }
 | {
 type: "ticket";
 id: string;
 title: string;
 description: string;
 nextStatus: string;
 };

const statusVariants: Record<string, { label: string; variant: "success" | "warning" | "error" | "info" }> = {
 active: { label: "Normal", variant: "success" },
 suspended: { label: "Pause", variant: "error" },
 deleted: { label: "Delete", variant: "warning" },
 cold_storage: { label: "Storage", variant: "info" },
 draft: { label: "Draft", variant: "info" },
 published: { label: "Published", variant: "success" },
 deprecated: { label: "alreadyuse", variant: "warning" },
 archived: { label: "Archived", variant: "warning" },
 open: { label: "Pending", variant: "warning" },
 in_progress: { label: "Processing", variant: "info" },
 waiting_on_customer: { label: "etcpendingUser", variant: "warning" },
 resolved: { label: "alreadyResolve", variant: "success" },
 closed: { label: "alreadyClose", variant: "error" },
};

type StatusHistoryItem = {
 from?: string;
 to?: string;
 note?: string;
 at?: string;
 actor_user_id?: string;
};

const ticketNextAction: Record<
 string,
 { label: string; nextStatus: string; variant: "default" | "secondary" | "outline" }
> = {
 open: { label: "StartProcess", nextStatus: "in_progress", variant: "default" },
 in_progress: { label: "MarkResolve", nextStatus: "resolved", variant: "secondary" },
 resolved: { label: "CloseTicket", nextStatus: "closed", variant: "outline" },
 closed: { label: "re-newOpen", nextStatus: "open", variant: "default" },
};

const formatDate = (value?: string) => {
 if (!value) return "-";
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return "-";
 return new Intl.DateTimeFormat("zh-CN", {
 dateStyle: "medium",
 timeStyle: "short",
 }).format(date);
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

export default function AdminConsolePage() {
 const { user } = useAuthStore();
 const isAdmin = user?.role === "admin";

 const [capabilities, setCapabilities] = useState<AdminCapability[]>([]);
 const [activeTab, setActiveTab] = useState("users");

 const [users, setUsers] = useState<AdminUser[]>([]);
 const [userSearch, setUserSearch] = useState("");
 const [userStatus, setUserStatus] = useState("");
 const [userRole, setUserRole] = useState("");
 const [userLoading, setUserLoading] = useState(false);

 const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
 const [workspaceSearch, setWorkspaceSearch] = useState("");
 const [workspaceStatus, setWorkspaceStatus] = useState("");
 const [workspaceLoading, setWorkspaceLoading] = useState(false);

 const [tickets, setTickets] = useState<SupportTicket[]>([]);
 const [ticketSearch, setTicketSearch] = useState("");
 const [ticketStatus, setTicketStatus] = useState("");
 const [ticketPriority, setTicketPriority] = useState("");
 const [ticketLoading, setTicketLoading] = useState(false);

 const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
 const [actionReason, setActionReason] = useState("");
 const [actionLoading, setActionLoading] = useState(false);

 useEffect(() => {
 if (!isAdmin) return;
 adminApi
 .getCapabilities()
 .then((data) => setCapabilities(data.capabilities))
 .catch(() => setCapabilities([]));
 }, [isAdmin]);

 const statusBadge = (status?: string) => {
 if (!status) return null;
 const config = statusVariants[status] ?? { label: status, variant: "info" };
 return (
 <Badge variant={config.variant} size="sm">
 {config.label}
 </Badge>
 );
 };

 const loadUsers = async () => {
 setUserLoading(true);
 try {
 const data = await adminApi.listUsers({
 search: userSearch || undefined,
 status: userStatus || undefined,
 role: userRole || undefined,
 page: 1,
 page_size: 20,
 });
 setUsers(data.items ?? []);
 } catch (error) {
 console.error("Failed to load users", error);
 setUsers([]);
 } finally {
 setUserLoading(false);
 }
 };

 const loadWorkspaces = async () => {
 setWorkspaceLoading(true);
 try {
 const data = await adminApi.listWorkspaces({
 search: workspaceSearch || undefined,
 status: workspaceStatus || undefined,
 page: 1,
 page_size: 20,
 });
 setWorkspaces(data.items ?? []);
 } catch (error) {
 console.error("Failed to load workspaces", error);
 setWorkspaces([]);
 } finally {
 setWorkspaceLoading(false);
 }
 };

 const loadTickets = async () => {
 setTicketLoading(true);
 try {
 const data = await adminApi.listSupportTickets({
 search: ticketSearch || undefined,
 status: ticketStatus || undefined,
 priority: ticketPriority || undefined,
 page: 1,
 page_size: 20,
 });
 setTickets(data.items ?? []);
 } catch (error) {
 console.error("Failed to load tickets", error);
 setTickets([]);
 } finally {
 setTicketLoading(false);
 }
 };

 const refreshActiveTab = () => {
 switch (activeTab) {
 case "users":
 return loadUsers();
 case "workspaces":
 return loadWorkspaces();
 case "tickets":
 return loadTickets();
 default:
 return Promise.resolve();
 }
 };

 useEffect(() => {
 if (!isAdmin) return;
 if (activeTab === "users") loadUsers();
 }, [activeTab, isAdmin, userSearch, userStatus, userRole]);

 useEffect(() => {
 if (!isAdmin) return;
 if (activeTab === "workspaces") loadWorkspaces();
 }, [activeTab, isAdmin, workspaceSearch, workspaceStatus]);

 useEffect(() => {
 if (!isAdmin) return;
 if (activeTab === "tickets") loadTickets();
 }, [activeTab, isAdmin, ticketSearch, ticketStatus, ticketPriority]);

 const openActionDialog = (target: ActionTarget) => {
 setActionReason("");
 setActionTarget(target);
 };

 const confirmAction = async () => {
 if (!actionTarget) return;
 setActionLoading(true);
 try {
 if (actionTarget.type === "user") {
 await adminApi.updateUserStatus(actionTarget.id, {
 status: actionTarget.nextStatus,
 reason: actionReason || undefined,
 });
 }
 if (actionTarget.type === "workspace") {
 await adminApi.updateWorkspaceStatus(actionTarget.id, {
 status: actionTarget.nextStatus,
 reason: actionReason || undefined,
 });
 }
 if (actionTarget.type === "ticket") {
 await adminApi.updateSupportTicketStatus(actionTarget.id, {
 status: actionTarget.nextStatus,
 note: actionReason || undefined,
 });
 }
 await refreshActiveTab();
 setActionTarget(null);
 } catch (error) {
 console.error("Failed to update status", error);
 } finally {
 setActionLoading(false);
 }
 };

 const adminHeader = useMemo(() => {
 if (!isAdmin) {
 return (
 <div className="rounded-2xl border border-border bg-surface-100 p-8 text-center">
 <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-200 text-warning">
 <AlertTriangle className="h-6 w-6" />
 </div>
 <h2 className="text-lg font-semibold text-foreground">needneedAdminPermission</h2>
 <p className="mt-2 text-sm text-foreground-muted">
 CurrentAccountnot yetbyAuthorizeAccessManageafter, PleaseContactSystemAdminPermission.
 </p>
 </div>
 );
 }

 return (
 <div className="relative overflow-hidden rounded-2xl border border-border bg-linear-to-br from-surface-100 via-surface-200/80 to-surface-100 p-6">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_55%)]" />
 <div className="relative flex flex-col gap-4">
 <div className="flex items-start gap-3">
 <div className="rounded-xl border border-border/60 bg-surface-100 p-3">
 <Sparkles className="h-5 w-5 text-brand-500" />
 </div>
 <div>
 <p className="text-xs uppercase tracking-[0.35em] text-foreground-muted">Command Desk</p>
 <h3 className="text-lg font-semibold text-foreground">OperationsandRisk Control</h3>
 <p className="mt-1 text-sm text-foreground-muted">
 1EntryManageUser, Workspace, AppandSupportTicket, AllActioncan.
 </p>
 </div>
 </div>
 <div className="flex flex-wrap gap-2">
 {capabilities.map((cap) => (
 <Badge key={cap.key} variant="gradient" size="sm">
 {cap.title}
 </Badge>
 ))}
 </div>
 </div>
 </div>
 );
 }, [capabilities, isAdmin]);

 return (
 <PageContainer className="space-y-6">
 <PageHeader
 title="Manageafter"
 eyebrow="InternalOperations"
 icon={<Shield className="h-4 w-4" />}
 description="AdminPermissionValidate, Risk Control, Support's1Work."
 actions={
 isAdmin ? (
 <Button variant="outline" size="sm" onClick={refreshActiveTab}>
 <RefreshCw className="mr-2 h-4 w-4" />
 RefreshData
 </Button>
 ) : null
 }
 />

 {adminHeader}

 {isAdmin && (
 <SettingsSection
 title="Manage"
 description="byModuleProcessOperationsTask, SupportMinimumClosed Loop'sQuery, andTrack."
 >
 <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
 <TabsList variant="segment" showIndicator fullWidth>
 <TabsTrigger value="users" icon={<Users className="h-4 w-4" />}>
 User
 </TabsTrigger>
 <TabsTrigger value="workspaces" icon={<Building2 className="h-4 w-4" />}>
 Workspace
 </TabsTrigger>
 <TabsTrigger value="tickets" icon={<LifeBuoy className="h-4 w-4" />}>
 SupportTicket
 </TabsTrigger>
 </TabsList>

 <TabsContent value="users" animated>
 <div className="space-y-4">
 <div className="flex flex-wrap items-center gap-3">
 <Input
 value={userSearch}
 onChange={(event) => setUserSearch(event.target.value)}
 placeholder="SearchUserEmail/Username"
 className="max-w-xs"
 />
 <select
 value={userStatus}
 onChange={(event) => setUserStatus(event.target.value)}
 className="h-9 rounded-md border border-border bg-surface-100 px-3 text-sm"
 >
 <option value="">allsectionStatus</option>
 <option value="active">Normal</option>
 <option value="suspended">Pause</option>
 </select>
 <select
 value={userRole}
 onChange={(event) => setUserRole(event.target.value)}
 className="h-9 rounded-md border border-border bg-surface-100 px-3 text-sm"
 >
 <option value="">allsectionRole</option>
 <option value="user">User</option>
 <option value="creator">Creativeuser</option>
 <option value="admin">Admin</option>
 </select>
 </div>

 <div className="space-y-2">
 {users.map((item) => (
 <div
 key={item.id}
 className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-100/80 px-4 py-3"
 >
 <div className="min-w-[220px]">
 <p className="text-sm font-semibold text-foreground">{item.username}</p>
 <p className="text-xs text-foreground-muted">{item.email}</p>
 {item.status_reason && (
 <p className="mt-1 text-xs text-warning">Reason: {item.status_reason}</p>
 )}
 </div>
 <div className="flex items-center gap-2">
 {statusBadge(item.status)}
 <Badge variant="outline" size="sm" className="flex items-center gap-1">
 <Crown className="h-3 w-3" />
 {item.role === "admin" ? "Admin": item.role === "creator" ? "Creativeuser": "User"}
 </Badge>
 </div>
 <div className="flex flex-wrap gap-2">
 {item.status !== "suspended" ? (
 <Button
 size="sm"
 variant="outline"
 onClick={() =>
 openActionDialog({
 type: "user",
 id: item.id,
 title: "PauseUser",
 description: "PauseafterwillNoneAccessProtectResource",
 nextStatus: "suspended",
 })
 }
 >
 <Ban className="mr-2 h-4 w-4" />
 Pause
 </Button>
 ) : (
 <Button
 size="sm"
 variant="secondary"
 onClick={() =>
 openActionDialog({
 type: "user",
 id: item.id,
 title: "RestoreUser",
 description: "RestoreaftercanagaintimesSign InandAccessSystem",
 nextStatus: "active",
 })
 }
 >
 <CheckCircle2 className="mr-2 h-4 w-4" />
 Restore
 </Button>
 )}
 {item.role !== "admin" ? (
 <Button
 size="sm"
 variant="default"
 onClick={() =>
 adminApi
 .updateUserRole(item.id, { role: "admin" })
 .then(loadUsers)
 .catch((error) => console.error("Failed to update role", error))
 }
 >
 asAdmin
 </Button>
 ) : (
 <Button
 size="sm"
 variant="outline"
 onClick={() =>
 adminApi
 .updateUserRole(item.id, { role: "user" })
 .then(loadUsers)
 .catch((error) => console.error("Failed to update role", error))
 }
 >
 CancelAdmin
 </Button>
 )}
 </div>
 </div>
 ))}
 {users.length === 0 && !userLoading && (
 <p className="text-sm text-foreground-muted">NoneMatchUser.</p>
 )}
 </div>
 </div>
 </TabsContent>

 <TabsContent value="workspaces" animated>
 <div className="space-y-4">
 <div className="flex flex-wrap items-center gap-3">
 <Input
 value={workspaceSearch}
 onChange={(event) => setWorkspaceSearch(event.target.value)}
 placeholder="Search Workspace Name/Slug"
 className="max-w-xs"
 />
 <select
 value={workspaceStatus}
 onChange={(event) => setWorkspaceStatus(event.target.value)}
 className="h-9 rounded-md border border-border bg-surface-100 px-3 text-sm"
 >
 <option value="">allsectionStatus</option>
 <option value="active">Normal</option>
 <option value="suspended">Pause</option>
 <option value="deleted">Delete</option>
 </select>
 </div>
 <div className="space-y-2">
 {workspaces.map((item) => (
 <div
 key={item.id}
 className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-100/80 px-4 py-3"
 >
 <div className="min-w-[240px]">
 <p className="text-sm font-semibold text-foreground">{item.name}</p>
 <p className="text-xs text-foreground-muted">{item.slug}</p>
 {item.owner && (
 <p className="mt-1 text-xs text-foreground-muted">
 Owner: {item.owner.email}
 </p>
 )}
 {item.status_reason && (
 <p className="mt-1 text-xs text-warning">Reason: {item.status_reason}</p>
 )}
 </div>
 <div className="flex items-center gap-2">{statusBadge(item.status)}</div>
 <div className="flex flex-wrap gap-2">
 {item.status !== "suspended" ? (
 <Button
 size="sm"
 variant="outline"
 onClick={() =>
 openActionDialog({
 type: "workspace",
 id: item.id,
 title: "Pause Workspace",
 description: "Pauseafter Workspace ResourcewillnotcanAccess",
 nextStatus: "suspended",
 })
 }
 >
 Pause
 </Button>
 ) : (
 <Button
 size="sm"
 variant="secondary"
 onClick={() =>
 openActionDialog({
 type: "workspace",
 id: item.id,
 title: "Restore Workspace",
 description: "RestoreaftercanagaintimesAccess",
 nextStatus: "active",
 })
 }
 >
 Restore
 </Button>
 )}
 </div>
 </div>
 ))}
 {workspaces.length === 0 && !workspaceLoading && (
 <p className="text-sm text-foreground-muted">NoneMatch Workspace.</p>
 )}
 </div>
 </div>
 </TabsContent>

 <TabsContent value="tickets" animated>
 <div className="space-y-4">
 <div className="flex flex-wrap items-center gap-3">
 <Input
 value={ticketSearch}
 onChange={(event) => setTicketSearch(event.target.value)}
 placeholder="SearchTicketTheme/Number"
 className="max-w-xs"
 />
 <select
 value={ticketStatus}
 onChange={(event) => setTicketStatus(event.target.value)}
 className="h-9 rounded-md border border-border bg-surface-100 px-3 text-sm"
 >
 <option value="">allsectionStatus</option>
 <option value="open">Pending</option>
 <option value="in_progress">Processing</option>
 <option value="waiting_on_customer">etcpendingUser</option>
 <option value="resolved">alreadyResolve</option>
 <option value="closed">alreadyClose</option>
 </select>
 <select
 value={ticketPriority}
 onChange={(event) => setTicketPriority(event.target.value)}
 className="h-9 rounded-md border border-border bg-surface-100 px-3 text-sm"
 >
 <option value="">allsectionPriority</option>
 <option value="critical">Urgent</option>
 <option value="high"></option>
 <option value="normal"></option>
 <option value="low"></option>
 </select>
 </div>
 <div className="space-y-2">
 {tickets.map((ticket) => {
 const history = parseStatusHistory(ticket);
 const latest = history[history.length - 1];
 const historyLabel = latest?.to
 ? statusVariants[latest.to]?.label ?? latest.to
 : statusVariants[ticket.status]?.label ?? ticket.status;
 const slaOverdue =
 ticket.sla_response_due_at &&
 ticket.status !== "resolved" &&
 ticket.status !== "closed" &&
 new Date(ticket.sla_response_due_at).getTime() < Date.now();
 const action = ticketNextAction[ticket.status] ?? null;
 return (
 <div
 key={ticket.id}
 className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-100/80 px-4 py-3"
 >
 <div className="min-w-[240px]">
 <p className="text-sm font-semibold text-foreground">
 {ticket.reference} · {ticket.subject}
 </p>
 <p className="text-xs text-foreground-muted">{ticket.requester_email}</p>
 {latest?.at && (
 <p className="mt-1 text-xs text-foreground-muted">
 RecentWorkflow: {latest.from || "Create"} → {historyLabel} ·{""}
 {formatDate(latest.at)}
 </p>
 )}
 {ticket.status_note && (
 <p className="mt-1 text-xs text-warning">Notes: {ticket.status_note}</p>
 )}
 </div>
 <div className="flex items-center gap-2">
 {statusBadge(ticket.status)}
 {ticket.priority && (
 <Badge variant="outline" size="sm">
 {ticket.priority.toUpperCase()}
 </Badge>
 )}
 {ticket.sla_response_due_at && (
 <Badge
 variant={slaOverdue ? "destructive" : "outline"}
 size="sm"
 className={cn(
 slaOverdue ? "bg-destructive-200 text-destructive" : "text-foreground-muted"
 )}
 >
 SLA {slaOverdue ? "alreadyTimeout": formatDate(ticket.sla_response_due_at)}
 </Badge>
 )}
 </div>
 <div className="flex flex-wrap gap-2">
 <Button asChild size="sm" variant="outline">
 <Link href={`/support-tickets/${ticket.id}`}>ViewDetails</Link>
 </Button>
 {action && (
 <Button
 size="sm"
 variant={action.variant}
 onClick={() =>
 openActionDialog({
 type: "ticket",
 id: ticket.id,
 title: "UpdateTicketStatus",
 description: `willStatusUpdateas"${statusVariants[action.nextStatus]?.label ?? action.nextStatus}"`,
 nextStatus: action.nextStatus,
 })
 }
 >
 {action.label}
 </Button>
 )}
 </div>
 </div>
 );
 })}
 {tickets.length === 0 && !ticketLoading && (
 <p className="text-sm text-foreground-muted">NoneMatchTicket.</p>
 )}
 </div>
 </div>
 </TabsContent>
 </Tabs>
 </SettingsSection>
 )}

 <ConfirmDialog
 isOpen={Boolean(actionTarget)}
 onClose={() => setActionTarget(null)}
 onConfirm={confirmAction}
 title={actionTarget?.title ?? "ConfirmAction"}
 description={actionTarget?.description}
 confirmText="ConfirmExecute"
 cancelText="Cancel"
 variant={actionTarget?.nextStatus === "suspended" ? "danger" : "info"}
 icon={actionTarget?.nextStatus === "suspended" ? Ban : CheckCircle2}
 isLoading={actionLoading}
 >
 <div className="space-y-2">
 <label className="text-xs text-foreground-muted">
 {actionTarget?.type === "ticket" ? "StatusDescription": "Reason"}
 </label>
 <textarea
 value={actionReason}
 onChange={(event) => setActionReason(event.target.value)}
 placeholder={actionTarget?.type === "ticket" ? "SupplementProcessDescription(Optional)": "Fill inReason(Optional)"}
 className={cn(
 "min-h-[80px] w-full rounded-md border border-border bg-surface-100 px-3 py-2 text-sm text-foreground",
 "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500/30"
 )}
 />
 </div>
 </ConfirmDialog>
 </PageContainer>
 );
}
