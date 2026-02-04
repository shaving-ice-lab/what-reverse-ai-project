"use client";

/**
 * 通知中心页面
 * 查看和管理所有通知消息
 */

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonGroup } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { EmptyState, PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  MoreHorizontal,
  Filter,
  Settings,
  Zap,
  Bot,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Users,
  CreditCard,
  Shield,
  Star,
  Gift,
  Search,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

// 通知类型配置 - Supabase 风格
const notificationTypes = {
  workflow: {
    icon: Zap,
    color: "text-warning",
    bg: "bg-warning-200",
    label: "工作流",
    badge: "warning",
  },
  agent: {
    icon: Bot,
    color: "text-foreground-light",
    bg: "bg-surface-200",
    label: "Agent",
    badge: "secondary",
  },
  message: {
    icon: MessageSquare,
    color: "text-foreground-light",
    bg: "bg-surface-200",
    label: "消息",
    badge: "secondary",
  },
  alert: {
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive-200",
    label: "警告",
    badge: "destructive",
  },
  info: {
    icon: Info,
    color: "text-foreground-light",
    bg: "bg-surface-200",
    label: "信息",
    badge: "outline",
  },
  success: {
    icon: CheckCircle2,
    color: "text-brand-500",
    bg: "bg-brand-200",
    label: "成功",
    badge: "success",
  },
  team: {
    icon: Users,
    color: "text-foreground-light",
    bg: "bg-surface-200",
    label: "团队",
    badge: "secondary",
  },
  billing: {
    icon: CreditCard,
    color: "text-warning",
    bg: "bg-warning-200",
    label: "账单",
    badge: "warning",
  },
  security: {
    icon: Shield,
    color: "text-destructive",
    bg: "bg-destructive-200",
    label: "安全",
    badge: "error",
  },
  promotion: {
    icon: Gift,
    color: "text-brand-500",
    bg: "bg-brand-200",
    label: "推广",
    badge: "primary",
  },
} as const;

type NotificationType = keyof typeof notificationTypes;
type SelectedType = NotificationType | "all";

const notificationTypeEntries = Object.entries(notificationTypes) as [
  NotificationType,
  (typeof notificationTypes)[NotificationType],
][];

// 模拟通知数据
const mockNotifications = [
  {
    id: "n1",
    type: "workflow" as const,
    title: "工作流执行完成",
    message: "「每日数据同步」工作流已成功执行，处理了 1,256 条数据",
    read: false,
    starred: false,
    createdAt: "2026-01-31T14:30:00",
    link: "/workflows/wf-123",
  },
  {
    id: "n2",
    type: "alert" as const,
    title: "工作流执行失败",
    message: "「用户通知」工作流执行失败：API 请求超时，请检查网络连接",
    read: false,
    starred: true,
    createdAt: "2026-01-31T13:15:00",
    link: "/workflows/wf-456/logs",
  },
  {
    id: "n3",
    type: "team" as const,
    title: "新成员加入团队",
    message: "李华 已接受邀请并加入您的团队",
    read: false,
    starred: false,
    createdAt: "2026-01-31T10:00:00",
    link: "/team",
  },
  {
    id: "n4",
    type: "agent" as const,
    title: "Agent 对话量突破",
    message: "您的「客服助手」Agent 本周对话量超过 500 次",
    read: true,
    starred: false,
    createdAt: "2026-01-30T18:45:00",
    link: "/my-agents/agent-789",
  },
  {
    id: "n5",
    type: "billing" as const,
    title: "账单提醒",
    message: "您的专业版订阅将于 7 天后到期，请及时续费",
    read: true,
    starred: false,
    createdAt: "2026-01-30T09:00:00",
    link: "/billing",
  },
  {
    id: "n6",
    type: "security" as const,
    title: "新设备登录",
    message: "检测到新设备登录您的账户：Windows 11 / Chrome 120",
    read: true,
    starred: true,
    createdAt: "2026-01-29T22:30:00",
    link: "/settings/security",
  },
  {
    id: "n7",
    type: "success" as const,
    title: "数据导出完成",
    message: "您请求的工作流执行日志已导出完成，可以下载了",
    read: true,
    starred: false,
    createdAt: "2026-01-29T16:00:00",
    link: "/files",
  },
  {
    id: "n8",
    type: "promotion" as const,
    title: "春节特惠活动",
    message: "限时优惠：企业版年付享 7 折，活动截止至 2 月 15 日",
    read: true,
    starred: false,
    createdAt: "2026-01-28T10:00:00",
    link: "/billing",
  },
  {
    id: "n9",
    type: "info" as const,
    title: "系统维护通知",
    message: "计划于 2026-02-05 02:00-04:00 进行系统维护，届时服务可能短暂中断",
    read: true,
    starred: false,
    createdAt: "2026-01-27T14:00:00",
    link: "/whats-new",
  },
  {
    id: "n10",
    type: "workflow" as const,
    title: "工作流执行完成",
    message: "「周报生成」工作流已成功执行",
    read: true,
    starred: false,
    createdAt: "2026-01-26T17:30:00",
    link: "/workflows/wf-321",
  },
];

// 格式化时间
function formatTime(dateString: string) {
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
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [selectedType, setSelectedType] = useState<SelectedType>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // 筛选通知
  const filteredNotifications = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return notifications.filter((n) => {
      const matchesType = selectedType === "all" || n.type === selectedType;
      const matchesUnread = !showUnreadOnly || !n.read;
      const matchesQuery = normalizedQuery.length === 0
        || n.title.toLowerCase().includes(normalizedQuery)
        || n.message.toLowerCase().includes(normalizedQuery);
      return matchesType && matchesUnread && matchesQuery;
    });
  }, [notifications, selectedType, showUnreadOnly, searchQuery]);

  const sortedNotifications = useMemo(() => {
    const data = [...filteredNotifications];
    data.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });
    return data;
  }, [filteredNotifications, sortOrder]);

  // 统计数据
  const stats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    starred: notifications.filter((n) => n.starred).length,
  };

  const typeCounts = useMemo<Record<SelectedType, number>>(() => {
    const counts = { all: 0 } as Record<SelectedType, number>;
    notifications.forEach((notification) => {
      counts.all += 1;
      counts[notification.type] = (counts[notification.type] ?? 0) + 1;
    });
    return counts;
  }, [notifications]);

  // 标记已读
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // 标记全部已读
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // 切换收藏
  const toggleStar = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, starred: !n.starred } : n))
    );
  };

  // 删除通知
  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

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

  // 批量删除
  const bulkDelete = () => {
    setNotifications((prev) => prev.filter((n) => !selectedItems.has(n.id)));
    setSelectedItems(new Set());
  };

  // 批量标记已读
  const bulkMarkAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (selectedItems.has(n.id) ? { ...n, read: true } : n))
    );
    setSelectedItems(new Set());
  };

  const resetFilters = () => {
    setSelectedType("all");
    setShowUnreadOnly(false);
    setSearchQuery("");
  };

  const allFilteredSelected = filteredNotifications.length > 0
    && filteredNotifications.every((notification) => selectedItems.has(notification.id));
  const someFilteredSelected = filteredNotifications.some((notification) => selectedItems.has(notification.id));

  const toggleSelectAll = () => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredNotifications.forEach((notification) => next.delete(notification.id));
      } else {
        filteredNotifications.forEach((notification) => next.add(notification.id));
      }
      return next;
    });
  };

  const typeOptions: Array<{
    value: SelectedType;
    label: string;
    icon: typeof Bell;
    color: string;
    bg: string;
  }> = [
    {
      value: "all",
      label: "全部通知",
      icon: Bell,
      color: "text-foreground-light",
      bg: "bg-surface-200",
    },
    ...notificationTypeEntries.map(([value, config]) => ({
      value,
      label: config.label,
      icon: config.icon,
      color: config.color,
      bg: config.bg,
    })),
  ];
  const trimmedQuery = searchQuery.trim();
  const displayQuery = trimmedQuery.length > 12 ? `${trimmedQuery.slice(0, 12)}...` : trimmedQuery;
  const hasActiveFilters = selectedType !== "all" || showUnreadOnly || trimmedQuery.length > 0;
  let emptyTitle = "暂无通知";
  let emptyDescription = "新的通知会显示在这里";

  if (trimmedQuery) {
    emptyTitle = "没有匹配结果";
    emptyDescription = "请尝试更换关键词或清除筛选";
  } else if (showUnreadOnly) {
    emptyTitle = "没有未读通知";
    emptyDescription = "所有通知都已阅读";
  } else if (selectedType !== "all") {
    emptyTitle = "该类型暂无通知";
    emptyDescription = "尝试切换类型或重置筛选";
  }
  const emptyAction = hasActiveFilters ? { label: "重置筛选", onClick: resetFilters } : undefined;

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="通知中心"
          description={stats.unread > 0 ? `您有 ${stats.unread} 条未读通知` : "所有通知已读"}
          actions={(
            <div className="flex items-center gap-2">
              {stats.unread > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  leftIcon={<CheckCheck className="w-4 h-4" />}
                >
                  全部标记已读
                </Button>
              )}
              <Link href="/settings">
                <Button variant="outline" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
                  通知设置
                </Button>
              </Link>
            </div>
          )}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <Badge variant="secondary" size="sm" icon={<Bell className="w-3.5 h-3.5" />}>
              未读 {stats.unread}
            </Badge>
            <Badge variant="warning" size="sm" icon={<Star className="w-3.5 h-3.5" />}>
              收藏 {stats.starred}
            </Badge>
            <Badge variant="outline" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
              总计 {stats.total}
            </Badge>
          </div>
        </PageHeader>

        <div className="page-grid grid-cols-1 md:grid-cols-3">
          <div className="page-panel p-4 md:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="page-caption">全部通知</span>
              <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                <Bell className="w-4 h-4 text-foreground-light" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-stat-large text-foreground tabular-nums">{stats.total}</span>
              <span className="text-xs text-foreground-muted pb-1">条</span>
            </div>
            <p className="text-xs text-foreground-light">系统累计的通知总量</p>
          </div>
          <div className="page-panel p-4 md:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="page-caption">未读待办</span>
              <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
                <CheckCheck className="w-4 h-4 text-brand-500" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-stat-large text-foreground tabular-nums">{stats.unread}</span>
              <span className="text-xs text-foreground-muted pb-1">条</span>
            </div>
            <p className="text-xs text-foreground-light">需要处理的提醒与告警</p>
          </div>
          <div className="page-panel p-4 md:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="page-caption">收藏关注</span>
              <div className="w-8 h-8 rounded-md bg-warning-200 flex items-center justify-center">
                <Star className="w-4 h-4 text-warning" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-stat-large text-foreground tabular-nums">{stats.starred}</span>
              <span className="text-xs text-foreground-muted pb-1">条</span>
            </div>
            <p className="text-xs text-foreground-light">标记为重点的通知</p>
          </div>
        </div>

        <div className="page-grid lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-6 lg:sticky lg:top-6 self-start">
            <div className="page-panel overflow-hidden">
              <div className="page-panel-header flex items-center justify-between">
                <div>
                  <p className="page-panel-title flex items-center gap-2">
                    <Filter className="w-4 h-4 text-foreground-light" />
                    过滤器
                  </p>
                  <p className="page-panel-description">按类型与已读状态过滤通知</p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  重置
                </Button>
              </div>
              <div className="divide-y divide-border px-4">
                <div className="py-4">
                  <p className="page-caption">类型</p>
                  <div className="mt-2 space-y-1">
                    {typeOptions.map((option) => {
                      const isActive = selectedType === option.value;
                      const Icon = option.icon;
                      const badgeVariant = option.value === "all"
                        ? "secondary"
                        : notificationTypes[option.value].badge;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedType(option.value)}
                          aria-pressed={isActive}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-md border px-2.5 py-2 text-left transition-colors",
                            isActive
                              ? "border-border-strong bg-surface-200 text-foreground"
                              : "border-transparent text-foreground-light hover:bg-surface-200/70"
                          )}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", option.bg)}>
                              <Icon className={cn("h-4 w-4", option.color)} />
                            </span>
                            <span className="text-[13px]">{option.label}</span>
                          </span>
                          <Badge variant={badgeVariant} size="xs" className="tabular-nums">
                            {typeCounts[option.value] ?? 0}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="py-4">
                  <p className="page-caption">状态</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant={!showUnreadOnly ? "secondary" : "outline"}
                      size="sm"
                      leftIcon={<Bell className="w-4 h-4" />}
                      onClick={() => setShowUnreadOnly(false)}
                    >
                      全部
                    </Button>
                    <Button
                      variant={showUnreadOnly ? "secondary" : "outline"}
                      size="sm"
                      leftIcon={<BellOff className="w-4 h-4" />}
                      onClick={() => setShowUnreadOnly(true)}
                    >
                      仅未读
                    </Button>
                  </div>
                </div>
                <div className="py-4">
                  <div className="rounded-md border border-border bg-surface-200/50 px-3 py-2">
                    <div className="flex items-center justify-between text-xs text-foreground-muted">
                      <span>当前筛选</span>
                      <span className="tabular-nums">
                        {filteredNotifications.length}/{stats.total}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedType !== "all" && (
                        <Badge variant="outline" size="xs">
                          类型：{notificationTypes[selectedType as NotificationType]?.label}
                        </Badge>
                      )}
                      {showUnreadOnly && (
                        <Badge variant="warning" size="xs">
                          仅未读
                        </Badge>
                      )}
                      {trimmedQuery && (
                        <Badge variant="outline" size="xs">
                          关键词：{displayQuery}
                        </Badge>
                      )}
                      {!showUnreadOnly && selectedType === "all" && !trimmedQuery && (
                        <span className="text-xs text-foreground-light">全部通知</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {selectedItems.size > 0 && (
              <div className="page-panel border-brand-400/40 bg-brand-200/20">
                <div className="px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2 text-[13px] text-foreground">
                    <Badge variant="primary" size="sm" className="tabular-nums">
                      {selectedItems.size}
                    </Badge>
                    已选择 {selectedItems.size} 项
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={bulkMarkAsRead}
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      标记已读
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={bulkDelete}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      删除
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
                      取消选择
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="page-panel overflow-hidden">
              <div className="page-panel-header space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="page-panel-title">通知列表</p>
                    <p className="page-panel-description">共 {filteredNotifications.length} 条通知</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" size="sm">
                      未读 {stats.unread}
                    </Badge>
                    <Badge variant="warning" size="sm">
                      收藏 {stats.starred}
                    </Badge>
                    <ButtonGroup attached>
                      <Button
                        variant={sortOrder === "newest" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setSortOrder("newest")}
                      >
                        最新
                      </Button>
                      <Button
                        variant={sortOrder === "oldest" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setSortOrder("oldest")}
                      >
                        最早
                      </Button>
                    </ButtonGroup>
                    <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
                      刷新
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    variant="search"
                    inputSize="sm"
                    placeholder="搜索通知标题或内容"
                    leftIcon={<Search className="h-4 w-4" />}
                    className="w-full md:max-w-sm"
                  />
                  <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                    <label className="inline-flex items-center gap-2 text-xs text-foreground-light">
                      <Checkbox
                        checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                        onCheckedChange={toggleSelectAll}
                        disabled={filteredNotifications.length === 0}
                        aria-label="全选当前筛选结果"
                      />
                      全选当前
                    </label>
                    <Badge variant="outline" size="sm" className="tabular-nums">
                      显示 {filteredNotifications.length}
                    </Badge>
                    {trimmedQuery && (
                      <Badge variant="secondary" size="sm">
                        关键词：{displayQuery}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t border-border">
                {filteredNotifications.length === 0 ? (
                  <EmptyState
                    icon={<Bell className="w-5 h-5" />}
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                ) : (
                  <div className="divide-y divide-border">
                    {sortedNotifications.map((notification) => {
                      const typeConfig = notificationTypes[notification.type];
                      const TypeIcon = typeConfig.icon;
                      const isSelected = selectedItems.has(notification.id);

                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "group relative flex items-start gap-4 px-5 py-4 transition-colors",
                            "hover:bg-surface-75/80",
                            !notification.read && "bg-surface-75/80",
                            isSelected && "bg-brand-200/30"
                          )}
                        >
                          {!notification.read && (
                            <span className="absolute left-0 top-6 h-6 w-[2px] rounded-full bg-brand-500/80" />
                          )}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(notification.id)}
                            className="mt-1"
                            aria-label={`选择通知：${notification.title}`}
                          />

                          <div
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-md shrink-0",
                              typeConfig.bg
                            )}
                          >
                            <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3
                                    className={cn(
                                      "text-[13px] font-medium truncate",
                                      !notification.read ? "text-foreground" : "text-foreground-light"
                                    )}
                                  >
                                    {notification.title}
                                  </h3>
                                  {!notification.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-foreground-muted line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(notification.createdAt)}
                                  </span>
                                  <Badge variant={typeConfig.badge} size="xs">
                                    {typeConfig.label}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => toggleStar(notification.id)}
                                  aria-label={notification.starred ? "取消收藏" : "收藏"}
                                  className={cn(
                                    "text-foreground-muted hover:text-warning",
                                    notification.starred && "text-warning"
                                  )}
                                >
                                  <Star className={cn("w-4 h-4", notification.starred && "fill-warning")} />
                                </Button>
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => markAsRead(notification.id)}
                                    aria-label="标记已读"
                                    className="text-foreground-muted hover:text-foreground"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                {notification.link && (
                                  <Link href={notification.link}>
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      aria-label="打开通知链接"
                                      className="text-foreground-muted hover:text-foreground"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      aria-label="更多操作"
                                      className="text-foreground-muted hover:text-foreground"
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40 bg-surface-100 border-border">
                                    {!notification.read && (
                                      <DropdownMenuItem
                                        onClick={() => markAsRead(notification.id)}
                                        className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                                      >
                                        <Check className="w-4 h-4 mr-2" />
                                        标记已读
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => toggleStar(notification.id)}
                                      className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                                    >
                                      <Star className="w-4 h-4 mr-2" />
                                      {notification.starred ? "取消收藏" : "收藏"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border-muted" />
                                    <DropdownMenuItem
                                      className="text-destructive hover:bg-destructive-200"
                                      onClick={() => deleteNotification(notification.id)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      删除
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {filteredNotifications.length > 0 && (
              <div className="flex justify-center">
                <Button variant="outline" size="sm">
                  加载更多
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
