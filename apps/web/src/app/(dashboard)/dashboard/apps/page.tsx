"use client";

/**
 * Workbench - App 列表
 */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { appApi, workspaceApi, type App, type Workspace } from "@/lib/api";
import {
  demoDataPacks,
  demoFlowScript,
  demoScaffoldTemplates,
  containerizationSpec,
  deploymentPipelineStrategy,
  environmentNamingSpec,
  releaseCadencePlan,
  releaseNoteTemplate,
  sampleApps,
  type SampleApp,
} from "@/lib/mock-data";
import {
  PageContainer,
  PageHeader,
  PageWithSidebar,
  SidebarNavGroup,
  SidebarNavItem,
  EmptyState,
} from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { InteractiveArchitecture, type ArchitectureLayer } from "@/components/demo/interactive-architecture";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Cpu,
  Database,
  FileCode,
  Globe,
  Layers,
  Loader2,
  Monitor,
  Search,
  ArrowRight,
  LayoutGrid,
  Server,
  Sparkles,
} from "lucide-react";

const statusStyles: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" }> = {
  draft: { label: "草稿", variant: "default" },
  published: { label: "已发布", variant: "success" },
  deprecated: { label: "已下线", variant: "warning" },
  archived: { label: "已归档", variant: "error" },
};

const releaseWindowTypeStyles = {
  feature: { label: "功能", variant: "success" as const },
  maintenance: { label: "维护", variant: "warning" as const },
  hotfix: { label: "热修复", variant: "error" as const },
};

const releaseWindowStatusStyles = {
  open: { label: "开放", variant: "success" as const },
  restricted: { label: "受限", variant: "secondary" as const },
};

const releaseImpactTone = {
  downtime: "text-foreground",
  affected: "text-foreground-light",
  migration: "text-foreground-muted",
};

const appsSidebarLinks = [
  { id: "workbench-map", label: "Workbench Map", icon: LayoutGrid },
  { id: "sample-apps", label: "示例 App", icon: Sparkles },
  { id: "demo-kit", label: "Demo Kit", icon: Database },
  { id: "demo-script", label: "Demo Script", icon: FileCode },
  { id: "release", label: "Release 策略", icon: Server },
  { id: "release-notes", label: "Release Notes", icon: FileCode },
  { id: "topology", label: "部署拓扑", icon: Monitor },
  { id: "container", label: "容器规范", icon: Cpu },
  { id: "environment", label: "环境命名", icon: Globe },
  { id: "deploy", label: "部署流水线", icon: Layers },
  { id: "apps-list", label: "App 列表", icon: LayoutGrid },
];

const WORKSPACE_STORAGE_KEY = "last_workspace_id";

const workbenchSurfaceStyle: CSSProperties = {
  "--workbench-surface": "#0c1118",
  "--workbench-panel": "rgba(19, 27, 40, 0.92)",
  "--workbench-border": "#233044",
  "--workbench-ink": "#e7efff",
  "--workbench-muted": "#a7b4c9",
  "--workbench-accent": "#f97316",
  "--workbench-accent-soft": "rgba(249, 115, 22, 0.18)",
  "--workbench-spot": "rgba(56, 189, 248, 0.22)",
} as CSSProperties;

const deploymentTopologyLayers: ArchitectureLayer[] = [
  {
    id: "web",
    name: "Web",
    description: "控制台与公开站点入口",
    icon: Monitor,
    color: "#3B82F6",
    components: [
      { name: "Dashboard", desc: "Workbench / Editor 控制台" },
      { name: "Public Site", desc: "官网与营销页面" },
    ],
  },
  {
    id: "api",
    name: "API",
    description: "统一鉴权与服务入口",
    icon: Server,
    color: "#8B5CF6",
    components: [
      { name: "REST API", desc: "应用管理与运行时接口" },
      { name: "WebSocket", desc: "执行状态实时推送" },
    ],
  },
  {
    id: "runtime",
    name: "Runtime",
    description: "执行引擎与任务调度",
    icon: Cpu,
    color: "#10B981",
    components: [
      { name: "Workflow Engine", desc: "工作流编排执行" },
      { name: "Scheduler", desc: "异步队列与重试" },
    ],
  },
  {
    id: "db-provisioner",
    name: "DB Provisioner",
    description: "数据资源创建与管理",
    icon: Database,
    color: "#F59E0B",
    components: [
      { name: "Schema Provision", desc: "数据库初始化与迁移" },
      { name: "Backup/Restore", desc: "备份与回滚策略" },
    ],
  },
  {
    id: "domain-service",
    name: "Domain Service",
    description: "域名验证与证书管理",
    icon: Globe,
    color: "#EC4899",
    components: [
      { name: "DNS 验证", desc: "TXT/CNAME 验证流程" },
      { name: "SSL Issuance", desc: "证书签发与续期" },
    ],
  },
];

const containerTagExample = `agentflow/web:v3.27.0-rc.1+build.42
agentflow/web:stable`;

const environmentNamingExample = `# Base pattern
${environmentNamingSpec.namingPattern}

# Namespace
af-{workspace}-{env}

# Secret prefix
${environmentNamingSpec.environments[2].secretPrefix}{KEY}`;

const complexityStyles: Record<SampleApp["complexity"], { label: string; variant: "success" | "warning" | "error" }> = {
  beginner: { label: "入门", variant: "success" },
  intermediate: { label: "进阶", variant: "warning" },
  advanced: { label: "高级", variant: "error" },
};

const sampleCategoryCount = new Set(sampleApps.map((app) => app.category)).size;

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function AppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeScaffoldId, setActiveScaffoldId] = useState(
    demoScaffoldTemplates[0]?.id ?? ""
  );
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await appApi.list({ page: 1, pageSize: 50 });
        if (!mounted) return;
        setApps(response.data || []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "加载 App 失败");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadWorkspaces = async () => {
      setWorkspaceLoading(true);
      setWorkspaceError(null);
      try {
        const list = await workspaceApi.list();
        if (!mounted) return;
        setWorkspaces(list);
        const storedId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
        const resolvedId =
          (storedId && list.some((workspace) => workspace.id === storedId) && storedId) ||
          list[0]?.id ||
          null;
        if (resolvedId) {
          localStorage.setItem(WORKSPACE_STORAGE_KEY, resolvedId);
        }
        setActiveWorkspaceId(resolvedId);
      } catch (err) {
        if (!mounted) return;
        setWorkspaceError(err instanceof Error ? err.message : "加载工作空间失败");
      } finally {
        if (mounted) setWorkspaceLoading(false);
      }
    };
    loadWorkspaces();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredApps = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return apps;
    return apps.filter((app) => {
      return (
        app.name.toLowerCase().includes(keyword) ||
        app.slug.toLowerCase().includes(keyword) ||
        (app.description || "").toLowerCase().includes(keyword)
      );
    });
  }, [apps, query]);

  const activeScaffold = useMemo(() => {
    if (!demoScaffoldTemplates.length) return undefined;
    return (
      demoScaffoldTemplates.find((template) => template.id === activeScaffoldId) ||
      demoScaffoldTemplates[0]
    );
  }, [activeScaffoldId]);

  const activeWorkspace = useMemo(() => {
    if (!activeWorkspaceId) return null;
    return workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null;
  }, [workspaces, activeWorkspaceId]);

  const workspaceApps = useMemo(() => {
    if (!activeWorkspaceId) return [];
    return apps.filter((app) => app.workspaceId === activeWorkspaceId);
  }, [apps, activeWorkspaceId]);

  const workspaceAppsPreview = useMemo(
    () => workspaceApps.slice(0, 3),
    [workspaceApps]
  );

  const primaryWorkspaceApp = workspaceAppsPreview[0];
  const workspaceAppsHref = activeWorkspaceId
    ? `/dashboard/workspaces/${activeWorkspaceId}/apps`
    : "/dashboard/workspaces";
  const monitoringHref =
    primaryWorkspaceApp && activeWorkspaceId
      ? `/dashboard/workspaces/${activeWorkspaceId}/apps/${primaryWorkspaceApp.id}/monitoring`
      : workspaceAppsHref;

  const workbenchRoutes = [
    {
      id: "workspace",
      step: "01",
      title: "Workspace 切换",
      description: "选择工作空间并进入对应 App 列表",
      href: "/dashboard/workspaces",
      icon: LayoutGrid,
    },
    {
      id: "apps",
      step: "02",
      title: "App 列表",
      description: activeWorkspace
        ? `${activeWorkspace.name} · ${workspaceApps.length} 个 App`
        : "进入工作空间 App 列表",
      href: workspaceAppsHref,
      icon: Layers,
    },
    {
      id: "monitoring",
      step: "03",
      title: "运行监控",
      description: primaryWorkspaceApp
        ? `监控 ${primaryWorkspaceApp.name} 的执行与指标`
        : "查看运行日志与指标",
      href: monitoringHref,
      icon: Monitor,
    },
  ];

  const handleWorkspaceChange = (value: string) => {
    setActiveWorkspaceId(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, value);
    }
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    apps.forEach((app) => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return counts;
  }, [apps]);

  const sidebar = (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
          Workspace Context
        </div>
        {workspaceLoading ? (
          <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            加载工作空间...
          </div>
        ) : workspaceError ? (
          <div className="text-[11px] text-foreground-muted">{workspaceError}</div>
        ) : (
          <>
            <Select value={activeWorkspaceId ?? ""} onValueChange={handleWorkspaceChange}>
              <SelectTrigger className="h-8 bg-surface-75 border-border">
                <SelectValue placeholder="选择工作空间" />
              </SelectTrigger>
              <SelectContent className="bg-surface-100 border-border">
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeWorkspace ? (
              <div className="space-y-1">
                <div className="text-[12px] font-medium text-foreground">
                  {activeWorkspace.name}
                </div>
                <div className="text-[10px] text-foreground-muted">
                  /{activeWorkspace.slug} · {activeWorkspace.plan?.toUpperCase() ?? "PLAN"}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-foreground-muted">
                尚未选择工作空间。
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] text-foreground-muted">
              <span>当前 App</span>
              <span>{workspaceApps.length}</span>
            </div>
          </>
        )}
        <div className="flex items-center justify-between text-[11px] text-foreground-muted">
          <Link href="/dashboard/workspaces" className="hover:text-foreground">
            工作空间列表
          </Link>
          <Link href={workspaceAppsHref} className="text-brand-500 hover:text-brand-400">
            进入 Apps
          </Link>
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
          App 搜索
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 App 名称、Slug"
            className="pl-8 h-8 bg-surface-75 border-border"
          />
        </div>
        <div className="text-[10px] text-foreground-muted">
          共 {filteredApps.length} / {apps.length}
        </div>
      </div>

      <SidebarNavGroup title="导航">
        {appsSidebarLinks.map((item) => {
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

      <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
          状态分布
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {Object.entries(statusStyles).map(([key, style]) => (
            <div key={key} className="rounded-md border border-border bg-surface-75 px-2 py-2">
              <div className="text-foreground-muted">{style.label}</div>
              <div className="text-foreground font-semibold">{statusCounts[key] || 0}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
          App 快览
        </div>
        {workspaceAppsPreview.length > 0 ? (
          <div className="space-y-2">
            {workspaceAppsPreview.map((app) => (
              <div key={app.id} className="flex items-center justify-between text-[12px]">
                <span className="truncate text-foreground">{app.name}</span>
                <Link
                  href={
                    activeWorkspaceId
                      ? `/dashboard/workspaces/${activeWorkspaceId}/apps/${app.id}/monitoring`
                      : "/dashboard/workspaces"
                  }
                  className="text-[11px] text-brand-500 hover:text-brand-400"
                >
                  监控
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-foreground-muted">
            {activeWorkspaceId ? "暂无 App" : "选择工作空间后查看"}
          </div>
        )}
        <div className="flex items-center justify-between text-[11px] text-foreground-muted">
          <span>运行监控入口</span>
          <Link href={monitoringHref} className="text-brand-500 hover:text-brand-400">
            打开监控
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <PageWithSidebar sidebarTitle="Workbench" sidebarWidth="wide" sidebar={sidebar}>
      <PageContainer>
      <PageHeader
        title="Workbench"
        eyebrow="Apps"
        icon={<LayoutGrid className="h-4 w-4" />}
        description="统一查看与管理 App 运行时，进入编辑器即可更新对应的工作流与配置。"
        actions={
          <Button variant="secondary" size="sm" asChild>
            <Link href="/dashboard/workflows/new">
              <Layers className="h-4 w-4" />
              新建工作流
            </Link>
          </Button>
        }
      />

      <section id="workbench-map" className="mt-6" style={workbenchSurfaceStyle}>
        <div className="relative overflow-hidden rounded-2xl border border-(--workbench-border) bg-(--workbench-surface) p-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-(--workbench-accent-soft) blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-12 h-40 w-40 rounded-full bg-(--workbench-spot) blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-(--workbench-muted)">
                Workbench Map
              </div>
              <h2 className="mt-2 text-xl font-semibold text-(--workbench-ink) font-sans">
                工作台信息架构
              </h2>
              <p className="mt-2 text-sm text-(--workbench-muted)">
                围绕 Workspace 上下文串联 App 列表与运行监控，确保主要路径一屏可达。
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {workbenchRoutes.map((route) => {
                  const Icon = route.icon;
                  return (
                    <Link
                      key={route.id}
                      href={route.href}
                      className="group rounded-xl border border-(--workbench-border) bg-(--workbench-panel) p-4 transition hover:-translate-y-0.5 hover:border-(--workbench-accent)/70"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold tracking-[0.25em] text-(--workbench-muted)">
                          {route.step}
                        </span>
                        <Icon className="h-4 w-4 text-(--workbench-muted) transition group-hover:text-(--workbench-accent)" />
                      </div>
                      <div className="mt-3 text-sm font-semibold text-(--workbench-ink) font-sans">
                        {route.title}
                      </div>
                      <p className="mt-1 text-xs text-(--workbench-muted)">
                        {route.description}
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-(--workbench-accent)">
                        进入路径
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-(--workbench-muted)">
                <span className="rounded-full border border-(--workbench-border) px-2 py-1">
                  /workspaces
                </span>
                <span className="rounded-full border border-(--workbench-border) px-2 py-1">
                  /workspaces/&#123;workspaceId&#125;/apps
                </span>
                <span className="rounded-full border border-(--workbench-border) px-2 py-1">
                  /workspaces/&#123;workspaceId&#125;/apps/&#123;appId&#125;/monitoring
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-(--workbench-border) bg-(--workbench-panel) p-4">
                <div className="text-[10px] uppercase tracking-[0.35em] text-(--workbench-muted)">
                  当前 Workspace
                </div>
                {workspaceLoading ? (
                  <div className="mt-3 flex items-center gap-2 text-xs text-(--workbench-muted)">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    加载工作空间...
                  </div>
                ) : workspaceError ? (
                  <div className="mt-3 text-xs text-(--workbench-muted)">
                    {workspaceError}
                  </div>
                ) : activeWorkspace ? (
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="text-base font-semibold text-(--workbench-ink) font-sans">
                        {activeWorkspace.name}
                      </div>
                      <div className="text-[11px] text-(--workbench-muted)">
                        /{activeWorkspace.slug} · {activeWorkspace.plan?.toUpperCase() ?? "PLAN"}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-(--workbench-muted)">
                      <span>App 总数 {workspaceApps.length}</span>
                      <Link
                        href={workspaceAppsHref}
                        className="text-(--workbench-accent) hover:text-(--workbench-ink)"
                      >
                        进入 App 列表
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-(--workbench-muted)">
                    尚未创建工作空间。
                  </div>
                )}
                <div className="mt-3">
                  <Link
                    href="/dashboard/workspaces"
                    className="inline-flex items-center gap-1 text-[11px] text-(--workbench-ink) hover:text-(--workbench-accent)"
                  >
                    查看工作空间列表
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-(--workbench-border) bg-(--workbench-panel) p-4">
                <div className="text-[10px] uppercase tracking-[0.35em] text-(--workbench-muted)">
                  App 预览
                </div>
                {workspaceAppsPreview.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {workspaceAppsPreview.map((app) => (
                      <div key={app.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[12px] text-(--workbench-ink)">
                          <span className="h-2 w-2 rounded-full bg-(--workbench-accent)" />
                          <span className="font-medium">{app.name}</span>
                        </div>
                        <Link
                          href={
                            activeWorkspaceId
                              ? `/dashboard/workspaces/${activeWorkspaceId}/apps/${app.id}/monitoring`
                              : "/dashboard/workspaces"
                          }
                          className="text-[11px] text-(--workbench-accent) hover:text-(--workbench-ink)"
                        >
                          监控
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-(--workbench-muted)">
                    {activeWorkspaceId ? "暂无 App，可先创建工作流。" : "选择工作空间后查看 App。"}
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between text-[11px] text-(--workbench-muted)">
                  <span>运行监控入口</span>
                  <Link
                    href={monitoringHref}
                    className="text-(--workbench-accent) hover:text-(--workbench-ink)"
                  >
                    打开监控
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sample-apps" className="mt-6 rounded-md border border-border bg-surface-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-muted">示例 App</div>
            <h2 className="text-sm font-medium text-foreground">内置示例 App 清单</h2>
            <p className="text-xs text-foreground-light">
              覆盖 {sampleCategoryCount} 类典型场景，可直接用于演示或二次改造
            </p>
          </div>
          <Badge variant="secondary" size="sm" className="bg-surface-200 text-foreground-light">
            共 {sampleApps.length} 个示例
          </Badge>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sampleApps.map((app) => {
            const complexity = complexityStyles[app.complexity];
            return (
              <div
                key={app.id}
                className="rounded-md border border-border bg-surface-75/80 p-4 transition hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-md bg-surface-200 flex items-center justify-center text-lg">
                      {app.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-foreground truncate">{app.name}</h3>
                        <Badge variant="outline" size="xs">
                          {app.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground-muted">{app.scenario}</p>
                    </div>
                  </div>
                  <Badge variant={complexity.variant} size="xs">
                    {complexity.label}
                  </Badge>
                </div>

                <p className="mt-3 text-xs text-foreground-light line-clamp-2">{app.description}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {app.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" size="xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-foreground-muted">
                  <span>更新于 {formatDate(app.updatedAt)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-brand-500 hover:text-brand-400"
                    asChild
                  >
                    <Link href={app.href}>
                      查看模板
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="demo-kit" className="mt-6 rounded-md border border-border bg-surface-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-muted">Demo Kit</div>
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-500" />
              Demo 数据与脚手架
            </h2>
            <p className="text-xs text-foreground-light">
              提供可直接演示的数据包与脚手架模板，快速搭建演示环境
            </p>
          </div>
          <Badge variant="secondary" size="sm" className="bg-surface-200 text-foreground-light">
            数据包 {demoDataPacks.length} · 模板 {demoScaffoldTemplates.length}
          </Badge>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
              Demo 数据包
            </div>
            <div className="grid gap-3">
              {demoDataPacks.map((pack) => (
                <div
                  key={pack.id}
                  className="rounded-md border border-border bg-surface-75/80 p-4 transition hover:border-border-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-md bg-surface-200 flex items-center justify-center">
                        <Database className="h-4 w-4 text-foreground-muted" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground">{pack.name}</h3>
                          <Badge variant="outline" size="xs">
                            {pack.format.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground-light">{pack.description}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" size="xs">
                      {pack.size}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-foreground-muted">
                    <span>{pack.records.toLocaleString()} 条记录</span>
                    <span>{pack.fields} 字段</span>
                    <span>更新于 {formatDate(pack.updatedAt)}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {pack.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" size="xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface-75/80 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
                  脚手架模板
                </div>
                <div className="text-sm font-medium text-foreground">快速演示模板</div>
              </div>
              <FileCode className="h-4 w-4 text-foreground-muted" />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {demoScaffoldTemplates.map((template) => (
                <Button
                  key={template.id}
                  variant={activeScaffoldId === template.id ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-7 text-[11px]",
                    activeScaffoldId === template.id
                      ? "bg-surface-200 text-foreground"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                  onClick={() => setActiveScaffoldId(template.id)}
                >
                  {template.name}
                </Button>
              ))}
            </div>

            {activeScaffold ? (
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-xs text-foreground-light">
                    {activeScaffold.description}
                  </div>
                  <div className="text-[11px] text-foreground-muted mt-1">
                    更新于 {formatDate(activeScaffold.updatedAt)}
                  </div>
                </div>
                <CodeBlock
                  code={activeScaffold.code}
                  language={activeScaffold.language}
                  filename={activeScaffold.entry}
                  showLineNumbers={false}
                  collapsible
                  defaultCollapsed
                />
                <div className="flex flex-wrap gap-2">
                  {activeScaffold.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" size="xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-foreground-muted">暂无可用脚手架模板</div>
            )}
          </div>
        </div>
      </section>

      <section id="demo-script" className="mt-6 rounded-md border border-border bg-surface-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-muted">Demo Script</div>
            <h2 className="text-sm font-medium text-foreground">
              {demoFlowScript.title}
            </h2>
            <p className="text-xs text-foreground-light">{demoFlowScript.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
            <Badge variant="secondary" size="xs">
              总时长 {demoFlowScript.totalDuration}
            </Badge>
            <Badge variant="secondary" size="xs">
              {demoFlowScript.steps.length} 个步骤
            </Badge>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-foreground-muted">
          <span>适用对象：</span>
          {demoFlowScript.audience.map((role) => (
            <Badge key={role} variant="secondary" size="xs">
              {role}
            </Badge>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-foreground-muted">
          {demoFlowScript.notes.map((note, index) => (
            <span key={note}>
              {index + 1}. {note}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {demoFlowScript.steps.map((step, index) => (
            <div
              key={step.id}
              className="rounded-md border border-border bg-surface-75/80 p-4 transition hover:border-border-strong"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-md bg-surface-200 flex items-center justify-center text-xs font-semibold text-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">{step.title}</h3>
                      <Badge variant="outline" size="xs">
                        {step.duration}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground-muted mt-1">
                      负责人：{step.owner} · {step.goal}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {step.actions.map((action) => (
                  <Badge key={action} variant="secondary" size="xs">
                    {action}
                  </Badge>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-foreground-muted">
                <span>输出：{step.deliverable}</span>
                <div className="flex items-center gap-2">
                  {step.links.map((link) => (
                    <Button
                      key={link.label}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] text-brand-500 hover:text-brand-400"
                      asChild
                    >
                      <Link href={link.href}>
                        {link.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="release" className="mt-6 rounded-md border border-border bg-surface-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-muted">Release</div>
            <h2 className="text-sm font-medium text-foreground">{releaseCadencePlan.title}</h2>
            <p className="text-xs text-foreground-light">{releaseCadencePlan.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
            <Badge variant="secondary" size="xs">
              {releaseCadencePlan.timezone}
            </Badge>
            <Badge variant="secondary" size="xs">
              负责人 {releaseCadencePlan.owner}
            </Badge>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-md border border-border bg-surface-75/80 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-surface-200/60 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
              <div className="col-span-3">窗口</div>
              <div className="col-span-2">频率</div>
              <div className="col-span-2">时间</div>
              <div className="col-span-3">范围</div>
              <div className="col-span-2">Gate</div>
            </div>
            {releaseCadencePlan.regularWindows.map((window) => {
              const typeStyle = releaseWindowTypeStyles[window.type];
              const statusStyle = releaseWindowStatusStyles[window.status];
              return (
                <div
                  key={window.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-200/40 transition-colors"
                >
                  <div className="col-span-3">
                    <div className="text-[12px] font-medium text-foreground">{window.label}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant={typeStyle.variant} size="xs">
                        {typeStyle.label}
                      </Badge>
                      <Badge variant={statusStyle.variant} size="xs">
                        {statusStyle.label}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-foreground-muted mt-1">
                      负责人：{window.owner}
                    </div>
                  </div>
                  <div className="col-span-2 text-[12px] text-foreground-light">
                    {window.cadence}
                  </div>
                  <div className="col-span-2 text-[12px] text-foreground-light">
                    {window.timeRange}
                  </div>
                  <div className="col-span-3 text-[11px] text-foreground-muted">
                    {window.scope}
                  </div>
                  <div className="col-span-2 text-[11px] text-foreground-muted">
                    {window.gate}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                冻结窗口
              </div>
              <div className="space-y-3">
                {releaseCadencePlan.freezeWindows.map((window) => (
                  <div key={window.id} className="space-y-1">
                    <div className="text-[12px] font-medium text-foreground">{window.label}</div>
                    <div className="text-[11px] text-foreground-muted">{window.rule}</div>
                    <div className="text-[10px] text-warning">{window.notes}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                Hotfix 策略
              </div>
              <div className="space-y-2 text-[11px] text-foreground-muted">
                <div>触发窗口：{releaseCadencePlan.hotfixPolicy.window}</div>
                <div>审批：{releaseCadencePlan.hotfixPolicy.approval}</div>
                <div>回滚：{releaseCadencePlan.hotfixPolicy.rollback}</div>
                <div>沟通：{releaseCadencePlan.hotfixPolicy.comms}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-md border border-border bg-surface-75/80 p-4">
            <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
              发布通道
            </div>
            <div className="space-y-3">
              {releaseCadencePlan.channels.map((channel) => (
                <div key={channel.id} className="rounded-md border border-border/60 bg-surface-100/60 p-3">
                  <div className="flex items-center justify-between text-[12px] text-foreground">
                    <span className="font-medium">{channel.label}</span>
                    <span className="text-[11px] text-foreground-muted">{channel.duration}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-surface-300 overflow-hidden">
                    <div
                      className="h-full bg-brand-500"
                      style={{ width: `${Math.min(channel.rollout, 100)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-foreground-muted mt-2">
                    保障阈值：{channel.guardrail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface-75/80 p-4">
            <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
              发布检查清单
            </div>
            <div className="space-y-2">
              {releaseCadencePlan.checklist.map((item, index) => (
                <div key={item} className="flex items-center gap-2 text-[12px] text-foreground-light">
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                  <span>
                    {index + 1}. {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="release-notes" className="mt-6 rounded-md border border-border bg-surface-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-muted">Release Notes</div>
            <h2 className="text-sm font-medium text-foreground">
              版本变更公告模板
            </h2>
            <p className="text-xs text-foreground-light">
              {releaseNoteTemplate.title} · {releaseNoteTemplate.version}
            </p>
          </div>
          <Badge variant="secondary" size="xs">
            {releaseNoteTemplate.date}
          </Badge>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-md border border-border bg-surface-75/80 p-4">
            <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
              摘要
            </div>
            <p className="text-sm text-foreground mt-2">{releaseNoteTemplate.summary}</p>

            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-2">
                Highlights
              </div>
              <div className="flex flex-wrap gap-2">
                {releaseNoteTemplate.highlights.map((item) => (
                  <Badge key={item} variant="secondary" size="xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {releaseNoteTemplate.sections.map((section) => (
                <div key={section.title}>
                  <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
                    {section.title}
                  </div>
                  <ul className="mt-2 space-y-1 text-[12px] text-foreground-light">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                影响评估
              </div>
              <div className="space-y-2 text-[12px]">
                <div className={releaseImpactTone.downtime}>
                  停机：{releaseNoteTemplate.impact.downtime}
                </div>
                <div className={releaseImpactTone.affected}>
                  影响范围：{releaseNoteTemplate.impact.affected}
                </div>
                <div className={releaseImpactTone.migration}>
                  迁移：{releaseNoteTemplate.impact.migration}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                回滚方案
              </div>
              <p className="text-[12px] text-foreground-light">{releaseNoteTemplate.rollback}</p>
            </div>

            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                相关链接
              </div>
              <div className="flex flex-wrap gap-2">
                {releaseNoteTemplate.links.map((link) => (
                  <Button
                    key={link.label}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-brand-500 hover:text-brand-400"
                    asChild
                  >
                    <Link href={link.href}>
                      {link.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                致谢
              </div>
              <div className="flex flex-wrap gap-2">
                {releaseNoteTemplate.acknowledgements.map((item) => (
                  <Badge key={item} variant="secondary" size="xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="topology" className="mt-6 rounded-md border border-border bg-surface-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-muted">Topology</div>
            <h2 className="text-sm font-medium text-foreground">部署拓扑图</h2>
            <p className="text-xs text-foreground-light">
              覆盖 Web / API / Runtime / DB Provisioner / Domain Service
            </p>
          </div>
          <Badge variant="secondary" size="xs">
            指导部署
          </Badge>
        </div>
        <div className="mt-4">
          <InteractiveArchitecture
            layers={deploymentTopologyLayers}
            defaultExpanded="api"
            showConnections
            layout="vertical"
          />
        </div>
      </section>

      <section id="container" className="mt-6 rounded-md border border-border bg-surface-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-muted">Container</div>
            <h2 className="text-sm font-medium text-foreground">容器化与镜像规范</h2>
            <p className="text-xs text-foreground-light">
              Registry：{containerizationSpec.registry}
            </p>
          </div>
          <Badge variant="secondary" size="xs">
            更新于 {formatDate(containerizationSpec.lastUpdated)}
          </Badge>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-md border border-border bg-surface-75/80 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-surface-200/60 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
              <div className="col-span-2">服务</div>
              <div className="col-span-3">镜像仓库</div>
              <div className="col-span-2">运行时</div>
              <div className="col-span-3">标签策略</div>
              <div className="col-span-2">回滚</div>
            </div>
            {containerizationSpec.images.map((image) => (
              <div
                key={image.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-200/40 transition-colors"
              >
                <div className="col-span-2">
                  <div className="text-[12px] font-medium text-foreground">{image.service}</div>
                  <div className="text-[10px] text-foreground-muted">health: {image.healthCheck}</div>
                </div>
                <div className="col-span-3 text-[12px] text-foreground-light">
                  {image.repository}
                </div>
                <div className="col-span-2">
                  <Badge variant="outline" size="xs">
                    {image.runtime}
                  </Badge>
                </div>
                <div className="col-span-3 text-[11px] text-foreground-muted">
                  {image.tagPolicy}
                </div>
                <div className="col-span-2 text-[11px] text-foreground-muted">
                  {image.rollback}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                标签规范
              </div>
              <CodeBlock
                code={`# Tag format\n${containerizationSpec.tagFormat}\n\n# Example\n${containerTagExample}`}
                language="bash"
                showLineNumbers={false}
                collapsible
                defaultCollapsed
              />
              <div className="mt-3 text-[11px] text-foreground-muted">
                Latest：{containerizationSpec.latestTag}
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                构建与合规
              </div>
              <div className="space-y-2 text-[12px] text-foreground-light">
                <div>保留策略：{containerizationSpec.retention}</div>
                <div>扫描策略：{containerizationSpec.scanPolicy}</div>
                <div>签名策略：{containerizationSpec.signingPolicy}</div>
                <div>回滚策略：{containerizationSpec.rollbackPolicy}</div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                构建流水线
              </div>
              <div className="space-y-2">
                {containerizationSpec.buildPipeline.map((step, index) => (
                  <div key={step} className="flex items-center gap-2 text-[12px] text-foreground-light">
                    <span className="h-2 w-2 rounded-full bg-brand-500" />
                    <span>
                      {index + 1}. {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="environment" className="mt-6 rounded-md border border-border bg-surface-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-muted">Environment</div>
            <h2 className="text-sm font-medium text-foreground">{environmentNamingSpec.title}</h2>
            <p className="text-xs text-foreground-light">{environmentNamingSpec.description}</p>
          </div>
          <Badge variant="secondary" size="xs">
            更新于 {formatDate(environmentNamingSpec.lastUpdated)}
          </Badge>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-md border border-border bg-surface-75/80 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-surface-200/60 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
              <div className="col-span-2">环境</div>
              <div className="col-span-3">命名空间</div>
              <div className="col-span-3">域名</div>
              <div className="col-span-2">保留</div>
              <div className="col-span-2">访问</div>
            </div>
            {environmentNamingSpec.environments.map((env) => (
              <div
                key={env.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-200/40 transition-colors"
              >
                <div className="col-span-2">
                  <Badge variant="secondary" size="xs">
                    {env.env}
                  </Badge>
                  <div className="text-[11px] text-foreground-muted mt-1">{env.label}</div>
                </div>
                <div className="col-span-3 text-[12px] text-foreground-light">
                  {env.namespace}
                </div>
                <div className="col-span-3 text-[12px] text-foreground-light">
                  {env.domainPattern}
                </div>
                <div className="col-span-2 text-[11px] text-foreground-muted">
                  {env.dataRetention}
                </div>
                <div className="col-span-2 text-[11px] text-foreground-muted">
                  {env.access}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                命名规范示例
              </div>
              <CodeBlock
                code={environmentNamingExample}
                language="bash"
                showLineNumbers={false}
                collapsible
                defaultCollapsed
              />
              <div className="mt-3 text-[11px] text-foreground-muted">
                配置前缀：{environmentNamingSpec.environments.map((env) => env.configPrefix).join(" / ")}
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                资源命名规则
              </div>
              <div className="space-y-2 text-[12px] text-foreground-light">
                {environmentNamingSpec.resourceRules.map((rule) => (
                  <div key={rule.id} className="space-y-1">
                    <div className="font-medium text-foreground">{rule.resource}</div>
                    <div className="text-[11px] text-foreground-muted">{rule.pattern}</div>
                    <div className="text-[11px] text-foreground-muted">示例：{rule.example}</div>
                    <div className="text-[10px] text-warning">{rule.notes}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                隔离准则
              </div>
              <div className="space-y-2">
                {environmentNamingSpec.guardrails.map((rule, index) => (
                  <div key={rule} className="flex items-center gap-2 text-[12px] text-foreground-light">
                    <span className="h-2 w-2 rounded-full bg-brand-500" />
                    <span>
                      {index + 1}. {rule}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="deploy" className="mt-6 rounded-md border border-border bg-surface-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-muted">Deploy</div>
            <h2 className="text-sm font-medium text-foreground">{deploymentPipelineStrategy.title}</h2>
            <p className="text-xs text-foreground-light">{deploymentPipelineStrategy.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
            <Badge variant="secondary" size="xs">
              更新于 {formatDate(deploymentPipelineStrategy.lastUpdated)}
            </Badge>
            {deploymentPipelineStrategy.toolchain.map((tool) => (
              <Badge key={tool} variant="outline" size="xs">
                {tool}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-foreground-muted">
          <span>触发：</span>
          {deploymentPipelineStrategy.triggers.map((trigger, index) => (
            <span key={trigger}>
              {index + 1}. {trigger}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-md border border-border bg-surface-75/80 p-4">
            <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
              流水线阶段
            </div>
            <div className="space-y-3">
              {deploymentPipelineStrategy.stages.map((stage, index) => (
                <div key={stage.id} className="rounded-md border border-border/60 bg-surface-100/60 p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-md bg-surface-200 flex items-center justify-center text-[11px] font-semibold text-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-[12px] font-medium text-foreground">{stage.name}</div>
                        <Badge variant="outline" size="xs">
                          {stage.duration}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-foreground-muted mt-1">负责人：{stage.owner}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {stage.gates.map((gate) => (
                          <Badge key={gate} variant="secondary" size="xs">
                            {gate}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2 text-[11px] text-foreground-muted">
                        输出：{stage.outputs.join(" / ")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                灰度放量阶梯
              </div>
              <div className="space-y-3">
                {deploymentPipelineStrategy.canary.trafficSteps.map((step) => (
                  <div key={step.id} className="rounded-md border border-border/60 bg-surface-100/60 p-3">
                    <div className="flex items-center justify-between text-[12px] text-foreground">
                      <span className="font-medium">{step.label}</span>
                      <span className="text-[11px] text-foreground-muted">{step.duration}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-surface-300 overflow-hidden">
                      <div
                        className="h-full bg-brand-500"
                        style={{ width: `${Math.min(step.traffic, 100)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-foreground-muted mt-2">达标：{step.successCriteria}</div>
                    <div className="text-[10px] text-warning mt-1">回滚：{step.rollback}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface-75/80 p-4">
              <div className="text-[11px] uppercase tracking-wider text-foreground-muted mb-3">
                灰度指标与回滚
              </div>
              <div className="space-y-3 text-[11px] text-foreground-muted">
                <div className="space-y-2">
                  {deploymentPipelineStrategy.canary.metrics.map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between gap-2">
                      <span className="text-foreground">{metric.name}</span>
                      <span>
                        {metric.threshold} · {metric.window}
                      </span>
                    </div>
                  ))}
                </div>
                <div>手动审批：{deploymentPipelineStrategy.canary.manualApproval}</div>
                <div>
                  自动回滚触发：
                  <div className="mt-2 space-y-1">
                    {deploymentPipelineStrategy.canary.autoRollback.map((rule) => (
                      <div key={rule} className="text-[11px] text-foreground-muted">
                        - {rule}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  冻结规则：
                  <div className="mt-2 space-y-1">
                    {deploymentPipelineStrategy.canary.freezeRules.map((rule) => (
                      <div key={rule} className="text-[11px] text-foreground-muted">
                        - {rule}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="apps-list" className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-muted">Apps</div>
            <h2 className="text-sm font-medium text-foreground">App 列表</h2>
            <p className="text-xs text-foreground-light">
              {query ? `当前搜索：${query}` : "按 Workspace 统一管理 App 资产"}
            </p>
          </div>
          <Badge variant="secondary" size="xs" className="bg-surface-200 text-foreground-light">
            {filteredApps.length} / {apps.length}
          </Badge>
        </div>

        <div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载 App 列表...
          </div>
        ) : error ? (
          <EmptyState
            icon={<Layers className="h-5 w-5" />}
            title="加载失败"
            description={error}
          />
        ) : filteredApps.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-5 w-5" />}
            title="暂无 App"
            description="先从工作流或 AI 创建一个 App，即可在 Workbench 中统一管理。"
            action={{ label: "去创建工作流", href: "/dashboard/workflows/new" }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredApps.map((app) => {
              const status = statusStyles[app.status] || { label: app.status, variant: "default" as const };
              return (
                <div
                  key={app.id}
                  className={cn(
                    "group rounded-lg border border-border bg-surface-100 p-4",
                    "hover:border-brand-500/50 hover:shadow-sm transition"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-md bg-surface-200 flex items-center justify-center text-lg">
                        {app.icon || "📦"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground truncate">{app.name}</h3>
                          <Badge variant={status.variant} size="xs">
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground-muted truncate">/{app.slug}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-foreground-muted hover:text-foreground" asChild>
                      <Link href={`/apps/editor/${app.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  {app.description && (
                    <p className="mt-3 text-xs text-foreground-light line-clamp-2">{app.description}</p>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs text-foreground-muted">
                    <span>
                      Workspace: {app.workspace?.name || "未命名空间"}
                    </span>
                    <span>更新于 {formatDate(app.updatedAt)}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-foreground-muted">
                    <span>版本: {app.currentVersionId ? "已绑定" : "未绑定"}</span>
                    <Link
                      href={`/apps/editor/${app.id}`}
                      className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-400"
                    >
                      打开编辑器
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </section>
    </PageContainer>
  </PageWithSidebar>
  );
}
