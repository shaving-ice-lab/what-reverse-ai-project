"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Play,
  Zap,
  Bot,
  Database,
  Mail,
  FileText,
  Globe,
  Users,
  CheckCircle,
  Clock,
} from "lucide-react";

// 活动类型
const activityTypes = [
  { type: "workflow_run", icon: Play, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { type: "ai_request", icon: Bot, color: "text-violet-500", bg: "bg-violet-500/10" },
  { type: "data_process", icon: Database, color: "text-blue-500", bg: "bg-blue-500/10" },
  { type: "email_sent", icon: Mail, color: "text-pink-500", bg: "bg-pink-500/10" },
  { type: "document", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
  { type: "api_call", icon: Globe, color: "text-cyan-500", bg: "bg-cyan-500/10" },
];

// 模拟用户名
const mockUsers = [
  "张伟", "李娜", "王强", "刘芳", "陈明", "杨洋", "赵敏", "黄磊",
  "周杰", "吴亮", "郑爽", "孙涛", "User123", "DevTeam", "DataBot",
];

// 模拟地点
const mockLocations = [
  "北京", "上海", "深圳", "杭州", "广州", "成都", "武汉", "南京",
  "西安", "东京", "新加坡", "硅谷", "伦敦", "悉尼",
];

// 模拟活动描述
const mockActivities = [
  "运行了「智能客服」工作流",
  "处理了 1,234 条数据记录",
  "调用 GPT-4 生成内容",
  "发送了 56 封营销邮件",
  "创建了新的自动化流程",
  "同步了 Notion 数据库",
  "完成了数据清洗任务",
  "触发了 Webhook 事件",
  "执行了定时任务",
  "导出了分析报告",
];

export interface Activity {
  id: string;
  type: string;
  user: string;
  location: string;
  description: string;
  timestamp: Date;
}

function generateActivity(): Activity {
  const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
  return {
    id: Math.random().toString(36).substring(7),
    type: type.type,
    user: mockUsers[Math.floor(Math.random() * mockUsers.length)],
    location: mockLocations[Math.floor(Math.random() * mockLocations.length)],
    description: mockActivities[Math.floor(Math.random() * mockActivities.length)],
    timestamp: new Date(),
  };
}

export interface LiveActivityFeedProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 最大显示条数 */
  maxItems?: number;
  /** 新活动生成间隔（毫秒） */
  interval?: number;
  /** 是否显示位置 */
  showLocation?: boolean;
  /** 是否自动生成活动 */
  autoGenerate?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
}

export function LiveActivityFeed({
  maxItems = 5,
  interval = 3000,
  showLocation = true,
  autoGenerate = true,
  compact = false,
  className,
  ...props
}: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化活动
  useEffect(() => {
    const initial = Array.from({ length: maxItems }, () => generateActivity());
    setActivities(initial);
    
    // 延迟显示动画
    setTimeout(() => setIsVisible(true), 100);
  }, [maxItems]);

  // 自动生成新活动
  useEffect(() => {
    if (!autoGenerate) return;

    const timer = setInterval(() => {
      setActivities((prev) => {
        const newActivity = generateActivity();
        return [newActivity, ...prev.slice(0, maxItems - 1)];
      });
    }, interval);

    return () => clearInterval(timer);
  }, [autoGenerate, interval, maxItems]);

  const getActivityConfig = (type: string) => {
    return activityTypes.find((t) => t.type === type) || activityTypes[0];
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 5) return "刚刚";
    if (diff < 60) return `${diff} 秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    return `${Math.floor(diff / 3600)} 小时前`;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        className
      )}
      {...props}
    >
      {/* 标题栏 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </div>
        <span className="text-sm font-medium text-primary">实时活动</span>
      </div>

      {/* 活动列表 */}
      <div className="space-y-2">
        {activities.map((activity, index) => {
          const config = getActivityConfig(activity.type);
          const Icon = config.icon;

          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl",
                "bg-card/50 border border-border/50",
                "transition-all duration-500 ease-out",
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4",
                compact && "p-2"
              )}
              style={{
                transitionDelay: `${index * 50}ms`,
              }}
            >
              {/* 图标 */}
              <div className={cn(
                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                config.bg,
                compact && "w-6 h-6"
              )}>
                <Icon className={cn("w-4 h-4", config.color, compact && "w-3 h-3")} />
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm text-foreground truncate",
                  compact && "text-xs"
                )}>
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-muted-foreground"> {activity.description}</span>
                </p>
                {showLocation && !compact && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activity.location}  {formatTime(activity.timestamp)}
                  </p>
                )}
              </div>

              {/* 时间（紧凑模式） */}
              {compact && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatTime(activity.timestamp)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 淡出遮罩 */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}

// 实时运行统计徽章
export interface LiveStatsBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 初始值 */
  initialValue?: number;
  /** 标签 */
  label?: string;
  /** 每秒增量范围 */
  incrementRange?: [number, number];
  /** 是否显示脉冲动画 */
  showPulse?: boolean;
}

export function LiveStatsBadge({
  initialValue = 1234567,
  label = "工作流已运行",
  incrementRange = [1, 5],
  showPulse = true,
  className,
  ...props
}: LiveStatsBadgeProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const timer = setInterval(() => {
      const increment = Math.floor(
        Math.random() * (incrementRange[1] - incrementRange[0] + 1) + incrementRange[0]
      );
      setValue((prev) => prev + increment);
    }, 1000);

    return () => clearInterval(timer);
  }, [incrementRange]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
        "bg-card/80 backdrop-blur-sm border border-border/50",
        "text-sm",
        className
      )}
      {...props}
    >
      {showPulse && (
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </div>
      )}
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold text-foreground tabular-nums">
        {formatNumber(value)}
      </span>
    </div>
  );
}

// 全球用户分布指示器
export interface GlobalUsersIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  activeUsers?: number;
}

export function GlobalUsersIndicator({
  activeUsers = 2847,
  className,
  ...props
}: GlobalUsersIndicatorProps) {
  const [users, setUsers] = useState(activeUsers);

  useEffect(() => {
    const timer = setInterval(() => {
      setUsers((prev) => {
        const change = Math.floor(Math.random() * 20) - 10;
        return Math.max(0, prev + change);
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-card border border-border",
        className
      )}
      {...props}
    >
      <div className="relative">
        <Users className="w-5 h-5 text-primary" />
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {users.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">全球在线用户</p>
      </div>
    </div>
  );
}
