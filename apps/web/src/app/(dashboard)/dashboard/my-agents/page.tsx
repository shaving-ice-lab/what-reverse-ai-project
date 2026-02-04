"use client";

/**
 * 我的代理页面
 * Supabase Settings 风格：左侧子导航 + 右侧内容区双栏布局
 * 遵循 STYLE-TERMINAL-PIXEL.md 极简文本风格规范
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
  PageWithSidebar,
  SidebarNavGroup,
  SidebarNavItem,
} from "@/components/dashboard/page-layout";

// ===== 类型定义 =====
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

// ===== 模拟数据 =====
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

// ===== 常量配置 =====
const statusMeta = {
  active: { label: "运行中", variant: "success", icon: CheckCircle, dot: "bg-brand-500" },
  paused: { label: "已暂停", variant: "warning", icon: Pause, dot: "bg-warning-400" },
  error: { label: "异常", variant: "error", icon: AlertTriangle, dot: "bg-destructive-400" },
  draft: { label: "草稿", variant: "secondary", icon: Edit, dot: "bg-surface-400" },
} as const;

const sortOptions = [
  { id: "recent", label: "最近更新" },
  { id: "success", label: "成功率" },
  { id: "runs", label: "执行次数" },
  { id: "name", label: "名称" },
] as const;

type SortOption = (typeof sortOptions)[number]["id"];

const typeLabelMap: Record<string, string> = {
  "customer-service": "客服",
  "data-analysis": "数据分析",
  "code-review": "代码审查",
  "content-creation": "内容创作",
  meeting: "会议",
};

// ===== 工具函数 =====
const formatDate = (value: string) => value.replace(/-/g, ".");
const getTypeLabel = (type: string) => typeLabelMap[type] ?? "通用";

const getPerformanceBarClass = (status: AgentStatus) => {
  if (status === "error") return "bg-destructive-400";
  if (status === "paused") return "bg-warning-400";
  if (status === "draft") return "bg-surface-400";
  return "bg-brand-500";
};

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

// ===== 侧边栏导航项组件 =====
interface StatusNavItemProps {
  label: string;
  count: number;
  dotClass?: string;
  active?: boolean;
  onClick: () => void;
}

function StatusNavItem({ label, count, dotClass, active, onClick }: StatusNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between h-8 px-3 rounded-md text-[12px] font-medium transition-colors",
        active
          ? "bg-surface-100/70 text-foreground"
          : "text-foreground-light hover:text-foreground hover:bg-surface-100/60"
      )}
    >
      <span className="flex items-center gap-2">
        {dotClass && <span className={cn("h-2 w-2 rounded-full", dotClass)} />}
        {label}
      </span>
      <span
        className={cn(
          "text-[11px] tabular-nums",
          active ? "text-foreground" : "text-foreground-muted"
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ===== 主页面组件 =====
export default function MyAgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "all">("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  // ===== 数据计算 =====
  const statusCounts = useMemo(() => {
    return agents.reduce(
      (acc, agent) => {
        acc[agent.status] += 1;
        return acc;
      },
      { active: 0, paused: 0, error: 0, draft: 0 }
    );
  }, []);

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

  // ===== 选择逻辑 =====
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

  const toggleSelectAgent = (agentId: string, checked: boolean | "indeterminate") => {
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

  const hasFilters = searchQuery.trim() !== "" || statusFilter !== "all";

  // ===== 侧边栏渲染 =====
  const sidebar = (
    <div className="space-y-6">
      {/* 状态分类导航 */}
      <SidebarNavGroup title="AGENTS">
        <StatusNavItem
          label="全部代理"
          count={agents.length}
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        />
        <StatusNavItem
          label="运行中"
          count={statusCounts.active}
          dotClass={statusMeta.active.dot}
          active={statusFilter === "active"}
          onClick={() => setStatusFilter("active")}
        />
        <StatusNavItem
          label="已暂停"
          count={statusCounts.paused}
          dotClass={statusMeta.paused.dot}
          active={statusFilter === "paused"}
          onClick={() => setStatusFilter("paused")}
        />
        <StatusNavItem
          label="异常"
          count={statusCounts.error}
          dotClass={statusMeta.error.dot}
          active={statusFilter === "error"}
          onClick={() => setStatusFilter("error")}
        />
        <StatusNavItem
          label="草稿"
          count={statusCounts.draft}
          dotClass={statusMeta.draft.dot}
          active={statusFilter === "draft"}
          onClick={() => setStatusFilter("draft")}
        />
      </SidebarNavGroup>

      {/* 快速操作 */}
      <SidebarNavGroup title="快速操作">
        <Link href="/my-agents/new" className="block">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            className="w-full justify-start h-8 text-[12px] font-medium text-foreground-light hover:text-foreground"
          >
            创建代理
          </Button>
        </Link>
      </SidebarNavGroup>
    </div>
  );

  return (
    <PageWithSidebar
      sidebarWidth="narrow"
      sidebarTitle="Agents"
      sidebar={sidebar}
    >
      <PageContainer>
        {/* 页面头部 */}
        <PageHeader
          title="我的代理"
          description="管理所有自动化代理、运行状态与执行表现"
          actions={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Settings className="h-4 w-4" />}
            >
              批量管理
            </Button>
          }
        />

        {/* 工具栏 */}
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="搜索代理、标签或模型..."
            leftIcon={<Search className="h-4 w-4" />}
            variant="search"
            inputSize="sm"
            className="w-full sm:w-[240px]"
          />

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden md:inline text-[12px] text-foreground-muted">排序</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-8 rounded-md border border-border bg-surface-100 px-2.5 text-[12px] text-foreground-light focus:border-brand-500 focus:outline-none transition-colors"
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

        {/* 结果计数 */}
        <div className="flex items-center justify-between text-[11px] text-foreground-muted">
          <span>
            显示 {sortedAgents.length} / {agents.length} 个代理
          </span>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="text-foreground-light hover:text-foreground transition-colors"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* 批量操作栏 */}
        {selectedVisibleCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-md border border-border bg-surface-75/80 text-[12px]">
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

        {/* 代理列表/网格 */}
        {sortedAgents.length > 0 ? (
          viewMode === "list" ? (
            <AgentListView
              agents={sortedAgents}
              selectedSet={selectedSet}
              allVisibleSelected={allVisibleSelected}
              someVisibleSelected={someVisibleSelected}
              toggleSelectAll={toggleSelectAll}
              toggleSelectAgent={toggleSelectAgent}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
            />
          ) : (
            <AgentGridView
              agents={sortedAgents}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
            />
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
      </PageContainer>
    </PageWithSidebar>
  );
}

// ===== 列表视图组件 =====
interface AgentListViewProps {
  agents: Agent[];
  selectedSet: Set<string>;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  toggleSelectAll: (checked: boolean | "indeterminate") => void;
  toggleSelectAgent: (agentId: string, checked: boolean | "indeterminate") => void;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
}

function AgentListView({
  agents,
  selectedSet,
  allVisibleSelected,
  someVisibleSelected,
  toggleSelectAll,
  toggleSelectAgent,
  activeMenu,
  setActiveMenu,
}: AgentListViewProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      {/* 表头 */}
      <div className="grid grid-cols-[auto_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b border-border bg-surface-75/80 pl-4 pr-5 py-2.5 text-[11px] font-medium text-foreground-muted uppercase tracking-wide border-l-2 border-l-transparent">
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

      {/* 列表项 */}
      <div className="divide-y divide-border">
        {agents.map((agent) => {
          const statusInfo = statusMeta[agent.status];
          const StatusIcon = statusInfo.icon;
          const TypeIcon = getTypeIcon(agent.type);
          const performanceBarClass = getPerformanceBarClass(agent.status);
          const isSelected = selectedSet.has(agent.id);

          return (
            <div
              key={agent.id}
              className={cn(
                "group grid grid-cols-[auto_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-l-2 pl-4 pr-5 py-3.5 transition-colors hover:bg-surface-75/60 hover:border-l-brand-500",
                agent.status === "error" && "border-l-destructive-400",
                agent.status === "paused" && "border-l-warning-400",
                agent.status === "draft" && "border-l-surface-400",
                agent.status === "active" && "border-l-brand-500/60",
                isSelected && "bg-surface-75/70"
              )}
            >
              {/* 选择框 */}
              <div className="flex items-start pt-0.5">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => toggleSelectAgent(agent.id, checked)}
                  aria-label={`选择 ${agent.name}`}
                />
              </div>

              {/* 代理信息 */}
              <div className="flex min-w-0 gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-200">
                  <TypeIcon className="h-4 w-4 text-foreground-light" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/my-agents/${agent.id}`}
                      className="text-[13px] font-medium text-foreground hover:text-foreground-light transition-colors"
                    >
                      {agent.name}
                    </Link>
                    <Badge variant="outline" size="xs">
                      {agent.model}
                    </Badge>
                    <Badge variant="secondary" size="xs">
                      {getTypeLabel(agent.type)}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[12px] text-foreground-light line-clamp-1">
                    {agent.description}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
                    <span className="font-mono">ID {agent.id}</span>
                    <span className="h-1 w-1 rounded-full bg-foreground-muted/70" />
                    <span>创建 {formatDate(agent.createdAt)}</span>
                  </div>
                  <BadgeGroup max={3} className="mt-1.5">
                    {agent.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" size="xs">
                        {tag}
                      </Badge>
                    ))}
                  </BadgeGroup>
                </div>
              </div>

              {/* 状态 */}
              <div className="space-y-1.5">
                <Badge
                  variant={statusInfo.variant}
                  size="xs"
                  icon={<StatusIcon className="h-3 w-3" />}
                >
                  {statusInfo.label}
                </Badge>
                <div className="text-[11px] text-foreground-muted">
                  更新 {formatDate(agent.updatedAt)}
                </div>
              </div>

              {/* 执行表现 */}
              <div className="space-y-1.5 text-[11px] text-foreground-light">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3" />
                  {agent.totalRuns.toLocaleString()} 次
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3" />
                  {agent.successRate}%
                </div>
                <div className="h-1 rounded-full bg-surface-300">
                  <div
                    className={cn("h-1 rounded-full", performanceBarClass)}
                    style={{ width: `${agent.successRate}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {agent.lastRun}
                </div>
              </div>

              {/* 操作 */}
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <AgentActionButton status={agent.status} />
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link href={`/my-agents/${agent.id}/edit`}>
                      <Settings className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <AgentMenu
                    agentId={agent.id}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== 网格视图组件 =====
interface AgentGridViewProps {
  agents: Agent[];
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
}

function AgentGridView({ agents, activeMenu, setActiveMenu }: AgentGridViewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {agents.map((agent) => {
        const statusInfo = statusMeta[agent.status];
        const StatusIcon = statusInfo.icon;
        const TypeIcon = getTypeIcon(agent.type);
        const performanceBarClass = getPerformanceBarClass(agent.status);

        return (
          <div
            key={agent.id}
            className="group rounded-md border border-border bg-surface-100/50 p-4 transition-all hover:border-border-strong"
          >
            {/* 头部 */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                  <TypeIcon className="h-4 w-4 text-foreground-light" />
                </div>
                <div>
                  <Link
                    href={`/my-agents/${agent.id}`}
                    className="text-[13px] font-medium text-foreground hover:text-foreground-light transition-colors"
                  >
                    {agent.name}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" size="xs">
                      {agent.model}
                    </Badge>
                    <Badge variant="secondary" size="xs">
                      {getTypeLabel(agent.type)}
                    </Badge>
                  </div>
                </div>
              </div>
              <Badge
                variant={statusInfo.variant}
                size="xs"
                icon={<StatusIcon className="h-3 w-3" />}
              >
                {statusInfo.label}
              </Badge>
            </div>

            {/* 描述 */}
            <p className="mt-2.5 text-[12px] text-foreground-light line-clamp-2">
              {agent.description}
            </p>

            {/* 标签 */}
            <BadgeGroup max={3} className="mt-2.5">
              {agent.tags.map((tag) => (
                <Badge key={tag} variant="secondary" size="xs">
                  {tag}
                </Badge>
              ))}
            </BadgeGroup>

            {/* 统计 */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-foreground-light">
              <div className="rounded-md border border-border bg-surface-100/70 p-2">
                <Zap className="mb-0.5 h-3 w-3" />
                <div className="text-foreground font-medium">{agent.totalRuns.toLocaleString()}</div>
                <div className="text-[10px] text-foreground-muted">执行</div>
              </div>
              <div className="rounded-md border border-border bg-surface-100/70 p-2">
                <CheckCircle className="mb-0.5 h-3 w-3" />
                <div className="text-foreground font-medium">{agent.successRate}%</div>
                <div className="text-[10px] text-foreground-muted">成功率</div>
                <div className="mt-1 h-1 rounded-full bg-surface-300">
                  <div
                    className={cn("h-1 rounded-full", performanceBarClass)}
                    style={{ width: `${agent.successRate}%` }}
                  />
                </div>
              </div>
              <div className="rounded-md border border-border bg-surface-100/70 p-2">
                <Clock className="mb-0.5 h-3 w-3" />
                <div className="text-foreground font-medium">{agent.lastRun}</div>
                <div className="text-[10px] text-foreground-muted">上次运行</div>
              </div>
            </div>

            {/* 底部操作 */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-foreground-muted">
              <span>更新 {formatDate(agent.updatedAt)}</span>
              <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <AgentActionButton status={agent.status} />
                <Button variant="ghost" size="icon-sm" asChild>
                  <Link href={`/my-agents/${agent.id}/edit`}>
                    <Settings className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <AgentMenu
                  agentId={agent.id}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===== 代理操作按钮 =====
function AgentActionButton({ status }: { status: AgentStatus }) {
  switch (status) {
    case "active":
      return (
        <Button variant="secondary" size="xs" leftIcon={<Pause className="h-3 w-3" />}>
          暂停
        </Button>
      );
    case "paused":
      return (
        <Button variant="secondary" size="xs" leftIcon={<Play className="h-3 w-3" />}>
          启动
        </Button>
      );
    case "draft":
      return (
        <Button variant="outline" size="xs" leftIcon={<Edit className="h-3 w-3" />}>
          完善
        </Button>
      );
    case "error":
      return (
        <Button variant="outline" size="xs" leftIcon={<AlertTriangle className="h-3 w-3" />}>
          诊断
        </Button>
      );
    default:
      return null;
  }
}

// ===== 代理菜单 =====
interface AgentMenuProps {
  agentId: string;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
}

function AgentMenu({ agentId, activeMenu, setActiveMenu }: AgentMenuProps) {
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setActiveMenu(activeMenu === agentId ? null : agentId)}
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </Button>

      {activeMenu === agentId && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-md border border-border bg-surface-100 p-1 z-20 shadow-lg">
          <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-foreground-light hover:bg-surface-200 hover:text-foreground transition-colors">
            <Copy className="h-3.5 w-3.5" />
            复制
          </button>
          <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-foreground-light hover:bg-surface-200 hover:text-foreground transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />
            查看日志
          </button>
          <div className="mx-2 my-1 h-px bg-border-muted" />
          <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-destructive hover:bg-destructive-200 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
            删除
          </button>
        </div>
      )}
    </div>
  );
}
