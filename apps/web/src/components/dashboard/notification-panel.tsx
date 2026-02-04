"use client";

/**
 * 通知面板组件 - Manus 风格
 * 显示系统通知、任务更新、消息提醒等
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Zap,
  MessageSquare,
  AlertTriangle,
  Info,
  Gift,
  Clock,
  User,
  Settings,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 通知类型
type NotificationType = "workflow" | "message" | "alert" | "info" | "reward" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// 模拟通知数据
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "workflow",
    title: "工作流执行完成",
    description: "「客户反馈自动处理」已成功执行，处理了 24 条反馈",
    time: "2 分钟前",
    read: false,
    actionUrl: "/dashboard/workflows/wf-1",
    actionLabel: "查看详情",
  },
  {
    id: "2",
    type: "alert",
    title: "API 调用限制警告",
    description: "您的 API 调用量已达到本月限额的 80%",
    time: "1 小时前",
    read: false,
    actionUrl: "/dashboard/settings/api-keys",
    actionLabel: "管理配额",
  },
  {
    id: "3",
    type: "reward",
    title: "获得成就徽章",
    description: "恭喜！您已创建第 10 个工作流，获得「自动化达人」徽章",
    time: "3 小时前",
    read: false,
  },
  {
    id: "4",
    type: "message",
    title: "新的团队消息",
    description: "张三在「项目协作」频道@了你",
    time: "昨天",
    read: true,
    actionUrl: "/messages",
    actionLabel: "查看消息",
  },
  {
    id: "5",
    type: "system",
    title: "系统更新通知",
    description: "AgentFlow 2.0 即将发布，新增 AI Agent 功能",
    time: "2 天前",
    read: true,
    actionUrl: "/whats-new",
    actionLabel: "了解更多",
  },
  {
    id: "6",
    type: "info",
    title: "使用技巧",
    description: "尝试使用「⌘K」快捷键快速搜索和执行命令",
    time: "3 天前",
    read: true,
  },
];

// 获取通知图标
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "workflow":
      return { icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" };
    case "message":
      return { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10" };
    case "alert":
      return { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" };
    case "info":
      return { icon: Info, color: "text-cyan-400", bg: "bg-cyan-500/10" };
    case "reward":
      return { icon: Gift, color: "text-purple-400", bg: "bg-purple-500/10" };
    case "system":
      return { icon: Settings, color: "text-muted-foreground", bg: "bg-muted/50" };
    default:
      return { icon: Bell, color: "text-muted-foreground", bg: "bg-muted/50" };
  }
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  // 标记为已读
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // 标记全部已读
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // 删除通知
  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // 清空所有通知
  const clearAll = () => {
    setNotifications([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* 通知面板 */}
      <div className="fixed right-4 top-16 w-[400px] max-h-[calc(100vh-100px)] bg-card border border-border rounded-2xl shadow-2xl shadow-black/50 z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-4 fade-in duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">通知</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
                {unreadCount} 未读
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                全部已读
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 筛选标签 */}
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
              filter === "all"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            全部
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
              filter === "unread"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            未读
          </button>
        </div>

        {/* 通知列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">暂无通知</p>
              <p className="text-xs text-muted-foreground/60 mt-1">新的通知将显示在这里</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => {
                const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-all group cursor-pointer",
                      !notification.read && "bg-primary/[0.02]"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      {/* 图标 */}
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                        <Icon className={cn("w-4 h-4", color)} />
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "text-sm font-medium truncate",
                                notification.read ? "text-muted-foreground" : "text-foreground"
                              )}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                              {notification.description}
                            </p>
                          </div>

                          {/* 操作菜单 */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground/60 opacity-0 group-hover:opacity-100 transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-36 bg-card border-border"
                            >
                              {!notification.read && (
                                <DropdownMenuItem
                                  className="text-foreground/80 focus:bg-muted focus:text-foreground gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  <Check className="w-4 h-4" />
                                  标记已读
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-red-400 focus:bg-red-500/10 focus:text-red-400 gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* 时间和操作 */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {notification.time}
                          </span>
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {notification.actionLabel}
                              <ChevronRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部 */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border flex items-center justify-between">
            <button
              onClick={clearAll}
              className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              清空全部
            </button>
            <a
              href="/dashboard/settings/notifications"
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              通知设置
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </>
  );
}

// 通知铃铛按钮组件
interface NotificationBellProps {
  onClick: () => void;
  unreadCount?: number;
}

export function NotificationBell({ onClick, unreadCount = 0 }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
