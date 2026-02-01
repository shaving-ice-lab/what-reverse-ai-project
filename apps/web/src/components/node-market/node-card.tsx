"use client";

/**
 * 自定义节点卡片组件
 * 
 * 展示单个节点的基本信息
 */

import {
  Star,
  Download,
  Package,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Wrench,
  GitBranch,
  MessageSquare,
  HardDrive,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomNode, CustomNodeCategory } from "@/types/custom-node";

// 分类图标映射
const categoryIconMap: Record<CustomNodeCategory, typeof Cpu> = {
  ai: Cpu,
  data: Database,
  integration: Globe,
  utility: Wrench,
  logic: GitBranch,
  communication: MessageSquare,
  storage: HardDrive,
  other: Sparkles,
};

// 分类名称映射
const categoryNameMap: Record<CustomNodeCategory, string> = {
  ai: "AI/LLM",
  data: "数据处理",
  integration: "集成",
  utility: "工具",
  logic: "逻辑控制",
  communication: "通信",
  storage: "存储",
  other: "其他",
};

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

interface NodeCardProps {
  node: CustomNode;
  variant?: "default" | "compact" | "horizontal";
  isInstalled?: boolean;
  hasUpdate?: boolean;
  onClick?: () => void;
  onInstall?: () => void;
  className?: string;
}

export function NodeCard({
  node,
  variant = "default",
  isInstalled = false,
  hasUpdate = false,
  onClick,
  onInstall,
  className,
}: NodeCardProps) {
  const CategoryIcon = categoryIconMap[node.category] || Sparkles;
  const categoryName = categoryNameMap[node.category] || "其他";

  // 紧凑卡片
  if (variant === "compact") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "group p-4 rounded-xl cursor-pointer transition-all",
          "bg-card border border-border",
          "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">
            {node.icon || "📦"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {node.name}
              </span>
              {isInstalled && (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                {node.avgRating.toFixed(1)}
              </span>
              <span>•</span>
              <span>{formatNumber(node.installCount)} 安装</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 横向卡片
  if (variant === "horizontal") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "group p-5 rounded-xl cursor-pointer transition-all",
          "bg-card border border-border",
          "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
          className
        )}
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-2xl shrink-0">
            {node.icon || "📦"}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {node.name}
              </h3>
              <span className="text-xs text-muted-foreground">v{node.version}</span>
              {node.author.isVerified && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  认证
                </span>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {node.description}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CategoryIcon className="w-3.5 h-3.5" />
                {categoryName}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                {node.avgRating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                {formatNumber(node.installCount)}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {isInstalled ? (
              <div className="flex items-center gap-2">
                {hasUpdate && (
                  <span className="px-2 py-1 rounded-md bg-orange-500/10 text-orange-500 text-xs font-medium">
                    有更新
                  </span>
                )}
                <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                  已安装
                </span>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInstall?.();
                }}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
              >
                安装
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 默认卡片
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl overflow-hidden cursor-pointer transition-all",
        "bg-card border border-border",
        "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
        className
      )}
    >
      {/* 顶部装饰 */}
      <div className="h-2 bg-linear-to-r from-primary/50 to-primary/20" />
      
      <div className="p-5">
        {/* 头部 */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-2xl shrink-0">
            {node.icon || "📦"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {node.name}
              </h3>
              {isInstalled && (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CategoryIcon className="w-3.5 h-3.5" />
                {categoryName}
              </span>
              <span>•</span>
              <span>v{node.version}</span>
            </div>
          </div>
        </div>

        {/* 描述 */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {node.description}
        </p>

        {/* 标签 */}
        {node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {node.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {node.tags.length > 3 && (
              <span className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                +{node.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 统计 */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              {node.avgRating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              {formatNumber(node.installCount)}
            </span>
          </div>
          
          {/* 作者 */}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
              {(node.author.displayName || node.author.username || "U").charAt(0)}
            </div>
            <span className="text-xs text-muted-foreground">
              {node.author.displayName || node.author.username}
            </span>
            {node.author.isVerified && (
              <CheckCircle2 className="w-3 h-3 text-blue-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
