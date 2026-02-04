"use client";

/**
 * 操作日志/审计日志页面
 * 记录用户所有操作历史
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageContainer, PageHeader, StatsCard } from "@/components/dashboard/page-layout";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Edit3,
  Eye,
  ExternalLink,
  FileText,
  Info,
  Key,
  LogIn,
  LogOut,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Shield,
  Trash2,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DrawerDialog } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// 操作类型配置
const actionTypes = {
  create: { label: "创建", icon: Plus, color: "text-brand-500", bg: "bg-brand-200/70" },
  update: { label: "更新", icon: Edit3, color: "text-brand-500", bg: "bg-brand-200/70" },
  delete: { label: "删除", icon: Trash2, color: "text-destructive-400", bg: "bg-destructive-200/70" },
  execute: { label: "执行", icon: Play, color: "text-brand-500", bg: "bg-brand-200/70" },
  view: { label: "查看", icon: Eye, color: "text-foreground-light", bg: "bg-surface-200/70" },
  share: { label: "分享", icon: Share2, color: "text-foreground-light", bg: "bg-surface-200/70" },
  login: { label: "登录", icon: LogIn, color: "text-brand-500", bg: "bg-brand-200/70" },
  logout: { label: "登出", icon: LogOut, color: "text-foreground-light", bg: "bg-surface-200/70" },
  settings: { label: "设置", icon: Settings, color: "text-foreground-light", bg: "bg-surface-200/70" },
  security: { label: "安全", icon: Shield, color: "text-warning", bg: "bg-warning-200/70" },
};

// 资源类型配置
const resourceTypes = {
  workflow: { label: "工作流", icon: Zap },
  agent: { label: "Agent", icon: Bot },
  conversation: { label: "对话", icon: FileText },
  apiKey: { label: "API 密钥", icon: Key },
  account: { label: "账户", icon: User },
  settings: { label: "设置", icon: Settings },
};

// 状态配置
const statusConfig = {
  success: { label: "成功", icon: CheckCircle, color: "text-brand-500", variant: "success" },
  failed: { label: "失败", icon: XCircle, color: "text-destructive", variant: "error" },
  warning: { label: "警告", icon: AlertTriangle, color: "text-warning", variant: "warning" },
  info: { label: "信息", icon: Info, color: "text-foreground-light", variant: "secondary" },
};

// 模拟日志数据
const mockLogs = [
  {
    id: "1",
    action: "execute",
    resource: "workflow",
    resourceName: "客户反馈自动处理",
    resourceId: "wf-123",
    status: "success",
    message: "工作流执行成功，处理了 15 条反馈",
    actor: {
      id: "user-001",
      name: "陈奕",
      email: "chenyi@reverse.ai",
      role: "管理员",
    },
    ip: "192.168.1.100",
    userAgent: "Chrome/120.0 Windows",
    timestamp: "2026-01-31T10:30:00Z",
    duration: 2500,
    metadata: {
      request_id: "req_94c3",
      region: "ap-sg",
      trigger: "manual",
    },
  },
  {
    id: "2",
    action: "create",
    resource: "agent",
    resourceName: "写作助手 v2",
    resourceId: "ag-456",
    status: "success",
    message: "创建新 Agent 成功",
    actor: {
      id: "user-002",
      name: "宋雨",
      email: "songyu@reverse.ai",
      role: "成员",
    },
    ip: "192.168.1.100",
    userAgent: "Chrome/120.0 Windows",
    timestamp: "2026-01-31T10:15:00Z",
    metadata: {
      template: "assistant-v2",
      visibility: "workspace",
      source: "dashboard",
    },
  },
  {
    id: "3",
    action: "security",
    resource: "apiKey",
    resourceName: "生产环境密钥",
    resourceId: "key-789",
    status: "warning",
    message: "API 密钥即将过期，请及时更新",
    actor: {
      id: "system",
      name: "安全审计",
      email: "security@reverse.ai",
      role: "系统",
    },
    ip: "192.168.1.100",
    userAgent: "Chrome/120.0 Windows",
    timestamp: "2026-01-31T09:45:00Z",
    metadata: {
      expires_at: "2026-02-03T00:00:00Z",
      policy: "rotate-7d",
    },
  },
  {
    id: "4",
    action: "delete",
    resource: "conversation",
    resourceName: "测试对话记录",
    resourceId: "conv-012",
    status: "success",
    message: "删除对话成功",
    actor: {
      id: "user-001",
      name: "陈奕",
      email: "chenyi@reverse.ai",
      role: "管理员",
    },
    ip: "192.168.1.100",
    userAgent: "Chrome/120.0 Windows",
    timestamp: "2026-01-31T09:30:00Z",
    metadata: {
      retention: "30d",
      soft_delete: true,
    },
  },
  {
    id: "5",
    action: "login",
    resource: "account",
    resourceName: "账户登录",
    status: "success",
    message: "用户登录成功",
    actor: {
      id: "user-003",
      name: "李可",
      email: "like@reverse.ai",
      role: "成员",
    },
    ip: "192.168.1.100",
    userAgent: "Chrome/120.0 Windows",
    timestamp: "2026-01-31T09:00:00Z",
    metadata: {
      method: "password",
      mfa: true,
      session_id: "sess_7f2a",
    },
  },
  {
    id: "6",
    action: "execute",
    resource: "workflow",
    resourceName: "数据同步任务",
    resourceId: "wf-345",
    status: "failed",
    message: "工作流执行失败：连接超时",
    actor: {
      id: "user-004",
      name: "周宁",
      email: "zhouning@reverse.ai",
      role: "成员",
    },
    ip: "192.168.1.100",
    userAgent: "Chrome/120.0 Windows",
    timestamp: "2026-01-30T18:20:00Z",
    duration: 30000,
    error: "Connection timeout after 30s",
    metadata: {
      error_code: "EXEC_TIMEOUT",
      retry: 2,
      node: "http.request",
    },
  },
  {
    id: "7",
    action: "update",
    resource: "settings",
    resourceName: "通知设置",
    status: "success",
    message: "更新通知偏好设置",
    actor: {
      id: "user-005",
      name: "孙洁",
      email: "sunjie@reverse.ai",
      role: "成员",
    },
    ip: "192.168.1.100",
    userAgent: "Chrome/120.0 Windows",
    timestamp: "2026-01-30T16:45:00Z",
    metadata: {
      channel: "email",
      previous: "all",
      current: "mentions",
    },
  },
  {
    id: "8",
    action: "share",
    resource: "workflow",
    resourceName: "邮件自动分类",
    resourceId: "wf-678",
    status: "success",
    message: "工作流已分享给团队成员",
    actor: {
      id: "user-002",
      name: "宋雨",
      email: "songyu@reverse.ai",
      role: "成员",
    },
    ip: "192.168.1.100",
    userAgent: "Chrome/120.0 Windows",
    timestamp: "2026-01-30T14:30:00Z",
    metadata: {
      shared_with: "Growth 团队",
      permission: "edit",
    },
  },
];

// 时间范围选项
const timeRanges = [
  { id: "1h", label: "最近 1 小时" },
  { id: "24h", label: "最近 24 小时" },
  { id: "7d", label: "最近 7 天" },
  { id: "30d", label: "最近 30 天" },
  { id: "custom", label: "自定义范围" },
];

const resultsTabs = [
  { id: "results", label: "结果" },
  { id: "explain", label: "解释" },
  { id: "chart", label: "图表" },
] as const;

const timeRangeLimits: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

function formatTimestamp(timestamp: string | Date) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(durationMs?: number) {
  if (durationMs === undefined) return "—";
  if (durationMs < 1000) return `${durationMs} ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function computeStats(logs: typeof mockLogs) {
  const total = logs.length;
  const success = logs.filter((log) => log.status === "success").length;
  const failed = logs.filter((log) => log.status === "failed").length;
  const warning = logs.filter((log) => log.status === "warning").length;
  const durations = logs.filter((log) => log.duration !== undefined).map((log) => log.duration ?? 0);
  const durationCount = durations.length;
  const avgDuration = durationCount
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durationCount)
    : 0;
  const successRate = total ? Math.round((success / total) * 100) : 0;
  return { total, success, failed, warning, avgDuration, successRate, durationCount };
}

function formatCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildCsv(headers: string[], rows: Array<Record<string, unknown>>) {
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => formatCsvValue(row[header])).join(",")),
  ];
  return lines.join("\n");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedResource, setSelectedResource] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedActor, setSelectedActor] = useState<string>("all");
  const [timeRange, setTimeRange] = useState("24h");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<(typeof mockLogs)[number] | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date());
  const [collectionQuery, setCollectionQuery] = useState("");
  const [queryDraft, setQueryDraft] = useState(
    "select\n  timestamp,\n  action,\n  resource,\n  status,\n  message\nfrom audit_logs\nwhere status != 'success'\norder by timestamp desc\nlimit 100"
  );
  const [resultsTab, setResultsTab] = useState<(typeof resultsTabs)[number]["id"]>("results");

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed(new Date());
    }, 1000);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedAction("all");
    setSelectedResource("all");
    setSelectedStatus("all");
    setSelectedActor("all");
    setTimeRange("24h");
  };

  const handleExport = (format: "csv" | "json") => {
    if (filteredLogs.length === 0) return;
    const exportRows = filteredLogs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      action: log.action,
      resource: log.resource,
      resource_name: log.resourceName ?? "",
      resource_id: log.resourceId ?? "",
      status: log.status,
      message: log.message,
      actor_name: log.actor?.name ?? "",
      actor_email: log.actor?.email ?? "",
      actor_role: log.actor?.role ?? "",
      ip: log.ip ?? "",
      user_agent: log.userAgent ?? "",
      duration_ms: log.duration ?? "",
      error: log.error ?? "",
      metadata: log.metadata ? JSON.stringify(log.metadata) : "",
    }));
    const exportedAt = new Date().toISOString();
    const fileStamp = exportedAt.replace(/[:]/g, "-").slice(0, 19);
    const baseName = `audit-logs-${fileStamp}`;

    if (format === "json") {
      const payload = {
        exported_at: exportedAt,
        filters: {
          search: searchQuery.trim(),
          action: selectedAction,
          resource: selectedResource,
          status: selectedStatus,
          actor: selectedActor,
          time_range: timeRange,
        },
        total: filteredLogs.length,
        items: exportRows,
      };
      downloadFile(JSON.stringify(payload, null, 2), `${baseName}.json`, "application/json;charset=utf-8");
      return;
    }

    const headers = [
      "id",
      "timestamp",
      "action",
      "resource",
      "resource_name",
      "resource_id",
      "status",
      "message",
      "actor_name",
      "actor_email",
      "actor_role",
      "ip",
      "user_agent",
      "duration_ms",
      "error",
      "metadata",
    ];
    const csv = buildCsv(headers, exportRows);
    downloadFile(csv, `${baseName}.csv`, "text/csv;charset=utf-8");
  };

  // 筛选日志
  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const timeLimit = timeRangeLimits[timeRange];
    const now = Date.now();

    return mockLogs.filter((log) => {
      const matchesSearch =
        query.length === 0 ||
        log.resourceName?.toLowerCase().includes(query) ||
        log.message.toLowerCase().includes(query) ||
        log.resourceId?.toLowerCase().includes(query) ||
        log.actor?.name?.toLowerCase().includes(query) ||
        log.actor?.email?.toLowerCase().includes(query);
      const matchesAction = selectedAction === "all" || log.action === selectedAction;
      const matchesResource = selectedResource === "all" || log.resource === selectedResource;
      const matchesStatus = selectedStatus === "all" || log.status === selectedStatus;
      const matchesActor = selectedActor === "all" || log.actor?.id === selectedActor;
      const matchesTime =
        !timeLimit || now - new Date(log.timestamp).getTime() <= timeLimit;
      return (
        matchesSearch &&
        matchesAction &&
        matchesResource &&
        matchesStatus &&
        matchesActor &&
        matchesTime
      );
    });
  }, [searchQuery, selectedAction, selectedResource, selectedStatus, selectedActor, timeRange]);

  // 统计数据
  const stats = useMemo(() => computeStats(mockLogs), []);
  const filteredStats = useMemo(() => computeStats(filteredLogs), [filteredLogs]);

  const selectedTimeRangeLabel =
    timeRanges.find((range) => range.id === timeRange)?.label ?? "自定义范围";

  const actorOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string; role?: string }>();
    mockLogs.forEach((log) => {
      if (!log.actor?.id) return;
      if (!map.has(log.actor.id)) {
        map.set(log.actor.id, {
          id: log.actor.id,
          name: log.actor.name,
          email: log.actor.email,
          role: log.actor.role,
        });
      }
    });
    return Array.from(map.values());
  }, []);

  const activeFilters = useMemo(() => {
    const items: { id: string; label: string }[] = [];
    if (searchQuery.trim()) {
      const trimmed = searchQuery.trim();
      items.push({
        id: "search",
        label: `搜索: ${trimmed.length > 16 ? `${trimmed.slice(0, 16)}…` : trimmed}`,
      });
    }
    if (selectedAction !== "all") {
      items.push({
        id: "action",
        label: `操作: ${actionTypes[selectedAction as keyof typeof actionTypes]?.label ?? selectedAction}`,
      });
    }
    if (selectedResource !== "all") {
      items.push({
        id: "resource",
        label: `资源: ${resourceTypes[selectedResource as keyof typeof resourceTypes]?.label ?? selectedResource}`,
      });
    }
    if (selectedStatus !== "all") {
      items.push({
        id: "status",
        label: `状态: ${statusConfig[selectedStatus as keyof typeof statusConfig]?.label ?? selectedStatus}`,
      });
    }
    if (selectedActor !== "all") {
      const actor = actorOptions.find((item) => item.id === selectedActor);
      items.push({
        id: "actor",
        label: `操作者: ${actor?.name ?? selectedActor}`,
      });
    }
    if (timeRange !== "24h") {
      items.push({
        id: "time",
        label: `时间: ${selectedTimeRangeLabel}`,
      });
    }
    return items;
  }, [
    searchQuery,
    selectedAction,
    selectedResource,
    selectedStatus,
    selectedActor,
    timeRange,
    selectedTimeRangeLabel,
    actorOptions,
  ]);

  const hasActiveFilters = activeFilters.length > 0;
  const failureRate = filteredStats.total
    ? Math.round((filteredStats.failed / filteredStats.total) * 100)
    : 0;

  const nonResultsState =
    resultsTab === "explain"
      ? {
          title: "暂无执行计划",
          description: "运行查询后生成解释信息。",
          icon: <Info className="w-5 h-5" />,
        }
      : {
          title: "暂无图表",
          description: "保存查询后可查看趋势图。",
          icon: <BarChart3 className="w-5 h-5" />,
        };

  const resourceCounts = useMemo(() => {
    return mockLogs.reduce<Record<string, number>>((acc, log) => {
      acc[log.resource] = (acc[log.resource] ?? 0) + 1;
      return acc;
    }, {});
  }, []);

  const actionCounts = useMemo(() => {
    return mockLogs.reduce<Record<string, number>>((acc, log) => {
      acc[log.action] = (acc[log.action] ?? 0) + 1;
      return acc;
    }, {});
  }, []);

  const collectionEntries = useMemo(() => {
    const query = collectionQuery.trim().toLowerCase();
    const entries = Object.entries(resourceTypes);
    if (!query) return entries;
    return entries.filter(([key, config]) => {
      return key.toLowerCase().includes(query) || config.label.toLowerCase().includes(query);
    });
  }, [collectionQuery]);

  const quickFilters = [
    {
      id: "failed",
      label: "失败事件",
      description: "定位失败与异常操作",
      status: "failed",
      tone: "bg-destructive",
    },
    {
      id: "security",
      label: "安全相关",
      description: "密钥与权限变更",
      action: "security",
      tone: "bg-warning",
    },
    {
      id: "login",
      label: "登录活动",
      description: "登录与登出记录",
      action: "login",
      tone: "bg-brand-500",
    },
  ];

  const applyQuickFilter = (filter: (typeof quickFilters)[number]) => {
    setSelectedAction(filter.action ?? "all");
    setSelectedStatus(filter.status ?? "all");
    setSelectedResource("all");
    setSelectedActor("all");
    setSearchQuery("");
    setTimeRange("24h");
    setResultsTab("results");
  };

  const selectedLogContext = selectedLog
    ? {
        action: actionTypes[selectedLog.action as keyof typeof actionTypes],
        resource: resourceTypes[selectedLog.resource as keyof typeof resourceTypes],
        status: statusConfig[selectedLog.status as keyof typeof statusConfig] ?? statusConfig.info,
      }
    : null;
  const SelectedActionIcon = selectedLogContext?.action?.icon ?? Info;
  const SelectedResourceIcon = selectedLogContext?.resource?.icon ?? FileText;
  const SelectedStatusIcon = selectedLogContext?.status?.icon ?? Info;
  const selectedMetadataEntries = selectedLog ? Object.entries(selectedLog.metadata ?? {}) : [];
  const canExport = filteredLogs.length > 0;

  return (
    <PageContainer>
      <div className="space-y-6">
        <p className="page-caption">Observability</p>
        <PageHeader
          title="操作日志"
          description="查看和追踪您的所有操作记录"
          actions={(
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                leftIcon={<RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />}
              >
                {isRefreshing ? "刷新中" : "刷新"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    leftIcon={<Download className="w-4 h-4" />}
                    disabled={!canExport}
                  >
                    导出日志
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-surface-100 border-border">
                  <DropdownMenuItem disabled={!canExport} onClick={() => handleExport("csv")}>
                    导出为 CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={!canExport} onClick={() => handleExport("json")}>
                    导出为 JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
            <Badge variant="outline" size="sm">
              保留 30 天
            </Badge>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {isRefreshing ? "正在刷新..." : `上次刷新 ${formatTimestamp(lastRefreshed)}`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {selectedTimeRangeLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              显示 {filteredLogs.length} / {stats.total}
            </span>
          </div>
        </PageHeader>

        {/* 统计卡片 */}
        <div className="page-grid grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon={<FileText className="w-4 h-4" />}
            title="总操作数"
            value={filteredStats.total}
            subtitle={hasActiveFilters ? `总计 ${stats.total}` : "当前范围内"}
          />
          <StatsCard
            icon={<CheckCircle className="w-4 h-4" />}
            title="成功率"
            value={`${filteredStats.successRate}%`}
            subtitle={`成功 ${filteredStats.success} 次`}
          />
          <StatsCard
            icon={<XCircle className="w-4 h-4" />}
            title="失败"
            value={filteredStats.failed}
            subtitle={`占比 ${failureRate}%`}
          />
          <StatsCard
            icon={<Clock className="w-4 h-4" />}
            title="平均耗时"
            value={formatDuration(filteredStats.avgDuration)}
            subtitle={
              filteredStats.durationCount
                ? `基于 ${filteredStats.durationCount} 次执行`
                : "暂无耗时数据"
            }
          />
        </div>

        <div className="page-panel">
          <div className="page-panel-header">
            <p className="page-panel-title">事件类型</p>
            <p className="page-panel-description">按操作与资源类型快速查看</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(actionTypes).map(([key, config]) => (
                <Badge key={key} variant="secondary" size="xs">
                  {config.label}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(resourceTypes).map(([key, config]) => (
                <Badge key={key} variant="outline" size="xs">
                  {config.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="page-grid xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="page-panel p-4 space-y-3">
              <Badge variant="outline" size="xs">
                即将推出
              </Badge>
              <div>
                <p className="text-sm font-medium text-foreground">新日志引擎</p>
                <p className="text-[13px] text-foreground-light">
                  支持实时检索与更细粒度的过滤器。
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full justify-center">
                申请早期访问
              </Button>
            </div>

            <div className="page-panel overflow-hidden">
              <div className="page-panel-header">
                <p className="page-panel-title">集合</p>
                <p className="page-panel-description">按资源类型浏览</p>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    variant="search"
                    inputSize="sm"
                    placeholder="搜索集合..."
                    value={collectionQuery}
                    onChange={(e) => setCollectionQuery(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                    className="w-full"
                  />
                  <Button variant="outline" size="icon-sm" aria-label="新增集合">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedResource("all")}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                      selectedResource === "all"
                        ? "bg-surface-200 text-foreground"
                        : "text-foreground-light hover:bg-surface-100 hover:text-foreground"
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="flex-1 text-left">全部资源</span>
                    <span className="text-[11px] text-foreground-muted tabular-nums">
                      {stats.total}
                    </span>
                  </button>
                  {collectionEntries.map(([key, config]) => {
                    const Icon = config.icon;
                    const count = resourceCounts[key] ?? 0;
                    const isActive = selectedResource === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedResource(key)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                          isActive
                            ? "bg-surface-200 text-foreground"
                            : "text-foreground-light hover:bg-surface-100 hover:text-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{config.label}</span>
                        <span className="text-[11px] text-foreground-muted tabular-nums">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="page-panel overflow-hidden">
              <div className="page-panel-header flex items-center justify-between">
                <div>
                  <p className="page-panel-title">查询</p>
                  <p className="page-panel-description">保存常用检索条件</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="新建查询">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-3 space-y-2">
                {quickFilters.map((filter) => {
                  const isActive =
                    (filter.status ? selectedStatus === filter.status : true) &&
                    (filter.action ? selectedAction === filter.action : true) &&
                    selectedResource === "all" &&
                    searchQuery.trim() === "";
                  const count =
                    filter.status === "failed"
                      ? stats.failed
                      : filter.action
                      ? actionCounts[filter.action] ?? 0
                      : 0;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => applyQuickFilter(filter)}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-md border border-transparent px-3 py-2 text-left transition-colors",
                        isActive
                          ? "bg-surface-200 text-foreground border-border"
                          : "text-foreground-light hover:bg-surface-100 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className={cn("mt-2 h-2 w-2 rounded-full", filter.tone)} />
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{filter.label}</p>
                          <p className="text-[11px] text-foreground-muted">{filter.description}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-foreground-muted tabular-nums">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="page-panel">
              <div className="page-panel-header flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="page-panel-title">日志查询</p>
                  <p className="page-panel-description">使用结构化条件快速定位事件</p>
                </div>
                <Badge variant="secondary" size="sm">
                  SQL
                </Badge>
              </div>
              <div className="px-6 pb-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                      插入来源
                    </Button>
                    <Button variant="outline" size="sm">
                      模板
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 h-8">
                          <Calendar className="w-4 h-4" />
                          {selectedTimeRangeLabel}
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-surface-100 border-border">
                        {timeRanges.map((range) => (
                          <DropdownMenuItem key={range.id} onClick={() => setTimeRange(range.id)}>
                            {range.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
                      字段参考
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      保存查询
                    </Button>
                    <Button size="sm" leftIcon={<Play className="w-4 h-4" />}>
                      运行
                    </Button>
                  </div>
                </div>
                <textarea
                  value={queryDraft}
                  onChange={(e) => setQueryDraft(e.target.value)}
                  className="min-h-[140px] w-full rounded-md border border-border bg-surface-200/80 px-3 py-2 text-[12px] font-mono text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-brand-500/40 focus:border-brand-500/40"
                  placeholder="输入日志查询条件..."
                />
                <div className="flex items-center justify-between text-xs text-foreground-muted">
                  <span>支持 SQL 与表达式查询，结果会同步到下方列表。</span>
                  <span>结果 {filteredLogs.length} 条</span>
                </div>
              </div>
            </div>

            {/* 筛选器 */}
            <div className="page-panel">
              <div className="page-panel-header flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="page-panel-title">筛选器</p>
                  <p className="page-panel-description">按操作、资源与状态过滤日志</p>
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Badge variant="secondary" size="sm">
                      已启用 {activeFilters.length} 项筛选
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={resetFilters} disabled={!hasActiveFilters}>
                    重置筛选
                  </Button>
                </div>
              </div>

              <div className="px-6 pb-6 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[220px] max-w-md">
                    <Input
                      variant="search"
                      inputSize="sm"
                      placeholder="搜索操作日志..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftIcon={<Search className="w-4 h-4" />}
                      className="w-full"
                    />
                  </div>

                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger className="h-8 w-[150px] bg-surface-100 border-border text-[12px] text-foreground-light">
                      <SelectValue placeholder="操作类型" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-100 border-border">
                      <SelectItem value="all">所有操作</SelectItem>
                      {Object.entries(actionTypes).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-8 w-[120px] bg-surface-100 border-border text-[12px] text-foreground-light">
                      <SelectValue placeholder="状态" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-100 border-border">
                      <SelectItem value="all">所有状态</SelectItem>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedResource} onValueChange={setSelectedResource}>
                    <SelectTrigger className="h-8 w-[150px] bg-surface-100 border-border text-[12px] text-foreground-light">
                      <SelectValue placeholder="资源类型" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-100 border-border">
                      <SelectItem value="all">所有资源</SelectItem>
                      {Object.entries(resourceTypes).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedActor} onValueChange={setSelectedActor}>
                    <SelectTrigger className="h-8 w-[160px] bg-surface-100 border-border text-[12px] text-foreground-light">
                      <SelectValue placeholder="操作者" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-100 border-border">
                      <SelectItem value="all">所有操作者</SelectItem>
                      {actorOptions.map((actor) => (
                        <SelectItem key={actor.id} value={actor.id}>
                          {actor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="h-8 w-[150px] bg-surface-100 border-border text-[12px] text-foreground-light">
                      <SelectValue placeholder="时间范围" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-100 border-border">
                      {timeRanges.map((range) => (
                        <SelectItem key={range.id} value={range.id}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                    <span>当前筛选</span>
                    {activeFilters.map((filter) => (
                      <Badge key={filter.id} variant="outline" size="sm">
                        {filter.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 日志列表 */}
            <div className="page-panel">
              <div className="page-panel-header flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="page-panel-title">日志列表</p>
                  <p className="page-panel-description">共 {filteredLogs.length} 条记录</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <Badge variant="success" size="sm">
                    成功 {filteredStats.success}
                  </Badge>
                  <Badge variant="warning" size="sm">
                    警告 {filteredStats.warning}
                  </Badge>
                  <Badge variant="error" size="sm">
                    失败 {filteredStats.failed}
                  </Badge>
                </div>
              </div>
              <div className="border-t border-border">
                {filteredLogs.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="w-5 h-5" />}
                    title="没有匹配的日志"
                    description="尝试调整筛选条件或扩大时间范围。"
                    action={{
                      label: "重置筛选",
                      onClick: resetFilters,
                    }}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[160px]">时间</TableHead>
                        <TableHead className="w-[180px]">操作者</TableHead>
                        <TableHead>动作</TableHead>
                        <TableHead>对象</TableHead>
                        <TableHead className="w-[170px]">结果</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => {
                        const actionConfig = actionTypes[log.action as keyof typeof actionTypes];
                        const resourceConfig = resourceTypes[log.resource as keyof typeof resourceTypes];
                        const status = statusConfig[log.status as keyof typeof statusConfig] ?? statusConfig.info;
                        const ActionIcon = actionConfig?.icon || Info;
                        const ResourceIcon = resourceConfig?.icon || FileText;
                        const StatusIcon = status?.icon || Info;
                        const actorInitial = log.actor?.name?.slice(0, 1) ?? "U";
                        const actorName = log.actor?.name ?? "未知用户";
                        const actorMeta = log.actor?.email ?? log.actor?.id ?? "—";

                        return (
                          <TableRow key={log.id} className="group">
                            <TableCell className="w-[160px] text-xs text-foreground-light">
                              <div className="flex flex-col">
                                <span className="text-[13px] text-foreground">
                                  {formatTimestamp(log.timestamp)}
                                </span>
                                <span className="text-[11px] text-foreground-muted">
                                  {new Date(log.timestamp).toLocaleString("zh-CN", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="w-[180px]">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-200 text-[12px] font-semibold text-foreground">
                                  {actorInitial}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">{actorName}</span>
                                    {log.actor?.role && (
                                      <Badge variant="outline" size="xs">
                                        {log.actor.role}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-foreground-muted truncate">{actorMeta}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[260px]">
                              <div className="flex items-start gap-3">
                                <div
                                  className={cn(
                                    "mt-0.5 flex h-9 w-9 items-center justify-center rounded-md border border-border/60",
                                    actionConfig?.bg ?? "bg-surface-200/70"
                                  )}
                                >
                                  <ActionIcon
                                    className={cn("h-4 w-4", actionConfig?.color ?? "text-foreground-light")}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground">
                                    {actionConfig?.label ?? log.action}
                                  </p>
                                  <p className="text-[12px] text-foreground-light truncate">{log.message}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[220px]">
                              <div className="space-y-1">
                                <Badge
                                  variant="secondary"
                                  size="xs"
                                  icon={<ResourceIcon className="w-3 h-3" />}
                                >
                                  {resourceConfig?.label ?? log.resource}
                                </Badge>
                                <p className="text-[13px] text-foreground">{log.resourceName ?? "—"}</p>
                                {log.resourceId && (
                                  <p className="text-[11px] text-foreground-muted font-mono">
                                    {log.resourceId}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="w-[170px]">
                              <div className="flex flex-col items-start gap-2">
                                <Badge
                                  variant={status?.variant ?? "secondary"}
                                  size="sm"
                                  icon={<StatusIcon className="w-3 h-3" />}
                                >
                                  {status?.label ?? "未知"}
                                </Badge>
                                {log.duration !== undefined && (
                                  <span className="text-[11px] text-foreground-muted">
                                    耗时 {formatDuration(log.duration)}
                                  </span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setSelectedLog(log)}
                                >
                                  详情
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
              {filteredLogs.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-75/60">
                  <p className="text-xs text-foreground-muted">
                    已显示 {filteredLogs.length} 条记录
                    {hasActiveFilters && `，总计 ${stats.total} 条`}
                  </p>
                  <Button variant="outline" size="sm">
                    加载更多日志
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <DrawerDialog
        open={!!selectedLog}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
        title="日志详情"
        description={
          selectedLog
            ? `${selectedLogContext?.action?.label ?? selectedLog.action} · ${
                selectedLogContext?.resource?.label ?? selectedLog.resource
              }`
            : undefined
        }
        side="right"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-md border border-border/60",
                      selectedLogContext?.action?.bg ?? "bg-surface-200/70"
                    )}
                  >
                    <SelectedActionIcon
                      className={cn("h-4 w-4", selectedLogContext?.action?.color ?? "text-foreground-light")}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-foreground-muted">动作</p>
                    <p className="text-base font-semibold text-foreground">
                      {selectedLogContext?.action?.label ?? selectedLog.action}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-foreground-light">{selectedLog.message}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(selectedLog.timestamp).toLocaleString("zh-CN")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {selectedLog.actor?.name ?? "未知用户"}
                  </span>
                  {selectedLog.duration !== undefined && (
                    <span className="inline-flex items-center gap-1">
                      <Play className="w-3.5 h-3.5" />
                      {formatDuration(selectedLog.duration)}
                    </span>
                  )}
                </div>
              </div>
              <Badge
                variant={selectedLogContext?.status?.variant ?? "secondary"}
                size="sm"
                icon={<SelectedStatusIcon className="w-3 h-3" />}
              >
                {selectedLogContext?.status?.label ?? "未知"}
              </Badge>
            </div>

            <div className="page-grid md:grid-cols-2">
              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-[11px] text-foreground-muted">操作者</p>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-200 text-[12px] font-semibold text-foreground">
                    {selectedLog.actor?.name?.slice(0, 1) ?? "U"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {selectedLog.actor?.name ?? "未知用户"}
                    </p>
                    <p className="text-[11px] text-foreground-muted">
                      {selectedLog.actor?.email ?? selectedLog.actor?.id ?? "—"}
                    </p>
                  </div>
                </div>
                {selectedLog.actor?.role && (
                  <Badge variant="outline" size="xs">
                    {selectedLog.actor.role}
                  </Badge>
                )}
              </div>

              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-[11px] text-foreground-muted">对象</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    size="xs"
                    icon={<SelectedResourceIcon className="w-3 h-3" />}
                  >
                    {selectedLogContext?.resource?.label ?? selectedLog.resource}
                  </Badge>
                  <span className="text-sm text-foreground">{selectedLog.resourceName ?? "—"}</span>
                </div>
                {selectedLog.resourceId && (
                  <p className="text-[11px] text-foreground-muted font-mono">
                    {selectedLog.resourceId}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-[11px] text-foreground-muted">访问环境</p>
                <div className="flex items-center gap-2 text-xs text-foreground-light">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>{selectedLog.userAgent}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground-light">
                  <User className="w-3.5 h-3.5" />
                  <span>{selectedLog.ip}</span>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-[11px] text-foreground-muted">执行信息</p>
                <p className="text-xs text-foreground-light">
                  耗时 {formatDuration(selectedLog.duration)}
                </p>
                {selectedLog.error && (
                  <p className="text-[11px] text-foreground-light font-mono bg-surface-200/70 border border-border rounded-md px-2 py-1">
                    {selectedLog.error}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-[11px] text-foreground-muted mb-2">元数据</p>
              {selectedMetadataEntries.length ? (
                <div className="space-y-2">
                  {selectedMetadataEntries.map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3">
                      <span className="text-[11px] uppercase tracking-wide text-foreground-muted">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-[12px] text-foreground">{formatMetadataValue(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-foreground-muted">暂无元数据</p>
              )}
            </div>
          </div>
        )}
      </DrawerDialog>
    </PageContainer>
  );
}
