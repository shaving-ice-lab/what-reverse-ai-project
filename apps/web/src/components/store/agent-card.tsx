"use client";

/**
 * Agent 卡片组件
 * 
 * 用于展示单个 Agent 的信息卡片，支持悬停效果和交互
 */

import Link from "next/link";
import {
  Star,
  Download,
  ArrowUpRight,
  Zap,
  Eye,
  FileText,
  BarChart3,
  MessageSquare,
  Users,
  Code2,
  Globe,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Agent, AgentCategory } from "@/types/agent";

// 分类图标映射
const categoryIconMap: Record<AgentCategory, typeof MessageSquare> = {
  content: FileText,
  data: BarChart3,
  customer: MessageSquare,
  productivity: Users,
  developer: Code2,
  research: Globe,
  education: FileText,
  finance: BarChart3,
  marketing: TrendingUp,
  other: Sparkles,
};

// 格式化数字
const formatCount = (num: number): string => {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

interface AgentCardProps {
  agent: Agent;
  index?: number;
  variant?: "default" | "compact" | "horizontal";
  onPreview?: (agent: Agent) => void;
  className?: string;
}

export function AgentCard({
  agent,
  index = 0,
  variant = "default",
  onPreview,
  className,
}: AgentCardProps) {
  const IconComponent = categoryIconMap[agent.category] || Sparkles;

  const handleClick = (e: React.MouseEvent) => {
    if (onPreview) {
      e.preventDefault();
      onPreview(agent);
    }
  };

  if (variant === "compact") {
    return (
      <Link href={`/store/${agent.slug}`}>
        <div
          className={cn(
            "group flex items-center gap-3 p-3 rounded-xl",
            "bg-card border border-border",
            "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10",
            "transition-all duration-200 cursor-pointer",
            className
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">
            {agent.icon || "🤖"}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {agent.name}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                {agent.avgRating.toFixed(1)}
              </span>
              <span></span>
              <span>{formatCount(agent.useCount)} 使用</span>
            </div>
          </div>
          {agent.pricingType === "free" && (
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
              免费
            </span>
          )}
        </div>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link href={`/store/${agent.slug}`}>
        <div
          className={cn(
            "group flex items-center gap-4 p-4 rounded-xl",
            "bg-card border border-border",
            "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10",
            "transition-all duration-200 cursor-pointer",
            className
          )}
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-2xl shrink-0">
            {agent.icon || "🤖"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {agent.name}
              </h4>
              {agent.useCount > 1000 && (
                <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 text-xs font-medium flex items-center gap-0.5">
                  <Zap className="w-3 h-3" />
                  热门
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
              {agent.description}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                {agent.avgRating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {formatCount(agent.useCount)}
              </span>
              <span className="text-muted-foreground/50">
                {agent.author?.displayName || agent.author?.username}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            {agent.pricingType === "free" ? (
              <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                免费
              </span>
            ) : agent.price ? (
              <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-semibold border border-orange-500/20">
                {agent.price}
              </span>
            ) : null}
            <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "group relative h-full bg-card rounded-2xl border border-border overflow-hidden cursor-pointer",
        "transition-all duration-300 ease-out",
            "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1",
        className
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        animation: "cardFadeIn 400ms ease-out both",
      }}
      onClick={handleClick}
    >
      {/* 鼠标跟随光效 */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(62,207,142,0.06), transparent 40%)",
        }}
      />

      {/* 顶部渐变条 */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Thumbnail Preview */}
      <div className="aspect-[16/9] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
        <span className="text-5xl transform group-hover:scale-110 transition-transform duration-300">
          {agent.icon || "🤖"}
        </span>
        {agent.coverImage && (
          <img
            src={agent.coverImage}
            alt={agent.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
          <span className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <Eye className="w-4 h-4" />
            快速预览
          </span>
        </div>

        {/* 热门标签 */}
        {agent.useCount > 1000 && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-orange-500 text-white text-xs font-semibold flex items-center gap-1 shadow-lg">
            <Zap className="w-3 h-3" />
            热门
          </div>
        )}
      </div>

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              "bg-primary/10 group-hover:bg-primary/20",
              "transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/20"
            )}
          >
            <IconComponent className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-2">
            {agent.pricingType === "free" && (
              <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                免费
              </span>
            )}
            {agent.pricingType === "paid" && agent.price && (
              <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-semibold border border-orange-500/20">
                {agent.price}
              </span>
            )}
          </div>
        </div>

        <h4 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors flex items-center gap-2">
          {agent.name}
          <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
        </h4>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {agent.description}
        </p>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
              {(agent.author?.displayName || agent.author?.username || "U").charAt(0)}
            </div>
            <span className="text-muted-foreground">
              {agent.author?.displayName || agent.author?.username || "未知"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-yellow-500">
              <Star className="w-3.5 h-3.5 fill-current" /> {agent.avgRating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Download className="w-3.5 h-3.5" /> {formatCount(agent.useCount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
