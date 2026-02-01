"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Heart,
  Share2,
  Reply,
  User,
  Clock,
  TrendingUp,
  Award,
  Star,
  Flame,
  Crown,
  Medal,
  Trophy,
  ArrowUp,
  ArrowDown,
  Zap,
  Code2,
  GitBranch,
  Rocket,
} from "lucide-react";

// 模拟讨论数据
const mockDiscussions = [
  {
    id: 1,
    author: "张伟",
    avatar: "Z",
    title: "如何优化大规模数据处理工作流？",
    preview: "我有一个需要处理 100 万条数据的工作流，目前运行时间太长，有什么优化建议吗？",
    tags: ["性能优化", "数据处理"],
    likes: 42,
    replies: 18,
    time: "10 分钟前",
    isHot: true,
  },
  {
    id: 2,
    author: "Emily Chen",
    avatar: "E",
    title: "分享：我的 AI 客服工作流模板",
    preview: "花了一周时间打磨的客服工作流，支持多轮对话、情感分析和自动分类，分享给大家...",
    tags: ["模板分享", "AI 应用"],
    likes: 89,
    replies: 34,
    time: "25 分钟前",
    isHot: true,
  },
  {
    id: 3,
    author: "王磊",
    avatar: "W",
    title: "新手提问：Webhook 触发器怎么配置？",
    preview: "想用 Webhook 触发工作流，但是一直收不到请求，有人能帮忙看看配置哪里有问题吗？",
    tags: ["新手求助", "Webhook"],
    likes: 12,
    replies: 8,
    time: "1 小时前",
    isHot: false,
  },
  {
    id: 4,
    author: "李娜",
    avatar: "L",
    title: "企业级部署最佳实践分享",
    preview: "我们公司使用 AgentFlow 已经半年了，分享一些在生产环境中总结的经验...",
    tags: ["最佳实践", "企业"],
    likes: 156,
    replies: 67,
    time: "2 小时前",
    isHot: true,
  },
  {
    id: 5,
    author: "Alex Liu",
    avatar: "A",
    title: "Feature Request: 支持 GraphQL 触发器",
    preview: "希望能增加 GraphQL Subscription 作为触发器类型，这样可以更好地与现有系统集成...",
    tags: ["功能建议"],
    likes: 28,
    replies: 12,
    time: "3 小时前",
    isHot: false,
  },
];

export interface LiveDiscussionFeedProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 显示数量 */
  limit?: number;
  /** 是否自动刷新 */
  autoRefresh?: boolean;
  /** 刷新间隔(ms) */
  refreshInterval?: number;
}

export function LiveDiscussionFeed({
  limit = 5,
  autoRefresh = true,
  refreshInterval = 30000,
  className,
  ...props
}: LiveDiscussionFeedProps) {
  const [discussions, setDiscussions] = useState(mockDiscussions.slice(0, limit));
  const [newCount, setNewCount] = useState(0);

  // 模拟实时更新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setNewCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const handleRefresh = () => {
    // 模拟加载新内容
    setDiscussions([...mockDiscussions].sort(() => Math.random() - 0.5).slice(0, limit));
    setNewCount(0);
  };

  return (
    <div className={cn("", className)} {...props}>
      {/* 新消息提示 */}
      {newCount > 0 && (
        <button
          onClick={handleRefresh}
          className="w-full mb-4 py-2 px-4 rounded-xl bg-primary/10 border border-primary/20 text-sm text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {newCount} 条新讨论，点击刷新
        </button>
      )}

      {/* 讨论列表 */}
      <div className="space-y-4">
        {discussions.map((discussion, index) => (
          <div
            key={discussion.id}
            className={cn(
              "p-4 rounded-xl border transition-all cursor-pointer group",
              "bg-card hover:bg-card/80 border-border hover:border-primary/30",
              "hover:shadow-lg hover:shadow-primary/5"
            )}
            style={{
              animation: `slideInUp 0.4s ease-out ${index * 0.1}s both`,
            }}
          >
            <div className="flex items-start gap-3">
              {/* 头像 */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center text-white font-semibold shrink-0">
                {discussion.avatar}
              </div>

              <div className="flex-1 min-w-0">
                {/* 标题和标签 */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {discussion.isHot && (
                      <Flame className="w-4 h-4 inline mr-1 text-orange-500" />
                    )}
                    {discussion.title}
                  </h4>
                </div>

                {/* 预览 */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {discussion.preview}
                </p>

                {/* 底部信息 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {discussion.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {discussion.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors">
                      <Heart className="w-3 h-3" />
                      {discussion.likes}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                      <MessageSquare className="w-3 h-3" />
                      {discussion.replies}
                    </span>
                  </div>
                </div>

                {/* 标签 */}
                <div className="flex items-center gap-2 mt-2">
                  {discussion.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// 排行榜数据
const mockLeaderboard = [
  { rank: 1, name: "李明", avatar: "L", score: 12580, change: 2, badge: "crown", workflows: 156, contributions: 89 },
  { rank: 2, name: "Sarah Wang", avatar: "S", score: 11240, change: -1, badge: "medal", workflows: 134, contributions: 76 },
  { rank: 3, name: "张强", avatar: "Z", score: 10890, change: 1, badge: "trophy", workflows: 128, contributions: 71 },
  { rank: 4, name: "Mike Chen", avatar: "M", score: 9650, change: 0, badge: "star", workflows: 112, contributions: 64 },
  { rank: 5, name: "王芳", avatar: "W", score: 8920, change: 3, badge: "star", workflows: 98, contributions: 58 },
  { rank: 6, name: "David Liu", avatar: "D", score: 8450, change: -2, badge: "star", workflows: 89, contributions: 52 },
  { rank: 7, name: "陈静", avatar: "C", score: 7890, change: 1, badge: "star", workflows: 82, contributions: 47 },
  { rank: 8, name: "Emma Zhang", avatar: "E", score: 7320, change: 0, badge: "star", workflows: 75, contributions: 42 },
];

export interface AnimatedLeaderboardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 显示数量 */
  limit?: number;
  /** 是否显示动画 */
  animated?: boolean;
  /** 排行榜类型 */
  type?: "contributors" | "workflows" | "overall";
}

export function AnimatedLeaderboard({
  limit = 8,
  animated = true,
  type = "overall",
  className,
  ...props
}: AnimatedLeaderboardProps) {
  const [isVisible, setIsVisible] = useState(!animated);
  const [hoveredRank, setHoveredRank] = useState<number | null>(null);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case "crown":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "medal":
        return <Medal className="w-4 h-4 text-muted-foreground" />;
      case "trophy":
        return <Trophy className="w-4 h-4 text-amber-600" />;
      default:
        return <Star className="w-4 h-4 text-primary" />;
    }
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/30";
    if (rank === 2) return "bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30";
    if (rank === 3) return "bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30";
    return "bg-card border-border";
  };

  return (
    <div className={cn("", className)} {...props}>
      <div className="space-y-2">
        {mockLeaderboard.slice(0, limit).map((user, index) => (
          <div
            key={user.rank}
            className={cn(
              "flex items-center gap-4 p-3 rounded-xl border transition-all",
              getRankStyle(user.rank),
              hoveredRank === user.rank && "scale-[1.02] shadow-lg"
            )}
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateX(0)" : "translateX(-20px)",
              transition: `all 0.4s ease-out ${index * 0.08}s`,
            }}
            onMouseEnter={() => setHoveredRank(user.rank)}
            onMouseLeave={() => setHoveredRank(null)}
          >
            {/* 排名 */}
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
              user.rank === 1 && "bg-yellow-500 text-black",
              user.rank === 2 && "bg-gray-400 text-black",
              user.rank === 3 && "bg-amber-600 text-white",
              user.rank > 3 && "bg-muted text-muted-foreground"
            )}>
              {user.rank}
            </div>

            {/* 头像 */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center text-white font-semibold">
              {user.avatar}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{user.name}</span>
                {getBadgeIcon(user.badge)}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {user.workflows} 工作流
                </span>
                <span className="flex items-center gap-1">
                  <Code2 className="w-3 h-3" />
                  {user.contributions} 贡献
                </span>
              </div>
            </div>

            {/* 分数和变化 */}
            <div className="text-right">
              <div className="font-bold text-foreground">{user.score.toLocaleString()}</div>
              <div className={cn(
                "flex items-center justify-end gap-0.5 text-xs",
                user.change > 0 && "text-emerald-500",
                user.change < 0 && "text-red-500",
                user.change === 0 && "text-muted-foreground"
              )}>
                {user.change > 0 && <ArrowUp className="w-3 h-3" />}
                {user.change < 0 && <ArrowDown className="w-3 h-3" />}
                {user.change !== 0 && Math.abs(user.change)}
                {user.change === 0 && "—"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
