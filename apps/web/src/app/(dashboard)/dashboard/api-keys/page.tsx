"use client";

/**
 * API 密钥管理页面
 * 创建、管理和监控 API 密钥
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Key,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Search,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
  Clock,
  Shield,
  Settings,
  ExternalLink,
  Calendar,
  X,
  CheckCircle2,
} from "lucide-react";
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
import { EmptyState } from "@/components/dashboard/supabase-ui";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";

// API 密钥数据
const mockApiKeys = [
  {
    id: "key-1",
    name: "前端发布密钥",
    type: "publishable",
    prefix: "pk-live",
    suffix: "8J4p",
    permissions: ["read"],
    status: "active",
    createdAt: "2025-12-15",
    lastUsed: "2026-01-31T14:30:00",
    expiresAt: null,
    usageCount: 15680,
    usageLimit: 50000,
  },
  {
    id: "key-2",
    name: "生产环境密钥",
    type: "secret",
    prefix: "sk-prod",
    suffix: "x8Kj",
    permissions: ["read", "write", "delete"],
    status: "active",
    createdAt: "2026-01-05",
    lastUsed: "2026-01-30T09:15:00",
    expiresAt: "2026-04-05",
    usageCount: 3240,
    usageLimit: 10000,
  },
  {
    id: "key-3",
    name: "测试环境密钥",
    type: "secret",
    prefix: "sk-test",
    suffix: "m3Np",
    permissions: ["read", "write"],
    status: "active",
    createdAt: "2026-01-20",
    lastUsed: "2026-01-28T16:45:00",
    expiresAt: "2026-02-20",
    usageCount: 856,
    usageLimit: 5000,
  },
  {
    id: "key-4",
    name: "Legacy Service Role",
    type: "legacy",
    prefix: "service_role",
    suffix: "t2Uv",
    permissions: ["read", "write"],
    status: "expired",
    createdAt: "2025-10-01",
    lastUsed: "2025-12-31T23:59:00",
    expiresAt: "2025-12-31",
    usageCount: 8900,
    usageLimit: 10000,
  },
];

// 权限配置 - Supabase 风格
const permissionConfig = {
  read: { label: "读取", className: "bg-surface-200 text-foreground-light" },
  write: { label: "写入", className: "bg-brand-200 text-brand-500" },
  delete: { label: "删除", className: "bg-destructive-200 text-destructive" },
};

// 状态配置 - Supabase 风格
const statusConfig = {
  active: { label: "活跃", className: "bg-brand-200 text-brand-500" },
  expired: { label: "已过期", className: "bg-destructive-200 text-destructive" },
  revoked: { label: "已撤销", className: "bg-surface-200 text-foreground-muted" },
};

const typeConfig = {
  publishable: { label: "Publishable", className: "bg-surface-200 text-foreground-light" },
  secret: { label: "Secret", className: "bg-brand-200 text-brand-500" },
  legacy: { label: "Legacy", className: "bg-warning/20 text-warning" },
};

type ApiKey = (typeof mockApiKeys)[number];

// 格式化时间
function formatLastUsed(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} 分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours} 小时前`;
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else {
    return date.toLocaleDateString("zh-CN");
  }
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState(mockApiKeys);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"publishable" | "secret">("secret");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([
    "read",
    "write",
  ]);
  const [newKeyExpiry, setNewKeyExpiry] = useState<string>("never");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  // 复制到剪贴板
  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 切换密钥可见性
  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  // 删除密钥
  const deleteKey = (id: string) => {
    setApiKeys((prev) => prev.filter((key) => key.id !== id));
  };

  // 撤销密钥
  const revokeKey = (id: string) => {
    setApiKeys((prev) =>
      prev.map((key) =>
        key.id === id ? { ...key, status: "revoked" } : key
      )
    );
  };

  const openCreateModal = (type: "publishable" | "secret") => {
    setCreateType(type);
    setNewKeyPermissions(type === "publishable" ? ["read"] : ["read", "write"]);
    setShowCreateModal(true);
  };

  // 创建新密钥
  const createNewKey = () => {
    const isPublishable = createType === "publishable";
    const keyPrefix = isPublishable ? "pk" : "sk";
    const newKey = `${keyPrefix}-${Math.random().toString(36).substring(2, 10)}${Math.random()
      .toString(36)
      .substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    setCreatedKey(newKey);

    const newApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      type: createType,
      prefix: isPublishable ? "pk-live" : "sk-live",
      suffix: newKey.slice(-4),
      permissions: isPublishable ? ["read"] : newKeyPermissions,
      status: "active" as const,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: new Date().toISOString(),
      expiresAt:
        newKeyExpiry === "never"
          ? null
          : new Date(Date.now() + parseInt(newKeyExpiry) * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
      usageCount: 0,
      usageLimit: 10000,
    };

    setApiKeys((prev) => [newApiKey, ...prev]);
  };

  // 关闭创建弹窗
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreatedKey(null);
    setNewKeyName("");
    setCreateType("secret");
    setNewKeyPermissions(["read", "write"]);
    setNewKeyExpiry("never");
  };

  // 切换权限
  const togglePermission = (perm: string) => {
    if (createType === "publishable") {
      return;
    }
    if (newKeyPermissions.includes(perm)) {
      setNewKeyPermissions(newKeyPermissions.filter((p) => p !== perm));
    } else {
      setNewKeyPermissions([...newKeyPermissions, perm]);
    }
  };

  const summary = useMemo(() => {
    const active = apiKeys.filter((key) => key.status === "active").length;
    const totalUsage = apiKeys.reduce((sum, key) => sum + key.usageCount, 0);
    return {
      total: apiKeys.length,
      active,
      totalUsage,
    };
  }, [apiKeys]);

  const currentKeys = useMemo(
    () => apiKeys.filter((key) => key.type !== "legacy"),
    [apiKeys]
  );
  const legacyKeys = useMemo(
    () => apiKeys.filter((key) => key.type === "legacy"),
    [apiKeys]
  );
  const publishableKey = useMemo(
    () => currentKeys.find((key) => key.type === "publishable") ?? null,
    [currentKeys]
  );
  const secretKeys = useMemo(
    () => currentKeys.filter((key) => key.type === "secret"),
    [currentKeys]
  );
  const sectionLinks = useMemo(
    () => [
      {
        id: "publishable-secret",
        label: "Publishable and secret API keys",
        count: currentKeys.length,
      },
      {
        id: "legacy-keys",
        label: "Legacy anon, service_role API keys",
        count: legacyKeys.length,
      },
    ],
    [currentKeys.length, legacyKeys.length]
  );

  const matchesQuery = (key: ApiKey) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return true;
    }
    const haystack = `${key.name} ${key.prefix} ${key.suffix}`.toLowerCase();
    return haystack.includes(normalized);
  };

  const filteredPublishable = useMemo(
    () => (publishableKey && matchesQuery(publishableKey) ? publishableKey : null),
    [publishableKey, query]
  );
  const filteredSecrets = useMemo(
    () => secretKeys.filter(matchesQuery),
    [secretKeys, query]
  );
  const filteredLegacy = useMemo(
    () => legacyKeys.filter(matchesQuery),
    [legacyKeys, query]
  );
  const isPublishable = createType === "publishable";

  const renderKeyCard = (apiKey: ApiKey) => {
    const status = statusConfig[apiKey.status as keyof typeof statusConfig];
    const typeMeta = typeConfig[apiKey.type as keyof typeof typeConfig];
    const isVisible = visibleKeys.has(apiKey.id);

    return (
      <div
        key={apiKey.id}
        className={cn(
          "rounded-md border border-border bg-surface-75/40 p-4 transition-supabase hover:border-border-strong",
          apiKey.type === "legacy" && "border-warning/30 bg-warning/5"
        )}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-foreground">
                {apiKey.name}
              </h3>
              <Badge size="sm" className={typeMeta.className}>
                {typeMeta.label}
              </Badge>
              <Badge size="sm" className={status.className}>
                {status.label}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[12px] text-foreground-light">
              <span className="break-all">
                {isVisible
                  ? `${apiKey.prefix}-${"*".repeat(24)}${apiKey.suffix}`
                  : `${apiKey.prefix}-${"•".repeat(24)}${apiKey.suffix}`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleKeyVisibility(apiKey.id)}
                  className="p-1.5 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-200 transition-colors"
                >
                  {isVisible ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `${apiKey.prefix}-****${apiKey.suffix}`,
                      apiKey.id
                    )
                  }
                  className="p-1.5 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-200 transition-colors"
                >
                  {copiedId === apiKey.id ? (
                    <Check className="w-3.5 h-3.5 text-brand-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-foreground-muted">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                创建于 {apiKey.createdAt}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatLastUsed(apiKey.lastUsed)} 使用
              </span>
              {apiKey.expiresAt && (
                <span className="flex items-center gap-1 text-warning">
                  <AlertTriangle className="w-3 h-3" />
                  {apiKey.expiresAt} 过期
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
              <span className="text-foreground-muted">权限</span>
              {apiKey.permissions.map((perm) => {
                const config =
                  permissionConfig[perm as keyof typeof permissionConfig];
                return (
                  <Badge key={perm} size="sm" className={config.className}>
                    {config.label}
                  </Badge>
                );
              })}
              <span className="lg:ml-auto text-foreground-light">
                使用量 {apiKey.usageCount.toLocaleString()} /{" "}
                {apiKey.usageLimit.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end lg:w-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-foreground-muted hover:text-foreground hover:bg-surface-200"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-surface-100 border-border"
              >
                <DropdownMenuItem className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                  <Settings className="w-4 h-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新生成
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border-muted" />
                {apiKey.status === "active" && (
                  <DropdownMenuItem
                    className="text-foreground-light hover:bg-surface-200"
                    onClick={() => revokeKey(apiKey.id)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    撤销密钥
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive hover:bg-destructive-200"
                  onClick={() => deleteKey(apiKey.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="page-caption text-foreground-muted">Project Settings</div>
        <PageHeader
          title="API 密钥"
          description="配置 publishable 与 secret API keys，用于安全地访问项目资源。"
          actions={(
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ExternalLink className="w-4 h-4" />}
              >
                API 文档
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => openCreateModal("publishable")}
              >
                新建 Publishable key
              </Button>
              <Button
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => openCreateModal("secret")}
              >
                新建 Secret key
              </Button>
            </div>
          )}
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
            <span>总密钥 {summary.total}</span>
            <span className="h-1 w-1 rounded-full bg-foreground-muted" />
            <span>活跃 {summary.active}</span>
            <span className="h-1 w-1 rounded-full bg-foreground-muted" />
            <span>总调用 {summary.totalUsage.toLocaleString()}</span>
          </div>
        </PageHeader>

          <section className="page-section">
            <div className="page-panel">
              <div className="page-panel-header">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="page-panel-title">API keys</h2>
                    <p className="page-panel-description">
                      Configure API keys to securely control access to your project.
                    </p>
                  </div>
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索密钥..."
                    variant="search"
                    inputSize="sm"
                    leftIcon={<Search className="w-4 h-4" />}
                    className="w-full md:w-56"
                  />
                </div>
              </div>

              <div className="px-6 pt-4 pb-6">
                <div className="lg:hidden flex flex-wrap gap-2 mb-4">
                  {sectionLinks.map((link) => (
                    <a
                      key={link.id}
                      href={`#${link.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground-light hover:text-foreground hover:border-border-strong transition-colors"
                    >
                      {link.label}
                      <span className="text-[10px] text-foreground-muted">
                        {link.count}
                      </span>
                    </a>
                  ))}
                </div>

                <div className="page-grid lg:grid-cols-[220px_1fr]">
                  <aside className="hidden lg:block">
                    <div className="sticky top-6 space-y-3">
                      <div className="text-category">On this page</div>
                      <nav className="space-y-1">
                        {sectionLinks.map((link) => (
                          <a
                            key={link.id}
                            href={`#${link.id}`}
                            className="flex items-center justify-between rounded-md px-2 py-1.5 text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-100 transition-colors"
                          >
                            <span>{link.label}</span>
                            <span className="text-[10px] text-foreground-muted">
                              {link.count}
                            </span>
                          </a>
                        ))}
                      </nav>
                    </div>
                  </aside>

                  <div className="space-y-8">
                    <section id="publishable-secret" className="scroll-mt-24 space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Publishable and secret API keys
                        </h3>
                        <p className="text-[13px] text-foreground-light mt-1">
                          Configure keys to securely control access to your project.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">
                              Publishable key
                            </h4>
                            <p className="text-[13px] text-foreground-light">
                              Safe to use in a browser when Row Level Security is enabled.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-[13px] border-border text-foreground-light hover:text-foreground hover:border-border-strong"
                            onClick={() => openCreateModal("publishable")}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            New publishable key
                          </Button>
                        </div>
                        {filteredPublishable ? (
                          renderKeyCard(filteredPublishable)
                        ) : (
                          <EmptyState
                            icon={Key}
                            title="暂无 Publishable key"
                            description="Publishable key 可用于前端环境。"
                            action={{
                              label: "新建 Publishable key",
                              onClick: () => openCreateModal("publishable"),
                              icon: Plus,
                            }}
                          />
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">
                              Secret keys
                            </h4>
                            <p className="text-[13px] text-foreground-light">
                              These keys have privileged access. Use in servers, functions, or backend services.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="h-8 px-3 text-[13px] bg-brand-500 text-background hover:bg-brand-600"
                            onClick={() => openCreateModal("secret")}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            New secret key
                          </Button>
                        </div>

                        <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-[12px] text-foreground-light">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Secret keys 应仅用于服务端
                              </p>
                              <p className="text-[12px] text-foreground-light">
                                请勿将 secret key 暴露在客户端或公开仓库中。
                              </p>
                            </div>
                          </div>
                        </div>

                        {filteredSecrets.length > 0 ? (
                          <div className="space-y-3">
                            {filteredSecrets.map(renderKeyCard)}
                          </div>
                        ) : (
                          <EmptyState
                            icon={Shield}
                            title="暂无 Secret key"
                            description="创建 Secret key 以便服务端安全访问。"
                            action={{
                              label: "新建 Secret key",
                              onClick: () => openCreateModal("secret"),
                              icon: Plus,
                            }}
                          />
                        )}
                      </div>
                    </section>

                    <section id="legacy-keys" className="scroll-mt-24 space-y-3">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Legacy anon, service_role API keys
                        </h3>
                        <p className="text-[13px] text-foreground-light mt-1">
                          推荐迁移到新的 Publishable/Secret keys，旧密钥将逐步弃用。
                        </p>
                      </div>

                      <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-[12px] text-foreground-light">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Legacy keys
                            </p>
                            <p className="text-[12px] text-foreground-light">
                              旧密钥逐步弃用，请规划迁移以确保安全。
                            </p>
                          </div>
                        </div>
                      </div>

                      {filteredLegacy.length > 0 ? (
                        <div className="space-y-3">
                          {filteredLegacy.map(renderKeyCard)}
                        </div>
                      ) : (
                        <EmptyState
                          icon={Key}
                          title="暂无 Legacy key"
                          description="无需使用 Legacy key 时，可保持为空。"
                        />
                      )}
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-background-overlay backdrop-blur-sm z-50"
            onClick={closeCreateModal}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 px-4">
            <div className="page-panel animate-scale-in">
              {createdKey ? (
                <>
                  <div className="page-panel-header flex items-center justify-between">
                    <div>
                      <h3 className="page-panel-title">密钥已创建</h3>
                      <p className="page-panel-description">
                        请立即复制保存，仅可查看一次
                      </p>
                    </div>
                    <button
                      onClick={closeCreateModal}
                      className="p-1.5 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-brand-200 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-brand-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-foreground">
                            {isPublishable ? "Publishable key" : "Secret key"}
                          </h4>
                          <Badge
                            size="sm"
                            className={
                              isPublishable
                                ? "bg-surface-200 text-foreground-light"
                                : "bg-brand-200 text-brand-500"
                            }
                          >
                            {isPublishable ? "Publishable" : "Secret"}
                          </Badge>
                        </div>
                        <p className="text-[13px] text-foreground-light mt-1">
                          这是您唯一一次查看完整密钥的机会
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-md bg-surface-75 border border-border">
                      <p className="text-xs text-foreground-muted mb-2">
                        您的 {isPublishable ? "Publishable" : "Secret"} key
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono text-foreground break-all">
                          {createdKey}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 h-8 w-8 border-border hover:bg-surface-200"
                          onClick={() => copyToClipboard(createdKey, "new")}
                        >
                          {copiedId === "new" ? (
                            <Check className="w-4 h-4 text-brand-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 rounded-md bg-warning/10 border border-warning/30">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                        <p className="text-xs text-foreground-light">
                          关闭此窗口后将无法再次查看完整密钥，请先保存。
                        </p>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-brand-500 hover:bg-brand-600 text-background"
                      onClick={closeCreateModal}
                    >
                      我已保存密钥
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="page-panel-header flex items-center justify-between">
                    <div>
                      <h3 className="page-panel-title">
                        创建新 {isPublishable ? "Publishable" : "Secret"} key
                      </h3>
                      <p className="page-panel-description">
                        {isPublishable
                          ? "可用于前端环境，需启用 RLS。"
                          : "仅用于服务端，避免泄露到客户端。"}
                      </p>
                    </div>
                    <button
                      onClick={closeCreateModal}
                      className="p-1.5 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-[13px] font-medium text-foreground mb-2">
                        密钥名称
                      </label>
                      <Input
                        placeholder={
                          isPublishable
                            ? "例如：Web publishable key"
                            : "例如：生产环境密钥"
                        }
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="h-10 bg-surface-75 border-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-foreground mb-2">
                        权限
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {Object.entries(permissionConfig).map(([key, config]) => {
                          const isDisabled = isPublishable && key !== "read";
                          return (
                            <button
                              key={key}
                              disabled={isDisabled}
                              onClick={() => togglePermission(key)}
                              className={cn(
                                "px-3 py-1.5 rounded-md border text-xs font-medium transition-supabase",
                                isDisabled &&
                                  "cursor-not-allowed border-border text-foreground-muted/60",
                                !isDisabled &&
                                  (newKeyPermissions.includes(key)
                                    ? cn(
                                        "border-brand-500/40 bg-brand-200 text-brand-500",
                                        key === "delete" &&
                                          "border-destructive/40 bg-destructive-200 text-destructive"
                                      )
                                    : "border-border text-foreground-muted hover:border-border-strong hover:text-foreground")
                              )}
                            >
                              {config.label}
                            </button>
                          );
                        })}
                      </div>
                      {isPublishable && (
                        <p className="mt-2 text-[12px] text-foreground-muted">
                          Publishable key 默认只读权限。
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-foreground mb-2">
                        过期时间
                      </label>
                      <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                        <SelectTrigger className="h-10 bg-surface-75 border-border">
                          <SelectValue placeholder="选择过期时间" />
                        </SelectTrigger>
                        <SelectContent className="bg-surface-100 border-border">
                          <SelectItem value="never">永不过期</SelectItem>
                          <SelectItem value="30">30 天</SelectItem>
                          <SelectItem value="90">90 天</SelectItem>
                          <SelectItem value="180">180 天</SelectItem>
                          <SelectItem value="365">1 年</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-border bg-surface-75 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={closeCreateModal}
                      className="border-border-muted text-foreground-light hover:bg-surface-200 hover:text-foreground"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={createNewKey}
                      disabled={!newKeyName || newKeyPermissions.length === 0}
                      className="bg-brand-500 hover:bg-brand-600 text-background"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      创建密钥
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
