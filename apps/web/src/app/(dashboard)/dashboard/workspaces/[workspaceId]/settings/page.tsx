"use client";

/**
 * Workspace Settings Page - Supabase Style
 * Member Management, General Settings, Billing Info
 */

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
 Settings,
 Users,
 CreditCard,
 Shield,
 Trash2,
 UserPlus,
 Mail,
 Crown,
 Clock,
 ChevronLeft,
 Loader2,
 MoreHorizontal,
 UserCog,
 Key,
 Check,
 X,
 RefreshCw,
 Edit3,
 Eye,
 EyeOff,
 Zap,
 Bot,
 MessageSquare,
 Send,
 Archive,
 Download,
 Play,
 Filter,
 FileText,
 Database,
 AlertTriangle,
 SlidersHorizontal,
 Plus,
 Copy,
 Link2,
 Globe,
 Webhook,
 Lock,
 Unlink,
 ExternalLink,
 Activity,
 CheckCircle2,
 XCircle,
 AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
 PageContainer,
 PageHeader,
 PageWithSidebar,
 SettingsSection,
 FormRow,
 SidebarNavItem,
 SidebarNavGroup,
 EmptyState,
} from "@/components/dashboard/page-layout";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuCheckboxItem,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 workspaceApi,
 type Workspace,
 type WorkspaceMember,
 type WorkspaceQuota,
 type LogArchiveJob,
 type LogArchiveType,
 type WorkspaceApiKey,
 type WorkspaceIntegration,
} from "@/lib/api/workspace";
import { configApi } from "@/lib/api/config";
import { billingApi, type BudgetSettings } from "@/lib/api/billing";
import { useAuthStore } from "@/stores/useAuthStore";
import { buildWorkspacePermissions, resolveWorkspaceRoleFromUser } from "@/lib/permissions";
import { PermissionGate } from "@/components/permissions/permission-gate";

// RoleConfig
const roles = [
 {
 id: "owner",
 name: "Owner",
    description: "Full control permissions — can manage team settings and billing",
 color: "text-warning",
 bgColor: "bg-warning-200",
 icon: Crown,
 },
 {
 id: "admin",
 name: "Admin",
    description: "Can manage members and most settings",
 color: "text-brand-500",
 bgColor: "bg-brand-200",
 icon: Shield,
 },
 {
 id: "member",
 name: "Member",
    description: "Can create and edit apps",
 color: "text-foreground-light",
 bgColor: "bg-surface-200",
 icon: Edit3,
 },
];

const archiveTypeOptions: Array<{
 value: LogArchiveType;
 label: string;
 description: string;
}> = [
 {
 value: "execution_logs",
 label: "Execution Logs",
 description: "Workflow execution records and node logs",
 },
 {
 value: "audit_logs",
 label: "Audit Log",
 description: "Actor, target, and action records",
 },
];

const archiveStatusConfig: Record<
 string,
 { label: string; color: string; bg: string; icon: React.ElementType }
> = {
 pending: { label: "Pending", color: "text-warning", bg: "bg-warning-200", icon: Clock },
 processing: { label: "Archive", color: "text-foreground-light", bg: "bg-surface-200", icon: Loader2 },
 completed: { label: "Ready to Replay", color: "text-brand-500", bg: "bg-brand-200", icon: Check },
 failed: { label: "Failed", color: "text-destructive", bg: "bg-destructive-200", icon: AlertTriangle },
};

type ReplayRow = {
 id: string;
 created_at?: string;
 execution_id?: string;
 workflow_id?: string;
 user_id?: string;
 status?: string;
 duration_ms?: number;
 node_id?: string;
 node_type?: string;
 error_message?: string;
 action?: string;
 actor_user_id?: string;
 target_type?: string;
 target_id?: string;
};

type ReplayColumnTemplate = {
 id: string;
 label: string;
 columns: string[];
 isCustom?: boolean;
 source?: "system" | "personal" | "shared";
};

type CloudReplayConfig = {
 version: number;
 columnsByDataset?: Record<string, string[]>;
 templateByDataset?: Record<string, string>;
 exportAllByDataset?: Record<string, boolean>;
 customTemplatesByDataset?: Record<string, ReplayColumnTemplate[]>;
};

type WorkspaceReplayTemplates = {
 version: number;
 templatesByDataset?: Record<string, ReplayColumnTemplate[]>;
};

const replayFieldMappings: Record<string, Array<{ label: string; field: string }>> = {
 node_logs: [
 { label: "Time", field: "created_at" },
 { label: "Execute ID", field: "execution_id" },
 { label: "Node ID", field: "node_id" },
 { label: "Node Type", field: "node_type" },
 { label: "Status", field: "status" },
 { label: "Duration", field: "duration_ms" },
 { label: "Error Info", field: "error_message" },
 ],
 executions: [
 { label: "Time", field: "created_at" },
 { label: "Execute ID", field: "execution_id" },
 { label: "Workflow ID", field: "workflow_id" },
 { label: "User ID", field: "user_id" },
 { label: "Status", field: "status" },
 { label: "Duration", field: "duration_ms" },
 { label: "Error Info", field: "error_message" },
 ],
 audit_logs: [
 { label: "Time", field: "created_at" },
 { label: "Action", field: "action" },
 { label: "Actor", field: "actor_user_id" },
 { label: "Target Type", field: "target_type" },
 { label: "Target ID", field: "target_id" },
 ],
};

const replayColumnTemplates: Record<string, ReplayColumnTemplate[]> = {
 node_logs: [
 {
 id: "default",
 label: "Default Template",
 columns: ["created_at", "execution_id", "node_id", "node_type", "status", "duration_ms", "error_message"],
 source: "system",
 },
 {
 id: "core",
 label: "Core Tracking",
 columns: ["created_at", "execution_id", "node_id", "status"],
 source: "system",
 },
 {
 id: "diagnostic",
 label: "Diagnostic Template",
 columns: ["created_at", "execution_id", "node_id", "node_type", "status", "error_message"],
 source: "system",
 },
 ],
 executions: [
 {
 id: "default",
 label: "Default Template",
 columns: ["created_at", "execution_id", "workflow_id", "user_id", "status", "duration_ms", "error_message"],
 source: "system",
 },
 {
 id: "core",
 label: "Core Tracking",
 columns: ["created_at", "execution_id", "status", "duration_ms"],
 source: "system",
 },
 {
 id: "ownership",
 label: "Attribution Template",
 columns: ["created_at", "workflow_id", "user_id", "status", "duration_ms"],
 source: "system",
 },
 ],
 audit_logs: [
 {
 id: "default",
 label: "Default Template",
 columns: ["created_at", "action", "actor_user_id", "target_type", "target_id"],
 source: "system",
 },
 {
 id: "actions",
 label: "Actions View",
 columns: ["created_at", "action", "actor_user_id"],
 source: "system",
 },
 {
 id: "targets",
 label: "Targets View",
 columns: ["created_at", "target_type", "target_id", "action"],
 source: "system",
 },
 ],
};

// EdgeNavigation
function SettingsNav({ workspaceId, activeTab }: { workspaceId: string; activeTab: string }) {
 const navItems = [
 { id: "general", label: "General Settings", icon: <Settings className="w-4 h-4" /> },
 { id: "members", label: "Member Management", icon: <Users className="w-4 h-4" /> },
 { id: "api-keys", label: "API Keys", icon: <Key className="w-4 h-4" /> },
 { id: "billing", label: "Usage & Billing", icon: <CreditCard className="w-4 h-4" /> },
 { id: "archives", label: "Archive & Replay", icon: <Archive className="w-4 h-4" /> },
 ];

 return (
 <SidebarNavGroup title="Settings">
 {navItems.map((item) => (
 <SidebarNavItem
 key={item.id}
 href={`/workspaces/${workspaceId}/settings?tab=${item.id}`}
 label={item.label}
 icon={item.icon}
 active={activeTab === item.id}
 />
 ))}
 </SidebarNavGroup>
 );
}

export default function WorkspaceSettingsPage() {
 const params = useParams();
 const router = useRouter();
 const workspaceId = params.workspaceId as string;
 const { user } = useAuthStore();
 const workspaceRole = resolveWorkspaceRoleFromUser(user?.role);
 const permissions = buildWorkspacePermissions(workspaceRole);

 const [activeTab, setActiveTab] = useState("general");
 const [workspace, setWorkspace] = useState<Workspace | null>(null);
 const [members, setMembers] = useState<WorkspaceMember[]>([]);
 const [quota, setQuota] = useState<WorkspaceQuota | null>(null);
 const [budget, setBudget] = useState<BudgetSettings | null>(null);
 const [isLoading, setIsLoading] = useState(true);

 // FormStatus
 const [editForm, setEditForm] = useState({ name: "", slug: "" });
 const [isSaving, setIsSaving] = useState(false);
 const [isBudgetSaving, setIsBudgetSaving] = useState(false);
 const [budgetForm, setBudgetForm] = useState({
 monthlyBudget: "",
 thresholds: "50, 80, 100",
 spendLimit: "",
 spendLimitEnabled: false,
 currency: "",
 });
 const [showInviteDialog, setShowInviteDialog] = useState(false);
 const [inviteEmail, setInviteEmail] = useState("");
 const [inviteRole, setInviteRole] = useState("member");
 const [isInviting, setIsInviting] = useState(false);

 // LogsArchive
 const [archives, setArchives] = useState<LogArchiveJob[]>([]);
 const [isArchiveLoading, setIsArchiveLoading] = useState(false);
 const [isArchiveCreating, setIsArchiveCreating] = useState(false);
 const [archiveError, setArchiveError] = useState<string | null>(null);
 const [archiveType, setArchiveType] = useState<LogArchiveType>("execution_logs");
 const [archiveRangeStart, setArchiveRangeStart] = useState("");
 const [archiveRangeEnd, setArchiveRangeEnd] = useState("");
 const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);

 // ArchiveReplay
 const [replayDataset, setReplayDataset] = useState("node_logs");
 const [replayFrom, setReplayFrom] = useState("");
 const [replayTo, setReplayTo] = useState("");
 const [replayExecutionId, setReplayExecutionId] = useState("");
 const [replayWorkflowId, setReplayWorkflowId] = useState("");
 const [replayUserId, setReplayUserId] = useState("");
 const [replayNodeId, setReplayNodeId] = useState("");
 const [replayNodeType, setReplayNodeType] = useState("");
 const [replayStatus, setReplayStatus] = useState("");
 const [replayAction, setReplayAction] = useState("");
 const [replayActor, setReplayActor] = useState("");
 const [replayTargetType, setReplayTargetType] = useState("");
 const [replayTargetId, setReplayTargetId] = useState("");
 const [replayLimit, setReplayLimit] = useState(50);
 const [replayOffset, setReplayOffset] = useState(0);
 const [replayRecords, setReplayRecords] = useState<Array<Record<string, unknown>>>([]);
 const [replayNextOffset, setReplayNextOffset] = useState<number | null>(null);
 const [isReplayLoading, setIsReplayLoading] = useState(false);
 const [replayError, setReplayError] = useState<string | null>(null);
 const [replayView, setReplayView] = useState<"table" | "json">("table");
 const [visibleColumnsByDataset, setVisibleColumnsByDataset] = useState<Record<string, string[]>>({});
 const [columnTemplateByDataset, setColumnTemplateByDataset] = useState<Record<string, string>>({});
 const [exportAllFieldsByDataset, setExportAllFieldsByDataset] = useState<Record<string, boolean>>({});
 const [customTemplatesByDataset, setCustomTemplatesByDataset] = useState<Record<string, ReplayColumnTemplate[]>>({});
 const [sharedTemplatesByDataset, setSharedTemplatesByDataset] = useState<Record<string, ReplayColumnTemplate[]>>({});
 const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
 const [showManageTemplatesDialog, setShowManageTemplatesDialog] = useState(false);
 const [newTemplateName, setNewTemplateName] = useState("");
 const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
 const [editingTemplateScope, setEditingTemplateScope] = useState<"personal" | "shared" | null>(null);
 const [editingTemplateName, setEditingTemplateName] = useState("");
 const [templateError, setTemplateError] = useState<string | null>(null);
 const [cloudSyncStatus, setCloudSyncStatus] = useState<"idle" | "syncing" | "error">("idle");
 const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
 const [cloudSyncReady, setCloudSyncReady] = useState(false);
 const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
 const [sharedSyncStatus, setSharedSyncStatus] = useState<"idle" | "syncing" | "error">("idle");
 const [sharedSyncError, setSharedSyncError] = useState<string | null>(null);
 const [sharedSyncedAt, setSharedSyncedAt] = useState<string | null>(null);

 // API Keys Status
 const [apiKeys, setApiKeys] = useState<WorkspaceApiKey[]>([]);
 const [integrations, setIntegrations] = useState<WorkspaceIntegration[]>([]);
 const [isApiKeysLoading, setIsApiKeysLoading] = useState(false);
 const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false);
 const [showRotateKeyDialog, setShowRotateKeyDialog] = useState(false);
 const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
 const [newKeyProvider, setNewKeyProvider] = useState("openai");
 const [newKeyName, setNewKeyName] = useState("");
 const [newKeyValue, setNewKeyValue] = useState("");
 const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read", "write"]);
 const [showKeyValue, setShowKeyValue] = useState(false);
 const [isCreatingKey, setIsCreatingKey] = useState(false);
 const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
 const [showWebhookDialog, setShowWebhookDialog] = useState(false);
 const [webhookName, setWebhookName] = useState("");
 const [webhookUrl, setWebhookUrl] = useState("");
 const [webhookSecret, setWebhookSecret] = useState("");
 const [webhookEvents, setWebhookEvents] = useState<string[]>(["execution.completed"]);
 const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);

 // from URL FetchCurrent tab
 useEffect(() => {
 const searchParams = new URLSearchParams(window.location.search);
 const tab = searchParams.get("tab") || "general";
 setActiveTab(tab);
 }, []);

 // LoadData
 useEffect(() => {
 loadData();
 }, [workspaceId]);

 useEffect(() => {
 if (activeTab !== "archives") return;
 loadArchives();
 loadCloudReplayConfig();
 loadSharedTemplates();
 }, [activeTab, workspaceId]);

 useEffect(() => {
 if (activeTab !== "api-keys") return;
 loadApiKeys();
 loadIntegrations();
 }, [activeTab, workspaceId]);

 useEffect(() => {
 if (!selectedArchive) return;
 if (selectedArchive.archive_type === "audit_logs") {
 setReplayDataset("audit_logs");
 } else if (replayDataset === "audit_logs") {
 setReplayDataset("node_logs");
 }
 setReplayRecords([]);
 setReplayNextOffset(null);
 setReplayOffset(0);
 }, [selectedArchive?.id]);

 useEffect(() => {
 if (replayDataset === "audit_logs") {
 setReplayExecutionId("");
 setReplayWorkflowId("");
 setReplayUserId("");
 setReplayNodeId("");
 setReplayNodeType("");
 setReplayStatus("");
 return;
 }
 if (replayDataset === "executions") {
 setReplayAction("");
 setReplayActor("");
 setReplayTargetType("");
 setReplayTargetId("");
 setReplayNodeId("");
 setReplayNodeType("");
 return;
 }
 if (replayDataset === "node_logs") {
 setReplayAction("");
 setReplayActor("");
 setReplayTargetType("");
 setReplayTargetId("");
 setReplayWorkflowId("");
 setReplayUserId("");
 }
 }, [replayDataset]);

 const parseThresholdInput = (value: string) => {
 return value
 .split(",")
 .map((item) => item.trim())
 .filter(Boolean)
 .map((item) => {
 const parsed = Number(item);
 if (Number.isNaN(parsed)) return null;
 const normalized = parsed > 1 ? parsed / 100 : parsed;
 return Math.min(Math.max(normalized, 0), 1);
 })
 .filter((item): item is number => item !== null);
 };

 const syncBudgetForm = (settings: BudgetSettings) => {
 setBudgetForm({
 monthlyBudget: settings.monthly_budget > 0 ? String(settings.monthly_budget) : "",
 thresholds: settings.thresholds?.length ? settings.thresholds.map((t) => String(Math.round(t * 100))).join(", ")
 : "50, 80, 100",
 spendLimit: settings.spend_limit > 0 ? String(settings.spend_limit) : "",
 spendLimitEnabled: settings.spend_limit_enabled,
 currency: settings.currency || "",
 });
 };

 const loadData = async () => {
 try {
 setIsLoading(true);
 const [ws, memberList] = await Promise.all([
 workspaceApi.get(workspaceId),
 workspaceApi.getMembers(workspaceId),
 ]);
 setWorkspace(ws);
 setMembers(memberList);
 setEditForm({ name: ws.name, slug: ws.slug });

 // TryLoadQuota(cancanFailed)
 try {
 const q = await workspaceApi.getQuota(workspaceId);
 setQuota(q);
 } catch {
 // Quota API may not be implemented yet
 }

 try {
 const settings = await billingApi.getBudgetSettings(workspaceId);
 setBudget(settings);
 syncBudgetForm(settings);
 } catch {
 // Budget API may not be implemented yet or insufficient permissions
 }
 } catch (error) {
 console.error("Failed to load workspace:", error);
 } finally {
 setIsLoading(false);
 }
 };

 // Load API Keys
 const loadApiKeys = async () => {
 try {
 setIsApiKeysLoading(true);
 const keys = await workspaceApi.listApiKeys(workspaceId);
 setApiKeys(keys);
 } catch (error) {
 console.error("Failed to load API keys:", error);
 } finally {
 setIsApiKeysLoading(false);
 }
 };

 // LoadIntegration
 const loadIntegrations = async () => {
 try {
 const items = await workspaceApi.listIntegrations(workspaceId);
 setIntegrations(items);
 } catch (error) {
 console.error("Failed to load integrations:", error);
 }
 };

 // Create API Key
 const handleCreateApiKey = async () => {
 if (!newKeyName.trim() || !newKeyValue.trim()) return;
 try {
 setIsCreatingKey(true);
 await workspaceApi.createApiKey(workspaceId, {
 provider: newKeyProvider,
 name: newKeyName.trim(),
 key: newKeyValue.trim(),
 scopes: newKeyScopes,
 });
 setShowCreateKeyDialog(false);
 setNewKeyName("");
 setNewKeyValue("");
 setNewKeyScopes(["read", "write"]);
 loadApiKeys();
 } catch (error) {
 console.error("Failed to create API key:", error);
 } finally {
 setIsCreatingKey(false);
 }
 };

 // Rotation API Key
 const handleRotateApiKey = async () => {
 if (!selectedKeyId || !newKeyValue.trim()) return;
 try {
 setIsCreatingKey(true);
 await workspaceApi.rotateApiKey(workspaceId, selectedKeyId, {
 key: newKeyValue.trim(),
 scopes: newKeyScopes,
 });
 setShowRotateKeyDialog(false);
 setSelectedKeyId(null);
 setNewKeyValue("");
 loadApiKeys();
 } catch (error) {
 console.error("Failed to rotate API key:", error);
 } finally {
 setIsCreatingKey(false);
 }
 };

 // Disable API Key
 const handleRevokeApiKey = async (keyId: string) => {
 try {
 await workspaceApi.revokeApiKey(workspaceId, keyId, "Manually disabled by user");
 loadApiKeys();
 } catch (error) {
 console.error("Failed to revoke API key:", error);
 }
 };

 // Delete API Key
 const handleDeleteApiKey = async (keyId: string) => {
 try {
 await workspaceApi.deleteApiKey(workspaceId, keyId);
 loadApiKeys();
 } catch (error) {
 console.error("Failed to delete API key:", error);
 }
 };

 // CopyKeyPreview
 const handleCopyKeyPreview = async (key: WorkspaceApiKey) => {
 const preview = key.key_preview || "••••••••";
 try {
 await navigator.clipboard.writeText(preview);
 setCopiedKeyId(key.id);
 setTimeout(() => setCopiedKeyId(null), 2000);
 } catch (error) {
 console.error("Failed to copy:", error);
 }
 };

 // Create Webhook
 const handleCreateWebhook = async () => {
 if (!webhookName.trim() || !webhookUrl.trim()) return;
 try {
 setIsCreatingWebhook(true);
 await workspaceApi.createWebhook(workspaceId, {
 name: webhookName.trim(),
 config: {
 url: webhookUrl.trim(),
 secret: webhookSecret.trim() || undefined,
 events: webhookEvents,
 is_active: true,
 },
 });
 setShowWebhookDialog(false);
 setWebhookName("");
 setWebhookUrl("");
 setWebhookSecret("");
 setWebhookEvents(["execution.completed"]);
 loadIntegrations();
 } catch (error) {
 console.error("Failed to create webhook:", error);
 } finally {
 setIsCreatingWebhook(false);
 }
 };

 // DeleteIntegration
 const handleDeleteIntegration = async (integrationId: string) => {
 try {
 await workspaceApi.deleteIntegration(workspaceId, integrationId);
 loadIntegrations();
 } catch (error) {
 console.error("Failed to delete integration:", error);
 }
 };

 const loadArchives = async () => {
 try {
 setIsArchiveLoading(true);
 setArchiveError(null);
 const items = await workspaceApi.listLogArchives(workspaceId);
 setArchives(items);
 if (items.length > 0 && !selectedArchiveId) {
 setSelectedArchiveId(items[0].id);
 }
 } catch (error) {
 setArchiveError("Failed to load log archives. Please try again.");
 console.error("Failed to load log archives:", error);
 } finally {
 setIsArchiveLoading(false);
 }
 };

 const toISO = (value: string) => {
 if (!value) return undefined;
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return undefined;
 return parsed.toISOString();
 };

 const toLocalInputValue = (date: Date) => {
 const pad = (value: number) => String(value).padStart(2, "0");
 return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
 };

 const applyArchivePreset = (days: number) => {
 const end = new Date();
 end.setHours(0, 0, 0, 0);
 const start = new Date(end);
 start.setDate(start.getDate() - days);
 setArchiveRangeStart(toLocalInputValue(start));
 setArchiveRangeEnd(toLocalInputValue(end));
 };

 const formatDateTime = (value?: string) => {
 if (!value) return "—";
 const parsed = new Date(value);
 if (Number.isNaN(parsed.getTime())) return value;
 return parsed.toLocaleString();
 };

 const formatFileSize = (size?: number) => {
 if (!size) return "—";
 if (size < 1024) return `${size} B`;
 if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
 if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
 return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
 };

 const getTemplatesForDataset = (dataset: string) => {
 const systemTemplates = replayColumnTemplates[dataset] || [];
 const customTemplates = customTemplatesByDataset[dataset] || [];
 const sharedTemplates = sharedTemplatesByDataset[dataset] || [];
 const customWithFlag = customTemplates.map((item) => ({ ...item, isCustom: true, source: "personal" as const }));
 const sharedWithFlag = sharedTemplates.map((item) => ({ ...item, isCustom: true, source: "shared" as const }));
 return [...systemTemplates, ...customWithFlag, ...sharedWithFlag];
 };

 const getDefaultColumns = (dataset: string) => {
 const templates = getTemplatesForDataset(dataset);
 if (templates.length > 0) {
 return templates[0].columns;
 }
 return (replayFieldMappings[dataset] || []).map((mapping) => mapping.field);
 };

 const normalizeColumns = (dataset: string, columns: string[]) => {
 const order = (replayFieldMappings[dataset] || []).map((mapping) => mapping.field);
 const orderSet = new Set(order);
 const normalized = order.filter((field) => columns.includes(field));
 columns.forEach((field) => {
 if (!orderSet.has(field)) {
 normalized.push(field);
 }
 });
 return normalized;
 };

 const resolveTemplateId = (dataset: string, columns: string[]) => {
 const templates = getTemplatesForDataset(dataset);
 for (const template of templates) {
 if (template.columns.length !== columns.length) {
 continue;
 }
 if (template.columns.every((field, index) => field === columns[index])) {
 return template.id;
 }
 }
 return "custom";
 };

 const storageKey = (dataset: string, suffix: string) =>
 `log-archive:${workspaceId}:${dataset}:${suffix}`;

 const replayConfigKey = "ui.log_archive.replay_config";
 const sharedTemplatesKey = "ui.log_archive.replay_templates.shared";

 const sanitizeTemplateList = (dataset: string, templates: ReplayColumnTemplate[]) =>
 templates
 .filter((item) => item && typeof item.id === "string" && typeof item.label === "string")
 .map((item) => ({
 id: item.id,
 label: item.label,
 columns: normalizeColumns(
 dataset,
 Array.isArray(item.columns) ? item.columns.filter((value: unknown) => typeof value === "string") : []
 ),
 isCustom: true,
 source: item.source,
 }))
 .filter((item) => item.columns.length > 0);

 useEffect(() => {
 if (typeof window === "undefined" || !workspaceId) return;
 const datasets = Object.keys(replayFieldMappings);
 const nextColumns: Record<string, string[]> = {};
 const nextTemplates: Record<string, string> = {};
 const nextExportAll: Record<string, boolean> = {};
 const nextCustomTemplates: Record<string, ReplayColumnTemplate[]> = {};
 const nextSharedTemplates: Record<string, ReplayColumnTemplate[]> = {};
 datasets.forEach((dataset) => {
 const rawColumns = window.localStorage.getItem(storageKey(dataset, "columns"));
 if (rawColumns) {
 try {
 const parsed = JSON.parse(rawColumns);
 if (Array.isArray(parsed)) {
 const normalized = normalizeColumns(dataset, parsed.filter((value) => typeof value === "string"));
 if (normalized.length > 0) {
 nextColumns[dataset] = normalized;
 }
 }
 } catch {
 // ignore invalid storage
 }
 }
 const templateId = window.localStorage.getItem(storageKey(dataset, "template"));
 if (templateId) {
 nextTemplates[dataset] = templateId;
 }
 const exportAll = window.localStorage.getItem(storageKey(dataset, "export_all"));
 if (exportAll === "true") {
 nextExportAll[dataset] = true;
 }
 const rawTemplates = window.localStorage.getItem(storageKey(dataset, "custom_templates"));
 if (rawTemplates) {
 try {
 const parsed = JSON.parse(rawTemplates);
 if (Array.isArray(parsed)) {
 const sanitized = parsed
 .filter((item) => item && typeof item.id === "string" && typeof item.label === "string")
 .map((item) => ({
 id: item.id,
 label: item.label,
 columns: normalizeColumns(
 dataset,
 Array.isArray(item.columns) ? item.columns.filter((value: unknown) => typeof value === "string") : []
 ),
 isCustom: true,
 source: "personal" as const,
 }))
 .filter((item) => item.columns.length > 0);
 if (sanitized.length > 0) {
 nextCustomTemplates[dataset] = sanitized;
 }
 }
 } catch {
 // ignore invalid storage
 }
 }
 const rawShared = window.localStorage.getItem(storageKey(dataset, "shared_templates"));
 if (rawShared) {
 try {
 const parsed = JSON.parse(rawShared);
 if (Array.isArray(parsed)) {
 const sanitized = parsed
 .filter((item) => item && typeof item.id === "string" && typeof item.label === "string")
 .map((item) => ({
 id: item.id,
 label: item.label,
 columns: normalizeColumns(
 dataset,
 Array.isArray(item.columns) ? item.columns.filter((value: unknown) => typeof value === "string") : []
 ),
 isCustom: true,
 source: "shared" as const,
 }))
 .filter((item) => item.columns.length > 0);
 if (sanitized.length > 0) {
 nextSharedTemplates[dataset] = sanitized;
 }
 }
 } catch {
 // ignore invalid storage
 }
 }
 });
 if (Object.keys(nextColumns).length > 0) {
 setVisibleColumnsByDataset((prev) => ({ ...prev, ...nextColumns }));
 }
 if (Object.keys(nextTemplates).length > 0) {
 setColumnTemplateByDataset((prev) => ({ ...prev, ...nextTemplates }));
 }
 if (Object.keys(nextExportAll).length > 0) {
 setExportAllFieldsByDataset((prev) => ({ ...prev, ...nextExportAll }));
 }
 if (Object.keys(nextCustomTemplates).length > 0) {
 setCustomTemplatesByDataset((prev) => ({ ...prev, ...nextCustomTemplates }));
 }
 if (Object.keys(nextSharedTemplates).length > 0) {
 setSharedTemplatesByDataset((prev) => ({ ...prev, ...nextSharedTemplates }));
 }
 }, [workspaceId]);

 const applyCloudReplayConfig = (config: CloudReplayConfig) => {
 if (!config) return;
 const datasets = Object.keys(replayFieldMappings);
 const nextColumns: Record<string, string[]> = {};
 const nextTemplates: Record<string, string> = {};
 const nextExportAll: Record<string, boolean> = {};
 const nextCustomTemplates: Record<string, ReplayColumnTemplate[]> = {};

 datasets.forEach((dataset) => {
 const columns = config.columnsByDataset?.[dataset];
 if (Array.isArray(columns)) {
 const normalized = normalizeColumns(dataset, columns.filter((value) => typeof value === "string"));
 if (normalized.length > 0) {
 nextColumns[dataset] = normalized;
 if (typeof window !== "undefined") {
 window.localStorage.setItem(storageKey(dataset, "columns"), JSON.stringify(normalized));
 }
 }
 }
 const templateId = config.templateByDataset?.[dataset];
 if (templateId && typeof templateId === "string") {
 nextTemplates[dataset] = templateId;
 if (typeof window !== "undefined") {
 window.localStorage.setItem(storageKey(dataset, "template"), templateId);
 }
 }
 const exportAll = config.exportAllByDataset?.[dataset];
 if (typeof exportAll === "boolean") {
 nextExportAll[dataset] = exportAll;
 if (typeof window !== "undefined") {
 window.localStorage.setItem(storageKey(dataset, "export_all"), String(exportAll));
 }
 }
 const templates = config.customTemplatesByDataset?.[dataset];
 if (Array.isArray(templates)) {
 const sanitized = sanitizeTemplateList(dataset, templates).map((item) => ({
 ...item,
 source: "personal" as const,
 }));
 if (sanitized.length > 0) {
 nextCustomTemplates[dataset] = sanitized;
 if (typeof window !== "undefined") {
 window.localStorage.setItem(storageKey(dataset, "custom_templates"), JSON.stringify(sanitized));
 }
 }
 }
 });

 if (Object.keys(nextColumns).length > 0) {
 setVisibleColumnsByDataset((prev) => ({ ...prev, ...nextColumns }));
 }
 if (Object.keys(nextTemplates).length > 0) {
 setColumnTemplateByDataset((prev) => ({ ...prev, ...nextTemplates }));
 }
 if (Object.keys(nextExportAll).length > 0) {
 setExportAllFieldsByDataset((prev) => ({ ...prev, ...nextExportAll }));
 }
 if (Object.keys(nextCustomTemplates).length > 0) {
 setCustomTemplatesByDataset((prev) => ({ ...prev, ...nextCustomTemplates }));
 }
 };

 const loadCloudReplayConfig = async () => {
 setCloudSyncStatus("syncing");
 setCloudSyncError(null);
 try {
 const items = await configApi.list({
 scope_type: "user",
 key: replayConfigKey,
 });
 const item = items[0];
 if (item?.value) {
 const parsed = JSON.parse(item.value) as CloudReplayConfig;
 applyCloudReplayConfig(parsed);
 setLastSyncedAt(new Date().toISOString());
 }
 setCloudSyncStatus("idle");
 } catch (error) {
 setCloudSyncStatus("error");
 setCloudSyncError("Failed to load cloud config");
 console.error("Failed to load cloud replay config:", error);
 } finally {
 setCloudSyncReady(true);
 }
 };

 const loadSharedTemplates = async () => {
 setSharedSyncStatus("syncing");
 setSharedSyncError(null);
 try {
 const items = await configApi.list({
 scope_type: "workspace",
 scope_id: workspaceId,
 key: sharedTemplatesKey,
 });
 const item = items[0];
 if (item?.value) {
 const parsed = JSON.parse(item.value) as WorkspaceReplayTemplates;
 const nextShared: Record<string, ReplayColumnTemplate[]> = {};
 Object.keys(parsed?.templatesByDataset || {}).forEach((dataset) => {
 const templates = parsed.templatesByDataset?.[dataset];
 if (Array.isArray(templates)) {
 const sanitized = sanitizeTemplateList(dataset, templates).map((template) => ({
 ...template,
 source: "shared" as const,
 }));
 if (sanitized.length > 0) {
 nextShared[dataset] = sanitized;
 if (typeof window !== "undefined") {
 window.localStorage.setItem(storageKey(dataset, "shared_templates"), JSON.stringify(sanitized));
 }
 }
 }
 });
 if (Object.keys(nextShared).length > 0) {
 setSharedTemplatesByDataset(nextShared);
 }
 setSharedSyncedAt(new Date().toISOString());
 }
 setSharedSyncStatus("idle");
 } catch (error) {
 setSharedSyncStatus("error");
 setSharedSyncError("Failed to load team templates");
 console.error("Failed to load shared templates:", error);
 }
 };

 const buildCloudReplayConfig = () => {
 const datasets = Object.keys(replayFieldMappings);
 const columnsByDataset: Record<string, string[]> = {};
 const templateByDataset: Record<string, string> = {};
 const exportAllByDataset: Record<string, boolean> = {};
 const customTemplates: Record<string, ReplayColumnTemplate[]> = {};

 datasets.forEach((dataset) => {
 const columns = visibleColumnsByDataset[dataset] || getDefaultColumns(dataset);
 columnsByDataset[dataset] = normalizeColumns(dataset, columns);
 const resolvedTemplate =
 columnTemplateByDataset[dataset] || resolveTemplateId(dataset, columnsByDataset[dataset]);
 if (resolvedTemplate) {
 templateByDataset[dataset] = resolvedTemplate;
 }
 if (typeof exportAllFieldsByDataset[dataset] === "boolean") {
 exportAllByDataset[dataset] = exportAllFieldsByDataset[dataset];
 }
 const templates = customTemplatesByDataset[dataset];
 if (templates?.length) {
 customTemplates[dataset] = sanitizeTemplateList(dataset, templates);
 }
 });

 const payload: CloudReplayConfig = {
 version: 1,
 columnsByDataset,
 templateByDataset,
 exportAllByDataset,
 customTemplatesByDataset: customTemplates,
 };
 return payload;
 };

 const saveSharedTemplates = async (templatesByDataset: Record<string, ReplayColumnTemplate[]>) => {
 setSharedSyncStatus("syncing");
 setSharedSyncError(null);
 try {
 const payload: WorkspaceReplayTemplates = {
 version: 1,
 templatesByDataset,
 };
 await configApi.upsert({
 scope_type: "workspace",
 scope_id: workspaceId,
 key: sharedTemplatesKey,
 value: JSON.stringify(payload),
 value_type: "json",
 description: "Log archive replay shared templates",
 });
 setSharedSyncStatus("idle");
 setSharedSyncedAt(new Date().toISOString());
 } catch (error) {
 setSharedSyncStatus("error");
 setSharedSyncError("Failed to sync team templates");
 console.error("Failed to save shared templates:", error);
 }
 };

 const syncCloudReplayConfig = async () => {
 if (!cloudSyncReady || cloudSyncStatus === "syncing") return;
 setCloudSyncStatus("syncing");
 setCloudSyncError(null);
 try {
 const payload = buildCloudReplayConfig();
 await configApi.upsert({
 scope_type: "user",
 key: replayConfigKey,
 value: JSON.stringify(payload),
 value_type: "json",
 description: "Log archive replay config and templates",
 });
 setCloudSyncStatus("idle");
 setLastSyncedAt(new Date().toISOString());
 } catch (error) {
 setCloudSyncStatus("error");
 setCloudSyncError("Cloud sync failed");
 console.error("Failed to sync cloud replay config:", error);
 }
 };

 useEffect(() => {
 if (!cloudSyncReady) return;
 const timeout = window.setTimeout(() => {
 void syncCloudReplayConfig();
 }, 800);
 return () => window.clearTimeout(timeout);
 }, [
 cloudSyncReady,
 visibleColumnsByDataset,
 columnTemplateByDataset,
 exportAllFieldsByDataset,
 customTemplatesByDataset,
 ]);

 const handleArchiveRequest = async () => {
 try {
 setIsArchiveCreating(true);
 setArchiveError(null);
 await workspaceApi.requestLogArchive(workspaceId, {
 archive_type: archiveType,
 range_start: toISO(archiveRangeStart),
 range_end: toISO(archiveRangeEnd),
 });
 await loadArchives();
 } catch (error) {
 setArchiveError("Failed to create archive task. Please check the parameters and try again.");
 console.error("Failed to request log archive:", error);
 } finally {
 setIsArchiveCreating(false);
 }
 };

 const handleArchiveDownload = async (job: LogArchiveJob) => {
 if (!job) return;
 try {
 const blob = await workspaceApi.downloadLogArchive(workspaceId, job.id);
 const url = window.URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.href = url;
 link.download = job.file_name || `log-archive-${job.id}.zip`;
 document.body.appendChild(link);
 link.click();
 link.remove();
 window.URL.revokeObjectURL(url);
 } catch (error) {
 setArchiveError("Failed to download archive. Please try again.");
 console.error("Failed to download log archive:", error);
 }
 };

 const handleArchiveDelete = async (job: LogArchiveJob) => {
 if (!job) return;
 try {
 setArchiveError(null);
 await workspaceApi.deleteLogArchive(workspaceId, job.id);
 const next = archives.filter((item) => item.id !== job.id);
 setArchives(next);
 if (selectedArchiveId === job.id) {
 setSelectedArchiveId(next[0]?.id ?? null);
 setReplayRecords([]);
 setReplayNextOffset(null);
 }
 } catch (error) {
 setArchiveError("Failed to delete archive. Please try again.");
 console.error("Failed to delete log archive:", error);
 }
 };

 const handleReplay = async (resetOffset = true) => {
 if (!selectedArchiveId) return;
 try {
 setIsReplayLoading(true);
 setReplayError(null);
 const nextOffset = resetOffset ? replayOffset : (replayNextOffset ?? replayOffset);
 const result = await workspaceApi.replayLogArchive(workspaceId, selectedArchiveId, {
 dataset: replayDataset,
 from: toISO(replayFrom),
 to: toISO(replayTo),
 limit: replayLimit,
 offset: nextOffset,
 execution_id: replayExecutionId.trim() || undefined,
 workflow_id: replayWorkflowId.trim() || undefined,
 user_id: replayUserId.trim() || undefined,
 node_id: replayNodeId.trim() || undefined,
 node_type: replayNodeType.trim() || undefined,
 status: replayStatus.trim() || undefined,
 action: replayAction.trim() || undefined,
 actor_user_id: replayActor.trim() || undefined,
 target_type: replayTargetType.trim() || undefined,
 target_id: replayTargetId.trim() || undefined,
 });
 if (resetOffset) {
 setReplayRecords(result.records || []);
 } else {
 setReplayRecords((prev) => [...prev, ...(result.records || [])]);
 }
 if (typeof result.next_offset === "number") {
 setReplayNextOffset(result.next_offset);
 if (!resetOffset) {
 setReplayOffset(result.next_offset);
 }
 } else {
 setReplayNextOffset(null);
 }
 } catch (error) {
 setReplayError("Archive replay failed. Please check the filter conditions and try again.");
 console.error("Failed to replay log archive:", error);
 } finally {
 setIsReplayLoading(false);
 }
 };

 const selectedArchive = archives.find((item) => item.id === selectedArchiveId) || null;
 const isAuditArchive = selectedArchive?.archive_type === "audit_logs";
 const replayDatasetOptions = isAuditArchive
 ? [{ value: "audit_logs", label: "Audit Log" }]
 : [
 { value: "node_logs", label: "Node Logs" },
 { value: "executions", label: "Execution Records" },
 ];
 const isAuditDataset = replayDataset === "audit_logs";
 const isExecutionDataset = replayDataset === "executions";
 const isNodeDataset = replayDataset === "node_logs";
 const currentFieldMappings = replayFieldMappings[replayDataset] || [];
 const defaultColumnsForDataset = useMemo(() => getDefaultColumns(replayDataset), [replayDataset]);
 const visibleColumnIds = useMemo(() => {
 const stored = visibleColumnsByDataset[replayDataset];
 if (stored && stored.length > 0) {
 return stored;
 }
 return defaultColumnsForDataset;
 }, [replayDataset, visibleColumnsByDataset, defaultColumnsForDataset]);

 useEffect(() => {
 if (visibleColumnsByDataset[replayDataset]?.length) {
 return;
 }
 if (defaultColumnsForDataset.length === 0) {
 return;
 }
 setVisibleColumnsByDataset((prev) => ({
 ...prev,
 [replayDataset]: defaultColumnsForDataset,
 }));
 setColumnTemplateByDataset((prev) => ({
 ...prev,
 [replayDataset]: "default",
 }));
 }, [replayDataset, defaultColumnsForDataset, visibleColumnsByDataset]);

 const replayRows = useMemo<ReplayRow[]>(() => {
 const toString = (value: unknown) => {
 if (value === null || value === undefined) return "";
 if (typeof value === "string") return value;
 if (typeof value === "number" || typeof value === "boolean") return String(value);
 return "";
 };
 const toNumber = (value: unknown) => {
 if (typeof value === "number") return value;
 if (typeof value === "string") {
 const parsed = Number(value);
 return Number.isNaN(parsed) ? undefined : parsed;
 }
 return undefined;
 };

 return replayRecords.map((record, index) => {
 if (isAuditDataset) {
 return {
 id: toString(record.id) || `audit-${index}`,
 created_at: toString(record.created_at),
 action: toString(record.action),
 actor_user_id: toString(record.actor_user_id),
 target_type: toString(record.target_type),
 target_id: toString(record.target_id),
 };
 }
 if (isExecutionDataset) {
 return {
 id: toString(record.id) || `execution-${index}`,
 execution_id: toString(record.id),
 created_at: toString(record.created_at),
 workflow_id: toString(record.workflow_id),
 user_id: toString(record.user_id),
 status: toString(record.status),
 duration_ms: toNumber(record.duration_ms),
 error_message: toString(record.error_message),
 };
 }
 return {
 id: toString(record.id) || `node-${index}`,
 execution_id: toString(record.execution_id),
 created_at: toString(record.created_at),
 node_id: toString(record.node_id),
 node_type: toString(record.node_type),
 status: toString(record.status),
 duration_ms: toNumber(record.duration_ms),
 error_message: toString(record.error_message),
 };
 });
 }, [replayRecords, replayDataset, isAuditDataset, isExecutionDataset, isNodeDataset]);

 const replayColumns = useMemo<Column<ReplayRow>[]>(() => {
 const renderStatus = (value?: string) => {
 if (!value) return "—";
 const normalized = value.toLowerCase();
 const color =
 normalized.includes("fail") || normalized.includes("error")
 ? "bg-destructive-200 text-destructive"
 : normalized.includes("success") || normalized.includes("completed")
 ? "bg-brand-200 text-brand-500"
 : "bg-surface-200 text-foreground-light";
 return (
 <Badge variant="secondary" className={cn("text-[10px]", color)}>
 {value}
 </Badge>
 );
 };
 const renderMono = (value?: string) => (
 <span className="font-mono text-[11px] text-foreground-light">{value || "—"}</span>
 );
 const renderText = (value?: string) => (
 <span className="max-w-[220px] truncate inline-block">{value || "—"}</span>
 );

 if (isAuditDataset) {
 return [
 {
 id: "created_at",
 header: "Time",
 accessor: "created_at",
 sortable: true,
 cell: (value) => formatDateTime(String(value)),
 },
 { id: "action", header: "Action", accessor: "action", sortable: true, cell: (value) => renderText(String(value || "")) },
 {
 id: "actor_user_id",
 header: "Actor",
 accessor: "actor_user_id",
 cell: (value) => renderMono(String(value || "")),
 },
 { id: "target_type", header: "Target Type", accessor: "target_type", sortable: true, cell: (value) => renderText(String(value || "")) },
 { id: "target_id", header: "Target ID", accessor: "target_id", cell: (value) => renderMono(String(value || "")) },
 ];
 }
 if (isExecutionDataset) {
 return [
 {
 id: "created_at",
 header: "Time",
 accessor: "created_at",
 sortable: true,
 cell: (value) => formatDateTime(String(value)),
 },
 { id: "execution_id", header: "Execute ID", accessor: "execution_id", cell: (value) => renderMono(String(value || "")) },
 { id: "workflow_id", header: "Workflow", accessor: "workflow_id", sortable: true, cell: (value) => renderMono(String(value || "")) },
 { id: "user_id", header: "User", accessor: "user_id", sortable: true, cell: (value) => renderMono(String(value || "")) },
 { id: "status", header: "Status", accessor: "status", sortable: true, cell: (value) => renderStatus(String(value || "")) },
 {
 id: "duration_ms",
 header: "Duration",
 accessor: "duration_ms",
 sortable: true,
 cell: (value) => (value ? `${value} ms` : "—"),
 },
 {
 id: "error_message",
 header: "Error Info",
 accessor: "error_message",
 cell: (value) => renderText(String(value || "")),
 },
 ];
 }
 return [
 {
 id: "created_at",
 header: "Time",
 accessor: "created_at",
 sortable: true,
 cell: (value) => formatDateTime(String(value)),
 },
 { id: "execution_id", header: "Execute ID", accessor: "execution_id", cell: (value) => renderMono(String(value || "")) },
 { id: "node_id", header: "Node ID", accessor: "node_id", sortable: true, cell: (value) => renderMono(String(value || "")) },
 { id: "node_type", header: "Node Type", accessor: "node_type", sortable: true, cell: (value) => renderText(String(value || "")) },
 { id: "status", header: "Status", accessor: "status", sortable: true, cell: (value) => renderStatus(String(value || "")) },
 {
 id: "duration_ms",
 header: "Duration",
 accessor: "duration_ms",
 sortable: true,
 cell: (value) => (value ? `${value} ms` : "—"),
 },
 {
 id: "error_message",
 header: "Error Info",
 accessor: "error_message",
 cell: (value) => renderText(String(value || "")),
 },
 ];
 }, [isAuditDataset, isExecutionDataset]);

 const visibleReplayColumns = useMemo(
 () => replayColumns.filter((column) => visibleColumnIds.includes(column.id)),
 [replayColumns, visibleColumnIds]
 );

 const currentTemplateId = useMemo(() => {
 const stored = columnTemplateByDataset[replayDataset];
 if (stored) return stored;
 return resolveTemplateId(replayDataset, visibleColumnIds);
 }, [columnTemplateByDataset, replayDataset, visibleColumnIds]);

 const exportAllFields = exportAllFieldsByDataset[replayDataset] ?? false;
 const customTemplatesForDataset = useMemo(
 () => customTemplatesByDataset[replayDataset] || [],
 [customTemplatesByDataset, replayDataset]
 );
 const sharedTemplatesForDataset = useMemo(
 () => sharedTemplatesByDataset[replayDataset] || [],
 [sharedTemplatesByDataset, replayDataset]
 );

 const toggleVisibleColumn = (field: string) => {
 setVisibleColumnsByDataset((prev) => {
 const current = new Set(prev[replayDataset] || defaultColumnsForDataset);
 if (current.has(field)) {
 if (current.size <= 1) {
 return prev;
 }
 current.delete(field);
 } else {
 current.add(field);
 }
 const nextColumns = normalizeColumns(replayDataset, Array.from(current));
 const templateId = resolveTemplateId(replayDataset, nextColumns);
 if (typeof window !== "undefined") {
 window.localStorage.setItem(storageKey(replayDataset, "columns"), JSON.stringify(nextColumns));
 window.localStorage.setItem(storageKey(replayDataset, "template"), templateId);
 }
 setColumnTemplateByDataset((templatePrev) => ({
 ...templatePrev,
 [replayDataset]: templateId,
 }));
 return {
 ...prev,
 [replayDataset]: nextColumns,
 };
 });
 };

 const resetVisibleColumns = () => {
 const nextColumns = normalizeColumns(replayDataset, defaultColumnsForDataset);
 if (typeof window !== "undefined") {
 window.localStorage.setItem(storageKey(replayDataset, "columns"), JSON.stringify(nextColumns));
 window.localStorage.setItem(storageKey(replayDataset, "template"), "default");
 }
 setColumnTemplateByDataset((prev) => ({
 ...prev,
 [replayDataset]: "default",
 }));
 setVisibleColumnsByDataset((prev) => ({
 ...prev,
 [replayDataset]: nextColumns,
 }));
 };

 const applyTemplate = (templateId: string) => {
 const template = getTemplatesForDataset(replayDataset).find((item) => item.id === templateId);
 if (!template) return;
 const nextColumns = normalizeColumns(replayDataset, template.columns);
 if (typeof window !== "undefined") {
 window.localStorage.setItem(storageKey(replayDataset, "columns"), JSON.stringify(nextColumns));
 window.localStorage.setItem(storageKey(replayDataset, "template"), template.id);
 }
 setColumnTemplateByDataset((prev) => ({
 ...prev,
 [replayDataset]: template.id,
 }));
 setVisibleColumnsByDataset((prev) => ({
 ...prev,
 [replayDataset]: nextColumns,
 }));
 };

 const toggleExportAllFields = () => {
 setExportAllFieldsByDataset((prev) => {
 const nextValue = !(prev[replayDataset] ?? false);
 if (typeof window !== "undefined") {
 window.localStorage.setItem(storageKey(replayDataset, "export_all"), String(nextValue));
 }
 return {
 ...prev,
 [replayDataset]: nextValue,
 };
 });
 };

 const persistCustomTemplates = (dataset: string, templates: ReplayColumnTemplate[]) => {
 if (typeof window === "undefined") return;
 window.localStorage.setItem(storageKey(dataset, "custom_templates"), JSON.stringify(templates));
 };

 const handleSaveCustomTemplate = () => {
 const name = newTemplateName.trim();
 if (!name) {
 setTemplateError("Template name cannot be empty");
 return;
 }
 setTemplateError(null);
 const id = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
 const template: ReplayColumnTemplate = {
 id,
 label: name,
 columns: normalizeColumns(replayDataset, visibleColumnIds),
 isCustom: true,
 source: "personal",
 };
 const nextTemplates = [...customTemplatesForDataset, template];
 setCustomTemplatesByDataset((prev) => ({
 ...prev,
 [replayDataset]: nextTemplates,
 }));
 persistCustomTemplates(replayDataset, nextTemplates);
 if (typeof window !== "undefined") {
 window.localStorage.setItem(storageKey(replayDataset, "template"), template.id);
 }
 setColumnTemplateByDataset((prev) => ({
 ...prev,
 [replayDataset]: template.id,
 }));
 setShowSaveTemplateDialog(false);
 setNewTemplateName("");
 };

 const handleShareTemplate = async (template: ReplayColumnTemplate) => {
 if (!template) return;
 const sharedTemplate: ReplayColumnTemplate = {
 id: `shared-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
 label: template.label,
 columns: normalizeColumns(replayDataset, template.columns),
 isCustom: true,
 source: "shared",
 };
 const nextShared = [...sharedTemplatesForDataset, sharedTemplate];
 setSharedTemplatesByDataset((prev) => ({
 ...prev,
 [replayDataset]: nextShared,
 }));
 if (typeof window !== "undefined") {
 window.localStorage.setItem(storageKey(replayDataset, "shared_templates"), JSON.stringify(nextShared));
 }
 await saveSharedTemplates({
 ...sharedTemplatesByDataset,
 [replayDataset]: nextShared,
 });
 };

 const handleStartRenameTemplate = (template: ReplayColumnTemplate, scope: "personal" | "shared") => {
 setEditingTemplateId(template.id);
 setEditingTemplateName(template.label);
 setEditingTemplateScope(scope);
 setTemplateError(null);
 };

 const handleSaveRenameTemplate = async (scope?: "personal" | "shared") => {
 if (!editingTemplateId) return;
 const targetScope = scope || editingTemplateScope;
 if (!targetScope) return;
 const name = editingTemplateName.trim();
 if (!name) {
 setTemplateError("Template name cannot be empty");
 return;
 }
 if (targetScope === "shared") {
 const nextTemplates = sharedTemplatesForDataset.map((item) =>
 item.id === editingTemplateId ? { ...item, label: name } : item
 );
 setSharedTemplatesByDataset((prev) => ({
 ...prev,
 [replayDataset]: nextTemplates,
 }));
 if (typeof window !== "undefined") {
 window.localStorage.setItem(storageKey(replayDataset, "shared_templates"), JSON.stringify(nextTemplates));
 }
 await saveSharedTemplates({
 ...sharedTemplatesByDataset,
 [replayDataset]: nextTemplates,
 });
 } else {
 const nextTemplates = customTemplatesForDataset.map((item) =>
 item.id === editingTemplateId ? { ...item, label: name } : item
 );
 setCustomTemplatesByDataset((prev) => ({
 ...prev,
 [replayDataset]: nextTemplates,
 }));
 persistCustomTemplates(replayDataset, nextTemplates);
 }
 setEditingTemplateId(null);
 setEditingTemplateScope(null);
 setEditingTemplateName("");
 setTemplateError(null);
 };

 const handleDeleteTemplate = async (templateId: string, scope: "personal" | "shared") => {
 if (scope === "shared") {
 const nextTemplates = sharedTemplatesForDataset.filter((item) => item.id !== templateId);
 setSharedTemplatesByDataset((prev) => ({
 ...prev,
 [replayDataset]: nextTemplates,
 }));
 if (typeof window !== "undefined") {
 window.localStorage.setItem(storageKey(replayDataset, "shared_templates"), JSON.stringify(nextTemplates));
 }
 await saveSharedTemplates({
 ...sharedTemplatesByDataset,
 [replayDataset]: nextTemplates,
 });
 } else {
 const nextTemplates = customTemplatesForDataset.filter((item) => item.id !== templateId);
 setCustomTemplatesByDataset((prev) => ({
 ...prev,
 [replayDataset]: nextTemplates,
 }));
 persistCustomTemplates(replayDataset, nextTemplates);
 }
 if (columnTemplateByDataset[replayDataset] === templateId) {
 resetVisibleColumns();
 }
 };

 const handleExportCSV = () => {
 if (replayRows.length === 0) return;
 const baseColumns = currentFieldMappings;
 const columns = exportAllFields
 ? [
 ...baseColumns,
 ...Array.from(
 replayRecords.reduce((set, record) => {
 Object.keys(record).forEach((key) => {
 if (!baseColumns.some((item) => item.field === key)) {
 set.add(key);
 }
 });
 return set;
 }, new Set<string>())
 )
 .sort()
 .map((field) => ({ label: field, field })),
 ]
 : baseColumns.filter((mapping) => visibleColumnIds.includes(mapping.field));
 if (columns.length === 0) return;
 const escapeCSV = (value: unknown) => {
 let text = "";
 if (value === null || value === undefined) {
 text = "";
 } else if (typeof value === "object") {
 text = JSON.stringify(value);
 } else {
 text = String(value);
 }
 const needsQuotes = /[",\n]/.test(text);
 const escaped = text.replace(/"/g, '""');
 return needsQuotes ? `"${escaped}"` : escaped;
 };
 const header = columns.map((col) => escapeCSV(col.label)).join(",");
 const rowsSource = exportAllFields ? replayRecords : replayRows;
 const lines = rowsSource.map((row) =>
 columns.map((col) => escapeCSV((row as Record<string, unknown>)[col.field])).join(",")
 );
 const csv = [header, ...lines].join("\n");
 const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
 const url = window.URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.href = url;
 link.download = `log-replay-${replayDataset}-${selectedArchiveId || "archive"}.csv`;
 document.body.appendChild(link);
 link.click();
 link.remove();
 window.URL.revokeObjectURL(url);
 };

 // Save current settings
 const handleSave = async () => {
 if (!workspace) return;

 try {
 setIsSaving(true);
 await workspaceApi.update(workspaceId, {
 name: editForm.name,
 slug: editForm.slug,
 });
 setWorkspace({ ...workspace, name: editForm.name, slug: editForm.slug });
 } catch (error) {
 console.error("Failed to save:", error);
 } finally {
 setIsSaving(false);
 }
 };

 const handleBudgetSave = async () => {
 if (!workspace) return;
 try {
 setIsBudgetSaving(true);
 const thresholds = parseThresholdInput(budgetForm.thresholds);
 const payload = {
 monthly_budget: budgetForm.monthlyBudget ? Number(budgetForm.monthlyBudget) : 0,
 thresholds,
 spend_limit: budgetForm.spendLimit ? Number(budgetForm.spendLimit) : 0,
 spend_limit_enabled: budgetForm.spendLimitEnabled,
 };
 const updated = await billingApi.updateBudgetSettings(workspaceId, payload);
 setBudget(updated);
 syncBudgetForm(updated);
 } catch (error) {
 console.error("Failed to update budget:", error);
 } finally {
 setIsBudgetSaving(false);
 }
 };

 // InviteMember
 const handleInvite = async () => {
 if (!inviteEmail) return;

 try {
 setIsInviting(true);
 await workspaceApi.inviteMember(workspaceId, {
 email: inviteEmail,
 role: inviteRole,
 });
 setShowInviteDialog(false);
 setInviteEmail("");
 setInviteRole("member");
 loadData(); // RefreshMemberList
 } catch (error) {
 console.error("Failed to invite:", error);
 } finally {
 setIsInviting(false);
 }
 };

 // FetchRoleConfig
 const getRoleConfig = (roleId: string) => {
 return roles.find((r) => r.id === roleId) || roles[2];
 };

 if (isLoading) {
 return (
 <PageContainer>
 <div className="flex items-center justify-center py-16">
 <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
 </div>
 </PageContainer>
 );
 }

 if (!workspace) {
 return (
 <PageContainer>
 <div className="text-center py-16">
 <p className="text-foreground-muted">Workspace does not exist</p>
 </div>
 </PageContainer>
 );
 }

 return (
 <PageWithSidebar
 sidebarWidth="narrow"
 sidebarTitle="Workspace Settings"
 sidebar={<SettingsNav workspaceId={workspaceId} activeTab={activeTab} />}
 >
 <PageContainer>
 {/* PageHeader */}
 <PageHeader
 title={workspace.name}
 eyebrow="Workspace Settings"
 backHref="/dashboard/apps"
 backLabel="Back to Apps"
 />

 {/* Current Settings */}
 {activeTab === "general" && (
 <div className="space-y-6">
 <SettingsSection
 title="Basic Info"
 description="Workspace name and identifier"
 footer={
 <Button onClick={handleSave} disabled={isSaving}>
 {isSaving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
 Save Changes
 </Button>
 }
 >
 <FormRow
 label="Workspace Name"
 description="Name used for display"
 >
 <Input
 value={editForm.name}
 onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
 className="max-w-md h-9 bg-surface-75 border-border focus:border-brand-500"
 />
 </FormRow>

 <FormRow
 label="URL Identifier"
 description="A unique identifier used in access URLs"
 >
 <div className="flex items-center gap-2 max-w-md">
 <span className="text-[12px] text-foreground-muted shrink-0">
 agentflow.app/
 </span>
 <Input
 value={editForm.slug}
 onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
 className="h-9 bg-surface-75 border-border focus:border-brand-500"
 />
 </div>
 </FormRow>
 </SettingsSection>

 {/* DangerRegion */}
 <SettingsSection
 title="Danger Zone"
 description="These actions are irreversible. Please proceed with caution."
 >
 <div className="flex items-center justify-between py-4">
 <div>
 <div className="text-[12px] font-medium text-foreground">Delete Workspace</div>
 <div className="text-[12px] text-foreground-light mt-0.5">
 Once deleted, all apps and data cannot be restored
 </div>
 </div>
 <Button variant="destructive" size="sm">
 <Trash2 className="w-4 h-4 mr-1.5" />
 Delete Workspace
 </Button>
 </div>
 </SettingsSection>
 </div>
 )}

 {/* MemberManage */}
 {activeTab === "members" && (
 <div className="space-y-6">
 <SettingsSection
 title="Team Members"
 description="Manage workspace members and permissions"
 >
 {/* Toolbar */}
 <div className="flex items-center justify-between mb-4">
 <div className="text-[12px] text-foreground-light">
 {members.length} {members.length === 1 ? "Member" : "Members"}
 </div>
 <PermissionGate permissions={permissions} required={["members_manage"]}>
 <Button size="sm" onClick={() => setShowInviteDialog(true)}>
 <UserPlus className="w-4 h-4 mr-1.5" />
 InviteMember
 </Button>
 </PermissionGate>
 </div>

 {/* MemberList */}
 <div className="space-y-2">
 {members.map((member) => {
 const role = getRoleConfig(member.role_name);
 const RoleIcon = role.icon;
 return (
 <div
 key={member.id}
 className="flex items-center justify-between p-3 rounded-md bg-surface-75 hover:bg-surface-100 transition-colors"
 >
 <div className="flex items-center gap-3">
 <Avatar className="w-9 h-9">
 <AvatarImage src={member.user?.avatar} />
 <AvatarFallback className="bg-brand-200 text-brand-500 text-[12px]">
 {member.user?.username?.slice(0, 2) || "??"}
 </AvatarFallback>
 </Avatar>
 <div>
 <p className="text-[12px] font-medium text-foreground">
 {member.user?.username || "Unknown User"}
 </p>
 <p className="text-[11px] text-foreground-muted">
 {member.user?.email || ""}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <Badge
 variant="secondary"
 className={cn("gap-1", role.bgColor, role.color)}
 >
 <RoleIcon className="w-3 h-3" />
 {role.name}
 </Badge>

 <PermissionGate permissions={permissions} required={["members_manage"]}>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon" className="h-8 w-8">
 <MoreHorizontal className="w-4 h-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-40 bg-surface-100 border-border">
 <DropdownMenuItem className="text-[12px]">
 <UserCog className="w-4 h-4 mr-2" />
 Change Role
 </DropdownMenuItem>
 <DropdownMenuSeparator className="bg-border" />
 {member.role_name !== "owner" && (
 <DropdownMenuItem className="text-[12px] text-destructive">
 <Trash2 className="w-4 h-4 mr-2" />
 Remove Member
 </DropdownMenuItem>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 </PermissionGate>
 </div>
 </div>
 );
 })}
 </div>
 </SettingsSection>

 {/* RoleDescription */}
 <SettingsSection
 title="Role & Permission Overview"
 description="Different roles have different action permissions"
 >
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {roles.map((role) => {
 const RoleIcon = role.icon;
 return (
 <div key={role.id} className="p-4 rounded-md bg-surface-75">
 <div className="flex items-center gap-2 mb-2">
 <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", role.bgColor)}>
 <RoleIcon className={cn("w-4 h-4", role.color)} />
 </div>
 <span className={cn("text-[12px] font-medium", role.color)}>
 {role.name}
 </span>
 </div>
 <p className="text-[11px] text-foreground-muted">{role.description}</p>
 </div>
 );
 })}
 </div>
 </SettingsSection>
 </div>
 )}

 {/* API KeyandIntegration */}
 {activeTab === "api-keys" && (
 <div className="space-y-6">
 {/* API Key ListTable */}
 <SettingsSection
 title="API Key"
 description="Manage API keys used for AI model calls and workflow execution"
 actions={
 <Button
 size="sm"
 onClick={() => setShowCreateKeyDialog(true)}
 leftIcon={<Plus className="w-4 h-4" />}
 >
 Add Key
 </Button>
 }
 >
 {isApiKeysLoading ? (
 <div className="flex items-center justify-center py-12">
 <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
 </div>
 ) : apiKeys.length === 0 ? (
 <EmptyState
 icon={<Key className="w-8 h-8" />}
 title="No API Keys"
 description="Add an API key to enable AI model calls"
 action={
 <Button
 size="sm"
 onClick={() => setShowCreateKeyDialog(true)}
 leftIcon={<Plus className="w-4 h-4" />}
 >
 Add Key
 </Button>
 }
 />
 ) : (
 <div className="divide-y divide-border">
 {apiKeys.map((key) => (
 <div
 key={key.id}
 className={cn(
 "flex items-center justify-between p-4",
 !key.is_active && "opacity-50"
 )}
 >
 <div className="flex items-center gap-4">
 <div className={cn(
 "w-10 h-10 rounded-md flex items-center justify-center",
 key.is_active ? "bg-brand-200" : "bg-surface-200"
 )}>
 <Key className={cn(
 "w-5 h-5",
 key.is_active ? "text-brand-500" : "text-foreground-muted"
 )} />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-foreground">
 {key.name}
 </span>
 <Badge variant={key.is_active ? "primary" : "secondary"} size="xs">
 {key.is_active ? "Active": "Disabled"}
 </Badge>
 <Badge variant="outline" size="xs">
 {key.provider}
 </Badge>
 </div>
 <div className="flex items-center gap-4 mt-1 text-xs text-foreground-muted">
 <span className="font-mono">{key.key_preview || "••••••••"}</span>
 <span>Scopes: {key.scopes?.join(", ") || "All"}</span>
 <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
 {key.last_used_at && (
 <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
 )}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Button
 variant="ghost"
 size="icon-sm"
 onClick={() => handleCopyKeyPreview(key)}
 >
 {copiedKeyId === key.id ? (
 <Check className="w-4 h-4 text-brand-500" />
 ) : (
 <Copy className="w-4 h-4" />
 )}
 </Button>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon-sm">
 <MoreHorizontal className="w-4 h-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem
 onClick={() => {
 setSelectedKeyId(key.id);
 setShowRotateKeyDialog(true);
 }}
 >
 <RefreshCw className="w-4 h-4 mr-2" />
 Rotate Key
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 {key.is_active ? (
 <DropdownMenuItem
 onClick={() => handleRevokeApiKey(key.id)}
 className="text-warning"
 >
 <Lock className="w-4 h-4 mr-2" />
 Disable
 </DropdownMenuItem>
 ) : (
 <DropdownMenuItem
 onClick={() => handleDeleteApiKey(key.id)}
 className="text-destructive"
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Delete
 </DropdownMenuItem>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 ))}
 </div>
 )}
 </SettingsSection>

 {/* IntegrationConfigblock */}
 <SettingsSection
 title="Integrations & Connections"
 description="Configure webhooks, OAuth authorization, and third-party service connections"
 >
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {/* Webhook Card */}
 <div className="p-4 rounded-md border border-border bg-surface-75 hover:border-border-strong transition-colors">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-10 h-10 rounded-md bg-brand-200 flex items-center justify-center">
 <Webhook className="w-5 h-5 text-brand-500" />
 </div>
 <div>
 <h4 className="text-sm font-medium text-foreground">Webhook</h4>
 <p className="text-xs text-foreground-muted">Event push notifications</p>
 </div>
 </div>
 <p className="text-xs text-foreground-muted mb-3">
 Push workflow events to external URLs for automated integrations
 </p>
 <div className="flex items-center justify-between">
 <Badge variant="secondary" size="xs">
 {integrations.filter(i => i.type === "webhook").length} configured
 </Badge>
 <Button
 variant="outline"
 size="xs"
 onClick={() => setShowWebhookDialog(true)}
 >
 Config
 </Button>
 </div>
 </div>

 {/* OAuth Card */}
 <div className="p-4 rounded-md border border-border bg-surface-75 hover:border-border-strong transition-colors">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-10 h-10 rounded-md bg-warning-200 flex items-center justify-center">
 <Shield className="w-5 h-5 text-warning" />
 </div>
 <div>
 <h4 className="text-sm font-medium text-foreground">OAuth Authorize</h4>
 <p className="text-xs text-foreground-muted">Third-party account connections</p>
 </div>
 </div>
 <p className="text-xs text-foreground-muted mb-3">
 Authorize access to Google, GitHub, Slack, and other services
 </p>
 <div className="flex items-center justify-between">
 <Badge variant="secondary" size="xs">
 {integrations.filter(i => i.type === "oauth").length} Connected
 </Badge>
 <Button variant="outline" size="xs">
 Manage
 </Button>
 </div>
 </div>

 {/* ConnectCard */}
 <div className="p-4 rounded-md border border-border bg-surface-75 hover:border-border-strong transition-colors">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-10 h-10 rounded-md bg-surface-200 flex items-center justify-center">
 <Link2 className="w-5 h-5 text-foreground-muted" />
 </div>
 <div>
 <h4 className="text-sm font-medium text-foreground">Third-Party Connectors</h4>
 <p className="text-xs text-foreground-muted">Data & service connections</p>
 </div>
 </div>
 <p className="text-xs text-foreground-muted mb-3">
 Connect databases, API endpoints, and external services
 </p>
 <div className="flex items-center justify-between">
 <Badge variant="secondary" size="xs">
 {integrations.filter(i => i.type === "connector").length} configured
 </Badge>
 <Button variant="outline" size="xs">
 Browse
 </Button>
 </div>
 </div>
 </div>

 {/* Configured Integrations List */}
 {integrations.length > 0 && (
 <div className="mt-6">
 <h4 className="text-sm font-medium text-foreground mb-3">Configured Integrations</h4>
 <div className="divide-y divide-border rounded-md border border-border">
 {integrations.map((integration) => {
 const statusConfig = {
 connected: { icon: CheckCircle2, color: "text-brand-500", label: "Connected" },
 disconnected: { icon: XCircle, color: "text-foreground-muted", label: "Disconnected" },
 error: { icon: AlertCircle, color: "text-destructive", label: "Error" },
 pending: { icon: Clock, color: "text-warning", label: "Pending" },
 }[integration.status] || { icon: Activity, color: "text-foreground-muted", label: "Unknown" };
 const StatusIcon = statusConfig.icon;

 return (
 <div
 key={integration.id}
 className="flex items-center justify-between p-4"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
 {integration.type === "webhook" && <Webhook className="w-4 h-4 text-foreground-muted" />}
 {integration.type === "oauth" && <Shield className="w-4 h-4 text-foreground-muted" />}
 {integration.type === "connector" && <Link2 className="w-4 h-4 text-foreground-muted" />}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-foreground">
 {integration.name}
 </span>
 <Badge variant="outline" size="xs">
 {integration.provider}
 </Badge>
 </div>
 <div className="flex items-center gap-2 mt-0.5">
 <StatusIcon className={cn("w-3 h-3", statusConfig.color)} />
 <span className={cn("text-xs", statusConfig.color)}>
 {statusConfig.label}
 </span>
 {integration.last_sync_at && (
 <span className="text-xs text-foreground-muted">
 · Last synced {new Date(integration.last_sync_at).toLocaleString()}
 </span>
 )}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="ghost" size="icon-sm">
 <Settings className="w-4 h-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon-sm"
 onClick={() => handleDeleteIntegration(integration.id)}
 >
 <Trash2 className="w-4 h-4 text-destructive" />
 </Button>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}
 </SettingsSection>

 {/* PermissionDescription */}
 <SettingsSection
 title="Permissions & Security"
 description="Security best practices for API keys and integrations"
 >
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-4 rounded-md bg-surface-75">
 <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
 <Shield className="w-4 h-4 text-brand-500" />
 Key Security
 </h4>
 <ul className="space-y-2 text-xs text-foreground-muted">
 <li className="flex items-start gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
 All keys are stored with AES-256 encryption
 </li>
 <li className="flex items-start gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
 Rotate keys periodically to reduce risk
 </li>
 <li className="flex items-start gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
 Use minimum permissions when setting scopes
 </li>
 </ul>
 </div>
 <div className="p-4 rounded-md bg-surface-75">
 <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
 <Activity className="w-4 h-4 text-warning" />
 Monitoring Tips
 </h4>
 <ul className="space-y-2 text-xs text-foreground-muted">
 <li className="flex items-start gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
 Monitor key usage rates and unusual API calls
 </li>
 <li className="flex items-start gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
 Set up webhook failure alerts
 </li>
 <li className="flex items-start gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
 Audit logs record all key-related actions
 </li>
 </ul>
 </div>
 </div>
 </SettingsSection>
 </div>
 )}

 {/* Create API Key Dialog */}
 <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
 <DialogContent className="sm:max-w-[480px]">
 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-violet-500 to-indigo-500 rounded-t-lg" />
 <DialogHeader>
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-200 to-violet-200 border border-brand-300">
 <Key className="w-6 h-6 text-brand-500" />
 </div>
 <div>
 <DialogTitle>Add API Key</DialogTitle>
 <DialogDescription className="flex items-center gap-1.5 mt-0.5">
 <Shield className="w-3 h-3" />
 Keys are stored with AES-256 encryption
 </DialogDescription>
 </div>
 </div>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <FormRow label="Provider">
 <Select value={newKeyProvider} onValueChange={setNewKeyProvider}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="openai">🤖 OpenAI</SelectItem>
 <SelectItem value="anthropic">🧠 Anthropic</SelectItem>
 <SelectItem value="google">🔮 Google AI</SelectItem>
 <SelectItem value="azure">☁️ Azure OpenAI</SelectItem>
 <SelectItem value="cohere">🌐 Cohere</SelectItem>
 <SelectItem value="huggingface">🤗 Hugging Face</SelectItem>
 <SelectItem value="ollama">🦙 Ollama</SelectItem>
 <SelectItem value="custom">⚙️ Custom</SelectItem>
 </SelectContent>
 </Select>
 </FormRow>
 <FormRow label="Key Name">
 <Input
 value={newKeyName}
 onChange={(e) => setNewKeyName(e.target.value)}
 placeholder="My API Key"
 />
 </FormRow>
 <FormRow label="API Key">
 <div className="relative">
 <Input
 type={showKeyValue ? "text" : "password"}
 value={newKeyValue}
 onChange={(e) => setNewKeyValue(e.target.value)}
 placeholder="sk-xxxxxxxxxxxxxxxx"
 className="pr-10 font-mono"
 />
 <Button
 type="button"
 variant="ghost"
 size="icon-sm"
 className="absolute right-2 top-1/2 -translate-y-1/2"
 onClick={() => setShowKeyValue(!showKeyValue)}
 >
 {showKeyValue ? (
 <EyeOff className="w-4 h-4" />
 ) : (
 <Eye className="w-4 h-4" />
 )}
 </Button>
 </div>
 </FormRow>
 <FormRow label="Permission Scopes">
 <div className="flex flex-wrap gap-2">
 {["read", "write", "execute", "admin"].map((scope) => (
 <Badge
 key={scope}
 variant={newKeyScopes.includes(scope) ? "primary" : "outline"}
 className="cursor-pointer"
 onClick={() => {
 setNewKeyScopes((prev) =>
 prev.includes(scope)
 ? prev.filter((s) => s !== scope)
 : [...prev, scope]
 );
 }}
 >
 {scope}
 </Badge>
 ))}
 </div>
 </FormRow>
 </div>
 <DialogFooter>
 <Button
 variant="outline"
 onClick={() => setShowCreateKeyDialog(false)}
 >
 Cancel
 </Button>
 <Button
 onClick={handleCreateApiKey}
 disabled={isCreatingKey || !newKeyName.trim() || !newKeyValue.trim()}
 >
 {isCreatingKey ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 Add...
 </>
 ) : (
 <>
 <Plus className="w-4 h-4 mr-2" />
 Add Key
 </>
 )}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Rotation API Key Dialog */}
 <Dialog open={showRotateKeyDialog} onOpenChange={setShowRotateKeyDialog}>
 <DialogContent className="sm:max-w-[480px]">
 <DialogHeader>
 <DialogTitle>Rotation API Key</DialogTitle>
 <DialogDescription>
 Enter the new key value. The old key will expire immediately.
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <FormRow label="New key">
 <div className="relative">
 <Input
 type={showKeyValue ? "text" : "password"}
 value={newKeyValue}
 onChange={(e) => setNewKeyValue(e.target.value)}
 placeholder="sk-xxxxxxxxxxxxxxxx"
 className="pr-10 font-mono"
 />
 <Button
 type="button"
 variant="ghost"
 size="icon-sm"
 className="absolute right-2 top-1/2 -translate-y-1/2"
 onClick={() => setShowKeyValue(!showKeyValue)}
 >
 {showKeyValue ? (
 <EyeOff className="w-4 h-4" />
 ) : (
 <Eye className="w-4 h-4" />
 )}
 </Button>
 </div>
 </FormRow>
 </div>
 <DialogFooter>
 <Button
 variant="outline"
 onClick={() => {
 setShowRotateKeyDialog(false);
 setSelectedKeyId(null);
 setNewKeyValue("");
 }}
 >
 Cancel
 </Button>
 <Button
 onClick={handleRotateApiKey}
 disabled={isCreatingKey || !newKeyValue.trim()}
 >
 {isCreatingKey ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 Rotation...
 </>
 ) : (
 <>
 <RefreshCw className="w-4 h-4 mr-2" />
 ConfirmRotation
 </>
 )}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Create Webhook Dialog */}
 <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
 <DialogContent className="sm:max-w-[520px]">
 <DialogHeader>
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-200 border border-brand-300">
 <Webhook className="w-6 h-6 text-brand-500" />
 </div>
 <div>
 <DialogTitle>Config Webhook</DialogTitle>
 <DialogDescription>
 Workflow events will be pushed to the specified URL
 </DialogDescription>
 </div>
 </div>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <FormRow label="Name">
 <Input
 value={webhookName}
 onChange={(e) => setWebhookName(e.target.value)}
 placeholder="My Webhook"
 />
 </FormRow>
 <FormRow label="URL">
 <Input
 value={webhookUrl}
 onChange={(e) => setWebhookUrl(e.target.value)}
 placeholder="https://example.com/webhook"
 />
 </FormRow>
 <FormRow label="Secret Key (Optional)">
 <Input
 type="password"
 value={webhookSecret}
 onChange={(e) => setWebhookSecret(e.target.value)}
 placeholder="Used to verify request identity"
 />
 </FormRow>
 <FormRow label="Subscribed Events">
 <div className="flex flex-wrap gap-2">
 {[
 "execution.completed",
 "execution.failed",
 "execution.started",
 "app.published",
 "domain.verified",
 ].map((event) => (
 <Badge
 key={event}
 variant={webhookEvents.includes(event) ? "primary" : "outline"}
 className="cursor-pointer"
 onClick={() => {
 setWebhookEvents((prev) =>
 prev.includes(event)
 ? prev.filter((e) => e !== event)
 : [...prev, event]
 );
 }}
 >
 {event}
 </Badge>
 ))}
 </div>
 </FormRow>
 </div>
 <DialogFooter>
 <Button
 variant="outline"
 onClick={() => setShowWebhookDialog(false)}
 >
 Cancel
 </Button>
 <Button
 onClick={handleCreateWebhook}
 disabled={isCreatingWebhook || !webhookName.trim() || !webhookUrl.trim()}
 >
 {isCreatingWebhook ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 Create...
 </>
 ) : (
 <>
 <Plus className="w-4 h-4 mr-2" />
 Create Webhook
 </>
 )}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* UsageandBilling */}
 {activeTab === "billing" && (
 <div className="space-y-6">
 {/* CurrentPlan */}
 <SettingsSection
 title="Current Plan"
 description="Workspace subscription plan and quota"
 >
 <div className="flex items-center justify-between p-4 rounded-md bg-surface-75">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-md bg-brand-200 flex items-center justify-center">
 <Crown className="w-6 h-6 text-brand-500" />
 </div>
 <div>
 <h3 className="text-[14px] font-semibold text-foreground">
 {workspace.plan === "free"
 ? "Free Plan"
 : workspace.plan === "pro"
 ? "Professional Plan"
: "Enterprise"}
 </h3>
 <p className="text-[12px] text-foreground-light">
 {workspace.plan === "free"
 ? "Up to 3 apps, basic features"
 : workspace.plan === "pro"
 ? "Up to 20 apps, advanced features"
: "Unlimited apps, all features"}
 </p>
 </div>
 </div>
 <PermissionGate permissions={permissions} required={["billing_manage"]}>
 <Button>Upgrade Plan</Button>
 </PermissionGate>
 </div>
 </SettingsSection>

 {/* UsageStatistics */}
 <SettingsSection
 title="Usage Statistics"
 description="Current month's resource usage"
 >
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 <UsageCard
 label="API Request"
 used={quota?.requests.used || 0}
 limit={quota?.requests.limit || 1000}
 icon={<Zap className="w-4 h-4" />}
 />
 <UsageCard
 label="Token Usage"
 used={quota?.tokens.used || 0}
 limit={quota?.tokens.limit || 100000}
 icon={<MessageSquare className="w-4 h-4" />}
 format="k"
 />
 <UsageCard
 label="App Count"
 used={quota?.apps.used || 0}
 limit={quota?.apps.limit || 3}
 icon={<Bot className="w-4 h-4" />}
 />
 <UsageCard
 label="Storage Space"
 used={quota?.storage.used || 0}
 limit={quota?.storage.limit || 1024}
 icon={<Key className="w-4 h-4" />}
 format="mb"
 />
 </div>
 </SettingsSection>

 {/* BudgetandReminder */}
 <SettingsSection
 title="Budget & Alerts"
 description="Set monthly budget, alert thresholds, and spending limits"
 >
 <PermissionGate
 permissions={permissions}
 required={["billing_manage"]}
 fallback={
 <div className="text-[12px] text-foreground-light">
 You do not have permission to manage budget settings.
 </div>
 }
 >
 <div className="space-y-4">
 <FormRow
 label="Monthly Budget"
 description="Exceeding the budget will trigger reminders and alerts"
 >
 <div className="flex items-center gap-3">
 <Input
 type="number"
 min={0}
 placeholder="e.g. 1000"
 value={budgetForm.monthlyBudget}
 onChange={(e) =>
 setBudgetForm({ ...budgetForm, monthlyBudget: e.target.value })
 }
 className="max-w-[220px]"
 />
 <span className="text-[12px] text-foreground-light">
 {budgetForm.currency || budget?.currency || "CNY"}
 </span>
 </div>
 </FormRow>

 <FormRow
 label="Alert Thresholds (%)"
 description="Comma-separated, e.g. 50, 80, 100"
 >
 <Input
 placeholder="50, 80, 100"
 value={budgetForm.thresholds}
 onChange={(e) =>
 setBudgetForm({ ...budgetForm, thresholds: e.target.value })
 }
 className="max-w-[320px]"
 />
 </FormRow>

 <FormRow
 label="Spending Limit"
 description="Prevent excess consumption when the limit is exceeded"
 >
 <div className="flex items-center gap-3">
 <Switch
 checked={budgetForm.spendLimitEnabled}
 onCheckedChange={(checked) =>
 setBudgetForm({ ...budgetForm, spendLimitEnabled: checked })
 }
 />
 <Input
 type="number"
 min={0}
 placeholder="e.g. 1200"
 value={budgetForm.spendLimit}
 onChange={(e) =>
 setBudgetForm({ ...budgetForm, spendLimit: e.target.value })
 }
 disabled={!budgetForm.spendLimitEnabled}
 className="max-w-[220px]"
 />
 <span className="text-[12px] text-foreground-light">
 {budgetForm.currency || budget?.currency || "CNY"}
 </span>
 </div>
 </FormRow>
 </div>

 <div className="flex justify-end mt-4">
 <Button onClick={handleBudgetSave} disabled={isBudgetSaving}>
 {isBudgetSaving ? "Saving..." : "Save Budget Settings"}
 </Button>
 </div>
 </PermissionGate>
 </SettingsSection>
 </div>
 )}

 {/* ArchiveReplay */}
 {activeTab === "archives" && (
 <PermissionGate
 permissions={permissions}
 required={["workspace_admin"]}
 fallback={(
 <SettingsSection
 title="Log Archives"
 description="This section is only accessible to admins"
 >
 <div className="text-[12px] text-foreground-light">
 You do not have permission to view log archives and replay content. Please contact a workspace admin.
 </div>
 </SettingsSection>
 )}
 >
 <div className="space-y-6">
 <SettingsSection
 title="Log Archives"
 description="Archive execution and audit logs for later replay and download"
 footer={(
 <Button onClick={handleArchiveRequest} disabled={isArchiveCreating}>
 {isArchiveCreating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
 Create Archive
 </Button>
 )}
 >
 <FormRow
 label="Archive Type"
 description="Select the type of log data to archive"
 >
 <Select value={archiveType} onValueChange={(value) => setArchiveType(value as LogArchiveType)}>
 <SelectTrigger className="h-9 bg-surface-75 border-border">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 {archiveTypeOptions.map((option) => (
 <SelectItem key={option.value} value={option.value}>
 <div className="flex flex-col">
 <span className="text-[12px] font-medium">{option.label}</span>
 <span className="text-[11px] text-foreground-muted">{option.description}</span>
 </div>
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </FormRow>

 <FormRow
 label="Archive Range"
 description="Optional. If empty, the system default archive window will be used"
 >
 <div className="space-y-2">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <Input
 type="datetime-local"
 value={archiveRangeStart}
 onChange={(e) => setArchiveRangeStart(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 <Input
 type="datetime-local"
 value={archiveRangeEnd}
 onChange={(e) => setArchiveRangeEnd(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <Button variant="outline" size="sm" onClick={() => applyArchivePreset(1)}>
 Recent 1 days
 </Button>
 <Button variant="outline" size="sm" onClick={() => applyArchivePreset(7)}>
 Recent 7 days
 </Button>
 <Button variant="outline" size="sm" onClick={() => applyArchivePreset(30)}>
 Recent 30 days
 </Button>
 </div>
 </div>
 </FormRow>
 {archiveError && (
 <div className="text-[12px] text-destructive">{archiveError}</div>
 )}
 </SettingsSection>

 <SettingsSection
 title="Archive Task List"
 description="Latest archive tasks, scopes, and download entries"
 >
 {isArchiveLoading ? (
 <div className="flex items-center justify-center py-8">
 <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
 </div>
 ) : archives.length === 0 ? (
 <EmptyState
 icon={<Archive className="w-5 h-5" />}
 title="No Archive Tasks"
 description="After creating an archive task, its status and download link will appear here."
 />
 ) : (
 <div className="space-y-2">
 {archives.map((job) => {
 const status = archiveStatusConfig[job.status] || archiveStatusConfig.pending;
 const StatusIcon = status.icon;
 const typeLabel = archiveTypeOptions.find((item) => item.value === job.archive_type)?.label || job.archive_type;
 const typeIcon = job.archive_type === "audit_logs" ? FileText : Database;
 const isSelected = selectedArchiveId === job.id;
 return (
 <div
 key={job.id}
 className={cn(
 "flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-md border bg-surface-75",
 isSelected ? "border-brand-500/60 bg-brand-200/10" : "border-border"
 )}
 >
 <div className="flex items-start gap-3">
 <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center text-foreground-muted">
 {React.createElement(typeIcon, { className: "w-4 h-4" })}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-[12px] font-medium text-foreground">{typeLabel}</span>
 <Badge variant="secondary" className={cn("text-[10px]", status.bg, status.color)}>
 <StatusIcon className="w-3 h-3 mr-1" />
 {status.label}
 </Badge>
 </div>
 <div className="text-[11px] text-foreground-muted mt-1">
 Range: {formatDateTime(job.range_start)} - {formatDateTime(job.range_end)}
 </div>
 <div className="text-[11px] text-foreground-muted">
 Create: {formatDateTime(job.created_at)} · Expired: {formatDateTime(job.expires_at)}
 </div>
 </div>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <span className="text-[11px] text-foreground-muted tabular-nums">
 {formatFileSize(job.file_size)}
 </span>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setSelectedArchiveId(job.id)}
 >
 <Play className="w-4 h-4 mr-1.5" />
 Replay
 </Button>
 {job.status === "completed" && (
 <Button variant="outline" size="sm" onClick={() => handleArchiveDownload(job)}>
 <Download className="w-4 h-4 mr-1.5" />
 Download
 </Button>
 )}
 <Button
 variant="ghost"
 size="sm"
 className="text-destructive hover:text-destructive"
 onClick={() => handleArchiveDelete(job)}
 >
 <Trash2 className="w-4 h-4 mr-1.5" />
 Delete
 </Button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </SettingsSection>

 <SettingsSection
 title="Archive Replay"
 description="Filter archive records and replay by condition"
 footer={(
 <div className="flex flex-wrap items-center gap-2">
 <Button variant="outline" onClick={() => handleReplay(true)} disabled={isReplayLoading || !selectedArchiveId}>
 {isReplayLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
 <Play className="w-4 h-4 mr-1.5" />
 QueryReplay
 </Button>
 {replayNextOffset !== null && (
 <Button variant="outline" onClick={() => handleReplay(false)} disabled={isReplayLoading}>
 <Filter className="w-4 h-4 mr-1.5" />
 Load more
 </Button>
 )}
 </div>
 )}
 >
 {!selectedArchive ? (
 <EmptyState
 icon={<Archive className="w-5 h-5" />}
 title="Please Select an Archive Task"
 description="Select an archive task from the list above to start replaying."
 />
 ) : (
 <div className="space-y-4">
 <div className="flex flex-wrap items-center gap-3 p-3 rounded-md bg-surface-75 border border-border">
 <div className="flex items-center gap-2 text-[12px] text-foreground-light">
 <Archive className="w-4 h-4" />
 CurrentArchive
 </div>
 <div className="text-[12px] text-foreground">
 {archiveTypeOptions.find((item) => item.value === selectedArchive.archive_type)?.label}
 </div>
 <Badge variant="secondary" className="text-[10px] bg-surface-200 text-foreground-light">
 {formatDateTime(selectedArchive.range_start)} - {formatDateTime(selectedArchive.range_end)}
 </Badge>
 </div>

 <FormRow
 label="Dataset"
 description="Select the archived dataset to replay"
 >
 <Select value={replayDataset} onValueChange={setReplayDataset}>
 <SelectTrigger className="h-9 bg-surface-75 border-border">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 {replayDatasetOptions.map((option) => (
 <SelectItem key={option.value} value={option.value}>
 {option.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </FormRow>

 <FormRow
 label="Template"
 description="Select a group or customize in the table"
 >
 <Select
 value={currentTemplateId}
 onValueChange={(value) => {
 if (value === "custom") return;
 applyTemplate(value);
 }}
 >
 <SelectTrigger className="h-9 bg-surface-75 border-border">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 {getTemplatesForDataset(replayDataset).map((template) => (
 <SelectItem key={template.id} value={template.id}>
 {template.source === "shared"
? `Team · ${template.label}`
   : template.source === "personal"
   ? `Personal · ${template.label}`
 : template.label}
 </SelectItem>
 ))}
 <SelectItem value="custom" disabled>
 Custom
 </SelectItem>
 </SelectContent>
 </Select>
 </FormRow>

 <div className="rounded-md border border-border bg-surface-75 p-3">
 <div className="flex items-center gap-2 text-[12px] text-foreground-light mb-2">
 <Database className="w-4 h-4" />
 FieldMapping
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
 {currentFieldMappings.map((mapping) => (
 <div
 key={mapping.field}
 className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-surface-100"
 >
 <span className="text-[11px] text-foreground-light">{mapping.label}</span>
 <Badge variant="secondary" className="text-[10px] bg-surface-200 text-foreground-light">
 {mapping.field}
 </Badge>
 </div>
 ))}
 </div>
 </div>

 <FormRow
 label="Time Filter"
 description="Optional: narrow down the replay time range"
 >
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <Input
 type="datetime-local"
 value={replayFrom}
 onChange={(e) => setReplayFrom(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 <Input
 type="datetime-local"
 value={replayTo}
 onChange={(e) => setReplayTo(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 </div>
 </FormRow>

 {isExecutionDataset && (
 <FormRow
 label="Execution Filter"
 description="Optional, filter by Execution / Workflow / User / Status"
 >
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <Input
 placeholder="execution_id"
 value={replayExecutionId}
 onChange={(e) => setReplayExecutionId(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 <Input
 placeholder="workflow_id"
 value={replayWorkflowId}
 onChange={(e) => setReplayWorkflowId(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 <Input
 placeholder="user_id"
 value={replayUserId}
 onChange={(e) => setReplayUserId(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 <Input
 placeholder="status"
 value={replayStatus}
 onChange={(e) => setReplayStatus(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 </div>
 </FormRow>
 )}

 {isNodeDataset && (
 <FormRow
 label="Node Filter"
 description="Optional, filter by Execution / Node / Status"
 >
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <Input
 placeholder="execution_id"
 value={replayExecutionId}
 onChange={(e) => setReplayExecutionId(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 <Input
 placeholder="node_id"
 value={replayNodeId}
 onChange={(e) => setReplayNodeId(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 <Input
 placeholder="node_type"
 value={replayNodeType}
 onChange={(e) => setReplayNodeType(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 <Input
 placeholder="status"
 value={replayStatus}
 onChange={(e) => setReplayStatus(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 </div>
 </FormRow>
 )}

 {isAuditDataset && (
 <FormRow
 label="Audit Filter"
 description="Optional, filter by Action / Actor / Target"
 >
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <Input
 placeholder="action"
 value={replayAction}
 onChange={(e) => setReplayAction(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 <Input
 placeholder="actor_user_id"
 value={replayActor}
 onChange={(e) => setReplayActor(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 <Input
 placeholder="target_type"
 value={replayTargetType}
 onChange={(e) => setReplayTargetType(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 <Input
 placeholder="target_id"
 value={replayTargetId}
 onChange={(e) => setReplayTargetId(e.target.value)}
 className="h-9 bg-surface-75 border-border"
 />
 </div>
 </FormRow>
 )}

 <FormRow
 label="Replay Pagination"
 description="Control replay count and offset"
 >
 <div className="grid grid-cols-2 gap-3">
 <Input
 type="number"
 min={1}
 value={replayLimit}
 onChange={(e) => setReplayLimit(Number(e.target.value))}
 className="h-9 bg-surface-75 border-border"
 />
 <Input
 type="number"
 min={0}
 value={replayOffset}
 onChange={(e) => setReplayOffset(Number(e.target.value))}
 className="h-9 bg-surface-75 border-border"
 />
 </div>
 </FormRow>

 {replayError && (
 <div className="text-[12px] text-destructive">{replayError}</div>
 )}

 <div className="space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex flex-col gap-1">
 <div className="text-[12px] text-foreground-light">Sync result</div>
 <div className="text-[11px] text-foreground-muted">
 {cloudSyncStatus === "syncing" && "Syncing to cloud..."}
 {cloudSyncStatus === "error" && (cloudSyncError || "Cloud sync failed")}
 {cloudSyncStatus === "idle" && lastSyncedAt && `Synced ${formatDateTime(lastSyncedAt)}`}
 {cloudSyncStatus === "idle" && !lastSyncedAt && "Not synced to cloud yet"}
 </div>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="outline" size="sm">
 <SlidersHorizontal className="w-4 h-4 mr-1.5" />
 Config
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-56 bg-surface-100 border-border">
 {currentFieldMappings.map((mapping) => (
 <DropdownMenuCheckboxItem
 key={mapping.field}
 checked={visibleColumnIds.includes(mapping.field)}
 onCheckedChange={() => toggleVisibleColumn(mapping.field)}
 >
 {mapping.label}
 </DropdownMenuCheckboxItem>
 ))}
 <DropdownMenuSeparator className="bg-border" />
 <DropdownMenuCheckboxItem
 checked={exportAllFields}
 onCheckedChange={toggleExportAllFields}
 >
 Export all fields
 </DropdownMenuCheckboxItem>
 <DropdownMenuSeparator className="bg-border" />
 <DropdownMenuItem
 onSelect={(event) => {
 event.preventDefault();
 resetVisibleColumns();
 }}
 className="text-[12px]"
 >
 Restore Default
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 <Button variant="outline" size="sm" onClick={() => setShowSaveTemplateDialog(true)}>
 Save Template
 </Button>
 <Button variant="outline" size="sm" onClick={() => setShowManageTemplatesDialog(true)}>
 Manage Templates
 </Button>
 <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={replayRows.length === 0}>
 <Download className="w-4 h-4 mr-1.5" />
 Export CSV
 </Button>
 <Button
 variant={replayView === "table" ? "default" : "outline"}
 size="sm"
 onClick={() => setReplayView("table")}
 >
 Table View
 </Button>
 <Button
 variant={replayView === "json" ? "default" : "outline"}
 size="sm"
 onClick={() => setReplayView("json")}
 >
 Original JSON
 </Button>
 </div>
 </div>
 {isReplayLoading ? (
 <div className="flex items-center justify-center py-6">
 <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
 </div>
 ) : replayRecords.length === 0 ? (
 <EmptyState
 icon={<FileText className="w-5 h-5" />}
 title="No Replay Results"
 description="Please adjust filter conditions and click Query Replay."
 />
 ) : replayView === "table" ? (
 <DataTable
 data={replayRows}
 columns={visibleReplayColumns}
 searchable
 searchKeys={visibleReplayColumns.map((column) => column.id as keyofReplayRow)}
 paginated
 pageSize={10}
 emptyMessage="No replay results"
 />
 ) : (
 replayRecords.map((record, idx) => (
 <div
 key={`${selectedArchive.id}-${idx}`}
 className="rounded-md border border-border bg-surface-75 p-3"
 >
 <div className="flex items-center justify-between text-[11px] text-foreground-muted mb-2">
 <span>Record {idx + 1}</span>
 <span className="tabular-nums">
 {formatDateTime(String(record.created_at || ""))}
 </span>
 </div>
 <pre className="text-[11px] leading-relaxed text-foreground-light whitespace-pre-wrap wrap-break-word max-h-60 overflow-auto">
 {JSON.stringify(record, null, 2)}
 </pre>
 </div>
 ))
 )}
 </div>
 </div>
 )}
 </SettingsSection>
 </div>
 </PermissionGate>
 )}
 </PageContainer>

 <Dialog
 open={showSaveTemplateDialog}
 onOpenChange={(open) => {
 setShowSaveTemplateDialog(open);
 if (!open) {
 setNewTemplateName("");
 setTemplateError(null);
 }
 }}
 >
 <DialogContent className="sm:max-w-md bg-surface-100 border-border">
 <DialogHeader>
 <DialogTitle className="text-foreground">Save custom template</DialogTitle>
 <DialogDescription className="text-foreground-light">
 Current config will be saved as a template and synced to your account
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-3 py-2">
 <div>
 <label className="block text-[12px] font-medium text-foreground mb-2">
 Template Name
 </label>
 <Input
 value={newTemplateName}
 onChange={(e) => setNewTemplateName(e.target.value)}
 placeholder="e.g. Default template"
 className="h-9 bg-surface-75 border-border focus:border-brand-500"
 />
 </div>
 {templateError && <p className="text-[12px] text-destructive">{templateError}</p>}
 <div className="text-[11px] text-foreground-muted">
 Template will be saved to the cloud and kept on this device.
 </div>
 </div>
 <DialogFooter>
 <Button
 variant="outline"
 onClick={() => setShowSaveTemplateDialog(false)}
 className="border-border"
 >
 Cancel
 </Button>
 <Button onClick={handleSaveCustomTemplate}>Save template</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 <Dialog
 open={showManageTemplatesDialog}
 onOpenChange={(open) => {
 setShowManageTemplatesDialog(open);
 if (!open) {
 setEditingTemplateId(null);
 setEditingTemplateName("");
 setEditingTemplateScope(null);
 setTemplateError(null);
 }
 }}
 >
 <DialogContent className="sm:max-w-lg bg-surface-100 border-border">
 <DialogHeader>
 <DialogTitle className="text-foreground">Template management</DialogTitle>
 <DialogDescription className="text-foreground-light">
 Manage current dataset personal/team templates
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-3 py-2">
 <div className="text-[12px] text-foreground-muted">Personal template</div>
 {customTemplatesForDataset.length === 0 ? (
 <EmptyState
 icon={<Archive className="w-5 h-5" />}
 title="No Personal Templates"
 description="Save the current configuration to create a personal template."
 />
 ) : (
 customTemplatesForDataset.map((template) => (
 <div
 key={template.id}
 className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-75 px-3 py-2"
 >
 <div className="min-w-0">
 {editingTemplateId === template.id ? (
 <Input
 value={editingTemplateName}
 onChange={(e) => setEditingTemplateName(e.target.value)}
 className="h-8 bg-surface-100 border-border"
 />
 ) : (
 <>
 <div className="text-[12px] font-medium text-foreground truncate">
 {template.label}
 </div>
 <div className="text-[11px] text-foreground-muted">
 {template.columns.length} columns
 </div>
 </>
 )}
 </div>
 <div className="flex flex-wrap items-center gap-2">
 {editingTemplateId === template.id ? (
 <>
 <Button size="sm" onClick={() => handleSaveRenameTemplate("personal")}>
 Save
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 setEditingTemplateId(null);
 setEditingTemplateName("");
 setEditingTemplateScope(null);
 setTemplateError(null);
 }}
 >
 Cancel
 </Button>
 </>
 ) : (
 <>
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 applyTemplate(template.id);
 setShowManageTemplatesDialog(false);
 }}
 >
 App
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleStartRenameTemplate(template, "personal")}
 >
 Rename
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => void handleShareTemplate(template)}
 >
Share to team
</Button>
 <Button
 variant="ghost"
 size="sm"
 className="text-destructive hover:text-destructive"
 onClick={() => void handleDeleteTemplate(template.id, "personal")}
 >
 Delete
 </Button>
 </>
 )}
 </div>
 </div>
 ))
 )}

 <div className="text-[12px] text-foreground-muted pt-2">Team template</div>
 {sharedTemplatesForDataset.length === 0 ? (
 <EmptyState
 icon={<Archive className="w-5 h-5" />}
 title="No Team Templates"
 description="You can share a personal template with the team."
 />
 ) : (
 sharedTemplatesForDataset.map((template) => (
 <div
 key={template.id}
 className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-75 px-3 py-2"
 >
 <div className="min-w-0">
 {editingTemplateId === template.id ? (
 <Input
 value={editingTemplateName}
 onChange={(e) => setEditingTemplateName(e.target.value)}
 className="h-8 bg-surface-100 border-border"
 />
 ) : (
 <>
 <div className="text-[12px] font-medium text-foreground truncate">
 {template.label}
 </div>
 <div className="text-[11px] text-foreground-muted">
 {template.columns.length} columns
 </div>
 </>
 )}
 </div>
 <div className="flex flex-wrap items-center gap-2">
 {editingTemplateId === template.id ? (
 <>
 <Button size="sm" onClick={() => handleSaveRenameTemplate("shared")}>
 Save
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 setEditingTemplateId(null);
 setEditingTemplateName("");
 setEditingTemplateScope(null);
 setTemplateError(null);
 }}
 >
 Cancel
 </Button>
 </>
 ) : (
 <>
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 applyTemplate(template.id);
 setShowManageTemplatesDialog(false);
 }}
 >
 App
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleStartRenameTemplate(template, "shared")}
 >
 Rename
 </Button>
 <Button
 variant="ghost"
 size="sm"
 className="text-destructive hover:text-destructive"
 onClick={() => void handleDeleteTemplate(template.id, "shared")}
 >
 Delete
 </Button>
 </>
 )}
 </div>
 </div>
 ))
 )}
 {templateError && <p className="text-[12px] text-destructive">{templateError}</p>}
 {sharedSyncStatus === "error" && (
 <p className="text-[12px] text-destructive">{sharedSyncError || "Failed to sync team templates"}</p>
 )}
 {sharedSyncStatus === "syncing" && (
 <p className="text-[12px] text-foreground-muted">Syncing team templates…</p>
 )}
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setShowManageTemplatesDialog(false)}>
 Close
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* InviteMemberDialog */}
 <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
 <DialogContent className="sm:max-w-md bg-surface-100 border-border">
 <DialogHeader>
 <DialogTitle className="text-foreground">Invite member</DialogTitle>
 <DialogDescription className="text-foreground-light">
 SendInviteEmailtonewMember
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4 py-4">
 <div>
 <label className="block text-[12px] font-medium text-foreground mb-2">
 Email Address
 </label>
 <Input
 type="email"
 placeholder="Enter email address"
 value={inviteEmail}
 onChange={(e) => setInviteEmail(e.target.value)}
 className="h-9 bg-surface-75 border-border focus:border-brand-500"
 />
 </div>

 <div>
 <label className="block text-[12px] font-medium text-foreground mb-2">
 Role
 </label>
 <Select value={inviteRole} onValueChange={setInviteRole}>
 <SelectTrigger className="h-9 bg-surface-75 border-border">
 <SelectValue />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 {roles
 .filter((r) => r.id !== "owner")
 .map((role) => (
 <SelectItem key={role.id} value={role.id}>
 <span className="flex items-center gap-2">
 <role.icon className={cn("w-4 h-4", role.color)} />
 {role.name}
 </span>
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 <DialogFooter>
 <Button
 variant="outline"
 onClick={() => setShowInviteDialog(false)}
 className="border-border"
 >
 Cancel
 </Button>
 <Button onClick={handleInvite} disabled={!inviteEmail || isInviting}>
 {isInviting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
 <Send className="w-4 h-4 mr-1.5" />
 SendInvite
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </PageWithSidebar>
 );
}

// UsageCardComponent
function UsageCard({
 label,
 used,
 limit,
 icon,
 format,
}: {
 label: string;
 used: number;
 limit: number;
 icon: React.ReactNode;
 format?: "k" | "mb";
}) {
 const percent = limit > 0 ? (used / limit) * 100 : 0;
 const formatValue = (v: number) => {
 if (format === "k") return `${(v / 1000).toFixed(1)}K`;
 if (format === "mb") return `${v} MB`;
 return v.toLocaleString();
 };

 return (
 <div className="p-4 rounded-md bg-surface-75">
 <div className="flex items-center gap-2 mb-3">
 <div className="text-foreground-muted">{icon}</div>
 <span className="text-[11px] text-foreground-light">{label}</span>
 </div>
 <div className="text-lg font-semibold text-foreground mb-2">
 {formatValue(used)}
 <span className="text-[12px] font-normal text-foreground-muted">
 {""}
 / {formatValue(limit)}
 </span>
 </div>
 <div className="h-1.5 rounded-full bg-surface-200 overflow-hidden">
 <div
 className={cn(
 "h-full rounded-full transition-all",
 percent > 80 ? "bg-destructive" : percent > 50 ? "bg-warning" : "bg-brand-500"
 )}
 style={{ width: `${Math.min(percent, 100)}%` }}
 />
 </div>
 </div>
 );
}
