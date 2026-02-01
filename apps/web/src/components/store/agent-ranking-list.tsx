"use client";

/**
 * Agent 排行列表组件
 * 
 * 展示热门或最新 Agent 的排行榜
 */

import Link from "next/link";
import {
  Star,
  Download,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Crown,
  Medal,
  Award,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Agent } from "@/types/agent";

// 格式化数字
const formatCount = (num: number): string => {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// 排名图标
const getRankIcon = (index: number) => {
  switch (index) {
    case 0:
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case 1:
      return <Medal className="w-4 h-4 text-muted-foreground" />;
    case 2:
      return <Award className="w-4 h-4 text-amber-600" />;
    default:
      return null;
  }
};

// 排名背景色
const getRankBgClass = (index: number) => {
  switch (index) {
    case 0:
      return "bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border-yellow-500/20";
    case 1:
      return "bg-gradient-to-r from-muted/10 to-muted/5 border-border";
    case 2:
      return "bg-gradient-to-r from-amber-600/10 to-amber-700/5 border-amber-600/20";
    default:
      return "bg-card border-border";
  }
};

interface AgentRankingListProps {
  agents: Agent[];
  title?: string;
  subtitle?: string;
  icon?: typeof TrendingUp;
  variant?: "popular" | "newest" | "rating";
  showRank?: boolean;
  limit?: number;
  viewAllHref?: string;
  className?: string;
}

export function AgentRankingList({
  agents,
  title = "热门排行",
  subtitle,
  icon: TitleIcon = TrendingUp,
  variant = "popular",
  showRank = true,
  limit = 5,
  viewAllHref,
  className,
}: AgentRankingListProps) {
  const displayAgents = agents.slice(0, limit);

  if (displayAgents.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TitleIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        <div className="p-8 text-center text-muted-foreground text-sm bg-card rounded-xl border border-border">
          暂无数据
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <TitleIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              查看更多
              <ArrowUpRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* 列表 */}
      <div className="space-y-2">
        {displayAgents.map((agent, index) => (
          <Link key={agent.id} href={`/store/${agent.slug}`}>
            <div
              className={cn(
                "group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10",
                showRank && index < 3 ? getRankBgClass(index) : "bg-card border-border"
              )}
              style={{
                animationDelay: `${index * 50}ms`,
                animation: "cardFadeIn 300ms ease-out both",
              }}
            >
              {/* 排名 */}
              {showRank && (
                <div className="flex items-center justify-center w-8 h-8 shrink-0">
                  {getRankIcon(index) || (
                    <span className="text-sm font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>
              )}

              {/* Agent 图标 */}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-xl shrink-0">
                {agent.icon || "🤖"}
              </div>

              {/* Agent 信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {agent.name}
                  </h4>
                  {index === 0 && variant === "popular" && (
                    <Flame className="w-4 h-4 text-orange-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {variant === "popular" && (
                    <>
                      <span className="flex items-center gap-0.5">
                        <Download className="w-3 h-3" />
                        {formatCount(agent.useCount)}
                      </span>
                      <span></span>
                    </>
                  )}
                  {variant === "newest" && (
                    <>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(agent.publishedAt || agent.createdAt).toLocaleDateString()}
                      </span>
                      <span></span>
                    </>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    {agent.avgRating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* 价格/状态 */}
              <div className="shrink-0 flex items-center gap-2">
                {agent.pricingType === "free" ? (
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                    免费
                  </span>
                ) : agent.price ? (
                  <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 text-xs font-medium">
                    {agent.price}
                  </span>
                ) : null}
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
