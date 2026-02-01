"use client";

/**
 * 工作流列表页面
 * Supabase 风格：密度更高、层次清晰、面板化布局
 */

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpDown,
  Download,
  Zap,
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  LayoutGrid,
  List,
  Folder,
  Star,
  Sparkles,
  ChevronDown,
  FolderOpen,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import { Button, ButtonGroup } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// 工作流状态
type WorkflowStatus = "active" | "paused" | "error" | "draft";
type SortBy = "updated" | "name" | "runs" | "success";

// 工作流数据
const workflows = [
  {
    id: "wf-1",
    name: "客户反馈自动处理",
    description: "自动收集并分析客户反馈，生成报告并通知相关团队",
    status: "active" as WorkflowStatus,
    trigger: "Webhook",
    createdAt: "2026-01-15",
    updatedAt: "2 小时前",
    lastRun: "5 分钟前",
    totalRuns: 1256,
    successRate: 98.5,
    folder: "客户服务",
    starred: true,
    tags: ["自动化", "客户服务", "报告"],
  },
  {
    id: "wf-2",
    name: "每日销售数据汇总",
    description: "每天自动汇总销售数据，生成可视化报告并发送邮件",
    status: "active" as WorkflowStatus,
    trigger: "定时触发 (每天 09:00)",
    createdAt: "2026-01-10",
    updatedAt: "1 天前",
    lastRun: "今天 09:00",
    totalRuns: 45,
    successRate: 100,
    folder: "数据分析",
    starred: true,
    tags: ["数据", "报告", "定时"],
  },
  {
    id: "wf-3",
    name: "GitHub Issue 自动分类",
    description: "使用 AI 自动分析新 Issue 并添加标签和分配负责人",
    status: "active" as WorkflowStatus,
    trigger: "GitHub Webhook",
    createdAt: "2026-01-08",
    updatedAt: "3 小时前",
    lastRun: "1 小时前",
    totalRuns: 234,
    successRate: 95.7,
    folder: "开发",
    starred: false,
    tags: ["GitHub", "AI", "自动化"],
  },
  {
    id: "wf-4",
    name: "新员工入职流程",
    description: "自动化新员工入职流程，包括账号创建、权限分配和通知",
    status: "paused" as WorkflowStatus,
    trigger: "手动触发",
    createdAt: "2026-01-05",
    updatedAt: "1 周前",
    lastRun: "2 周前",
    totalRuns: 23,
    successRate: 100,
    folder: "人力资源",
    starred: false,
    tags: ["HR", "入职", "自动化"],
  },
  {
    id: "wf-5",
    name: "社交媒体内容发布",
    description: "定时发布社交媒体内容到多个平台",
    status: "error" as WorkflowStatus,
    trigger: "定时触发",
    createdAt: "2026-01-03",
    updatedAt: "6 小时前",
    lastRun: "6 小时前",
    totalRuns: 89,
    successRate: 87.6,
    folder: "营销",
    starred: false,
    tags: ["社交媒体", "营销", "定时"],
  },
  {
    id: "wf-6",
    name: "订单处理自动化",
    description: "新订单自动验证、处理并发送确认邮件",
    status: "draft" as WorkflowStatus,
    trigger: "Webhook",
    createdAt: "2026-01-20",
    updatedAt: "刚刚",
    lastRun: "未运行",
    totalRuns: 0,
    successRate: 0,
    folder: "电商",
    starred: false,
    tags: ["电商", "订单", "自动化"],
  },
];

// 文件夹列表
const folders = [
  { name: "全部", count: workflows.length },
  { name: "客户服务", count: 1 },
  { name: "数据分析", count: 1 },
  { name: "开发", count: 1 },
  { name: "人力资源", count: 1 },
  { name: "营销", count: 1 },
  { name: "电商", count: 1 },
];

// 获取状态信息 - Supabase 风格
const getStatusInfo = (status: WorkflowStatus) => {
  switch (status) {
    case "active":
      return {
        label: "运行中",
        color: "text-brand-500",
        bg: "bg-brand-200/70",
        border: "border-brand-400/40",
        icon: CheckCircle,
      };
    case "paused":
      return {
        label: "已暂停",
        color: "text-warning",
        bg: "bg-warning-200/70",
        border: "border-warning/30",
        icon: Pause,
      };
    case "error":
      return {
        label: "异常",
        color: "text-destructive",
        bg: "bg-destructive-200/70",
        border: "border-destructive/30",
        icon: AlertTriangle,
      };
    case "draft":
      return {
        label: "草稿",
        color: "text-foreground-muted",
        bg: "bg-surface-200",
        border: "border-border",
        icon: Edit,
      };
  }
};

const getRelativeMinutes = (value: string) => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  if (value.includes("刚刚")) return 0;
  const minuteMatch = value.match(/(\d+)\s*分钟?前/);
  if (minuteMatch) return Number.parseInt(minuteMatch[1], 10);
  const hourMatch = value.match(/(\d+)\s*小时前/);
  if (hourMatch) return Number.parseInt(hourMatch[1], 10) * 60;
  const dayMatch = value.match(/(\d+)\s*天前/);
  if (dayMatch) return Number.parseInt(dayMatch[1], 10) * 24 * 60;
  const weekMatch = value.match(/(\d+)\s*周前/);
  if (weekMatch) return Number.parseInt(weekMatch[1], 10) * 7 * 24 * 60;
  return Number.MAX_SAFE_INTEGER;
};

export default function WorkflowsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | "all">("all");
  const [selectedFolder, setSelectedFolder] = useState("全部");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<SortBy>("updated");

  // 筛选工作流
  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch =
      wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || wf.status === statusFilter;
    const matchesFolder = selectedFolder === "全部" || wf.folder === selectedFolder;
    return matchesSearch && matchesStatus && matchesFolder;
  });

  // 统计数据
  const totalRuns = workflows.reduce((sum, w) => sum + w.totalRuns, 0);
  const weightedSuccess = workflows.reduce(
    (sum, w) => sum + w.totalRuns * w.successRate,
    0
  );
  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.status === "active").length,
    paused: workflows.filter((w) => w.status === "paused").length,
    error: workflows.filter((w) => w.status === "error").length,
    draft: workflows.filter((w) => w.status === "draft").length,
    starred: workflows.filter((w) => w.starred).length,
    totalRuns,
    avgSuccessRate: totalRuns ? weightedSuccess / totalRuns : 0,
  };

  const statItems = [
    {
      label: "总工作流",
      value: stats.total.toLocaleString(),
      helper: `${stats.starred} 已收藏`,
      icon: Zap,
    },
    {
      label: "运行中",
      value: stats.active.toLocaleString(),
      helper: `${stats.paused} 已暂停`,
      icon: Play,
    },
    {
      label: "执行次数",
      value: stats.totalRuns.toLocaleString(),
      helper: "累计运行",
      icon: Activity,
    },
    {
      label: "平均成功率",
      value: `${stats.avgSuccessRate.toFixed(1)}%`,
      helper: `${stats.error} 异常`,
      icon: CheckCircle,
      valueClassName: "text-brand-500",
    },
  ];

  const statusPills: Array<{
    key: WorkflowStatus | "all";
    label: string;
    count: number;
    color: string;
    bg: string;
    border: string;
  }> = [
    {
      key: "all",
      label: "全部",
      count: stats.total,
      color: "text-foreground",
      bg: "bg-surface-200/60",
      border: "border-border",
    },
    {
      key: "active",
      label: "运行中",
      count: stats.active,
      color: "text-brand-500",
      bg: "bg-brand-200/60",
      border: "border-brand-400/30",
    },
    {
      key: "paused",
      label: "已暂停",
      count: stats.paused,
      color: "text-warning",
      bg: "bg-warning-200/60",
      border: "border-warning/30",
    },
    {
      key: "error",
      label: "异常",
      count: stats.error,
      color: "text-destructive",
      bg: "bg-destructive-200/60",
      border: "border-destructive/30",
    },
    {
      key: "draft",
      label: "草稿",
      count: stats.draft,
      color: "text-foreground-muted",
      bg: "bg-surface-200/60",
      border: "border-border",
    },
  ];

  const sortOptions: Array<{ value: SortBy; label: string }> = [
    { value: "updated", label: "最近更新" },
    { value: "name", label: "名称" },
    { value: "runs", label: "运行次数" },
    { value: "success", label: "成功率" },
  ];

  const sortedWorkflows = [...filteredWorkflows].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name, "zh-Hans-CN");
      case "runs":
        return b.totalRuns - a.totalRuns;
      case "success":
        return b.successRate - a.successRate;
      case "updated":
      default:
        return getRelativeMinutes(a.updatedAt) - getRelativeMinutes(b.updatedAt);
    }
  });

  const mostRecentWorkflow = [...workflows].sort(
    (a, b) => getRelativeMinutes(a.updatedAt) - getRelativeMinutes(b.updatedAt)
  )[0];
  const recentStatusInfo = mostRecentWorkflow
    ? getStatusInfo(mostRecentWorkflow.status)
    : null;

  return (
    <PageContainer className="relative">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[70%] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-16 right-[-10%] h-40 w-64 rounded-full bg-brand-500/5 blur-2xl" />
      <div className="relative space-y-6">
        <PageHeader
          eyebrow="Automation Studio"
          title="工作流"
          icon={<Sparkles className="h-4 w-4" />}
          description="统一管理触发器、执行与版本，快速定位关键自动化流程。"
          badge={(
            <Badge
              variant="secondary"
              size="sm"
              className="bg-surface-200 text-foreground-light"
            >
              显示 {filteredWorkflows.length} / {stats.total}
            </Badge>
          )}
          actions={(
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                导入
              </Button>
              <Button size="sm" asChild leftIcon={<Plus className="h-4 w-4" />}>
                <Link href="/workflows/new">创建工作流</Link>
              </Button>
            </div>
          )}
        />

        <div className="page-divider" />

        <section className="page-section">
          <div className="page-panel overflow-hidden">
            <div className="page-panel-header flex items-center justify-between">
              <div>
                <div className="page-caption">Overview</div>
                <h2 className="page-panel-title">工作流概览</h2>
                <p className="page-panel-description">关键指标与最近更新</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <Clock className="w-3.5 h-3.5" />
                最近更新 {mostRecentWorkflow?.updatedAt ?? "—"}
              </div>
            </div>
            <div className="p-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="page-grid grid-cols-2 lg:grid-cols-4">
                {statItems.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-md border border-border bg-surface-75/80 p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs text-foreground-muted">{stat.label}</p>
                      <p
                        className={cn(
                          "text-lg font-semibold",
                          stat.valueClassName ?? "text-foreground"
                        )}
                      >
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-foreground-muted">{stat.helper}</p>
                    </div>
                    <div className="h-9 w-9 rounded-md bg-surface-200 flex items-center justify-center">
                      <stat.icon className="h-4 w-4 text-foreground-light" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-border bg-surface-75/80 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">最近更新</h3>
                  <span className="text-xs text-foreground-muted">自动同步</span>
                </div>
                {mostRecentWorkflow ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-md bg-surface-200/80 border border-border flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-foreground-light" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {mostRecentWorkflow.starred && (
                            <Star className="w-4 h-4 text-warning fill-current" />
                          )}
                          <Link
                            href={`/workflows/${mostRecentWorkflow.id}`}
                            className="text-sm font-medium text-foreground hover:text-brand-500 transition-colors truncate"
                          >
                            {mostRecentWorkflow.name}
                          </Link>
                          {recentStatusInfo && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                                recentStatusInfo.bg,
                                recentStatusInfo.color,
                                recentStatusInfo.border
                              )}
                            >
                              <recentStatusInfo.icon className="w-3 h-3" />
                              {recentStatusInfo.label}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-foreground-light line-clamp-2">
                          {mostRecentWorkflow.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-200/60 px-2 py-0.5">
                        <FolderOpen className="w-3 h-3" />
                        {mostRecentWorkflow.folder}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mostRecentWorkflow.lastRun}
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {mostRecentWorkflow.totalRuns} 次
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/workflows/${mostRecentWorkflow.id}`}>查看详情</Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/editor/${mostRecentWorkflow.id}`}>打开编辑器</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[13px] text-foreground-muted">暂无更新记录</div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="page-section">
          <div className="page-panel">
            <div className="page-panel-header flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="page-caption">Filters</div>
                <h2 className="page-panel-title">筛选与排序</h2>
                <p className="page-panel-description">按状态、目录或更新频率筛选</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <Badge
                  variant="secondary"
                  size="sm"
                  className="bg-surface-200 text-foreground-light"
                >
                  当前 {sortedWorkflows.length} 项
                </Badge>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {statusPills.map((pill) => (
                  <button
                    key={pill.key}
                    onClick={() => setStatusFilter(pill.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
                      pill.bg,
                      pill.border,
                      pill.color,
                      statusFilter === pill.key
                        ? "ring-1 ring-brand-500/30"
                        : "hover:bg-surface-200"
                    )}
                  >
                    <span>{pill.label}</span>
                    <span className="text-foreground">{pill.count}</span>
                  </button>
                ))}
                <div className="ml-auto hidden sm:flex items-center gap-2 text-[11px] text-foreground-muted">
                  <Clock className="w-3.5 h-3.5" />
                  <span>最近更新</span>
                  <span className="text-foreground">{mostRecentWorkflow?.updatedAt ?? "—"}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Input
                  placeholder="搜索工作流..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant="search"
                  inputSize="default"
                  leftIcon={<Search className="h-4 w-4" />}
                  className="min-w-[220px] max-w-md flex-1"
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<FolderOpen className="h-4 w-4" />}
                      rightIcon={<ChevronDown className="h-3.5 w-3.5" />}
                    >
                      {selectedFolder}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-48 bg-surface-100 border border-border rounded-md"
                  >
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.name}
                        onClick={() => setSelectedFolder(folder.name)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 text-sm rounded-md mx-1 cursor-pointer",
                          selectedFolder === folder.name
                            ? "bg-surface-200 text-foreground"
                            : "text-foreground-light hover:bg-surface-200 hover:text-foreground"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Folder className="w-4 h-4" />
                          {folder.name}
                        </span>
                        <span className="text-xs text-foreground-muted">{folder.count}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="bg-border mx-2" />
                    <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm text-foreground-light hover:bg-surface-200 hover:text-foreground rounded-md mx-1 cursor-pointer">
                      <Plus className="w-4 h-4" />
                      新建文件夹
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<ArrowUpDown className="h-4 w-4" />}
                      rightIcon={<ChevronDown className="h-3.5 w-3.5" />}
                    >
                      {sortOptions.find((option) => option.value === sortBy)?.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-40 bg-surface-100 border border-border rounded-md"
                  >
                    {sortOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={cn(
                          "px-3 py-2 text-sm rounded-md mx-1 cursor-pointer",
                          sortBy === option.value
                            ? "bg-surface-200 text-foreground"
                            : "text-foreground-light hover:bg-surface-200 hover:text-foreground"
                        )}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="ml-auto">
                  <ButtonGroup
                    attached
                    className="border border-border rounded-md overflow-hidden bg-surface-200/60"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "rounded-none h-9 px-3",
                        viewMode === "list"
                          ? "bg-surface-200 text-foreground"
                          : "text-foreground-muted hover:text-foreground"
                      )}
                      onClick={() => setViewMode("list")}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "rounded-none h-9 px-3",
                        viewMode === "grid"
                          ? "bg-surface-200 text-foreground"
                          : "text-foreground-muted hover:text-foreground"
                      )}
                      onClick={() => setViewMode("grid")}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-section">
          {sortedWorkflows.length > 0 && viewMode === "list" && (
            <div className="page-panel overflow-hidden">
                <div className="hidden lg:grid grid-cols-[minmax(0,2.2fr)_140px_120px_120px_100px_110px] xl:grid-cols-[minmax(0,2.2fr)_140px_120px_120px_100px_110px_110px] gap-4 px-5 py-3 bg-surface-75/80 border-b border-border text-table-header">
                  <span>工作流</span>
                  <span>触发方式</span>
                  <span>最近运行</span>
                  <span>运行次数</span>
                  <span>成功率</span>
                  <span className="hidden xl:block">更新</span>
                  <span className="text-right">操作</span>
                </div>
                <div className="divide-y divide-border">
                  {sortedWorkflows.map((workflow) => {
                    const statusInfo = getStatusInfo(workflow.status);
                    const rowAccent =
                      workflow.status === "active"
                        ? "border-l-brand-500/40"
                        : workflow.status === "paused"
                          ? "border-l-warning/40"
                          : workflow.status === "error"
                            ? "border-l-destructive/40"
                            : "border-l-transparent";
                    return (
                      <div
                        key={workflow.id}
                        className={cn(
                          "group grid grid-cols-1 lg:grid-cols-[minmax(0,2.2fr)_140px_120px_120px_100px_110px] xl:grid-cols-[minmax(0,2.2fr)_140px_120px_120px_100px_110px_110px] gap-4 px-5 py-3.5 border-l-2 hover:bg-surface-75/80 transition-colors",
                          rowAccent
                        )}
                      >
                        <div className="flex flex-col gap-2 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-md bg-surface-200/80 border border-border flex items-center justify-center shrink-0">
                              <Zap className="w-4 h-4 text-foreground-light" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {workflow.starred && (
                                  <Star className="w-4 h-4 text-warning fill-current" />
                                )}
                                <Link
                                  href={`/workflows/${workflow.id}`}
                                  className="text-sm font-medium text-foreground hover:text-brand-500 transition-colors truncate"
                                >
                                  {workflow.name}
                                </Link>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border",
                                    statusInfo.bg,
                                    statusInfo.color,
                                    statusInfo.border
                                  )}
                                >
                                  <statusInfo.icon className="w-3 h-3" />
                                  {statusInfo.label}
                                </span>
                              </div>
                              <p className="text-[13px] text-foreground-light line-clamp-1">
                                {workflow.description}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-foreground-muted">
                                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-200/60 px-2 py-0.5">
                                  <Folder className="w-3 h-3" />
                                  {workflow.folder}
                                </span>
                                {workflow.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-md border border-border bg-surface-200/60 px-2 py-0.5 text-[11px]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {workflow.tags.length > 2 && (
                                  <span className="text-[11px] text-foreground-muted">
                                    +{workflow.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted lg:hidden">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {workflow.trigger.includes("定时") ? "定时" : workflow.trigger}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {workflow.lastRun}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {workflow.totalRuns}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {workflow.successRate}%
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {workflow.updatedAt}
                            </span>
                          </div>
                        </div>

                        <div className="hidden lg:flex items-center text-xs text-foreground-light">
                          {workflow.trigger.includes("定时") ? "定时" : workflow.trigger}
                        </div>
                        <div className="hidden lg:flex items-center text-xs text-foreground-light">
                          {workflow.lastRun}
                        </div>
                        <div className="hidden lg:flex items-center text-xs text-foreground-light">
                          {workflow.totalRuns}
                        </div>
                        <div className="hidden lg:flex items-center text-xs text-foreground-light">
                          {workflow.successRate}%
                        </div>
                        <div className="hidden xl:flex items-center text-xs text-foreground-light">
                          {workflow.updatedAt}
                        </div>

                        <div className="flex items-center justify-start lg:justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-foreground-muted hover:text-foreground"
                            asChild
                          >
                            <Link href={`/editor/${workflow.id}`} aria-label="编辑工作流">
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          {workflow.status === "active" ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-foreground-muted hover:text-foreground"
                              aria-label="暂停工作流"
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          ) : workflow.status !== "draft" ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-foreground-muted hover:text-foreground"
                              aria-label="启用工作流"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          ) : null}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-foreground-muted hover:text-foreground"
                                aria-label="更多操作"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-40 bg-surface-100 border border-border rounded-md"
                            >
                              <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm text-foreground-light hover:bg-surface-200 hover:text-foreground rounded-md mx-1 cursor-pointer">
                                <Copy className="w-4 h-4" />
                                复制
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm text-foreground-light hover:bg-surface-200 hover:text-foreground rounded-md mx-1 cursor-pointer">
                                <Star className="w-4 h-4" />
                                {workflow.starred ? "取消收藏" : "收藏"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border mx-2" />
                              <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive-200 hover:text-destructive rounded-md mx-1 cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {sortedWorkflows.length > 0 && viewMode !== "list" && (
            <div className="page-grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedWorkflows.map((workflow) => {
                const statusInfo = getStatusInfo(workflow.status);
                return (
                  <Link
                    key={workflow.id}
                    href={`/workflows/${workflow.id}`}
                    className={cn(
                      "page-panel p-5 transition-supabase group bg-surface-100/80",
                      "hover:border-border-strong hover:bg-surface-75/80"
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-9 h-9 rounded-md bg-surface-200/80 border border-border flex items-center justify-center">
                        <Zap className="w-4 h-4 text-foreground-light" />
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border",
                          statusInfo.bg,
                          statusInfo.color,
                          statusInfo.border
                        )}
                      >
                        <statusInfo.icon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-foreground-muted mb-3">
                      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-200/60 px-2 py-0.5">
                        <Folder className="w-3 h-3" />
                        {workflow.folder}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {workflow.updatedAt}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-1 group-hover:text-brand-500 transition-colors flex items-center gap-2">
                      {workflow.starred && (
                        <Star className="w-4 h-4 text-warning fill-current" />
                      )}
                      {workflow.name}
                    </h3>
                    <p className="text-[13px] text-foreground-light mb-4 line-clamp-2">
                      {workflow.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {workflow.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-border bg-surface-200/60 px-2 py-0.5 text-[11px] text-foreground-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-foreground-muted">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {workflow.totalRuns}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {workflow.successRate}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {workflow.lastRun}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          {sortedWorkflows.length === 0 && (
            <div className="page-panel px-6 py-16 text-center border-dashed border-border bg-surface-100/60">
              <div className="w-14 h-14 rounded-md bg-surface-200/80 border border-border flex items-center justify-center mx-auto mb-5">
                <Zap className="w-6 h-6 text-foreground-muted" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">
                {searchQuery || statusFilter !== "all"
                  ? "没有找到匹配的工作流"
                  : "还没有创建工作流"}
              </h3>
              <p className="text-[13px] text-foreground-light mb-6 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "尝试使用其他关键词或筛选条件"
                  : "创建您的第一个工作流，开始自动化之旅"}
              </p>
              {searchQuery || statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  清除筛选
                </Button>
              ) : (
                <Link href="/workflows/new">
                  <Button>
                    <Plus className="mr-2 w-4 h-4" />
                    创建工作流
                  </Button>
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
