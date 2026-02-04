"use client";

/**
 * Workspace 设置页 - Supabase 风格
 * 成员管理、基本设置、计费信息
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

// 角色配置
const roles = [
  {
    id: "owner",
    name: "所有者",
    description: "完全控制权限，可以管理团队设置和账单",
    color: "text-warning",
    bgColor: "bg-warning-200",
    icon: Crown,
  },
  {
    id: "admin",
    name: "管理员",
    description: "可以管理成员和大部分设置",
    color: "text-brand-500",
    bgColor: "bg-brand-200",
    icon: Shield,
  },
  {
    id: "member",
    name: "成员",
    description: "可以创建和编辑应用",
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
    label: "执行日志",
    description: "工作流执行记录与节点日志",
  },
  {
    value: "audit_logs",
    label: "审计日志",
    description: "操作人、目标与行为记录",
  },
];

const archiveStatusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  pending: { label: "待处理", color: "text-warning", bg: "bg-warning-200", icon: Clock },
  processing: { label: "归档中", color: "text-foreground-light", bg: "bg-surface-200", icon: Loader2 },
  completed: { label: "可回放", color: "text-brand-500", bg: "bg-brand-200", icon: Check },
  failed: { label: "失败", color: "text-destructive", bg: "bg-destructive-200", icon: AlertTriangle },
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
    { label: "时间", field: "created_at" },
    { label: "执行 ID", field: "execution_id" },
    { label: "节点 ID", field: "node_id" },
    { label: "节点类型", field: "node_type" },
    { label: "状态", field: "status" },
    { label: "耗时", field: "duration_ms" },
    { label: "错误信息", field: "error_message" },
  ],
  executions: [
    { label: "时间", field: "created_at" },
    { label: "执行 ID", field: "execution_id" },
    { label: "工作流 ID", field: "workflow_id" },
    { label: "用户 ID", field: "user_id" },
    { label: "状态", field: "status" },
    { label: "耗时", field: "duration_ms" },
    { label: "错误信息", field: "error_message" },
  ],
  audit_logs: [
    { label: "时间", field: "created_at" },
    { label: "动作", field: "action" },
    { label: "操作人", field: "actor_user_id" },
    { label: "目标类型", field: "target_type" },
    { label: "目标 ID", field: "target_id" },
  ],
};

const replayColumnTemplates: Record<string, ReplayColumnTemplate[]> = {
  node_logs: [
    {
      id: "default",
      label: "默认模板",
      columns: ["created_at", "execution_id", "node_id", "node_type", "status", "duration_ms", "error_message"],
      source: "system",
    },
    {
      id: "core",
      label: "核心追踪",
      columns: ["created_at", "execution_id", "node_id", "status"],
      source: "system",
    },
    {
      id: "diagnostic",
      label: "诊断模板",
      columns: ["created_at", "execution_id", "node_id", "node_type", "status", "error_message"],
      source: "system",
    },
  ],
  executions: [
    {
      id: "default",
      label: "默认模板",
      columns: ["created_at", "execution_id", "workflow_id", "user_id", "status", "duration_ms", "error_message"],
      source: "system",
    },
    {
      id: "core",
      label: "核心追踪",
      columns: ["created_at", "execution_id", "status", "duration_ms"],
      source: "system",
    },
    {
      id: "ownership",
      label: "归因模板",
      columns: ["created_at", "workflow_id", "user_id", "status", "duration_ms"],
      source: "system",
    },
  ],
  audit_logs: [
    {
      id: "default",
      label: "默认模板",
      columns: ["created_at", "action", "actor_user_id", "target_type", "target_id"],
      source: "system",
    },
    {
      id: "actions",
      label: "行为视图",
      columns: ["created_at", "action", "actor_user_id"],
      source: "system",
    },
    {
      id: "targets",
      label: "目标视图",
      columns: ["created_at", "target_type", "target_id", "action"],
      source: "system",
    },
  ],
};

// 侧边导航
function SettingsNav({ workspaceId, activeTab }: { workspaceId: string; activeTab: string }) {
  const navItems = [
    { id: "general", label: "基本设置", icon: <Settings className="w-4 h-4" /> },
    { id: "members", label: "成员管理", icon: <Users className="w-4 h-4" /> },
    { id: "api-keys", label: "API 密钥", icon: <Key className="w-4 h-4" /> },
    { id: "billing", label: "用量与计费", icon: <CreditCard className="w-4 h-4" /> },
    { id: "archives", label: "归档回放", icon: <Archive className="w-4 h-4" /> },
  ];

  return (
    <SidebarNavGroup title="设置">
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

  // 表单状态
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

  // 日志归档
  const [archives, setArchives] = useState<LogArchiveJob[]>([]);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [isArchiveCreating, setIsArchiveCreating] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveType, setArchiveType] = useState<LogArchiveType>("execution_logs");
  const [archiveRangeStart, setArchiveRangeStart] = useState("");
  const [archiveRangeEnd, setArchiveRangeEnd] = useState("");
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);

  // 归档回放
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

  // API Keys 状态
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
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["workflow.completed"]);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);

  // 从 URL 获取当前 tab
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get("tab") || "general";
    setActiveTab(tab);
  }, []);

  // 加载数据
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
      thresholds: settings.thresholds?.length
        ? settings.thresholds.map((t) => String(Math.round(t * 100))).join(", ")
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

      // 尝试加载配额（可能失败）
      try {
        const q = await workspaceApi.getQuota(workspaceId);
        setQuota(q);
      } catch {
        // 配额接口可能未实现
      }

      try {
        const settings = await billingApi.getBudgetSettings(workspaceId);
        setBudget(settings);
        syncBudgetForm(settings);
      } catch {
        // 预算接口可能未实现或无权限
      }
    } catch (error) {
      console.error("Failed to load workspace:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载 API Keys
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

  // 加载集成
  const loadIntegrations = async () => {
    try {
      const items = await workspaceApi.listIntegrations(workspaceId);
      setIntegrations(items);
    } catch (error) {
      console.error("Failed to load integrations:", error);
    }
  };

  // 创建 API Key
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

  // 轮换 API Key
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

  // 禁用 API Key
  const handleRevokeApiKey = async (keyId: string) => {
    try {
      await workspaceApi.revokeApiKey(workspaceId, keyId, "用户主动禁用");
      loadApiKeys();
    } catch (error) {
      console.error("Failed to revoke API key:", error);
    }
  };

  // 删除 API Key
  const handleDeleteApiKey = async (keyId: string) => {
    try {
      await workspaceApi.deleteApiKey(workspaceId, keyId);
      loadApiKeys();
    } catch (error) {
      console.error("Failed to delete API key:", error);
    }
  };

  // 复制密钥预览
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

  // 创建 Webhook
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
      setWebhookEvents(["workflow.completed"]);
      loadIntegrations();
    } catch (error) {
      console.error("Failed to create webhook:", error);
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  // 删除集成
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
      setArchiveError("日志归档加载失败，请稍后重试");
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
      setCloudSyncError("云端配置加载失败");
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
      setSharedSyncError("团队模板加载失败");
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
        description: "日志归档回放共享模板",
      });
      setSharedSyncStatus("idle");
      setSharedSyncedAt(new Date().toISOString());
    } catch (error) {
      setSharedSyncStatus("error");
      setSharedSyncError("团队模板同步失败");
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
        description: "日志归档回放列配置与模板",
      });
      setCloudSyncStatus("idle");
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setCloudSyncStatus("error");
      setCloudSyncError("云端同步失败");
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
      setArchiveError("创建归档任务失败，请检查参数或稍后重试");
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
      setArchiveError("下载归档包失败，请稍后重试");
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
      setArchiveError("删除归档包失败，请稍后重试");
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
      setReplayError("归档回放失败，请检查过滤条件或稍后重试");
      console.error("Failed to replay log archive:", error);
    } finally {
      setIsReplayLoading(false);
    }
  };

  const selectedArchive = archives.find((item) => item.id === selectedArchiveId) || null;
  const isAuditArchive = selectedArchive?.archive_type === "audit_logs";
  const replayDatasetOptions = isAuditArchive
    ? [{ value: "audit_logs", label: "审计日志" }]
    : [
        { value: "node_logs", label: "节点日志" },
        { value: "executions", label: "执行记录" },
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
          header: "时间",
          accessor: "created_at",
          sortable: true,
          cell: (value) => formatDateTime(String(value)),
        },
        { id: "action", header: "动作", accessor: "action", sortable: true, cell: (value) => renderText(String(value || "")) },
        {
          id: "actor_user_id",
          header: "操作人",
          accessor: "actor_user_id",
          cell: (value) => renderMono(String(value || "")),
        },
        { id: "target_type", header: "目标类型", accessor: "target_type", sortable: true, cell: (value) => renderText(String(value || "")) },
        { id: "target_id", header: "目标 ID", accessor: "target_id", cell: (value) => renderMono(String(value || "")) },
      ];
    }
    if (isExecutionDataset) {
      return [
        {
          id: "created_at",
          header: "时间",
          accessor: "created_at",
          sortable: true,
          cell: (value) => formatDateTime(String(value)),
        },
        { id: "execution_id", header: "执行 ID", accessor: "execution_id", cell: (value) => renderMono(String(value || "")) },
        { id: "workflow_id", header: "工作流", accessor: "workflow_id", sortable: true, cell: (value) => renderMono(String(value || "")) },
        { id: "user_id", header: "用户", accessor: "user_id", sortable: true, cell: (value) => renderMono(String(value || "")) },
        { id: "status", header: "状态", accessor: "status", sortable: true, cell: (value) => renderStatus(String(value || "")) },
        {
          id: "duration_ms",
          header: "耗时",
          accessor: "duration_ms",
          sortable: true,
          cell: (value) => (value ? `${value} ms` : "—"),
        },
        {
          id: "error_message",
          header: "错误信息",
          accessor: "error_message",
          cell: (value) => renderText(String(value || "")),
        },
      ];
    }
    return [
      {
        id: "created_at",
        header: "时间",
        accessor: "created_at",
        sortable: true,
        cell: (value) => formatDateTime(String(value)),
      },
      { id: "execution_id", header: "执行 ID", accessor: "execution_id", cell: (value) => renderMono(String(value || "")) },
      { id: "node_id", header: "节点 ID", accessor: "node_id", sortable: true, cell: (value) => renderMono(String(value || "")) },
      { id: "node_type", header: "节点类型", accessor: "node_type", sortable: true, cell: (value) => renderText(String(value || "")) },
      { id: "status", header: "状态", accessor: "status", sortable: true, cell: (value) => renderStatus(String(value || "")) },
      {
        id: "duration_ms",
        header: "耗时",
        accessor: "duration_ms",
        sortable: true,
        cell: (value) => (value ? `${value} ms` : "—"),
      },
      {
        id: "error_message",
        header: "错误信息",
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
      setTemplateError("模板名称不能为空");
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
      setTemplateError("模板名称不能为空");
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

  // 保存基本设置
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

  // 邀请成员
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
      loadData(); // 刷新成员列表
    } catch (error) {
      console.error("Failed to invite:", error);
    } finally {
      setIsInviting(false);
    }
  };

  // 获取角色配置
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
          <p className="text-foreground-muted">工作空间不存在</p>
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
        {/* 页面头部 */}
        <PageHeader
          title={workspace.name}
          eyebrow="工作空间设置"
          backHref={`/workspaces/${workspaceId}/apps`}
          backLabel="返回应用列表"
        />

        {/* 基本设置 */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <SettingsSection
              title="基本信息"
              description="工作空间的名称和标识"
              footer={
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  保存更改
                </Button>
              }
            >
              <FormRow
                label="工作空间名称"
                description="用于显示的名称"
              >
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="max-w-md h-9 bg-surface-75 border-border focus:border-brand-500"
                />
              </FormRow>

              <FormRow
                label="URL 标识"
                description="用于访问地址的唯一标识"
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

            {/* 危险区域 */}
            <SettingsSection
              title="危险操作"
              description="以下操作不可撤销，请谨慎操作"
            >
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="text-[12px] font-medium text-foreground">删除工作空间</div>
                  <div className="text-[12px] text-foreground-light mt-0.5">
                    删除后所有应用和数据将无法恢复
                  </div>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  删除工作空间
                </Button>
              </div>
            </SettingsSection>
          </div>
        )}

        {/* 成员管理 */}
        {activeTab === "members" && (
          <div className="space-y-6">
            <SettingsSection
              title="团队成员"
              description="管理工作空间的成员和权限"
            >
              {/* 工具栏 */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-[12px] text-foreground-light">
                  共 {members.length} 位成员
                </div>
                <PermissionGate permissions={permissions} required={["members_manage"]}>
                  <Button size="sm" onClick={() => setShowInviteDialog(true)}>
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    邀请成员
                  </Button>
                </PermissionGate>
              </div>

              {/* 成员列表 */}
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
                            {member.user?.username || "未知用户"}
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
                                更改角色
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border" />
                              {member.role_name !== "owner" && (
                                <DropdownMenuItem className="text-[12px] text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  移除成员
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

            {/* 角色说明 */}
            <SettingsSection
              title="角色权限说明"
              description="不同角色拥有不同的操作权限"
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

        {/* API 密钥与集成 */}
        {activeTab === "api-keys" && (
          <div className="space-y-6">
            {/* API Key 列表表格 */}
            <SettingsSection
              title="API 密钥"
              description="管理用于 AI 模型调用和工作流执行的密钥"
              actions={
                <Button
                  size="sm"
                  onClick={() => setShowCreateKeyDialog(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  添加密钥
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
                  title="暂无 API 密钥"
                  description="添加 API 密钥以启用 AI 模型调用"
                  action={
                    <Button
                      size="sm"
                      onClick={() => setShowCreateKeyDialog(true)}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      添加密钥
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
                              {key.is_active ? "活跃" : "已禁用"}
                            </Badge>
                            <Badge variant="outline" size="xs">
                              {key.provider}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-foreground-muted">
                            <span className="font-mono">{key.key_preview || "••••••••"}</span>
                            <span>Scopes: {key.scopes?.join(", ") || "全部"}</span>
                            <span>创建于 {new Date(key.created_at).toLocaleDateString()}</span>
                            {key.last_used_at && (
                              <span>最后使用 {new Date(key.last_used_at).toLocaleDateString()}</span>
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
                              轮换密钥
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {key.is_active ? (
                              <DropdownMenuItem
                                onClick={() => handleRevokeApiKey(key.id)}
                                className="text-warning"
                              >
                                <Lock className="w-4 h-4 mr-2" />
                                禁用
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleDeleteApiKey(key.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                删除
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

            {/* 集成配置区块 */}
            <SettingsSection
              title="集成与连接器"
              description="配置 Webhook、OAuth 授权和第三方服务连接"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Webhook 卡片 */}
                <div className="p-4 rounded-md border border-border bg-surface-75 hover:border-border-strong transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-md bg-brand-200 flex items-center justify-center">
                      <Webhook className="w-5 h-5 text-brand-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Webhook</h4>
                      <p className="text-xs text-foreground-muted">事件推送通知</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground-muted mb-3">
                    将工作流事件推送到外部 URL，实现自动化集成
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" size="xs">
                      {integrations.filter(i => i.type === "webhook").length} 个已配置
                    </Badge>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setShowWebhookDialog(true)}
                    >
                      配置
                    </Button>
                  </div>
                </div>

                {/* OAuth 卡片 */}
                <div className="p-4 rounded-md border border-border bg-surface-75 hover:border-border-strong transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-md bg-warning-200 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">OAuth 授权</h4>
                      <p className="text-xs text-foreground-muted">第三方账户连接</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground-muted mb-3">
                    授权访问 Google、GitHub、Slack 等服务
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" size="xs">
                      {integrations.filter(i => i.type === "oauth").length} 个已连接
                    </Badge>
                    <Button variant="outline" size="xs">
                      管理
                    </Button>
                  </div>
                </div>

                {/* 连接器卡片 */}
                <div className="p-4 rounded-md border border-border bg-surface-75 hover:border-border-strong transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-md bg-surface-200 flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-foreground-muted" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">第三方连接器</h4>
                      <p className="text-xs text-foreground-muted">数据源与服务</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground-muted mb-3">
                    连接数据库、API 端点和外部服务
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" size="xs">
                      {integrations.filter(i => i.type === "connector").length} 个已配置
                    </Badge>
                    <Button variant="outline" size="xs">
                      浏览
                    </Button>
                  </div>
                </div>
              </div>

              {/* 已配置的集成列表 */}
              {integrations.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-foreground mb-3">已配置的集成</h4>
                  <div className="divide-y divide-border rounded-md border border-border">
                    {integrations.map((integration) => {
                      const statusConfig = {
                        connected: { icon: CheckCircle2, color: "text-brand-500", label: "已连接" },
                        disconnected: { icon: XCircle, color: "text-foreground-muted", label: "未连接" },
                        error: { icon: AlertCircle, color: "text-destructive", label: "错误" },
                        pending: { icon: Clock, color: "text-warning", label: "待处理" },
                      }[integration.status] || { icon: Activity, color: "text-foreground-muted", label: "未知" };
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
                                    · 最后同步 {new Date(integration.last_sync_at).toLocaleString()}
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

            {/* 权限说明 */}
            <SettingsSection
              title="权限与安全"
              description="API 密钥和集成的安全最佳实践"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-md bg-surface-75">
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand-500" />
                    密钥安全
                  </h4>
                  <ul className="space-y-2 text-xs text-foreground-muted">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                      所有密钥使用 AES-256 加密存储
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                      定期轮换密钥以降低泄露风险
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                      使用最小权限原则设置 Scopes
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-md bg-surface-75">
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-warning" />
                    监控建议
                  </h4>
                  <ul className="space-y-2 text-xs text-foreground-muted">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                      监控密钥使用频率和异常调用
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                      设置 Webhook 失败告警
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                      审计日志记录所有密钥操作
                    </li>
                  </ul>
                </div>
              </div>
            </SettingsSection>
          </div>
        )}

        {/* 创建 API Key 对话框 */}
        <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
          <DialogContent className="sm:max-w-[480px]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-violet-500 to-indigo-500 rounded-t-lg" />
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-200 to-violet-200 border border-brand-300">
                  <Key className="w-6 h-6 text-brand-500" />
                </div>
                <div>
                  <DialogTitle>添加 API 密钥</DialogTitle>
                  <DialogDescription className="flex items-center gap-1.5 mt-0.5">
                    <Shield className="w-3 h-3" />
                    密钥将使用 AES-256 加密存储
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <FormRow label="提供商">
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
                    <SelectItem value="custom">⚙️ 自定义</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="密钥名称">
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="我的 API 密钥"
                />
              </FormRow>
              <FormRow label="API 密钥">
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
              <FormRow label="权限范围">
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
                取消
              </Button>
              <Button
                onClick={handleCreateApiKey}
                disabled={isCreatingKey || !newKeyName.trim() || !newKeyValue.trim()}
              >
                {isCreatingKey ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    添加中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    添加密钥
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 轮换 API Key 对话框 */}
        <Dialog open={showRotateKeyDialog} onOpenChange={setShowRotateKeyDialog}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>轮换 API 密钥</DialogTitle>
              <DialogDescription>
                输入新的密钥值，旧密钥将立即失效
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <FormRow label="新密钥">
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
                取消
              </Button>
              <Button
                onClick={handleRotateApiKey}
                disabled={isCreatingKey || !newKeyValue.trim()}
              >
                {isCreatingKey ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    轮换中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    确认轮换
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 创建 Webhook 对话框 */}
        <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-200 border border-brand-300">
                  <Webhook className="w-6 h-6 text-brand-500" />
                </div>
                <div>
                  <DialogTitle>配置 Webhook</DialogTitle>
                  <DialogDescription>
                    将工作流事件推送到指定 URL
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <FormRow label="名称">
                <Input
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                  placeholder="我的 Webhook"
                />
              </FormRow>
              <FormRow label="URL">
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                />
              </FormRow>
              <FormRow label="签名密钥（可选）">
                <Input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="用于验证请求签名"
                />
              </FormRow>
              <FormRow label="订阅事件">
                <div className="flex flex-wrap gap-2">
                  {[
                    "workflow.completed",
                    "workflow.failed",
                    "workflow.started",
                    "execution.success",
                    "execution.error",
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
                取消
              </Button>
              <Button
                onClick={handleCreateWebhook}
                disabled={isCreatingWebhook || !webhookName.trim() || !webhookUrl.trim()}
              >
                {isCreatingWebhook ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    创建 Webhook
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 用量与计费 */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            {/* 当前计划 */}
            <SettingsSection
              title="当前计划"
              description="工作空间的订阅计划和配额"
            >
              <div className="flex items-center justify-between p-4 rounded-md bg-surface-75">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-brand-200 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-brand-500" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-foreground">
                      {workspace.plan === "free"
                        ? "免费版"
                        : workspace.plan === "pro"
                        ? "专业版"
                        : "企业版"}
                    </h3>
                    <p className="text-[12px] text-foreground-light">
                      {workspace.plan === "free"
                        ? "最多 3 个应用，基础功能"
                        : workspace.plan === "pro"
                        ? "最多 20 个应用，高级功能"
                        : "无限应用，全部功能"}
                    </p>
                  </div>
                </div>
                <PermissionGate permissions={permissions} required={["billing_manage"]}>
                  <Button>升级计划</Button>
                </PermissionGate>
              </div>
            </SettingsSection>

            {/* 用量统计 */}
            <SettingsSection
              title="用量统计"
              description="本月资源使用情况"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <UsageCard
                  label="API 请求"
                  used={quota?.requests.used || 0}
                  limit={quota?.requests.limit || 1000}
                  icon={<Zap className="w-4 h-4" />}
                />
                <UsageCard
                  label="Token 用量"
                  used={quota?.tokens.used || 0}
                  limit={quota?.tokens.limit || 100000}
                  icon={<MessageSquare className="w-4 h-4" />}
                  format="k"
                />
                <UsageCard
                  label="应用数量"
                  used={quota?.apps.used || 0}
                  limit={quota?.apps.limit || 3}
                  icon={<Bot className="w-4 h-4" />}
                />
                <UsageCard
                  label="存储空间"
                  used={quota?.storage.used || 0}
                  limit={quota?.storage.limit || 1024}
                  icon={<Key className="w-4 h-4" />}
                  format="mb"
                />
              </div>
            </SettingsSection>

            {/* 预算与提醒 */}
            <SettingsSection
              title="预算与提醒"
              description="设置月度预算、提醒阈值与硬性上限"
            >
              <PermissionGate
                permissions={permissions}
                required={["billing_manage"]}
                fallback={
                  <div className="text-[12px] text-foreground-light">
                    你没有权限管理预算设置。
                  </div>
                }
              >
                <div className="space-y-4">
                  <FormRow
                    label="月度预算"
                    description="超过预算会触发提醒与告警"
                  >
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        placeholder="例如 1000"
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
                    label="提醒阈值 (%)"
                    description="逗号分隔，例如 50, 80, 100"
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
                    label="硬性上限"
                    description="超过上限时可阻断超额消耗"
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
                        placeholder="例如 1200"
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
                    {isBudgetSaving ? "保存中..." : "保存预算设置"}
                  </Button>
                </div>
              </PermissionGate>
            </SettingsSection>
          </div>
        )}

        {/* 归档回放 */}
        {activeTab === "archives" && (
          <PermissionGate
            permissions={permissions}
            required={["workspace_admin"]}
            fallback={(
              <SettingsSection
                title="日志归档"
                description="该区域仅管理员可访问"
              >
                <div className="text-[12px] text-foreground-light">
                  你没有权限查看日志归档与回放内容，请联系工作空间管理员。
                </div>
              </SettingsSection>
            )}
          >
            <div className="space-y-6">
              <SettingsSection
                title="日志归档"
                description="将执行/审计日志写入冷存储，支持后续回放与下载"
                footer={(
                  <Button onClick={handleArchiveRequest} disabled={isArchiveCreating}>
                    {isArchiveCreating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                    创建归档
                  </Button>
                )}
              >
                <FormRow
                  label="归档类型"
                  description="选择需要归档的日志数据类型"
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
                  label="归档范围"
                  description="可选，留空则使用系统默认归档窗口"
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
                        最近 1 天
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => applyArchivePreset(7)}>
                        最近 7 天
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => applyArchivePreset(30)}>
                        最近 30 天
                      </Button>
                    </div>
                  </div>
                </FormRow>
                {archiveError && (
                  <div className="text-[12px] text-destructive">{archiveError}</div>
                )}
              </SettingsSection>

              <SettingsSection
                title="归档任务列表"
                description="最新归档任务、范围与下载入口"
              >
                {isArchiveLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
                  </div>
                ) : archives.length === 0 ? (
                  <EmptyState
                    icon={<Archive className="w-5 h-5" />}
                    title="暂无归档任务"
                    description="创建归档任务后，这里会显示归档状态与下载入口。"
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
                                范围：{formatDateTime(job.range_start)} - {formatDateTime(job.range_end)}
                              </div>
                              <div className="text-[11px] text-foreground-muted">
                                创建：{formatDateTime(job.created_at)} · 过期：{formatDateTime(job.expires_at)}
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
                              回放
                            </Button>
                            {job.status === "completed" && (
                              <Button variant="outline" size="sm" onClick={() => handleArchiveDownload(job)}>
                                <Download className="w-4 h-4 mr-1.5" />
                                下载
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleArchiveDelete(job)}
                            >
                              <Trash2 className="w-4 h-4 mr-1.5" />
                              删除
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SettingsSection>

              <SettingsSection
                title="归档回放"
                description="按条件筛选归档内记录并回放"
                footer={(
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => handleReplay(true)} disabled={isReplayLoading || !selectedArchiveId}>
                      {isReplayLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                      <Play className="w-4 h-4 mr-1.5" />
                      查询回放
                    </Button>
                    {replayNextOffset !== null && (
                      <Button variant="outline" onClick={() => handleReplay(false)} disabled={isReplayLoading}>
                        <Filter className="w-4 h-4 mr-1.5" />
                        加载更多
                      </Button>
                    )}
                  </div>
                )}
              >
                {!selectedArchive ? (
                  <EmptyState
                    icon={<Archive className="w-5 h-5" />}
                    title="请选择归档任务"
                    description="从上方列表选择归档任务后即可回放。"
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3 p-3 rounded-md bg-surface-75 border border-border">
                      <div className="flex items-center gap-2 text-[12px] text-foreground-light">
                        <Archive className="w-4 h-4" />
                        当前归档
                      </div>
                      <div className="text-[12px] text-foreground">
                        {archiveTypeOptions.find((item) => item.value === selectedArchive.archive_type)?.label}
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-surface-200 text-foreground-light">
                        {formatDateTime(selectedArchive.range_start)} - {formatDateTime(selectedArchive.range_end)}
                      </Badge>
                    </div>

                    <FormRow
                      label="数据集"
                      description="选择需要回放的归档数据集"
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
                      label="列模板"
                      description="选择预置列组合，或在表格中自定义"
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
                                ? `团队 · ${template.label}`
                                : template.source === "personal"
                                ? `个人 · ${template.label}`
                                : template.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom" disabled>
                            自定义
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormRow>

                    <div className="rounded-md border border-border bg-surface-75 p-3">
                      <div className="flex items-center gap-2 text-[12px] text-foreground-light mb-2">
                        <Database className="w-4 h-4" />
                        字段映射
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
                      label="时间过滤"
                      description="可选，缩小回放的时间范围"
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
                        label="执行过滤"
                        description="可选，按执行/工作流/用户/状态过滤"
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
                        label="节点过滤"
                        description="可选，按执行/节点/状态过滤"
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
                        label="审计过滤"
                        description="可选，按 action/actor/target 过滤"
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
                      label="回放分页"
                      description="控制回放数量与偏移"
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
                          <div className="text-[12px] text-foreground-light">回放结果</div>
                          <div className="text-[11px] text-foreground-muted">
                            {cloudSyncStatus === "syncing" && "云端同步中..."}
                            {cloudSyncStatus === "error" && (cloudSyncError || "云端同步失败")}
                            {cloudSyncStatus === "idle" && lastSyncedAt && `已同步 ${formatDateTime(lastSyncedAt)}`}
                            {cloudSyncStatus === "idle" && !lastSyncedAt && "尚未同步云端"}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                                列配置
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
                          导出全部字段
                        </DropdownMenuCheckboxItem>
                              <DropdownMenuSeparator className="bg-border" />
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault();
                                  resetVisibleColumns();
                                }}
                                className="text-[12px]"
                              >
                                恢复默认
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button variant="outline" size="sm" onClick={() => setShowSaveTemplateDialog(true)}>
                            保存模板
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setShowManageTemplatesDialog(true)}>
                            管理模板
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={replayRows.length === 0}>
                            <Download className="w-4 h-4 mr-1.5" />
                            导出 CSV
                          </Button>
                          <Button
                            variant={replayView === "table" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setReplayView("table")}
                          >
                            表格视图
                          </Button>
                          <Button
                            variant={replayView === "json" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setReplayView("json")}
                          >
                            原始 JSON
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
                          title="暂无回放结果"
                          description="请调整筛选条件后点击“查询回放”。"
                        />
                      ) : replayView === "table" ? (
                        <DataTable
                          data={replayRows}
                          columns={visibleReplayColumns}
                          searchable
                          searchKeys={visibleReplayColumns.map((column) => column.id as keyof ReplayRow)}
                          paginated
                          pageSize={10}
                          emptyMessage="暂无回放结果"
                        />
                      ) : (
                        replayRecords.map((record, idx) => (
                          <div
                            key={`${selectedArchive.id}-${idx}`}
                            className="rounded-md border border-border bg-surface-75 p-3"
                          >
                            <div className="flex items-center justify-between text-[11px] text-foreground-muted mb-2">
                              <span>记录 {idx + 1}</span>
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
            <DialogTitle className="text-foreground">保存自定义模板</DialogTitle>
            <DialogDescription className="text-foreground-light">
              当前列配置将保存为模板并同步到账号
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                模板名称
              </label>
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="例如：故障排查模板"
                className="h-9 bg-surface-75 border-border focus:border-brand-500"
              />
            </div>
            {templateError && <p className="text-[12px] text-destructive">{templateError}</p>}
            <div className="text-[11px] text-foreground-muted">
              模板将保存到云端，跨设备保持一致。
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveTemplateDialog(false)}
              className="border-border"
            >
              取消
            </Button>
            <Button onClick={handleSaveCustomTemplate}>保存模板</Button>
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
            <DialogTitle className="text-foreground">模板管理</DialogTitle>
            <DialogDescription className="text-foreground-light">
              管理当前数据集的个人/团队模板
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="text-[12px] text-foreground-muted">个人模板</div>
            {customTemplatesForDataset.length === 0 ? (
              <EmptyState
                icon={<Archive className="w-5 h-5" />}
                title="暂无个人模板"
                description="保存当前列配置以创建个人模板。"
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
                          列数 {template.columns.length}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {editingTemplateId === template.id ? (
                      <>
                        <Button size="sm" onClick={() => handleSaveRenameTemplate("personal")}>
                          保存
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
                          取消
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
                          应用
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartRenameTemplate(template, "personal")}
                        >
                          重命名
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleShareTemplate(template)}
                        >
                          共享到团队
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void handleDeleteTemplate(template.id, "personal")}
                        >
                          删除
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}

            <div className="text-[12px] text-foreground-muted pt-2">团队模板</div>
            {sharedTemplatesForDataset.length === 0 ? (
              <EmptyState
                icon={<Archive className="w-5 h-5" />}
                title="暂无团队模板"
                description="可将个人模板共享到团队。"
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
                          列数 {template.columns.length}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {editingTemplateId === template.id ? (
                      <>
                        <Button size="sm" onClick={() => handleSaveRenameTemplate("shared")}>
                          保存
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
                          取消
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
                          应用
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartRenameTemplate(template, "shared")}
                        >
                          重命名
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void handleDeleteTemplate(template.id, "shared")}
                        >
                          删除
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            {templateError && <p className="text-[12px] text-destructive">{templateError}</p>}
            {sharedSyncStatus === "error" && (
              <p className="text-[12px] text-destructive">{sharedSyncError || "团队模板同步失败"}</p>
            )}
            {sharedSyncStatus === "syncing" && (
              <p className="text-[12px] text-foreground-muted">团队模板同步中...</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManageTemplatesDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 邀请成员对话框 */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">邀请成员</DialogTitle>
            <DialogDescription className="text-foreground-light">
              发送邀请邮件给新成员
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                邮箱地址
              </label>
              <Input
                type="email"
                placeholder="输入邮箱地址"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-9 bg-surface-75 border-border focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                角色
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
              取消
            </Button>
            <Button onClick={handleInvite} disabled={!inviteEmail || isInviting}>
              {isInviting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              <Send className="w-4 h-4 mr-1.5" />
              发送邀请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWithSidebar>
  );
}

// 用量卡片组件
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
          {" "}
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
