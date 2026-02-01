"use client";

/**
 * 执行历史面板组件
 * 
 * 显示工作流执行历史记录，支持查看详情、重试和取消
 */

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  Play,
  Square,
  Layers,
  Timer,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { executionApi } from "@/lib/api";
import type { WorkflowExecution } from "@/types/workflow-api";
import { cn } from "@/lib/utils";

interface ExecutionHistoryPanelProps {
  workflowId?: string;  // 可选，指定工作流ID时只显示该工作流的执行历史
  limit?: number;       // 显示数量限制
  showTitle?: boolean;  // 是否显示标题
  onViewDetail?: (execution: WorkflowExecution) => void;  // 查看详情回调
}

// 执行状态颜色和图标映射
const statusConfig: Record<string, { color: string; bgColor: string; icon: typeof CheckCircle; label: string }> = {
  pending: {
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    icon: Clock,
    label: "等待中",
  },
  running: {
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    icon: Loader2,
    label: "执行中",
  },
  completed: {
    color: "text-primary",
    bgColor: "bg-primary/10",
    icon: CheckCircle,
    label: "已完成",
  },
  failed: {
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    icon: XCircle,
    label: "失败",
  },
  cancelled: {
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    icon: Square,
    label: "已取消",
  },
};

// 格式化持续时间
const formatDuration = (ms?: number): string => {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
};

export function ExecutionHistoryPanel({
  workflowId,
  limit = 10,
  showTitle = true,
  onViewDetail,
}: ExecutionHistoryPanelProps) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // 加载执行历史
  const loadExecutions = useCallback(async () => {
    if (!workflowId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await executionApi.list(workflowId, { pageSize: limit });
      setExecutions(response.data || []);
      setError(null);
    } catch (err) {
      console.error("加载执行历史失败:", err);
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [workflowId, limit]);

  // 刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadExecutions();
  };

  // 重试执行
  const handleRetry = async (executionId: string) => {
    setRetryingId(executionId);
    try {
      await executionApi.retry(executionId);
      // 重新加载列表
      await loadExecutions();
    } catch (err) {
      console.error("重试执行失败:", err);
      alert(err instanceof Error ? err.message : "重试失败");
    } finally {
      setRetryingId(null);
    }
  };

  // 取消执行
  const handleCancel = async (executionId: string) => {
    setCancellingId(executionId);
    try {
      await executionApi.cancel(executionId);
      // 重新加载列表
      await loadExecutions();
    } catch (err) {
      console.error("取消执行失败:", err);
      alert(err instanceof Error ? err.message : "取消失败");
    } finally {
      setCancellingId(null);
    }
  };

  // 初始加载
  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);

  // 自动刷新正在执行的任务
  useEffect(() => {
    const hasRunning = executions.some(e => e.status === "running" || e.status === "pending");
    if (!hasRunning) return;

    const interval = setInterval(() => {
      loadExecutions();
    }, 5000);

    return () => clearInterval(interval);
  }, [executions, loadExecutions]);

  // 无工作流ID时显示提示 - 增强版
  if (!workflowId) {
    return (
      <Card className="border border-border/60 bg-card/80 backdrop-blur-sm p-6">
        <div className="flex flex-col items-center justify-center text-center py-10">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 ring-1 ring-border/50">
            <Layers className="w-8 h-8 text-muted-foreground/70" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">请选择工作流</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            选择一个工作流以查看其执行历史记录
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-primary/20 transition-colors duration-300">
      {/* 标题栏 - 增强版 */}
      {showTitle && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-violet-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Timer className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">执行历史</h3>
              <p className="text-xs text-muted-foreground">
                {executions.length} 条记录
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            刷新
          </Button>
        </div>
      )}

      {/* 内容区 */}
      <div className="divide-y divide-border/30">
        {isLoading ? (
          // 加载骨架 - 增强版
          Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className="flex items-center gap-4 p-4"
              style={{
                animationDelay: `${i * 50}ms`,
                animation: 'fadeInUp 300ms ease-out both'
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-muted/50 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted/50 rounded-lg w-1/3 animate-pulse" />
                <div className="h-3 bg-muted/50 rounded-lg w-1/2 animate-pulse" />
              </div>
              <div className="w-20 h-6 bg-muted/50 rounded-full animate-pulse" />
            </div>
          ))
        ) : error ? (
          // 错误状态 - 增强版
          <div className="flex flex-col items-center justify-center text-center p-10">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 ring-1 ring-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">加载失败</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
          </div>
        ) : executions.length === 0 ? (
          // 空状态 - 增强版
          <div className="flex flex-col items-center justify-center text-center p-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 ring-1 ring-primary/20">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">暂无执行记录</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              运行工作流后，执行记录将显示在这里
            </p>
          </div>
        ) : (
          // 执行列表 - 增强版
          executions.map((execution, index) => {
            const config = statusConfig[execution.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const isRunning = execution.status === "running" || execution.status === "pending";
            const canRetry = execution.status === "failed";
            const canCancel = isRunning;

            return (
              <div
                key={execution.id}
                className={cn(
                  "flex items-center gap-4 p-4 transition-all duration-200 group",
                  onViewDetail && "hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent cursor-pointer",
                  execution.status === "running" && "bg-blue-500/5"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeInUp 300ms ease-out both'
                }}
                onClick={() => onViewDetail?.(execution)}
              >
                {/* 状态图标 */}
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center ring-1 transition-transform duration-200 group-hover:scale-105",
                  config.bgColor,
                      execution.status === "completed" && "ring-primary/20",
                  execution.status === "failed" && "ring-red-500/20",
                  execution.status === "running" && "ring-blue-500/20",
                  execution.status === "pending" && "ring-orange-500/20",
                  execution.status === "cancelled" && "ring-border"
                )}>
                  <StatusIcon className={cn("w-5 h-5", config.color, execution.status === "running" && "animate-spin")} />
                </div>

                {/* 执行信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      执行 #{execution.id.slice(-6)}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium ring-1",
                      config.bgColor, config.color,
                      execution.status === "completed" && "ring-primary/20",
                      execution.status === "failed" && "ring-red-500/20",
                      execution.status === "running" && "ring-blue-500/20",
                      execution.status === "pending" && "ring-orange-500/20",
                      execution.status === "cancelled" && "ring-border"
                    )}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(execution.startTime), { addSuffix: true, locale: zhCN })}
                    </span>
                    {execution.duration && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50">
                        <Timer className="w-3 h-3" />
                        {formatDuration(execution.duration)}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded-md bg-muted/50">
                      {execution.trigger?.type || "手动"}
                    </span>
                  </div>
                  {execution.error && (
                    <p className="text-xs text-red-500 mt-1.5 truncate px-2 py-1 rounded-md bg-red-500/5">
                      错误: {execution.error.message}
                    </p>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canRetry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry(execution.id);
                      }}
                      disabled={retryingId === execution.id}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8 p-0"
                    >
                      {retryingId === execution.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(execution.id);
                      }}
                      disabled={cancellingId === execution.id}
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0"
                    >
                      {cancellingId === execution.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  {onViewDetail && (
                      <div className="p-1 rounded-md bg-muted/50 group-hover:bg-primary/10 transition-colors">
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 查看更多 - 增强版 */}
      {executions.length > 0 && executions.length >= limit && (
        <div className="px-6 py-4 border-t border-border/50 bg-gradient-to-r from-muted/20 via-transparent to-muted/20">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-primary hover:bg-primary/10 group"
          >
            查看更多记录
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      )}
    </Card>
  );
}
