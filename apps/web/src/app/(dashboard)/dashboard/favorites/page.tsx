"use client";

/**
 * 收藏夹页面
 * 管理用户收藏的工作流、Agent、模板等内容
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
  Star,
  Search,
  Zap,
  Bot,
  FileText,
  FolderOpen,
  MoreHorizontal,
  ArrowUpDown,
  Clock,
  Trash2,
  StarOff,
  ExternalLink,
  Copy,
  RefreshCw,
  LayoutGrid,
  List,
  Heart,
  Sparkles,
  BookOpen,
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

// 收藏类型配置
const typeConfig = {
  workflow: {
    label: "工作流",
    variant: "primary" as const,
    icon: Zap,
    color: "text-brand-500",
    bgColor: "bg-brand-200/60",
    borderColor: "border-brand-400/40",
  },
  agent: {
    label: "Agent",
    variant: "secondary" as const,
    icon: Bot,
    color: "text-foreground-light",
    bgColor: "bg-surface-200",
    borderColor: "border-border",
  },
  template: {
    label: "模板",
    variant: "warning" as const,
    icon: BookOpen,
    color: "text-warning",
    bgColor: "bg-warning-200/60",
    borderColor: "border-warning/30",
  },
  document: {
    label: "文档",
    variant: "outline" as const,
    icon: FileText,
    color: "text-foreground-muted",
    bgColor: "bg-surface-200",
    borderColor: "border-border",
  },
  folder: {
    label: "文件夹",
    variant: "outline" as const,
    icon: FolderOpen,
    color: "text-foreground-muted",
    bgColor: "bg-surface-200",
    borderColor: "border-border",
  },
};

type FavoriteType = keyof typeof typeConfig;

// 模拟收藏数据
const mockFavorites = [
  {
    id: "fav-1",
    name: "每日数据同步工作流",
    description: "自动同步多个数据源的数据到主数据库",
    type: "workflow" as FavoriteType,
    href: "/dashboard/workflows/wf-1",
    createdAt: "2026-01-15T10:00:00",
    favoritedAt: "2026-02-01T14:30:00",
    author: "系统",
    usageCount: 156,
  },
  {
    id: "fav-2",
    name: "客服智能助手",
    description: "基于 GPT-4 的智能客服 Agent，支持多轮对话",
    type: "agent" as FavoriteType,
    href: "/dashboard/my-agents/agent-1",
    createdAt: "2026-01-20T09:00:00",
    favoritedAt: "2026-02-02T10:15:00",
    author: "AI 团队",
    usageCount: 89,
  },
  {
    id: "fav-3",
    name: "营销文案生成模板",
    description: "一键生成产品营销文案，支持多种风格",
    type: "template" as FavoriteType,
    href: "/dashboard/template-gallery/tpl-1",
    createdAt: "2026-01-10T14:00:00",
    favoritedAt: "2026-01-28T16:45:00",
    author: "内容团队",
    usageCount: 234,
  },
  {
    id: "fav-4",
    name: "API 开发文档",
    description: "完整的 REST API 接口文档和使用指南",
    type: "document" as FavoriteType,
    href: "/docs/api",
    createdAt: "2026-01-05T08:00:00",
    favoritedAt: "2026-01-25T11:20:00",
    author: "开发团队",
    usageCount: 567,
  },
  {
    id: "fav-5",
    name: "用户注册通知流程",
    description: "新用户注册后自动发送欢迎邮件和短信",
    type: "workflow" as FavoriteType,
    href: "/dashboard/workflows/wf-2",
    createdAt: "2026-01-18T13:00:00",
    favoritedAt: "2026-02-03T09:00:00",
    author: "运营团队",
    usageCount: 78,
  },
  {
    id: "fav-6",
    name: "数据分析 Agent",
    description: "智能数据分析助手，支持自然语言查询",
    type: "agent" as FavoriteType,
    href: "/dashboard/my-agents/agent-2",
    createdAt: "2026-01-22T11:00:00",
    favoritedAt: "2026-01-30T15:30:00",
    author: "数据团队",
    usageCount: 45,
  },
  {
    id: "fav-7",
    name: "项目资源文件夹",
    description: "存放项目相关的图片、文档和配置文件",
    type: "folder" as FavoriteType,
    href: "/dashboard/files/folder-1",
    createdAt: "2026-01-08T10:00:00",
    favoritedAt: "2026-01-20T14:00:00",
    author: "我",
    usageCount: 23,
  },
  {
    id: "fav-8",
    name: "电商订单处理模板",
    description: "自动处理订单状态更新和库存同步",
    type: "template" as FavoriteType,
    href: "/dashboard/template-gallery/tpl-2",
    createdAt: "2026-01-12T16:00:00",
    favoritedAt: "2026-02-01T08:45:00",
    author: "电商团队",
    usageCount: 112,
  },
];

type SortKey = "favoritedAt" | "name" | "usageCount" | "createdAt";
type ViewMode = "grid" | "list";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "favoritedAt", label: "收藏时间" },
  { value: "name", label: "名称" },
  { value: "usageCount", label: "使用次数" },
  { value: "createdAt", label: "创建时间" },
];

// 格式化时间
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export default function FavoritesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("favoritedAt");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState(mockFavorites);

  // 筛选并排序
  const visibleFavorites = useMemo(() => {
    const filtered = favorites.filter((fav) => {
      const matchesSearch =
        fav.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fav.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || fav.type === selectedType;
      return matchesSearch && matchesType;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "zh-CN");
        case "usageCount":
          return b.usageCount - a.usageCount;
        case "createdAt":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "favoritedAt":
        default:
          return new Date(b.favoritedAt).getTime() - new Date(a.favoritedAt).getTime();
      }
    });
  }, [favorites, searchQuery, selectedType, sortBy]);

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

  // 全选
  const toggleSelectAll = () => {
    if (selectedItems.size === visibleFavorites.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(visibleFavorites.map((f) => f.id)));
    }
  };

  // 取消收藏
  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== id));
    selectedItems.delete(id);
    setSelectedItems(new Set(selectedItems));
  };

  // 批量取消收藏
  const bulkRemove = () => {
    setFavorites((prev) => prev.filter((fav) => !selectedItems.has(fav.id)));
    setSelectedItems(new Set());
  };

  // 统计数据
  const stats = {
    total: favorites.length,
    workflows: favorites.filter((f) => f.type === "workflow").length,
    agents: favorites.filter((f) => f.type === "agent").length,
    templates: favorites.filter((f) => f.type === "template").length,
    documents: favorites.filter((f) => f.type === "document").length,
    folders: favorites.filter((f) => f.type === "folder").length,
  };

  const hasSelection = selectedItems.size > 0;

  const statCards = [
    {
      label: "全部收藏",
      value: stats.total,
      helper: "收藏项目",
      icon: Star,
      iconClassName: "bg-warning-200/60 border-warning/30 text-warning",
    },
    {
      label: "工作流",
      value: stats.workflows,
      helper: "自动化流程",
      icon: Zap,
      iconClassName: "bg-brand-200/60 border-brand-400/40 text-brand-500",
    },
    {
      label: "Agent",
      value: stats.agents,
      helper: "智能助手",
      icon: Bot,
      iconClassName: "bg-surface-200 border-border text-foreground-light",
    },
    {
      label: "模板",
      value: stats.templates,
      helper: "预设模板",
      icon: BookOpen,
      iconClassName: "bg-warning-200/60 border-warning/30 text-warning",
    },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 页面头部 */}
        <div className="space-y-3">
          <p className="page-caption">Favorites</p>
          <PageHeader
            title="收藏夹"
            description="管理您收藏的工作流、Agent、模板和文档"
            actions={
              <div className="flex items-center gap-2">
                <ButtonGroup attached>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </ButtonGroup>
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
              <span className="inline-flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                {stats.total} 个收藏
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                {stats.workflows} 工作流
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                {stats.agents} Agent
              </span>
            </div>
          </PageHeader>
        </div>

        {/* 统计卡片 */}
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

        {/* 筛选栏 */}
        <section className="page-panel p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <Input
                variant="dark"
                placeholder="搜索收藏..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-surface-200 border border-border text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[130px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="workflow">工作流</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="template">模板</SelectItem>
                <SelectItem value="document">文档</SelectItem>
                <SelectItem value="folder">文件夹</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortKey)}>
              <SelectTrigger className="w-[140px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-foreground-muted" />
                  <SelectValue placeholder="排序" />
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
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <span>显示 {visibleFavorites.length} / {favorites.length}</span>
            {selectedType !== "all" && (
              <Badge variant="outline" size="xs">
                类型：{typeConfig[selectedType as FavoriteType]?.label}
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
                已选择 {selectedItems.size} 个收藏
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="destructive" size="sm" onClick={bulkRemove} leftIcon={<StarOff className="w-4 h-4" />}>
                  取消收藏
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
                  取消选择
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* 收藏列表 */}
        <section className="page-panel overflow-hidden">
          <div className="page-panel-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="page-panel-title">收藏列表</p>
              <p className="page-panel-description">共 {visibleFavorites.length} 个收藏</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
                刷新
              </Button>
            </div>
          </div>

          {viewMode === "list" ? (
            <div className="border-t border-border">
              <div className="grid items-center gap-4 px-4 py-2.5 border-b border-border bg-surface-75/80 text-table-header grid-cols-[24px_minmax(0,1fr)_80px] md:grid-cols-[24px_minmax(0,1fr)_100px_100px_80px]">
                <Checkbox
                  checked={selectedItems.size === visibleFavorites.length && visibleFavorites.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-left">名称</span>
                <span className="hidden md:block text-center">类型</span>
                <span className="hidden md:block text-center">收藏时间</span>
                <span className="text-right">操作</span>
              </div>

              {visibleFavorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-md bg-surface-200 border border-border flex items-center justify-center mb-4">
                    <Star className="w-6 h-6 text-foreground-muted" />
                  </div>
                  <h3 className="text-base font-medium text-foreground mb-2">没有收藏</h3>
                  <p className="text-[13px] text-foreground-light mb-4 max-w-sm">
                    {searchQuery ? "尝试其他搜索条件" : "收藏工作流、Agent 或模板后会显示在这里"}
                  </p>
                  <Link href="/dashboard/workflows">
                    <Button size="sm" leftIcon={<Zap className="w-4 h-4" />}>
                      浏览工作流
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {visibleFavorites.map((fav) => {
                    const config = typeConfig[fav.type];
                    const TypeIcon = config.icon;
                    const isSelected = selectedItems.has(fav.id);

                    return (
                      <div
                        key={fav.id}
                        className={cn(
                          "grid items-center gap-4 px-4 py-4 transition-supabase grid-cols-[24px_minmax(0,1fr)_80px] md:grid-cols-[24px_minmax(0,1fr)_100px_100px_80px]",
                          isSelected ? "bg-brand-200/20" : "hover:bg-surface-75/60"
                        )}
                      >
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(fav.id)} />

                        <div className="min-w-0 flex items-start gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-md border flex items-center justify-center shrink-0",
                              config.bgColor,
                              config.borderColor
                            )}
                          >
                            <TypeIcon className={cn("w-4 h-4", config.color)} />
                          </div>
                          <div className="min-w-0">
                            <Link href={fav.href} className="group">
                              <h3 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors truncate">
                                {fav.name}
                              </h3>
                            </Link>
                            <p className="text-[12px] text-foreground-light truncate">{fav.description}</p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted mt-1">
                              <span>作者: {fav.author}</span>
                              <span>·</span>
                              <span>{fav.usageCount} 次使用</span>
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:flex justify-center">
                          <Badge variant={config.variant} size="sm" icon={<TypeIcon className="w-3 h-3" />}>
                            {config.label}
                          </Badge>
                        </div>

                        <div className="hidden md:flex justify-center">
                          <span className="text-[13px] text-foreground-light">{formatDate(fav.favoritedAt)}</span>
                        </div>

                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => removeFavorite(fav.id)}
                            className="text-warning"
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-xs" className="text-foreground-muted">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 rounded-lg bg-surface-100 border-border shadow-2xl"
                            >
                              <DropdownMenuItem
                                asChild
                                className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200"
                              >
                                <Link href={fav.href}>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  打开
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200">
                                <Copy className="w-4 h-4 mr-2" />
                                复制链接
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border" />
                              <DropdownMenuItem
                                className="text-[13px] text-destructive-400 focus:text-destructive focus:bg-destructive-200"
                                onClick={() => removeFavorite(fav.id)}
                              >
                                <StarOff className="w-4 h-4 mr-2" />
                                取消收藏
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
          ) : (
            <div className="p-4 border-t border-border">
              {visibleFavorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-md bg-surface-200 border border-border flex items-center justify-center mb-4">
                    <Star className="w-6 h-6 text-foreground-muted" />
                  </div>
                  <h3 className="text-base font-medium text-foreground mb-2">没有收藏</h3>
                  <p className="text-[13px] text-foreground-light mb-4 max-w-sm">
                    {searchQuery ? "尝试其他搜索条件" : "收藏工作流、Agent 或模板后会显示在这里"}
                  </p>
                  <Link href="/dashboard/workflows">
                    <Button size="sm" leftIcon={<Zap className="w-4 h-4" />}>
                      浏览工作流
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {visibleFavorites.map((fav) => {
                    const config = typeConfig[fav.type];
                    const TypeIcon = config.icon;

                    return (
                      <Card
                        key={fav.id}
                        variant="default"
                        hover="border"
                        padding="sm"
                        className="group relative"
                      >
                        <div className="absolute top-3 right-3 flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => removeFavorite(fav.id)}
                            className="text-warning opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </Button>
                        </div>

                        <Link href={fav.href} className="block">
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-md border flex items-center justify-center shrink-0",
                                config.bgColor,
                                config.borderColor
                              )}
                            >
                              <TypeIcon className={cn("w-5 h-5", config.color)} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors truncate">
                                {fav.name}
                              </h3>
                              <Badge variant={config.variant} size="xs" className="mt-1">
                                {config.label}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-[12px] text-foreground-light line-clamp-2 mb-3">{fav.description}</p>

                          <div className="flex items-center justify-between text-[11px] text-foreground-muted">
                            <span>{fav.author}</span>
                            <span>{fav.usageCount} 次使用</span>
                          </div>
                        </Link>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
