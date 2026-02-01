"use client";

/**
 * 对话统计面板组件 - 现代化设计
 * 显示对话相关的统计数据
 */

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Star,
  Archive,
  Sparkles,
  TrendingUp,
  BarChart3,
  Loader2,
  Zap,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { conversationApi, type ConversationStatistics } from "@/lib/api";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: number;
  color?: string;
  className?: string;
}

function StatCard({ title, value, icon, description, trend, color = "primary", className }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    primary: "from-primary/20 to-orange-500/20 text-primary",
    blue: "from-blue-500/20 to-cyan-500/20 text-blue-500",
    amber: "from-amber-500/20 to-yellow-500/20 text-amber-500",
    purple: "from-purple-500/20 to-pink-500/20 text-purple-500",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden p-3 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors group",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0",
          colorClasses[color]
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground-light truncate">{title}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium",
            trend >= 0 ? "text-emerald-500" : "text-red-500"
          )}>
            <TrendingUp className={cn("w-3 h-3", trend < 0 && "rotate-180")} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {description && (
        <p className="text-xs text-foreground-light mt-1.5 pl-12">{description}</p>
      )}
    </div>
  );
}

interface StatisticsPanelProps {
  className?: string;
}

export function StatisticsPanel({ className }: StatisticsPanelProps) {
  const [stats, setStats] = useState<ConversationStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await conversationApi.getStatistics();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch statistics:", err);
        setError("加载统计数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={cn("text-center py-8 text-foreground-light", className)}>
        {error || "暂无统计数据"}
      </div>
    );
  }

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // 获取最常用的模型
  const topModel = Object.entries(stats.modelUsage || {})
    .sort(([, a], [, b]) => b - a)[0];

  return (
    <div className={cn("space-y-3", className)}>
      {/* 标题 */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center">
          <Activity className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">统计概览</h3>
      </div>

      {/* 核心统计 */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          title="对话"
          value={formatNumber(stats.totalConversations)}
          icon={<MessageSquare className="w-4 h-4" />}
          color="primary"
        />
        <StatCard
          title="消息"
          value={formatNumber(stats.totalMessages)}
          icon={<TrendingUp className="w-4 h-4" />}
          color="blue"
        />
        <StatCard
          title="收藏"
          value={formatNumber(stats.starredConversations)}
          icon={<Star className="w-4 h-4" />}
          color="amber"
        />
        <StatCard
          title="Tokens"
          value={formatNumber(stats.totalTokenUsage)}
          icon={<Zap className="w-4 h-4" />}
          color="purple"
        />
      </div>

      {/* 平均消息数 */}
      <div className="p-3 rounded-xl border border-border bg-gradient-to-r from-muted/30 to-muted/10">
        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground-light">平均消息数</p>
          <p className="text-sm font-bold text-foreground">
            {stats.averageMessagesPerConversation?.toFixed(1) || 0} 条/对话
          </p>
        </div>
      </div>

      {/* 最常用模型 */}
      {topModel && (
        <div className="p-3 rounded-xl border border-border bg-card/50">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-foreground-light">最常用模型</p>
            <span className="text-xs text-foreground-light">{topModel[1]} 次</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{topModel[0]}</p>
        </div>
      )}

      {/* 模型使用分布 */}
      {Object.keys(stats.modelUsage || {}).length > 0 && (
        <div className="p-3 rounded-xl border border-border bg-card/50">
          <p className="text-xs text-foreground-light mb-3">模型分布</p>
          <div className="space-y-2.5">
            {Object.entries(stats.modelUsage)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 4)
              .map(([model, count]) => {
                const percentage = stats.totalConversations > 0
                  ? (count / stats.totalConversations) * 100
                  : 0;
                return (
                  <div key={model} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground font-medium truncate">{model}</span>
                      <span className="text-foreground-light shrink-0 ml-2">{Math.round(percentage)}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
