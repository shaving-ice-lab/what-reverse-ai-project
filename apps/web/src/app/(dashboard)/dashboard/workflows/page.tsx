"use client";

/**
 * 工作流列表页面
 * Supabase Settings 风格：侧边导航 + 右侧内容区面板化布局
 * 参考 STYLE-TERMINAL-PIXEL.md 极简文本样式规范
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
  LayoutGrid,
  List,
  Folder,
  Star,
  ChevronDown,
} from "lucide-react";
import {
  PageWithSidebar,
  SidebarNavItem,
  SidebarNavGroup,
  CategoryHeader,
} from "@/components/dashboard/page-layout";
import { LegacyEntryBanner } from "@/components/dashboard/legacy-entry-banner";
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

// 获取状态信息
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

// 侧边栏导航组件
function WorkflowSidebar({
  statusFilter,
  setStatusFilter,
  selectedFolder,
  setSelectedFolder,
  stats,
}: {
  statusFilter: WorkflowStatus | "all";
  setStatusFilter: (status: WorkflowStatus | "all") => void;
  selectedFolder: string;
  setSelectedFolder: (folder: string) => void;
  stats: {
    total: number;
    active: number;
    paused: number;
    error: number;
    draft: number;
  };
}) {
  return (
    <div className="space-y-1">
      {/* 状态筛选 */}
      <SidebarNavGroup title="状态">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium transition-colors",
            statusFilter === "all"
              ? "bg-surface-100/70 text-foreground"
              : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
          )}
        >
          <span>全部工作流</span>
          <span className="text-[11px] text-foreground-muted">{stats.total}</span>
        </button>
        <button
          onClick={() => setStatusFilter("active")}
          className={cn(
            "w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium transition-colors",
            statusFilter === "active"
              ? "bg-surface-100/70 text-foreground"
              : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            运行中
          </span>
          <span className="text-[11px] text-foreground-muted">{stats.active}</span>
        </button>
        <button
          onClick={() => setStatusFilter("paused")}
          className={cn(
            "w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium transition-colors",
            statusFilter === "paused"
              ? "bg-surface-100/70 text-foreground"
              : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            已暂停
          </span>
          <span className="text-[11px] text-foreground-muted">{stats.paused}</span>
        </button>
        <button
          onClick={() => setStatusFilter("error")}
          className={cn(
            "w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium transition-colors",
            statusFilter === "error"
              ? "bg-surface-100/70 text-foreground"
              : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
            异常
          </span>
          <span className="text-[11px] text-foreground-muted">{stats.error}</span>
        </button>
        <button
          onClick={() => setStatusFilter("draft")}
          className={cn(
            "w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium transition-colors",
            statusFilter === "draft"
              ? "bg-surface-100/70 text-foreground"
              : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
            草稿
          </span>
          <span className="text-[11px] text-foreground-muted">{stats.draft}</span>
        </button>
      </SidebarNavGroup>

      {/* 分隔线 */}
      <div className="h-px bg-border my-3" />

      {/* 文件夹筛选 */}
      <SidebarNavGroup title="文件夹">
        {folders.map((folder) => (
          <button
            key={folder.name}
            onClick={() => setSelectedFolder(folder.name)}
            className={cn(
              "w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium transition-colors",
              selectedFolder === folder.name
                ? "bg-surface-100/70 text-foreground"
                : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
            )}
          >
            <span>{folder.name}</span>
            <span className="text-[11px] text-foreground-muted">{folder.count}</span>
          </button>
        ))}
      </SidebarNavGroup>

      {/* 新建文件夹 */}
      <button className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[12px] text-foreground-muted hover:text-foreground hover:bg-surface-100/60 transition-colors mt-2">
        <Plus className="w-3.5 h-3.5" />
        新建文件夹
      </button>
    </div>
  );
}

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
    <PageWithSidebar
      sidebarTitle="工作流"
      sidebarWidth="narrow"
      sidebar={
        <WorkflowSidebar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          selectedFolder={selectedFolder}
          setSelectedFolder={setSelectedFolder}
          stats={stats}
        />
      }
    >
      <div className="space-y-6 max-w-[960px]">
        <LegacyEntryBanner type="workflow" />
        {/* 页面头部 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-foreground">工作流管理</h1>
            <p className="text-[12px] text-foreground-light mt-1">
              管理和监控所有自动化工作流
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>
              导入
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/workflows/new">
                <Plus className="h-3.5 w-3.5" />
                创建工作流
              </Link>
            </Button>
          </div>
        </div>

        {/* 概览面板 */}
        <div className="page-panel">
          <div className="page-panel-header">
            <h2 className="page-panel-title">概览</h2>
            <p className="page-panel-description">关键指标与最近更新</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="p-3 rounded-md border border-border bg-surface-75/60">
                <p className="text-[11px] text-foreground-muted mb-1">总工作流</p>
                <p className="text-lg font-semibold text-foreground">{stats.total}</p>
                <p className="text-[11px] text-foreground-muted">{stats.starred} 已收藏</p>
              </div>
              <div className="p-3 rounded-md border border-border bg-surface-75/60">
                <p className="text-[11px] text-foreground-muted mb-1">运行中</p>
                <p className="text-lg font-semibold text-foreground">{stats.active}</p>
                <p className="text-[11px] text-foreground-muted">{stats.paused} 已暂停</p>
              </div>
              <div className="p-3 rounded-md border border-border bg-surface-75/60">
                <p className="text-[11px] text-foreground-muted mb-1">执行次数</p>
                <p className="text-lg font-semibold text-foreground">{stats.totalRuns.toLocaleString()}</p>
                <p className="text-[11px] text-foreground-muted">累计运行</p>
              </div>
              <div className="p-3 rounded-md border border-border bg-surface-75/60">
                <p className="text-[11px] text-foreground-muted mb-1">平均成功率</p>
                <p className="text-lg font-semibold text-brand-500">{stats.avgSuccessRate.toFixed(1)}%</p>
                <p className="text-[11px] text-foreground-muted">{stats.error} 异常</p>
              </div>
            </div>

            {/* 最近更新 */}
            {mostRecentWorkflow && (
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-foreground-muted uppercase tracking-wide">最近更新</span>
                  <span className="text-[11px] text-foreground-muted">{mostRecentWorkflow.updatedAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-surface-200/80 border border-border flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5 text-foreground-light" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {mostRecentWorkflow.starred && (
                          <Star className="w-3.5 h-3.5 text-warning fill-current" />
                        )}
                        <Link
                          href={`/dashboard/workflows/${mostRecentWorkflow.id}`}
                          className="text-[13px] font-medium text-foreground hover:text-brand-500 transition-colors truncate"
                        >
                          {mostRecentWorkflow.name}
                        </Link>
                        {recentStatusInfo && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                              recentStatusInfo.bg,
                              recentStatusInfo.color,
                              recentStatusInfo.border
                            )}
                          >
                            {recentStatusInfo.label}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-foreground-light truncate">
                        {mostRecentWorkflow.description}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="shrink-0 ml-4">
                    <Link href={`/editor/${mostRecentWorkflow.id}`}>编辑</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 工作流列表面板 */}
        <div className="page-panel">
          <div className="page-panel-header flex items-center justify-between">
            <div>
              <h2 className="page-panel-title">工作流</h2>
              <p className="page-panel-description">
                {sortedWorkflows.length} 个工作流
                {statusFilter !== "all" && ` · ${getStatusInfo(statusFilter).label}`}
                {selectedFolder !== "全部" && ` · ${selectedFolder}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ButtonGroup
                attached
                className="border border-border rounded-md overflow-hidden bg-surface-200/60"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-none h-7 px-2",
                    viewMode === "list"
                      ? "bg-surface-200 text-foreground"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-none h-7 px-2",
                    viewMode === "grid"
                      ? "bg-surface-200 text-foreground"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
              </ButtonGroup>
            </div>
          </div>

          {/* 工具栏 */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <Input
              placeholder="搜索工作流..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="search"
              inputSize="sm"
              leftIcon={<Search className="h-3.5 w-3.5" />}
              className="max-w-[240px]"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ChevronDown className="h-3 w-3" />}
                  className="h-8"
                >
                  {sortOptions.find((option) => option.value === sortBy)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-36 bg-surface-100 border border-border rounded-md"
              >
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={cn(
                      "px-3 py-1.5 text-[12px] rounded-md mx-1 cursor-pointer",
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
          </div>

          {/* 列表视图 */}
          {sortedWorkflows.length > 0 && viewMode === "list" && (
            <div>
              {/* 表头 */}
              <div className="hidden lg:grid grid-cols-[1fr_100px_100px_80px_80px] gap-4 px-4 py-2 border-b border-border text-[11px] font-medium text-foreground-muted uppercase tracking-wide">
                <span>工作流</span>
                <span>触发方式</span>
                <span>最近运行</span>
                <span>运行次数</span>
                <span className="text-right">操作</span>
              </div>
              {/* 列表项 */}
              <div className="divide-y divide-border">
                {sortedWorkflows.map((workflow) => {
                  const statusInfo = getStatusInfo(workflow.status);
                  return (
                    <div
                      key={workflow.id}
                      className="group grid grid-cols-1 lg:grid-cols-[1fr_100px_100px_80px_80px] gap-4 px-4 py-3 hover:bg-surface-75/50 transition-colors"
                    >
                      {/* 工作流信息 */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-surface-200/80 border border-border flex items-center justify-center shrink-0">
                          <Zap className="w-3.5 h-3.5 text-foreground-light" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {workflow.starred && (
                              <Star className="w-3.5 h-3.5 text-warning fill-current shrink-0" />
                            )}
                            <Link
                              href={`/dashboard/workflows/${workflow.id}`}
                              className="text-[13px] font-medium text-foreground hover:text-brand-500 transition-colors truncate"
                            >
                              {workflow.name}
                            </Link>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0",
                                statusInfo.bg,
                                statusInfo.color,
                                statusInfo.border
                              )}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-foreground-light truncate">
                            {workflow.description}
                          </p>
                        </div>
                      </div>

                      {/* 触发方式 */}
                      <div className="hidden lg:flex items-center text-[11px] text-foreground-light">
                        {workflow.trigger.includes("定时") ? "定时" : workflow.trigger}
                      </div>

                      {/* 最近运行 */}
                      <div className="hidden lg:flex items-center text-[11px] text-foreground-light">
                        {workflow.lastRun}
                      </div>

                      {/* 运行次数 */}
                      <div className="hidden lg:flex items-center text-[11px] text-foreground-light">
                        {workflow.totalRuns}
                      </div>

                      {/* 操作 */}
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-foreground-muted hover:text-foreground h-7 w-7"
                          asChild
                        >
                          <Link href={`/editor/${workflow.id}`} aria-label="编辑工作流">
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-foreground-muted hover:text-foreground h-7 w-7"
                              aria-label="更多操作"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-36 bg-surface-100 border border-border rounded-md"
                          >
                            {workflow.status === "active" ? (
                              <DropdownMenuItem className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:bg-surface-200 hover:text-foreground rounded-md mx-1 cursor-pointer">
                                <Pause className="w-3.5 h-3.5" />
                                暂停
                              </DropdownMenuItem>
                            ) : workflow.status !== "draft" ? (
                              <DropdownMenuItem className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:bg-surface-200 hover:text-foreground rounded-md mx-1 cursor-pointer">
                                <Play className="w-3.5 h-3.5" />
                                启用
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:bg-surface-200 hover:text-foreground rounded-md mx-1 cursor-pointer">
                              <Copy className="w-3.5 h-3.5" />
                              复制
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-foreground-light hover:bg-surface-200 hover:text-foreground rounded-md mx-1 cursor-pointer">
                              <Star className="w-3.5 h-3.5" />
                              {workflow.starred ? "取消收藏" : "收藏"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border mx-2" />
                            <DropdownMenuItem className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-destructive hover:bg-destructive-200 hover:text-destructive rounded-md mx-1 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* 移动端信息 */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-foreground-muted lg:hidden">
                        <span>{workflow.trigger.includes("定时") ? "定时" : workflow.trigger}</span>
                        <span>{workflow.lastRun}</span>
                        <span>{workflow.totalRuns} 次运行</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 网格视图 */}
          {sortedWorkflows.length > 0 && viewMode === "grid" && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedWorkflows.map((workflow) => {
                const statusInfo = getStatusInfo(workflow.status);
                return (
                  <Link
                    key={workflow.id}
                    href={`/dashboard/workflows/${workflow.id}`}
                    className="block p-4 rounded-lg border border-border bg-surface-75/60 hover:border-border-strong hover:bg-surface-100/80 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 rounded-md bg-surface-200/80 border border-border flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-foreground-light" />
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                          statusInfo.bg,
                          statusInfo.color,
                          statusInfo.border
                        )}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <h3 className="text-[13px] font-medium text-foreground mb-1 group-hover:text-brand-500 transition-colors flex items-center gap-2">
                      {workflow.starred && (
                        <Star className="w-3.5 h-3.5 text-warning fill-current" />
                      )}
                      <span className="truncate">{workflow.name}</span>
                    </h3>
                    <p className="text-[11px] text-foreground-light mb-3 line-clamp-2">
                      {workflow.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-foreground-muted">
                      <span>{workflow.totalRuns} 次运行</span>
                      <span>{workflow.updatedAt}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* 空状态 */}
          {sortedWorkflows.length === 0 && (
            <div className="px-4 py-12 text-center">
              <div className="w-12 h-12 rounded-md bg-surface-200/80 border border-border flex items-center justify-center mx-auto mb-4">
                <Zap className="w-5 h-5 text-foreground-muted" />
              </div>
              <h3 className="text-[13px] font-medium text-foreground mb-1">
                {searchQuery || statusFilter !== "all"
                  ? "没有找到匹配的工作流"
                  : "还没有创建工作流"}
              </h3>
              <p className="text-[11px] text-foreground-light mb-4 max-w-xs mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "尝试使用其他关键词或筛选条件"
                  : "创建您的第一个工作流，开始自动化之旅"}
              </p>
              {searchQuery || statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setSelectedFolder("全部");
                  }}
                >
                  清除筛选
                </Button>
              ) : (
                <Button size="sm" asChild>
                  <Link href="/dashboard/workflows/new">
                    <Plus className="mr-1.5 w-3.5 h-3.5" />
                    创建工作流
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </PageWithSidebar>
  );
}
