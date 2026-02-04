"use client";

/**
 * 对话历史页面
 * 浏览和管理所有历史对话记录
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, ButtonGroup } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  History,
  Search,
  MessageSquare,
  Bot,
  Trash2,
  Archive,
  Star,
  StarOff,
  MoreHorizontal,
  ArrowUpDown,
  Clock,
  Download,
  Share2,
  Copy,
  Eye,
  Sparkles,
  Code,
  Image,
  RefreshCw,
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

// 对话类型配置
const typeConfig = {
  chat: {
    label: "对话",
    variant: "primary",
    icon: MessageSquare,
    iconColor: "text-brand-500",
  },
  agent: {
    label: "Agent",
    variant: "secondary",
    icon: Bot,
    iconColor: "text-foreground-light",
  },
  creative: {
    label: "创意",
    variant: "warning",
    icon: Sparkles,
    iconColor: "text-warning",
  },
  code: {
    label: "代码",
    variant: "outline",
    icon: Code,
    iconColor: "text-brand-500",
  },
  image: {
    label: "图像",
    variant: "secondary",
    icon: Image,
    iconColor: "text-foreground-light",
  },
} as const;

// 模拟对话历史数据
const mockConversations = [
  {
    id: "conv-1",
    title: "关于 React 性能优化的讨论",
    preview: "如何使用 useMemo 和 useCallback 优化组件渲染...",
    type: "chat" as const,
    model: "GPT-4",
    messageCount: 24,
    starred: true,
    archived: false,
    createdAt: "2026-01-31T10:30:00",
    updatedAt: "2026-01-31T14:20:00",
  },
  {
    id: "conv-2",
    title: "产品营销文案生成",
    preview: "为新产品发布会撰写一篇吸引人的营销文案...",
    type: "creative" as const,
    model: "Claude 3",
    messageCount: 12,
    starred: false,
    archived: false,
    createdAt: "2026-01-30T16:45:00",
    updatedAt: "2026-01-30T17:30:00",
  },
  {
    id: "conv-3",
    title: "Python 数据分析脚本",
    preview: "编写一个自动化数据清洗和分析的 Python 脚本...",
    type: "code" as const,
    model: "GPT-4",
    messageCount: 18,
    starred: true,
    archived: false,
    createdAt: "2026-01-30T09:15:00",
    updatedAt: "2026-01-30T11:45:00",
  },
  {
    id: "conv-4",
    title: "客服助手 Agent 对话",
    preview: "测试新配置的客服 Agent 响应质量...",
    type: "agent" as const,
    model: "Custom Agent",
    messageCount: 35,
    starred: false,
    archived: false,
    createdAt: "2026-01-29T14:00:00",
    updatedAt: "2026-01-29T15:30:00",
  },
  {
    id: "conv-5",
    title: "网站 Banner 设计",
    preview: "为电商网站首页生成一组促销 Banner...",
    type: "image" as const,
    model: "DALL-E 3",
    messageCount: 8,
    starred: false,
    archived: false,
    createdAt: "2026-01-29T10:00:00",
    updatedAt: "2026-01-29T10:45:00",
  },
  {
    id: "conv-6",
    title: "API 文档编写",
    preview: "为 REST API 接口编写详细的技术文档...",
    type: "creative" as const,
    model: "Claude 3",
    messageCount: 15,
    starred: true,
    archived: false,
    createdAt: "2026-01-28T11:30:00",
    updatedAt: "2026-01-28T13:00:00",
  },
  {
    id: "conv-7",
    title: "Vue.js 组件重构",
    preview: "将 Options API 组件迁移到 Composition API...",
    type: "code" as const,
    model: "GPT-4",
    messageCount: 28,
    starred: false,
    archived: true,
    createdAt: "2026-01-27T09:00:00",
    updatedAt: "2026-01-27T12:30:00",
  },
  {
    id: "conv-8",
    title: "用户调研问卷设计",
    preview: "设计一份针对产品体验的用户调研问卷...",
    type: "chat" as const,
    model: "GPT-4",
    messageCount: 10,
    starred: false,
    archived: true,
    createdAt: "2026-01-26T15:00:00",
    updatedAt: "2026-01-26T16:00:00",
  },
];

// 时间范围选项
const timeRanges = [
  { value: "all", label: "全部时间" },
  { value: "today", label: "今天" },
  { value: "week", label: "最近 7 天" },
  { value: "month", label: "最近 30 天" },
  { value: "quarter", label: "最近 3 个月" },
];

type SortKey = "updated" | "created" | "messages" | "title";
type ViewMode = "all" | "starred" | "archived";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "updated", label: "最近更新" },
  { value: "created", label: "创建时间" },
  { value: "messages", label: "消息数量" },
  { value: "title", label: "标题" },
];

// 格式化时间
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `今天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    return `昨天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else {
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  }
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [timeRange, setTimeRange] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [showArchived, setShowArchived] = useState(false);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [conversations, setConversations] = useState(mockConversations);

  const activeView: ViewMode = showArchived ? "archived" : showStarredOnly ? "starred" : "all";

  const setView = (view: ViewMode) => {
    if (view === "all") {
      setShowArchived(false);
      setShowStarredOnly(false);
      return;
    }
    if (view === "starred") {
      setShowStarredOnly(true);
      setShowArchived(false);
      return;
    }
    setShowArchived(true);
    setShowStarredOnly(false);
  };

  // 筛选并排序对话
  const visibleConversations = useMemo(() => {
    const filtered = conversations.filter((conv) => {
      // 搜索过滤
      const matchesSearch =
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.preview.toLowerCase().includes(searchQuery.toLowerCase());

      // 类型过滤
      const matchesType = selectedType === "all" || conv.type === selectedType;

      // 视图过滤
      const matchesArchived = activeView === "archived" ? conv.archived : true;
      const matchesStarred = activeView === "starred" ? conv.starred : true;

      // 时间范围过滤
      let matchesTime = true;
      if (timeRange !== "all") {
        const convDate = new Date(conv.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - convDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (timeRange) {
          case "today":
            matchesTime = diffDays === 0;
            break;
          case "week":
            matchesTime = diffDays <= 7;
            break;
          case "month":
            matchesTime = diffDays <= 30;
            break;
          case "quarter":
            matchesTime = diffDays <= 90;
            break;
        }
      }

      return matchesSearch && matchesType && matchesArchived && matchesStarred && matchesTime;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "messages":
          return b.messageCount - a.messageCount;
        case "title":
          return a.title.localeCompare(b.title, "zh-CN");
        case "updated":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return sorted;
  }, [conversations, searchQuery, selectedType, activeView, timeRange, sortBy]);

  // 切换选择
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (visibleConversations.length === 0) {
      return;
    }
    if (selectedItems.size === visibleConversations.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(visibleConversations.map((c) => c.id)));
    }
  };

  // 切换收藏
  const toggleStar = (id: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id ? { ...conv, starred: !conv.starred } : conv
      )
    );
  };

  // 删除对话
  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    selectedItems.delete(id);
    setSelectedItems(new Set(selectedItems));
  };

  // 归档对话
  const archiveConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id ? { ...conv, archived: !conv.archived } : conv
      )
    );
  };

  // 批量操作
  const bulkDelete = () => {
    setConversations((prev) => prev.filter((conv) => !selectedItems.has(conv.id)));
    setSelectedItems(new Set());
  };

  const bulkArchive = () => {
    setConversations((prev) =>
      prev.map((conv) =>
        selectedItems.has(conv.id) ? { ...conv, archived: true } : conv
      )
    );
    setSelectedItems(new Set());
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setTimeRange("all");
    setSortBy("updated");
    setShowArchived(false);
    setShowStarredOnly(false);
  };

  // 统计数据
  const stats = {
    total: conversations.length,
    active: conversations.filter((c) => !c.archived).length,
    starred: conversations.filter((c) => c.starred).length,
    archived: conversations.filter((c) => c.archived).length,
    today: conversations.filter((c) => {
      const diffDays = Math.floor(
        (new Date().getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays === 0;
    }).length,
  };

  const sortLabel = sortOptions.find((option) => option.value === sortBy)?.label ?? "最近更新";

  const statCards = [
    {
      label: "活跃对话",
      value: stats.active,
      helper: "未归档",
      icon: MessageSquare,
      iconClassName: "bg-brand-200/60 border-brand-400/40 text-brand-500",
    },
    {
      label: "收藏对话",
      value: stats.starred,
      helper: "已标记星标",
      icon: Star,
      iconClassName: "bg-warning-200/60 border-warning/30 text-warning",
    },
    {
      label: "今日对话",
      value: stats.today,
      helper: "过去 24 小时",
      icon: Clock,
      iconClassName: "bg-surface-200 border-border text-foreground-light",
    },
    {
      label: "已归档",
      value: stats.archived,
      helper: "历史记录",
      icon: Archive,
      iconClassName: "bg-surface-200 border-border text-foreground-light",
    },
  ];

  const viewTabs = [
    { value: "all", label: "全部", count: stats.total },
    { value: "starred", label: "收藏", count: stats.starred },
    { value: "archived", label: "归档", count: stats.archived },
  ] as const;

  const latestUpdate = useMemo(() => {
    if (conversations.length === 0) return null;

    return conversations.reduce((latest, conv) => {
      return new Date(conv.updatedAt).getTime() > new Date(latest).getTime()
        ? conv.updatedAt
        : latest;
    }, conversations[0].updatedAt);
  }, [conversations]);

  const hasSelection = selectedItems.size > 0;

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="page-caption">Conversations</p>
          <PageHeader
            title="对话历史"
            description="浏览和管理您的所有对话记录"
            actions={(
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  导出
                </Button>
                <Link href="/">
                  <Button size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
                    新建对话
                  </Button>
                </Link>
              </div>
            )}
          >
            <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {latestUpdate ? `最近更新 ${formatDate(latestUpdate)}` : "暂无记录"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                收藏 {stats.starred}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5" />
                归档 {stats.archived}
              </span>
            </div>
          </PageHeader>
        </div>

        <section className="page-section">
          <div className="page-grid grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  variant="stats"
                  hover="border"
                  padding="sm"
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs text-foreground-muted">{stat.label}</p>
                    <p className="text-stat-number text-foreground tabular-nums">{stat.value}</p>
                    <p className="text-[11px] text-foreground-muted">{stat.helper}</p>
                  </div>
                  <div
                    className={cn(
                      "h-9 w-9 rounded-md border flex items-center justify-center",
                      stat.iconClassName
                    )}
                  >
                    <StatIcon className="w-4 h-4" />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="page-panel p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <Input
                variant="dark"
                placeholder="搜索对话标题或摘要..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-surface-200 border border-border text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <SelectValue placeholder="对话类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="chat">对话</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="creative">创意</SelectItem>
                <SelectItem value="code">代码</SelectItem>
                <SelectItem value="image">图像</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortKey)}>
            <SelectTrigger className="w-[150px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-foreground-muted" />
                  <SelectValue placeholder="排序方式" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ButtonGroup attached className="flex-wrap">
              {viewTabs.map((view) => (
                <Button
                  key={view.value}
                  variant={activeView === view.value ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setView(view.value)}
                  className={cn(activeView === view.value && "bg-surface-200 border-border-strong")}
                >
                  {view.label}
                  <span className="ml-1 text-[11px] text-foreground-muted tabular-nums">
                    {view.count}
                  </span>
                </Button>
              ))}
            </ButtonGroup>

            <Button variant="ghost" size="sm" onClick={resetFilters}>
              重置筛选
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <span>
              显示 {visibleConversations.length} / {conversations.length}
            </span>
            {searchQuery && (
              <Badge variant="outline" size="xs">
                关键词：{searchQuery}
              </Badge>
            )}
            {selectedType !== "all" && (
              <Badge variant="outline" size="xs">
                类型：{typeConfig[selectedType as keyof typeof typeConfig]?.label}
              </Badge>
            )}
            {timeRange !== "all" && (
              <Badge variant="outline" size="xs">
                {timeRanges.find((range) => range.value === timeRange)?.label}
              </Badge>
            )}
            {sortBy !== "updated" && (
              <Badge variant="outline" size="xs">
                排序：{sortLabel}
              </Badge>
            )}
            {activeView === "starred" && (
              <Badge variant="warning" size="xs">
                仅收藏
              </Badge>
            )}
            {activeView === "archived" && (
              <Badge variant="secondary" size="xs">
                仅归档
              </Badge>
            )}
          </div>
        </section>

        {/* 批量操作栏 */}
        {hasSelection && (
          <section className="page-panel border-brand-400/40 bg-brand-200/20">
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2 text-[13px] text-foreground">
                <Badge variant="primary" size="sm">
                  {selectedItems.size}
                </Badge>
                已选择 {selectedItems.size} 条对话
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={bulkArchive}>
                  <Archive className="w-4 h-4" />
                  归档
                </Button>
                <Button variant="destructive" size="sm" onClick={bulkDelete}>
                  <Trash2 className="w-4 h-4" />
                  删除
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
                  取消选择
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* 对话列表 */}
        <section className="page-panel overflow-hidden">
          <div className="page-panel-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="page-panel-title">对话列表</p>
              <p className="page-panel-description">共 {visibleConversations.length} 条对话</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
                刷新
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                导出
              </Button>
            </div>
          </div>

          <div className="border-t border-border">
            <div className="grid items-center gap-4 px-4 py-2.5 border-b border-border bg-surface-75/80 text-table-header grid-cols-[24px_minmax(0,1fr)_72px] md:grid-cols-[24px_minmax(0,1fr)_110px_120px_72px] lg:grid-cols-[24px_minmax(0,1fr)_110px_90px_120px_72px]">
              <Checkbox
                checked={selectedItems.size === visibleConversations.length && visibleConversations.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="flex-1 text-left">对话</span>
              <span className="hidden md:block text-center">类型</span>
              <span className="hidden lg:block text-center">消息</span>
              <span className="hidden md:block text-center">更新时间</span>
              <span className="text-right">操作</span>
            </div>

            {visibleConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-md bg-surface-200 border border-border flex items-center justify-center mb-4">
                  <History className="w-6 h-6 text-foreground-muted" />
                </div>
                <h3 className="text-base font-medium text-foreground mb-2">没有找到对话</h3>
                <p className="text-[13px] text-foreground-light mb-4 max-w-sm">
                  {searchQuery ? "尝试其他搜索关键词" : "开始新的对话吧"}
                </p>
                <Link href="/">
                  <Button size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
                    新建对话
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {visibleConversations.map((conv) => {
                  const config = typeConfig[conv.type];
                  const TypeIcon = config.icon;
                  const isSelected = selectedItems.has(conv.id);

                  return (
                    <div
                      key={conv.id}
                      className={cn(
                        "grid items-center gap-4 px-4 py-4 transition-supabase grid-cols-[24px_minmax(0,1fr)_72px] md:grid-cols-[24px_minmax(0,1fr)_110px_120px_72px] lg:grid-cols-[24px_minmax(0,1fr)_110px_90px_120px_72px]",
                        isSelected ? "bg-brand-200/20" : "hover:bg-surface-75/60"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(conv.id)}
                      />

                      <div className="min-w-0 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-md bg-surface-200 border border-border flex items-center justify-center">
                          <TypeIcon className={cn("w-4 h-4", config.iconColor)} />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/chat/${conv.id}`} className="group block min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors truncate">
                                {conv.title}
                              </h3>
                              <Badge variant="outline" size="xs" className="hidden md:inline-flex">
                                {conv.model}
                              </Badge>
                              {conv.starred && (
                                <Star className="w-4 h-4 text-warning fill-current shrink-0" />
                              )}
                              {conv.archived && (
                                <Badge variant="outline" size="xs">
                                  已归档
                                </Badge>
                              )}
                            </div>
                            <p className="text-[13px] text-foreground-light truncate">
                              {conv.preview}
                            </p>
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-muted md:hidden">
                            <Badge variant="outline" size="xs">
                              {conv.model}
                            </Badge>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {conv.messageCount} 条消息
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(conv.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:flex justify-center">
                        <Badge
                          variant={config.variant}
                          size="sm"
                          icon={<TypeIcon className="w-3 h-3" />}
                        >
                          {config.label}
                        </Badge>
                      </div>

                      <div className="hidden lg:flex justify-center">
                        <span className="text-[13px] text-foreground-light tabular-nums">
                          {conv.messageCount} 条
                        </span>
                      </div>

                      <div className="hidden md:flex justify-center">
                        <span className="text-[13px] text-foreground-light">
                          {formatDate(conv.updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => toggleStar(conv.id)}
                          className={cn(conv.starred ? "text-warning" : "text-foreground-muted")}
                        >
                          {conv.starred ? (
                            <Star className="w-4 h-4 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4" />
                          )}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-xs" className="text-foreground-muted">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-52 rounded-lg bg-surface-100 border-border shadow-2xl"
                          >
                            <DropdownMenuItem
                              asChild
                              className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200"
                            >
                              <Link href={`/chat/${conv.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                查看对话
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200">
                              <Copy className="w-4 h-4 mr-2" />
                              复制链接
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200">
                              <Share2 className="w-4 h-4 mr-2" />
                              分享
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200">
                              <Download className="w-4 h-4 mr-2" />
                              导出
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              onClick={() => archiveConversation(conv.id)}
                              className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200"
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              {conv.archived ? "取消归档" : "归档"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-[13px] text-destructive-400 focus:text-destructive focus:bg-destructive-200"
                              onClick={() => deleteConversation(conv.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              删除
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
        </section>
      </div>
    </PageContainer>
  );
}
