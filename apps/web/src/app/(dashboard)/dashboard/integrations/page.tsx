"use client";

/**
 * 集成市场页面
 * 展示可用的第三方服务集成和插件
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import { Download, ExternalLink, Key, Plus, Search, Settings, Star } from "lucide-react";

// 集合筛选（对齐 Supabase Integrations）
const collections = [
  { id: "all", label: "All" },
  { id: "wrappers", label: "Wrappers" },
  { id: "modules", label: "Postgres Modules" },
  { id: "graphql", label: "GraphQL" },
  { id: "vault", label: "Vault beta" },
];

const collectionLabelMap = new Map(
  collections.map((collection) => [collection.id, collection.label])
);

const releaseBadgeLabel = {
  alpha: "Alpha",
  beta: "Beta",
} as const;

const releaseBadgeVariant = {
  alpha: "info",
  beta: "warning",
} as const;

// 集成数据
const integrations = [
  {
    id: "cron",
    name: "Cron",
    description: "在 Postgres 中调度周期任务，驱动批处理与自动化触发。",
    collection: "modules",
    icon: "⏱️",
    color: "bg-surface-200",
    official: true,
    installed: true,
    popular: true,
    installs: 8600,
    rating: 4.8,
    features: ["计划任务", "时区调度", "失败重试"],
  },
  {
    id: "queues",
    name: "Queues",
    description: "轻量消息队列，为工作流任务提供延迟与并发控制。",
    collection: "modules",
    icon: "📦",
    color: "bg-surface-200",
    official: true,
    installed: false,
    popular: true,
    installs: 9200,
    rating: 4.7,
    features: ["延迟队列", "并发控制", "重试策略"],
  },
  {
    id: "db-webhooks",
    name: "Database Webhooks",
    description: "将数据库事件实时推送至外部系统或工作流端点。",
    collection: "modules",
    icon: "🔗",
    color: "bg-surface-200",
    official: true,
    installed: false,
    popular: true,
    installs: 6800,
    rating: 4.6,
    features: ["事件订阅", "签名校验", "重放保护"],
  },
  {
    id: "graphql",
    name: "GraphQL",
    description: "使用 GraphQL 查询工作流数据，并提供交互式 IDE。",
    collection: "graphql",
    icon: "🔺",
    color: "bg-surface-200",
    official: true,
    installed: true,
    popular: true,
    installs: 10400,
    rating: 4.8,
    features: ["Schema 生成", "GraphiQL", "权限控制"],
  },
  {
    id: "vault",
    name: "Vault",
    description: "应用级加密与密钥管理，保护敏感凭据与秘密。",
    collection: "vault",
    icon: "🛡️",
    color: "bg-surface-200",
    official: true,
    release: "beta",
    installed: true,
    popular: false,
    installs: 3500,
    rating: 4.4,
    features: ["密钥轮换", "字段加密", "审计日志"],
  },
  {
    id: "slack",
    name: "Slack",
    description: "将 AI 工作流与 Slack 集成，自动发送通知和消息。",
    collection: "wrappers",
    icon: "🔔",
    color: "bg-surface-200",
    official: true,
    installed: true,
    popular: true,
    installs: 12500,
    rating: 4.8,
    features: ["消息通知", "工作流触发", "频道管理"],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "连接 Google Drive，自动同步文件和文档。",
    collection: "wrappers",
    icon: "📁",
    color: "bg-surface-200",
    official: true,
    installed: true,
    popular: true,
    installs: 18200,
    rating: 4.9,
    features: ["文件同步", "自动备份", "权限管理"],
  },
  {
    id: "notion",
    name: "Notion",
    description: "与 Notion 数据库集成，自动更新和创建页面。",
    collection: "wrappers",
    icon: "📝",
    color: "bg-surface-200",
    official: true,
    installed: false,
    popular: true,
    installs: 15800,
    rating: 4.7,
    features: ["数据库同步", "页面创建", "内容导出"],
  },
  {
    id: "github",
    name: "GitHub",
    description: "连接 GitHub 仓库，自动化代码审查和 Issue 管理。",
    collection: "wrappers",
    icon: "🐙",
    color: "bg-surface-200",
    official: true,
    installed: false,
    popular: true,
    installs: 9800,
    rating: 4.6,
    features: ["代码审查", "Issue 自动化", "PR 管理"],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "与 Salesforce CRM 集成，自动化客户数据管理。",
    collection: "wrappers",
    icon: "☁️",
    color: "bg-surface-200",
    official: false,
    release: "beta",
    installed: false,
    popular: false,
    installs: 5200,
    rating: 4.5,
    features: ["客户同步", "销售自动化", "报告生成"],
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "通过 Zapier 连接数千个应用程序。",
    collection: "wrappers",
    icon: "⚡",
    color: "bg-surface-200",
    official: true,
    installed: true,
    popular: true,
    installs: 22000,
    rating: 4.8,
    features: ["多应用连接", "自动化工作流", "条件触发"],
  },
  {
    id: "airtable",
    name: "Airtable",
    description: "与 Airtable 数据库集成，管理结构化数据。",
    collection: "wrappers",
    icon: "📊",
    color: "bg-surface-200",
    official: false,
    release: "beta",
    installed: false,
    popular: false,
    installs: 7600,
    rating: 4.6,
    features: ["数据同步", "表格管理", "视图定制"],
  },
  {
    id: "discord",
    name: "Discord",
    description: "将 AI 助手集成到 Discord 服务器。",
    collection: "wrappers",
    icon: "🎮",
    color: "bg-surface-200",
    official: false,
    installed: false,
    popular: false,
    installs: 6400,
    rating: 4.4,
    features: ["机器人集成", "消息自动化", "频道管理"],
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    description: "自动化 Google 表格数据处理和分析。",
    collection: "wrappers",
    icon: "📈",
    color: "bg-surface-200",
    official: true,
    installed: true,
    popular: true,
    installs: 14200,
    rating: 4.7,
    features: ["数据导入", "公式自动化", "报表生成"],
  },
  {
    id: "jira",
    name: "Jira",
    description: "与 Jira 集成，自动化项目管理和 Issue 跟踪。",
    collection: "wrappers",
    icon: "📋",
    color: "bg-surface-200",
    official: false,
    release: "alpha",
    installed: false,
    popular: false,
    installs: 4800,
    rating: 4.5,
    features: ["Issue 同步", "Sprint 管理", "报告生成"],
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "自动化邮件营销和用户列表管理。",
    collection: "wrappers",
    icon: "📧",
    color: "bg-surface-200",
    official: false,
    installed: false,
    popular: false,
    installs: 3200,
    rating: 4.3,
    features: ["邮件自动化", "用户分组", "营销活动"],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "CRM 和营销自动化集成。",
    collection: "wrappers",
    icon: "🟠",
    color: "bg-surface-200",
    official: false,
    release: "beta",
    installed: false,
    popular: false,
    installs: 4100,
    rating: 4.4,
    features: ["客户管理", "营销自动化", "销售分析"],
  },
];

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("all");

  // 筛选集成
  const filteredIntegrations = useMemo(() => {
    return integrations.filter((integration) => {
      const matchesSearch =
        integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCollection =
        selectedCollection === "all" || integration.collection === selectedCollection;

      return matchesSearch && matchesCollection;
    });
  }, [searchQuery, selectedCollection]);

  const installedCount = integrations.filter((i) => i.installed).length;
  const totalCount = integrations.length;
  const filteredCount = filteredIntegrations.length;
  const activeCollectionLabel =
    collectionLabelMap.get(selectedCollection) ?? "All";
  const installedIntegrations = integrations.filter((i) => i.installed);
  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: integrations.length };
    integrations.forEach((integration) => {
      counts[integration.collection] = (counts[integration.collection] ?? 0) + 1;
    });
    return counts;
  }, []);

  return (
    <PageContainer className="dashboard-page">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Integrations"
          title="Extend your database"
          description="统一管理连接、权限与自动化触发，让团队快速接入官方与社区集成。"
          actions={(
            <div className="page-toolbar">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Settings className="h-4 w-4" />}
              >
                管理集成
              </Button>
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                新增集成
              </Button>
            </div>
          )}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <Badge variant="secondary" size="xs">
              已连接 {installedCount} 个
            </Badge>
            <Badge variant="outline" size="xs">
              全部 {totalCount} 个
            </Badge>
            <Badge variant="outline" size="xs">
              当前筛选 {filteredCount} 个
            </Badge>
          </div>
        </PageHeader>

        <div className="page-grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="page-panel p-4">
            <div className="text-xs text-foreground-light">已连接</div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-stat-number text-foreground">{installedCount}</span>
              <span className="text-[11px] text-foreground-muted">个集成</span>
            </div>
            <p className="mt-2 text-[11px] text-foreground-muted">
              当前团队已启用的插件数量
            </p>
          </div>
          <div className="page-panel p-4">
            <div className="text-xs text-foreground-light">集成总数</div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-stat-number text-foreground">{totalCount}</span>
              <span className="text-[11px] text-foreground-muted">个可用</span>
            </div>
            <p className="mt-2 text-[11px] text-foreground-muted">
              包含官方与社区维护的连接器
            </p>
          </div>
          <div className="page-panel p-4">
            <div className="text-xs text-foreground-light">当前筛选</div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-stat-number text-foreground">{filteredCount}</span>
              <span className="text-[11px] text-foreground-muted">个结果</span>
            </div>
            <p className="mt-2 text-[11px] text-foreground-muted">
              根据分类与搜索自动更新
            </p>
          </div>
        </div>

        <div className="page-divider" />

        <section className="page-grid lg:grid-cols-[220px_minmax(0,1fr)_320px]">
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="page-panel">
              <div className="page-panel-header">
                <p className="page-panel-title">Collections</p>
              </div>
              <div className="p-3 space-y-1">
                {collections.map((collection) => {
                  const isActive = selectedCollection === collection.id;
                  return (
                    <button
                      key={collection.id}
                      type="button"
                      onClick={() => setSelectedCollection(collection.id)}
                      className={cn(
                        "relative flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-surface-200 text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:w-[2px] before:-translate-y-1/2 before:rounded-full before:bg-brand-500"
                          : "text-foreground-muted hover:bg-surface-200/60 hover:text-foreground"
                      )}
                    >
                      <span>{collection.label}</span>
                      <span className="rounded-full bg-surface-200 px-1.5 py-0.5 text-[10px] text-foreground-muted">
                        {collectionCounts[collection.id] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
          <div className="space-y-4">
            <div className="page-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Integration catalog
                  </h2>
                  <p className="text-xs text-foreground-light">
                    兼容官方插件与社区连接，适合不同团队规模与部署方式。
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" size="xs">
                    显示 {filteredCount} 个
                  </Badge>
                  <Badge variant="outline" size="xs">
                    {activeCollectionLabel}
                  </Badge>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="w-full max-w-sm">
                  <Input
                    variant="search"
                    placeholder="Search integrations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                  />
                </div>
                <span className="text-xs text-foreground-muted">
                  支持名称或描述关键词搜索
                </span>
              </div>
            </div>

            {filteredIntegrations.length === 0 ? (
              <div className="rounded-md border border-dashed border-border-muted bg-surface-100/60 px-6 py-12 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-200">
                  <Search className="h-4 w-4 text-foreground-muted" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  未找到匹配集成
                </h3>
                <p className="mt-1 text-xs text-foreground-light">
                  尝试调整关键词或切换分类标签。
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-5 border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCollection("all");
                  }}
                >
                  清除筛选
                </Button>
              </div>
            ) : (
              <div className="page-grid md:grid-cols-2 xl:grid-cols-3">
                {filteredIntegrations.map((integration) => {
                  const collectionLabel =
                    collectionLabelMap.get(integration.collection) ?? "Other";
                  return (
                    <div
                      key={integration.id}
                      className={cn(
                        "group flex h-full flex-col rounded-md border p-4 transition-supabase hover:border-border-strong hover:bg-surface-75",
                        integration.installed
                          ? "border-brand-500/30 bg-brand-200/10"
                          : "border-border bg-surface-100"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-200 text-xl",
                            integration.color
                          )}
                        >
                          {integration.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">
                              {integration.name}
                            </h3>
                            <Badge variant="outline" size="xs">
                              {collectionLabel}
                            </Badge>
                            {integration.official && (
                              <Badge variant="secondary" size="xs">
                                官方
                              </Badge>
                            )}
                            {integration.installed && (
                              <Badge variant="primary" size="xs">
                                已安装
                              </Badge>
                            )}
                            {integration.release && (
                              <Badge
                                size="xs"
                                variant={releaseBadgeVariant[integration.release]}
                              >
                                {releaseBadgeLabel[integration.release]}
                              </Badge>
                            )}
                            {integration.popular && (
                              <Badge variant="warning" size="xs">
                                热门
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-foreground-muted line-clamp-2">
                            {integration.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {integration.features.slice(0, 3).map((feature) => (
                          <span
                            key={feature}
                            className="rounded-full bg-surface-200 px-2.5 py-0.5 text-[11px] text-foreground-muted"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-foreground-muted">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-warning fill-warning" />
                            {integration.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {(integration.installs / 1000).toFixed(1)}k
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {integration.installed ? (
                            <Button
                              size="xs"
                              variant="outline"
                              className="border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                            >
                              管理
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              variant="outline"
                              className="border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                            >
                              安装
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon-xs"
                            className="border-border-muted text-foreground-muted hover:text-foreground hover:bg-surface-200"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="page-panel">
              <div className="page-panel-header flex items-center justify-between">
                <div>
                  <h3 className="page-panel-title">已连接</h3>
                  <p className="page-panel-description">
                    当前团队正在使用的集成与授权状态。
                  </p>
                </div>
                <Badge variant="secondary" size="xs">
                  {installedCount}
                </Badge>
              </div>

              <div className="p-5">
                {installedIntegrations.length === 0 ? (
                  <p className="text-xs text-foreground-muted">暂无已连接的集成。</p>
                ) : (
                  <div className="space-y-3">
                    {installedIntegrations.map((integration) => {
                      const collectionLabel =
                        collectionLabelMap.get(integration.collection) ?? "Other";
                      return (
                        <div
                          key={integration.id}
                          className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-200/60 px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-200 text-lg",
                                integration.color
                              )}
                            >
                              {integration.icon}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {integration.name}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-foreground-muted">
                                <span>{collectionLabel}</span>
                                {integration.release && (
                                  <span className="rounded-full bg-surface-200 px-2 py-0.5 text-[10px] text-foreground-muted">
                                    {releaseBadgeLabel[integration.release]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border text-foreground-light hover:text-foreground hover:bg-surface-200"
                          >
                            管理
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <Key className="h-4 w-4 text-foreground-muted" />
                  </div>
                  <div>
                    <h3 className="page-panel-title">API Key 与权限</h3>
                    <p className="page-panel-description">
                      创建密钥并管理权限，用于集成调用与 Webhook 签名。
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                  asChild
                >
                  <Link href="/dashboard/settings/api-keys">前往 API Key</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  查看权限说明
                </Button>
              </div>
            </div>
            <div className="page-panel">
              <div className="page-panel-header">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <span className="text-base text-brand-500">✦</span>
                  </div>
                  <div>
                    <h3 className="page-panel-title">自定义集成</h3>
                    <p className="page-panel-description">
                      使用 API、Webhook 与队列任务，把任何系统接入工作流。
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  查看文档
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  创建 Webhook
                </Button>
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <span className="text-base text-foreground-muted">◎</span>
                  </div>
                  <div>
                    <h3 className="page-panel-title">权限与安全</h3>
                    <p className="page-panel-description">
                      所有集成都使用最小权限策略，并支持即时撤销访问。
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-2 text-xs text-foreground-muted">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  OAuth scopes 透明展示与审核
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  集成密钥自动轮换与告警
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  日志留存用于审计追踪
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </PageContainer>
  );
}
