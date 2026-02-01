"use client";

/**
 * 我的代理页面
 * Supabase 风格：数据密度、清晰层级与可操作性
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  Settings,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Code,
  Database,
  Globe,
  ExternalLink,
  List,
  LayoutGrid,
} from "lucide-react";
import { Button, ButtonGroup } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, BadgeGroup } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  EmptyState,
  PageContainer,
  PageHeader,
  StatsCard,
} from "@/components/dashboard/page-layout";

// 代理状态
type AgentStatus = "active" | "paused" | "error" | "draft";

type Agent = {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  model: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  lastRun: string;
  totalRuns: number;
  successRate: number;
  tags: string[];
};

// 代理数据
const agents: Agent[] = [
  {
    id: "agent-1",
    name: "客服智能助手",
    description: "自动回复客户咨询，处理常见问题，智能转接人工客服",
    status: "active",
    model: "GPT-4",
    type: "customer-service",
    createdAt: "2026-01-15",
    updatedAt: "2026-01-30",
    lastRun: "2 分钟前",
    totalRuns: 15234,
    successRate: 98.5,
    tags: ["客服", "自动回复", "智能转接"],
  },
  {
    id: "agent-2",
    name: "数据分析助手",
    description: "自动分析销售数据，生成报告，发送每日摘要",
    status: "active",
    model: "GPT-4",
    type: "data-analysis",
    createdAt: "2026-01-10",
    updatedAt: "2026-01-29",
    lastRun: "1 小时前",
    totalRuns: 892,
    successRate: 99.2,
    tags: ["数据分析", "报告生成", "定时任务"],
  },
  {
    id: "agent-3",
    name: "代码审查机器人",
    description: "自动审查 Pull Request，检查代码规范，提供改进建议",
    status: "paused",
    model: "Claude 3",
    type: "code-review",
    createdAt: "2026-01-08",
    updatedAt: "2026-01-24",
    lastRun: "3 天前",
    totalRuns: 456,
    successRate: 97.8,
    tags: ["GitHub", "代码审查", "CI/CD"],
  },
  {
    id: "agent-4",
    name: "内容创作助手",
    description: "根据主题生成博客文章、社交媒体内容和营销文案",
    status: "error",
    model: "GPT-4",
    type: "content-creation",
    createdAt: "2026-01-05",
    updatedAt: "2026-01-25",
    lastRun: "5 小时前",
    totalRuns: 234,
    successRate: 92.3,
    tags: ["内容生成", "营销", "社交媒体"],
  },
  {
    id: "agent-5",
    name: "会议摘要生成器",
    description: "自动转录会议内容，生成会议纪要和行动项",
    status: "draft",
    model: "Whisper + GPT-4",
    type: "meeting",
    createdAt: "2026-01-20",
    updatedAt: "2026-01-28",
    lastRun: "未运行",
    totalRuns: 0,
    successRate: 0,
    tags: ["会议", "转录", "摘要"],
  },
];

const statusMeta = {
  active: { label: "运行中", variant: "success", icon: CheckCircle },
  paused: { label: "已暂停", variant: "warning", icon: Pause },
  error: { label: "异常", variant: "error", icon: AlertTriangle },
  draft: { label: "草稿", variant: "secondary", icon: Edit },
} as const;

const sortOptions = [
  { id: "recent", label: "最近更新" },
  { id: "success", label: "成功率" },
  { id: "runs", label: "执行次数" },
  { id: "name", label: "名称" },
] as const;

type SortOption = (typeof sortOptions)[number]["id"];

const formatDate = (value: string) => value.replace(/-/g, ".");

const typeLabelMap: Record<string, string> = {
  "customer-service": "客服",
  "data-analysis": "数据分析",
  "code-review": "代码审查",
  "content-creation": "内容创作",
  meeting: "会议",
};

const getTypeLabel = (type: string) => typeLabelMap[type] ?? "通用";

const getPerformanceBarClass = (status: AgentStatus) => {
  if (status === "error") return "bg-destructive-400";
  if (status === "paused") return "bg-warning-400";
  if (status === "draft") return "bg-surface-400";
  return "bg-brand-500";
};

// 获取类型图标
const getTypeIcon = (type: string) => {
  switch (type) {
    case "customer-service":
      return MessageSquare;
    case "data-analysis":
      return Database;
    case "code-review":
      return Code;
    case "content-creation":
      return Edit;
    case "meeting":
      return Globe;
    default:
      return Bot;
  }
};

export default function MyAgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "all">("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const filteredAgents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return agents.filter((agent) => {
      const matchesSearch =
        !normalizedQuery ||
        agent.name.toLowerCase().includes(normalizedQuery) ||
        agent.description.toLowerCase().includes(normalizedQuery) ||
        agent.model.toLowerCase().includes(normalizedQuery) ||
        agent.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const sortedAgents = useMemo(() => {
    const list = [...filteredAgents];
    switch (sortBy) {
      case "success":
        return list.sort((a, b) => b.successRate - a.successRate);
      case "runs":
        return list.sort((a, b) => b.totalRuns - a.totalRuns);
      case "name":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "recent":
      default:
        return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
  }, [filteredAgents, sortBy]);

  const selectedSet = useMemo(() => new Set(selectedAgents), [selectedAgents]);
  const selectedVisibleCount = sortedAgents.filter((agent) =>
    selectedSet.has(agent.id)
  ).length;
  const allVisibleSelected =
    sortedAgents.length > 0 && selectedVisibleCount === sortedAgents.length;
  const someVisibleSelected =
    selectedVisibleCount > 0 && selectedVisibleCount < sortedAgents.length;

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedAgents(sortedAgents.map((agent) => agent.id));
      return;
    }
    setSelectedAgents([]);
  };

  const toggleSelectAgent = (
    agentId: string,
    checked: boolean | "indeterminate"
  ) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (checked === true) {
        next.add(agentId);
      } else {
        next.delete(agentId);
      }
      return Array.from(next);
    });
  };

  const statusCounts = agents.reduce(
    (acc, agent) => {
      acc[agent.status] += 1;
      return acc;
    },
    { active: 0, paused: 0, error: 0, draft: 0 }
  );

  const totalRuns = agents.reduce((sum, agent) => sum + agent.totalRuns, 0);
  const totalSuccess = agents.reduce(
    (sum, agent) => sum + agent.totalRuns * (agent.successRate / 100),
    0
  );
  const successRate = totalRuns
    ? Number(((totalSuccess / totalRuns) * 100).toFixed(1))
    : 0;
  const latestUpdatedAt = agents.reduce(
    (latest, agent) => (agent.updatedAt > latest ? agent.updatedAt : latest),
    agents[0]?.updatedAt ?? ""
  );

  const stats = {
    total: agents.length,
    totalRuns,
    successRate,
    latestUpdatedAt,
    ...statusCounts,
  };

  const statusTabs = [
    { id: "all", label: "全部", count: stats.total },
    { id: "active", label: "运行中", count: stats.active },
    { id: "paused", label: "已暂停", count: stats.paused },
    { id: "error", label: "异常", count: stats.error },
    { id: "draft", label: "草稿", count: stats.draft },
  ] as const;

  const healthScore = Math.round(stats.successRate);
  const activeRatio = stats.total ? Math.round((stats.active / stats.total) * 100) : 0;
  const healthState =
    healthScore >= 97
      ? { label: "稳定", variant: "success" }
      : healthScore >= 90
        ? { label: "关注", variant: "warning" }
        : { label: "需要注意", variant: "error" };

  const attentionAgents = agents.filter(
    (agent) => agent.status === "error" || agent.status === "paused"
  );
  const attentionPreview = attentionAgents.slice(0, 3);
  const attentionBadge =
    attentionAgents.length === 0
      ? { label: "全部正常", variant: "secondary" as const }
      : { label: `${attentionAgents.length} 个`, variant: "warning" as const };

  const appliedFilters = useMemo(() => {
    const filters: Array<{
      id: string;
      label: string;
      onClear: () => void;
    }> = [];

    if (searchQuery.trim()) {
      filters.push({
        id: "search",
        label: `搜索: ${searchQuery.trim()}`,
        onClear: () => setSearchQuery(""),
      });
    }

    if (statusFilter !== "all") {
      const statusInfo = statusMeta[statusFilter];
      filters.push({
        id: "status",
        label: `状态: ${statusInfo.label}`,
        onClear: () => setStatusFilter("all"),
      });
    }

    if (sortBy !== "recent") {
      const sortLabel =
        sortOptions.find((option) => option.id === sortBy)?.label ?? sortBy;
      filters.push({
        id: "sort",
        label: `排序: ${sortLabel}`,
        onClear: () => setSortBy("recent"),
      });
    }

    return filters;
  }, [searchQuery, sortBy, statusFilter]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("recent");
  };

  const hasFilters = searchQuery.trim() !== "" || statusFilter !== "all";
  const latestUpdateLabel = stats.latestUpdatedAt
    ? formatDate(stats.latestUpdatedAt)
    : "-";

  return (
    <PageContainer>
      <div className="space-y-6">
        <p className="page-caption">Agents</p>
        <PageHeader
          title="我的代理"
          description="集中管理所有自动化代理、运行状态与执行表现。"
          actions={(
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Settings className="h-4 w-4" />}
              >
                批量管理
              </Button>
              <Link href="/my-agents/new">
                <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                  创建代理
                </Button>
              </Link>
            </div>
          )}
        />

        <div className="page-divider" />

        <div className="page-grid xl:grid-cols-[3fr_1.2fr]">
          <div className="page-grid sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              icon={<Bot className="h-4 w-4" />}
              title="总代理数"
              value={stats.total}
              subtitle={`草稿 ${stats.draft} 个`}
            />
            <StatsCard
              icon={<Zap className="h-4 w-4" />}
              title="运行中"
              value={stats.active}
              subtitle={`活跃率 ${activeRatio}%`}
            />
            <StatsCard
              icon={<Clock className="h-4 w-4" />}
              title="总执行次数"
              value={stats.totalRuns.toLocaleString()}
              subtitle="最近 30 天"
            />
            <StatsCard
              icon={<CheckCircle className="h-4 w-4" />}
              title="整体成功率"
              value={`${stats.successRate}%`}
              subtitle="按执行次数加权"
            />
          </div>

          <div className="space-y-4">
            <div className="page-panel relative overflow-hidden p-4">
              <div className="pointer-events-none absolute -right-10 -top-16 h-32 w-32 rounded-full bg-brand-500/10 blur-2xl" />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">运行健康度</p>
                    <p className="text-xs text-foreground-light">最近 7 天概览</p>
                  </div>
                  <Badge variant={healthState.variant} size="sm">
                    {healthState.label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-foreground-light">
                    <span>成功率</span>
                    <span className="text-foreground">{healthScore}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-300">
                    <div
                      className="h-1.5 rounded-full bg-brand-500"
                      style={{ width: `${healthScore}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-border bg-surface-100/70 p-2.5">
                    <p className="text-[11px] text-foreground-muted">运行中</p>
                    <p className="text-sm font-semibold text-foreground">{stats.active}</p>
                    <p className="text-[10px] text-foreground-muted">活跃率 {activeRatio}%</p>
                  </div>
                  <div className="rounded-md border border-border bg-surface-100/70 p-2.5">
                    <p className="text-[11px] text-foreground-muted">异常 / 暂停</p>
                    <p className="text-sm font-semibold text-foreground">
                      {stats.error} / {stats.paused}
                    </p>
                    <p className="text-[10px] text-foreground-muted">需关注 {stats.error}</p>
                  </div>
                </div>
                <div className="text-[11px] text-foreground-muted">
                  最近更新 {latestUpdateLabel}
                </div>
              </div>
            </div>

            <div className="page-panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">需要关注</p>
                  <p className="text-xs text-foreground-light">异常与暂停状态</p>
                </div>
                <Badge variant={attentionBadge.variant} size="sm">
                  {attentionBadge.label}
                </Badge>
              </div>
              {attentionAgents.length > 0 ? (
                <div className="space-y-2">
                  {attentionPreview.map((agent) => {
                    const statusInfo = statusMeta[agent.status];
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-100/70 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/my-agents/${agent.id}`}
                            className="text-[13px] font-medium text-foreground hover:text-foreground-light transition-colors"
                          >
                            {agent.name}
                          </Link>
                          <div className="text-[11px] text-foreground-muted">
                            上次运行 {agent.lastRun}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={statusInfo.variant}
                            size="xs"
                            icon={<StatusIcon className="h-3 w-3" />}
                          >
                            {statusInfo.label}
                          </Badge>
                          <Button
                            variant={agent.status === "error" ? "outline" : "secondary"}
                            size="xs"
                          >
                            {agent.status === "error" ? "诊断" : "启动"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-md border border-border bg-surface-75/60 px-3 py-2 text-xs text-foreground-light">
                  目前没有异常或暂停的代理。
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-foreground-muted">
                <span>共 {attentionAgents.length} 个待处理</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setStatusFilter("error")}
                  >
                    查看异常
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setStatusFilter("paused")}
                  >
                    查看暂停
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-panel p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索代理、标签或模型..."
              leftIcon={<Search className="h-4 w-4" />}
              variant="search"
              inputSize="sm"
              className="w-full sm:w-[280px]"
            />

            <div className="flex items-center gap-1 rounded-md border border-border bg-surface-100 p-1">
              {statusTabs.map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-surface-200 text-foreground"
                        : "text-foreground-light hover:text-foreground hover:bg-surface-200"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        isActive
                          ? "bg-surface-300 text-foreground"
                          : "bg-surface-200 text-foreground-muted"
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="hidden md:flex items-center gap-1 text-xs text-foreground-muted">
                <span>排序</span>
              </div>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="h-8 rounded-md border border-border bg-surface-100 px-2.5 text-xs text-foreground-light focus:border-brand-500 focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>

              <ButtonGroup attached>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </ButtonGroup>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs text-foreground-muted">
            <span>
              显示 {sortedAgents.length} / {stats.total} 个代理
            </span>
            <span>最近更新 {latestUpdateLabel}</span>
          </div>
          {appliedFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-foreground-muted">已应用</span>
              {appliedFilters.map((filter) => (
                <Badge
                  key={filter.id}
                  variant="outline"
                  size="sm"
                  onClose={filter.onClear}
                >
                  {filter.label}
                </Badge>
              ))}
              <Button variant="ghost" size="xs" onClick={clearAllFilters}>
                清除
              </Button>
            </div>
          )}
        </div>

        {sortedAgents.length > 0 ? (
          viewMode === "list" ? (
            <div className="space-y-3">
              {selectedVisibleCount > 0 && (
                <div className="page-panel flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs">
                  <div className="flex items-center gap-2 text-foreground-light">
                    <Badge variant="secondary" size="xs">
                      已选 {selectedVisibleCount} 项
                    </Badge>
                    <span>可进行批量操作</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="xs" leftIcon={<Pause className="h-3.5 w-3.5" />}>
                      暂停
                    </Button>
                    <Button variant="secondary" size="xs" leftIcon={<Play className="h-3.5 w-3.5" />}>
                      启动
                    </Button>
                    <Button variant="outline" size="xs" leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
                      删除
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => setSelectedAgents([])}>
                      清除选择
                    </Button>
                  </div>
                </div>
              )}

              <div className="page-panel overflow-hidden">
                <div className="grid grid-cols-[auto_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b border-border bg-surface-75/80 pl-4 pr-5 py-3 text-table-header border-l-2 border-l-transparent">
                  <div className="flex items-center">
                    <Checkbox
                      checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                      onCheckedChange={toggleSelectAll}
                      aria-label="选择所有代理"
                    />
                  </div>
                  <span>代理</span>
                  <span>状态</span>
                  <span>执行表现</span>
                  <span className="text-right">操作</span>
                </div>
                <div className="divide-y divide-border">
                {sortedAgents.map((agent) => {
                  const statusInfo = statusMeta[agent.status];
                  const StatusIcon = statusInfo.icon;
                  const TypeIcon = getTypeIcon(agent.type);
                  const performanceBarClass = getPerformanceBarClass(agent.status);
                  const isSelected = selectedSet.has(agent.id);

                  return (
                    <div
                      key={agent.id}
                      className={cn(
                        "group grid grid-cols-[auto_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-l-2 pl-4 pr-5 py-4 transition-colors hover:bg-surface-75/60 hover:border-l-brand-500",
                        agent.status === "error" && "border-l-destructive-400",
                        agent.status === "paused" && "border-l-warning-400",
                        agent.status === "draft" && "border-l-surface-400",
                        agent.status === "active" && "border-l-brand-500/60",
                        isSelected && "bg-surface-75/70"
                      )}
                    >
                      <div className="flex items-start pt-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => toggleSelectAgent(agent.id, checked)}
                          aria-label={`选择 ${agent.name}`}
                        />
                      </div>
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface-200">
                          <TypeIcon className="h-5 w-5 text-foreground-light" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/my-agents/${agent.id}`}
                              className="text-[15px] font-medium text-foreground hover:text-foreground-light transition-colors"
                            >
                              {agent.name}
                            </Link>
                            <Badge variant="outline" size="sm">
                              {agent.model}
                            </Badge>
                            <Badge variant="secondary" size="xs">
                              {getTypeLabel(agent.type)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[13px] text-foreground-light line-clamp-1">
                            {agent.description}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                            <span className="font-mono">ID {agent.id}</span>
                            <span className="h-1 w-1 rounded-full bg-foreground-muted/70" />
                            <span>创建 {formatDate(agent.createdAt)}</span>
                          </div>
                          <BadgeGroup max={3} className="mt-2">
                            {agent.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" size="xs">
                                {tag}
                              </Badge>
                            ))}
                          </BadgeGroup>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Badge
                          variant={statusInfo.variant}
                          size="sm"
                          icon={<StatusIcon className="h-3 w-3" />}
                        >
                          {statusInfo.label}
                        </Badge>
                        <div className="text-xs text-foreground-muted">
                          更新 {formatDate(agent.updatedAt)}
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-foreground-light">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" />
                          {agent.totalRuns.toLocaleString()} 次执行
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {agent.successRate}% 成功率
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-300">
                          <div
                            className={cn("h-1.5 rounded-full", performanceBarClass)}
                            style={{ width: `${agent.successRate}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {agent.lastRun}
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <div className="flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {agent.status === "active" && (
                            <Button
                              variant="secondary"
                              size="xs"
                              leftIcon={<Pause className="h-3.5 w-3.5" />}
                            >
                              暂停
                            </Button>
                          )}
                          {agent.status === "paused" && (
                            <Button
                              variant="secondary"
                              size="xs"
                              leftIcon={<Play className="h-3.5 w-3.5" />}
                            >
                              启动
                            </Button>
                          )}
                          {agent.status === "draft" && (
                            <Button
                              variant="outline"
                              size="xs"
                              leftIcon={<Edit className="h-3.5 w-3.5" />}
                            >
                              完善
                            </Button>
                          )}
                          {agent.status === "error" && (
                            <Button
                              variant="outline"
                              size="xs"
                              leftIcon={<AlertTriangle className="h-3.5 w-3.5" />}
                            >
                              诊断
                            </Button>
                          )}
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/my-agents/${agent.id}/edit`}>
                              <Settings className="h-4 w-4" />
                            </Link>
                          </Button>
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                setActiveMenu(activeMenu === agent.id ? null : agent.id)
                              }
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>

                            {activeMenu === agent.id && (
                              <div className="absolute right-0 top-full mt-2 w-44 rounded-md border border-border bg-surface-100 p-1 z-20">
                                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground-light hover:bg-surface-200 hover:text-foreground">
                                  <Copy className="h-4 w-4" />
                                  复制
                                </button>
                                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground-light hover:bg-surface-200 hover:text-foreground">
                                  <ExternalLink className="h-4 w-4" />
                                  查看日志
                                </button>
                                <div className="mx-2 my-1 h-px bg-border-muted" />
                                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive-200 hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                  删除
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          ) : (
            <div className="page-grid md:grid-cols-2 xl:grid-cols-3">
              {sortedAgents.map((agent) => {
                const statusInfo = statusMeta[agent.status];
                const StatusIcon = statusInfo.icon;
                const TypeIcon = getTypeIcon(agent.type);
                const performanceBarClass = getPerformanceBarClass(agent.status);

                return (
                  <div
                    key={agent.id}
                    className="page-panel group p-5 transition-all hover:border-border-strong"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-200">
                          <TypeIcon className="h-5 w-5 text-foreground-light" />
                        </div>
                        <div>
                          <Link
                            href={`/my-agents/${agent.id}`}
                            className="text-sm font-semibold text-foreground hover:text-foreground-light transition-colors"
                          >
                            {agent.name}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" size="xs">
                              {agent.model}
                            </Badge>
                            <Badge variant="secondary" size="xs">
                              {getTypeLabel(agent.type)}
                            </Badge>
                          </div>
                          <div className="mt-1 text-[11px] text-foreground-muted font-mono">
                            ID {agent.id}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={statusInfo.variant}
                        size="sm"
                        icon={<StatusIcon className="h-3 w-3" />}
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <p className="mt-3 text-[13px] text-foreground-light line-clamp-2">
                      {agent.description}
                    </p>

                    <BadgeGroup max={3} className="mt-3">
                      {agent.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" size="xs">
                          {tag}
                        </Badge>
                      ))}
                    </BadgeGroup>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-foreground-light">
                      <div className="rounded-md border border-border bg-surface-100/70 p-2">
                        <Zap className="mb-1 h-3.5 w-3.5" />
                        <div className="text-foreground">{agent.totalRuns.toLocaleString()}</div>
                        <div className="text-[10px] text-foreground-muted">执行</div>
                      </div>
                      <div className="rounded-md border border-border bg-surface-100/70 p-2">
                        <CheckCircle className="mb-1 h-3.5 w-3.5" />
                        <div className="text-foreground">{agent.successRate}%</div>
                        <div className="text-[10px] text-foreground-muted">成功率</div>
                        <div className="mt-1 h-1 rounded-full bg-surface-300">
                          <div
                            className={cn("h-1 rounded-full", performanceBarClass)}
                            style={{ width: `${agent.successRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="rounded-md border border-border bg-surface-100/70 p-2">
                        <Clock className="mb-1 h-3.5 w-3.5" />
                        <div className="text-foreground">{agent.lastRun}</div>
                        <div className="text-[10px] text-foreground-muted">上次运行</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-foreground-muted">
                      <span>更新 {formatDate(agent.updatedAt)}</span>
                      <div className="flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {agent.status === "active" && (
                          <Button
                            variant="secondary"
                            size="xs"
                            leftIcon={<Pause className="h-3.5 w-3.5" />}
                          >
                            暂停
                          </Button>
                        )}
                        {agent.status === "paused" && (
                          <Button
                            variant="secondary"
                            size="xs"
                            leftIcon={<Play className="h-3.5 w-3.5" />}
                          >
                            启动
                          </Button>
                        )}
                        {agent.status === "draft" && (
                          <Button
                            variant="outline"
                            size="xs"
                            leftIcon={<Edit className="h-3.5 w-3.5" />}
                          >
                            完善
                          </Button>
                        )}
                        {agent.status === "error" && (
                          <Button
                            variant="outline"
                            size="xs"
                            leftIcon={<AlertTriangle className="h-3.5 w-3.5" />}
                          >
                            诊断
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/my-agents/${agent.id}/edit`}>
                            <Settings className="h-4 w-4" />
                          </Link>
                        </Button>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setActiveMenu(activeMenu === agent.id ? null : agent.id)
                            }
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>

                          {activeMenu === agent.id && (
                            <div className="absolute right-0 top-full mt-2 w-44 rounded-md border border-border bg-surface-100 p-1 z-20">
                              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground-light hover:bg-surface-200 hover:text-foreground">
                                <Copy className="h-4 w-4" />
                                复制
                              </button>
                              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground-light hover:bg-surface-200 hover:text-foreground">
                                <ExternalLink className="h-4 w-4" />
                                查看日志
                              </button>
                              <div className="mx-2 my-1 h-px bg-border-muted" />
                              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive-200 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                删除
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <EmptyState
            icon={<Bot className="h-5 w-5" />}
            title={hasFilters ? "没有找到匹配的代理" : "还没有创建代理"}
            description={
              hasFilters
                ? "尝试使用其他关键词或筛选条件"
                : "创建您的第一个 AI 代理，开始自动化之旅。"
            }
            action={
              hasFilters
                ? {
                    label: "清除筛选",
                    onClick: () => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    },
                  }
                : { label: "创建代理", href: "/my-agents/new" }
            }
          />
        )}
      </div>
    </PageContainer>
  );
}
