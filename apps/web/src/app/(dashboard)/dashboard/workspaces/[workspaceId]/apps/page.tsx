"use client";

/**
 * App 列表与管理页 - Supabase 风格
 * 应用列表、状态筛选、创建入口、发布操作
 */

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Users,
  Clock,
  ChevronRight,
  Loader2,
  Bot,
  Zap,
  Settings,
  Trash2,
  Copy,
  ExternalLink,
  BarChart3,
  Rocket,
  Archive,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appApi, type App } from "@/lib/api/app";
import { workspaceApi, type Workspace } from "@/lib/api/workspace";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  buildWorkspacePermissions,
  hasAnyWorkspacePermission,
  resolveWorkspaceRoleFromUser,
} from "@/lib/permissions";
import { PermissionAction } from "@/components/permissions/permission-action";

// 状态配置
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  draft: { label: "草稿", color: "text-foreground-muted", bgColor: "bg-surface-200", icon: Edit3 },
  published: { label: "已发布", color: "text-brand-500", bgColor: "bg-brand-200", icon: CheckCircle2 },
  deprecated: { label: "已下线", color: "text-warning", bgColor: "bg-warning-200", icon: AlertCircle },
  archived: { label: "已归档", color: "text-foreground-muted", bgColor: "bg-surface-200", icon: Archive },
};

const statusOrder: Record<string, number> = {
  published: 0,
  draft: 1,
  deprecated: 2,
  archived: 3,
};

const sortOptions = [
  { value: "updated_desc", label: "最近更新" },
  { value: "updated_asc", label: "最早更新" },
  { value: "name_asc", label: "名称 A-Z" },
  { value: "name_desc", label: "名称 Z-A" },
  { value: "status", label: "状态优先" },
];

// 访问模式配置
const accessModeConfig: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  private: { label: "私有", icon: Lock, description: "仅成员可访问" },
  public_auth: { label: "需登录", icon: Users, description: "登录用户可访问" },
  public_anonymous: { label: "公开", icon: Globe, description: "任何人可访问" },
};

const visibilityOptions = [
  { value: "all", label: "可见性" },
  ...Object.entries(accessModeConfig).map(([key, config]) => ({
    value: key,
    label: config.label,
  })),
];

const domainStatusOptions = [
  { value: "all", label: "域名状态" },
  { value: "bound", label: "已绑定" },
  { value: "unbound", label: "未绑定" },
];

const timeRangeOptions = [
  { value: "all", label: "全部时间" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
  { value: "90d", label: "近 90 天" },
];

export default function AppsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuthStore();
  const workspaceRole = resolveWorkspaceRoleFromUser(user?.role);
  const permissions = buildWorkspacePermissions(workspaceRole);
  const canCreate = hasAnyWorkspacePermission(permissions, "apps_create", "app_edit");
  const canPublish = hasAnyWorkspacePermission(permissions, "app_publish");
  const canEdit = hasAnyWorkspacePermission(permissions, "app_edit");

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("updated_desc");
  const [origin, setOrigin] = useState("");
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
  const [isBulkArchiving, setIsBulkArchiving] = useState(false);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  
  // 创建应用对话框
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", slug: "", description: "" });
  const [isCreating, setIsCreating] = useState(false);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [workspaceId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ws, appsData] = await Promise.all([
        workspaceApi.get(workspaceId),
        appApi.list({ workspace_id: workspaceId }),
      ]);
      setWorkspace(ws);
      setApps(appsData.items);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 自动生成 slug
  const handleNameChange = (name: string) => {
    setCreateForm({
      ...createForm,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
        .replace(/^-|-$/g, ""),
    });
  };

  // 创建应用
  const handleCreate = async () => {
    if (!createForm.name || !createForm.slug) return;

    try {
      setIsCreating(true);
      const app = await appApi.create({
        workspace_id: workspaceId,
        name: createForm.name,
        slug: createForm.slug,
        description: createForm.description || undefined,
      });
      setShowCreateDialog(false);
      setCreateForm({ name: "", slug: "", description: "" });
      router.push(`/workspaces/${workspaceId}/apps/${app.id}/builder`);
    } catch (error) {
      console.error("Failed to create app:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // 发布应用
  const handlePublish = async (appId: string) => {
    try {
      await appApi.publish(appId);
      loadData();
    } catch (error) {
      console.error("Failed to publish app:", error);
    }
  };

  // 下线应用
  const handleDeprecate = async (appId: string) => {
    try {
      await appApi.deprecate(appId);
      loadData();
    } catch (error) {
      console.error("Failed to deprecate app:", error);
    }
  };

  // 归档应用
  const handleArchive = async (appId: string) => {
    try {
      await appApi.archive(appId);
      loadData();
    } catch (error) {
      console.error("Failed to archive app:", error);
    }
  };

  // 筛选应用
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const accessMode = app.access_policy?.access_mode || "private";
    const matchesVisibility = visibilityFilter === "all" || accessMode === visibilityFilter;
    const matchesDomain =
      domainFilter === "all" || resolveDomainStatus(app) === domainFilter;
    const timeRangeDays =
      timeRangeFilter === "7d"
        ? 7
        : timeRangeFilter === "30d"
        ? 30
        : timeRangeFilter === "90d"
        ? 90
        : null;
    const updatedAt = parseTimestamp(app.updated_at);
    const matchesTimeRange =
      !timeRangeDays || (updatedAt && Date.now() - updatedAt <= timeRangeDays * 86400000);
    return (
      matchesSearch &&
      matchesStatus &&
      matchesVisibility &&
      matchesDomain &&
      matchesTimeRange
    );
  });

  const parseTimestamp = (value?: string) => {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const formatShortDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("zh-CN");
  };

  const resolveDomain = (app: App) => {
    const candidate = (
      app as {
        domain?: string;
        custom_domain?: string;
        primary_domain?: string;
      }
    ).domain ||
      (app as { custom_domain?: string }).custom_domain ||
      (app as { primary_domain?: string }).primary_domain;
    return candidate || "未绑定";
  };

  const resolveLastRun = (app: App) => {
    const candidate = (
      app as { last_run_at?: string; latest_execution_at?: string }
    ).last_run_at || (app as { latest_execution_at?: string }).latest_execution_at;
    const fallback = app.updated_at || app.published_at || app.created_at;
    const value = candidate || fallback;
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("zh-CN");
  };

  const resolveDomainStatus = (app: App) => {
    const domain = resolveDomain(app);
    return domain === "未绑定" ? "unbound" : "bound";
  };

  const resolveRuntimeLink = (app: App) => {
    if (origin && workspace?.slug) {
      return `${origin}/runtime/${workspace.slug}/${app.slug}`;
    }
    return `/workspaces/${workspaceId}/apps/${app.id}`;
  };

  const handleCopyLink = async (app: App) => {
    const link = resolveRuntimeLink(app);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedAppId(app.id);
      setTimeout(() => setCopiedAppId(null), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const toggleSelectApp = (appId: string, checked: boolean | "indeterminate") => {
    setSelectedAppIds((prev) => {
      const next = new Set(prev);
      if (checked === true) {
        next.add(appId);
      } else {
        next.delete(appId);
      }
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean | "indeterminate", appIds: string[]) => {
    setSelectedAppIds((prev) => {
      if (checked === true) {
        const next = new Set(prev);
        appIds.forEach((id) => next.add(id));
        return next;
      }
      const next = new Set(prev);
      appIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleBulkPublish = async (appsToPublish: App[]) => {
    if (appsToPublish.length === 0) return;
    try {
      setIsBulkPublishing(true);
      setBulkActionError(null);
      for (const app of appsToPublish) {
        await appApi.publish(app.id);
      }
      setSelectedAppIds(new Set());
      await loadData();
    } catch (error) {
      console.error("Failed to bulk publish:", error);
      setBulkActionError("批量发布失败，请稍后重试。");
    } finally {
      setIsBulkPublishing(false);
    }
  };

  const handleBulkArchive = async (appsToArchive: App[]) => {
    if (appsToArchive.length === 0) return;
    const confirmed = window.confirm("确定要批量归档选中的应用吗？");
    if (!confirmed) return;
    try {
      setIsBulkArchiving(true);
      setBulkActionError(null);
      for (const app of appsToArchive) {
        await appApi.archive(app.id);
      }
      setSelectedAppIds(new Set());
      await loadData();
    } catch (error) {
      console.error("Failed to bulk archive:", error);
      setBulkActionError("批量归档失败，请稍后重试。");
    } finally {
      setIsBulkArchiving(false);
    }
  };

  const sortedApps = [...filteredApps].sort((a, b) => {
    if (sortKey === "updated_asc") {
      return parseTimestamp(a.updated_at) - parseTimestamp(b.updated_at);
    }
    if (sortKey === "updated_desc") {
      return parseTimestamp(b.updated_at) - parseTimestamp(a.updated_at);
    }
    if (sortKey === "name_asc") {
      return a.name.localeCompare(b.name, "zh-CN", { sensitivity: "base" });
    }
    if (sortKey === "name_desc") {
      return b.name.localeCompare(a.name, "zh-CN", { sensitivity: "base" });
    }
    if (sortKey === "status") {
      const rankA = statusOrder[a.status] ?? 99;
      const rankB = statusOrder[b.status] ?? 99;
      if (rankA !== rankB) return rankA - rankB;
      return b.name.localeCompare(a.name, "zh-CN", { sensitivity: "base" });
    }
    return 0;
  });

  const visibleAppIds = sortedApps.map((app) => app.id);
  const selectedVisibleCount = visibleAppIds.filter((id) => selectedAppIds.has(id)).length;
  const allVisibleSelected = visibleAppIds.length > 0 && selectedVisibleCount === visibleAppIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;
  const selectedApps = sortedApps.filter((app) => selectedAppIds.has(app.id));
  const publishableApps = selectedApps.filter((app) => app.status === "draft");

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.draft;
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

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 页面头部 */}
        <PageHeader
          title="应用管理"
          eyebrow={workspace?.name}
          description="管理工作空间中的应用，发布和监控运行状态"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workspaces/${workspaceId}/settings`}>
                  <Settings className="w-4 h-4 mr-1.5" />
                  设置
                </Link>
              </Button>
              <PermissionAction
                permissions={permissions}
                required={["apps_create", "app_edit"]}
                label="创建应用"
                icon={Plus}
                size="sm"
                onClick={() => setShowCreateDialog(true)}
              />
            </div>
          }
        >
          {/* 统计信息 */}
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              {apps.length} 个应用
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {apps.filter((a) => a.status === "published").length} 个已发布
            </span>
          </div>
        </PageHeader>

        {/* 搜索和筛选 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <Input
              placeholder="搜索应用..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-surface-75 border-border focus:bg-surface-100 focus:border-brand-500"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 bg-surface-75 border-border">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent className="bg-surface-100 border-border">
              <SelectItem value="all">全部状态</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger className="w-[120px] h-9 bg-surface-75 border-border">
              <SelectValue placeholder="可见性" />
            </SelectTrigger>
            <SelectContent className="bg-surface-100 border-border">
              {visibilityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-[120px] h-9 bg-surface-75 border-border">
              <SelectValue placeholder="域名状态" />
            </SelectTrigger>
            <SelectContent className="bg-surface-100 border-border">
              {domainStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
            <SelectTrigger className="w-[120px] h-9 bg-surface-75 border-border">
              <SelectValue placeholder="时间范围" />
            </SelectTrigger>
            <SelectContent className="bg-surface-100 border-border">
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="w-[140px] h-9 bg-surface-75 border-border">
              <SelectValue placeholder="排序" />
            </SelectTrigger>
            <SelectContent className="bg-surface-100 border-border">
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAppIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-100 px-4 py-3">
            <div className="text-[12px] text-foreground-light">
              已选择 {selectedAppIds.size} 个应用
              {publishableApps.length > 0 && (
                <span className="text-foreground-muted">
                  ，其中 {publishableApps.length} 个可发布
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canPublish ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkPublish(publishableApps)}
                  disabled={publishableApps.length === 0 || isBulkPublishing}
                >
                  {isBulkPublishing && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  批量发布
                </Button>
              ) : (
                <PermissionAction
                  permissions={permissions}
                  required={["app_publish"]}
                  label="批量发布"
                  icon={Rocket}
                  size="sm"
                  variant="outline"
                />
              )}
              {canEdit ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkArchive(selectedApps)}
                  disabled={selectedApps.length === 0 || isBulkArchiving}
                >
                  {isBulkArchiving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  批量归档
                </Button>
              ) : (
                <PermissionAction
                  permissions={permissions}
                  required={["app_edit"]}
                  label="批量归档"
                  icon={Archive}
                  size="sm"
                  variant="outline"
                />
              )}
            </div>
            {bulkActionError && (
              <div className="text-[11px] text-destructive">{bulkActionError}</div>
            )}
          </div>
        )}

        {/* 应用列表 */}
        {filteredApps.length === 0 ? (
          <EmptyState
            icon={<Bot className="w-6 h-6" />}
            title={searchQuery || statusFilter !== "all" ? "未找到匹配的应用" : "暂无应用"}
            description={
              searchQuery || statusFilter !== "all"
                ? "尝试调整搜索条件或筛选条件"
                : "创建你的第一个应用，开始构建 AI 工作流"
            }
            action={
              !searchQuery && statusFilter === "all" && canCreate
                ? {
                    label: "创建应用",
                    onClick: () => setShowCreateDialog(true),
                  }
                : undefined
            }
          />
        ) : (
          <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
            {/* 表头 */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
              <div className="col-span-3 flex items-center gap-2">
                <Checkbox
                  checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                  onCheckedChange={(checked) => toggleSelectAll(checked, visibleAppIds)}
                  aria-label="全选应用"
                />
                <span>应用</span>
              </div>
              <div className="col-span-2">状态</div>
              <div className="col-span-1">可见性</div>
              <div className="col-span-1">版本</div>
              <div className="col-span-1">域名</div>
              <div className="col-span-1">最近运行</div>
              <div className="col-span-1">更新时间</div>
              <div className="col-span-2 text-right">操作</div>
            </div>

            {/* 应用行 */}
            {sortedApps.map((app) => {
              const status = getStatusConfig(app.status);
              const StatusIcon = status.icon;
              const accessMode = app.access_policy?.access_mode || "private";
              const access = accessModeConfig[accessMode] || accessModeConfig.private;
              const AccessIcon = access.icon;

              return (
                <div
                  key={app.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border last:border-b-0 hover:bg-surface-75 transition-colors"
                >
                  {/* 应用信息 */}
                  <div className="col-span-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedAppIds.has(app.id)}
                        onCheckedChange={(checked) => toggleSelectApp(app.id, checked)}
                        aria-label={`选择应用 ${app.name}`}
                        className="mt-2"
                      />
                      <Link
                        href={`/workspaces/${workspaceId}/apps/${app.id}`}
                        className="group flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-md bg-surface-200 border border-border flex items-center justify-center text-foreground-light group-hover:border-brand-500/50 transition-colors">
                          {app.icon ? (
                            <span className="text-lg">{app.icon}</span>
                          ) : (
                            <Bot className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-[13px] font-medium text-foreground group-hover:text-brand-500 transition-colors">
                            {app.name}
                          </h3>
                          <p className="text-[11px] text-foreground-muted">
                            /{workspace?.slug}/{app.slug}
                          </p>
                          <p className="text-[10px] text-foreground-muted mt-1">
                            更新于 {formatShortDate(app.updated_at)}
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* 状态 */}
                  <div className="col-span-2 flex items-center">
                    <Badge
                      variant="secondary"
                      className={cn("gap-1", status.bgColor, status.color)}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                  </div>

                  {/* 可见性 */}
                  <div className="col-span-1 flex items-center">
                    <span className="flex items-center gap-1 text-[11px] text-foreground-light">
                      <AccessIcon className="w-3.5 h-3.5" />
                      {access.label}
                    </span>
                  </div>

                  {/* 版本 */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-[12px] text-foreground-light">
                      {app.current_version?.version || "v0.0.0"}
                    </span>
                  </div>

                  {/* 域名 */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-[11px] text-foreground-light truncate">
                      {resolveDomain(app)}
                    </span>
                  </div>

                  {/* 最近运行 */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-[11px] text-foreground-light">
                      {resolveLastRun(app)}
                    </span>
                  </div>

                  {/* 更新时间 */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-[11px] text-foreground-light">
                      {formatShortDate(app.updated_at)}
                    </span>
                  </div>

                  {/* 操作 */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {/* 快捷操作 */}
                    {app.status === "draft" && (
                      <PermissionAction
                        permissions={permissions}
                        required={["app_publish"]}
                        label="发布"
                        icon={Rocket}
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => handlePublish(app.id)}
                      />
                    )}

                    {app.status === "published" && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8"
                      >
                        <Link href={`/workspaces/${workspaceId}/apps/${app.id}/monitoring`}>
                          <BarChart3 className="w-3.5 h-3.5 mr-1" />
                          监控
                        </Link>
                      </Button>
                    )}

                    {/* 更多操作 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-surface-100 border-border">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/workspaces/${workspaceId}/apps/${app.id}`}
                            className="flex items-center gap-2 text-[12px]"
                          >
                            <Eye className="w-4 h-4" />
                            应用概览
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/workspaces/${workspaceId}/apps/${app.id}/builder`}
                            className="flex items-center gap-2 text-[12px]"
                          >
                            <Edit3 className="w-4 h-4" />
                            编辑应用
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCopyLink(app)}
                          className="flex items-center gap-2 text-[12px]"
                        >
                          <Copy className="w-4 h-4" />
                          {copiedAppId === app.id ? "已复制链接" : "复制链接"}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/workspaces/${workspaceId}/apps/${app.id}/monitoring`}
                            className="flex items-center gap-2 text-[12px]"
                          >
                            <BarChart3 className="w-4 h-4" />
                            运行监控
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/workspaces/${workspaceId}/apps/${app.id}/domains`}
                            className="flex items-center gap-2 text-[12px]"
                          >
                            <Globe className="w-4 h-4" />
                            域名管理
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-border" />

                        {app.status === "published" && (
                          <DropdownMenuItem
                            onClick={() => handleDeprecate(app.id)}
                            className="text-[12px] text-warning"
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            下线应用
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => handleArchive(app.id)}
                          className="text-[12px] text-destructive"
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          归档应用
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 创建应用对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">创建应用</DialogTitle>
            <DialogDescription className="text-foreground-light">
              创建一个新的 AI 应用
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                应用名称 <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="例如：日报助手"
                value={createForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="h-9 bg-surface-75 border-border focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                URL 标识 <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-foreground-muted shrink-0">
                  /{workspace?.slug}/
                </span>
                <Input
                  placeholder="daily-report"
                  value={createForm.slug}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, slug: e.target.value })
                  }
                  className="h-9 bg-surface-75 border-border focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                描述（可选）
              </label>
              <Input
                placeholder="简要描述应用功能..."
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                className="h-9 bg-surface-75 border-border focus:border-brand-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-border"
            >
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createForm.name || !createForm.slug || isCreating}
            >
              {isCreating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
