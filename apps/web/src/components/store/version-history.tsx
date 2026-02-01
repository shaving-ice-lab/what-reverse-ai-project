"use client";

/**
 * 版本历史组件
 * 
 * 展示 Agent 的版本更新历史
 */

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  GitBranch,
  Tag,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bug,
  Zap,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AgentVersion } from "@/types/agent";

// 解析变更日志中的类型
const getChangeTypeIcon = (changelog: string) => {
  const lowerChangelog = changelog.toLowerCase();
  if (lowerChangelog.includes("新功能") || lowerChangelog.includes("新增") || lowerChangelog.includes("feature")) {
    return { icon: Sparkles, color: "text-primary", bg: "bg-primary/10" };
  }
  if (lowerChangelog.includes("修复") || lowerChangelog.includes("bug") || lowerChangelog.includes("fix")) {
    return { icon: Bug, color: "text-orange-500", bg: "bg-orange-500/10" };
  }
  if (lowerChangelog.includes("优化") || lowerChangelog.includes("性能") || lowerChangelog.includes("improve")) {
    return { icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10" };
  }
  return { icon: FileText, color: "text-foreground-light", bg: "bg-surface-200" };
};

interface VersionHistoryProps {
  versions: AgentVersion[];
  currentVersion?: string;
  showAll?: boolean;
  maxItems?: number;
  className?: string;
}

export function VersionHistory({
  versions,
  currentVersion,
  showAll = false,
  maxItems = 5,
  className,
}: VersionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(showAll);

  if (!versions || versions.length === 0) {
    return (
      <div className={cn("rounded-xl bg-surface-200/50 border border-border p-6 text-center", className)}>
        <GitBranch className="w-10 h-10 text-foreground-light mx-auto mb-3" />
        <p className="text-foreground-light">暂无版本历史</p>
      </div>
    );
  }

  const displayedVersions = isExpanded ? versions : versions.slice(0, maxItems);
  const hasMore = versions.length > maxItems;

  return (
    <div className={cn("space-y-4", className)}>
      {/* 当前版本标记 */}
      {currentVersion && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
          <Tag className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            当前版本：{currentVersion}
          </span>
        </div>
      )}

      {/* 版本时间线 */}
      <div className="relative">
        {/* 时间线 */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-4">
          {displayedVersions.map((version, index) => {
            const changeType = getChangeTypeIcon(version.changelog);
            const IconComponent = changeType.icon;
            const isLatest = index === 0;

            return (
              <div key={version.version} className="relative pl-10">
                {/* 时间线节点 */}
                <div
                  className={cn(
                    "absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center",
                    isLatest ? "bg-primary/20 ring-2 ring-brand-500/30" : changeType.bg
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isLatest ? "bg-primary" : "bg-foreground-light"
                    )}
                  />
                </div>

                {/* 版本卡片 */}
                <div
                  className={cn(
                    "p-4 rounded-xl border transition-colors",
                    isLatest
                      ? "bg-card border-primary/20"
                      : "bg-card border-border hover:border-primary/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        v{version.version}
                      </span>
                      {isLatest && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          最新
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-foreground-light shrink-0">
                      {formatDistanceToNow(new Date(version.publishedAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className={cn("p-1 rounded", changeType.bg)}>
                      <IconComponent className={cn("w-3.5 h-3.5", changeType.color)} />
                    </div>
                    <p className="text-sm text-foreground-light leading-relaxed">
                      {version.changelog}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 展开/收起按钮 */}
      {hasMore && !showAll && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-1 w-full py-2 text-sm text-foreground-light hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              收起
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              查看全部 ({versions.length} 个版本)
            </>
          )}
        </button>
      )}
    </div>
  );
}
