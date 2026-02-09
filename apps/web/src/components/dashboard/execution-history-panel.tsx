"use client";

/**
 * Execution History Panel Component
 * 
 * Displays workflow execution history records. Supports viewing details, retry, and cancel.
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
  workflowId?: string; // Optional, specify workflow ID to display its execution history
  limit?: number; // Display count limit
  showTitle?: boolean; // Whether to display the title
  onViewDetail?: (execution: WorkflowExecution) => void; // View details callback
}

// Execution status color and icon mapping
const statusConfig: Record<string, { color: string; bgColor: string; icon: typeof CheckCircle; label: string }> = {
 pending: {
 color: "text-orange-500",
 bgColor: "bg-orange-500/10",
 icon: Clock,
    label: "Pending",
 },
 running: {
 color: "text-blue-500",
 bgColor: "bg-blue-500/10",
 icon: Loader2,
    label: "Running",
 },
 completed: {
 color: "text-primary",
 bgColor: "bg-primary/10",
 icon: CheckCircle,
 label: "Completed",
 },
 failed: {
 color: "text-red-500",
 bgColor: "bg-red-500/10",
 icon: XCircle,
 label: "Failed",
 },
 cancelled: {
 color: "text-foreground-light",
 bgColor: "bg-surface-200",
 icon: Square,
 label: "Cancelled",
 },
};

// Format duration
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

  // Load execution history
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
      console.error("Failed to load execution history:", err);
      setError(err instanceof Error ? err.message: "Failed to load execution history");
 } finally {
 setIsLoading(false);
 setIsRefreshing(false);
 }
 }, [workflowId, limit]);

  // Refresh data
 const handleRefresh = async () => {
 setIsRefreshing(true);
 await loadExecutions();
 };

  // Retry execution
  const handleRetry = async (executionId: string) => {
    setRetryingId(executionId);
    try {
      await executionApi.retry(executionId);
      // Reload list
      await loadExecutions();
    } catch (err) {
      console.error("Failed to retry execution:", err);
      alert(err instanceof Error ? err.message: "Failed to retry execution");
 } finally {
 setRetryingId(null);
 }
 };

  // Cancel execution
  const handleCancel = async (executionId: string) => {
    setCancellingId(executionId);
    try {
      await executionApi.cancel(executionId);
      // Reload list
      await loadExecutions();
    } catch (err) {
      console.error("Failed to cancel execution:", err);
      alert(err instanceof Error ? err.message: "Failed to cancel execution");
 } finally {
 setCancellingId(null);
 }
 };

  // Initial load
 useEffect(() => {
 loadExecutions();
 }, [loadExecutions]);

  // Auto-refresh currently executing tasks
 useEffect(() => {
 const hasRunning = executions.some(e => e.status === "running" || e.status === "pending");
 if (!hasRunning) return;

 const interval = setInterval(() => {
 loadExecutions();
 }, 5000);

 return () => clearInterval(interval);
 }, [executions, loadExecutions]);

  // No Workflow ID - Display Tip - Enhanced
 if (!workflowId) {
 return (
 <Card className="border border-border/60 bg-card/80 backdrop-blur-sm p-6">
 <div className="flex flex-col items-center justify-center text-center py-10">
 <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 ring-1 ring-border/50">
 <Layers className="w-8 h-8 text-foreground-light/70" />
 </div>
            <h3 className="font-semibold text-foreground mb-2">Please select a workflow</h3>
            <p className="text-sm text-foreground-light max-w-xs">
              Select a workflow to view its execution history
 </p>
 </div>
 </Card>
 );
 }

 return (
 <Card className="border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-primary/20 transition-colors duration-300">
 {/* Title - Enhanced */}
 {showTitle && (
 <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-violet-500/5">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
 <Timer className="w-5 h-5 text-primary" />
 </div>
 <div>
                <h3 className="font-semibold text-foreground">Execution History</h3>
                <p className="text-xs text-foreground-light">
                  {executions.length} records
 </p>
 </div>
 </div>
 <Button
 variant="ghost"
 size="sm"
 onClick={handleRefresh}
 disabled={isRefreshing}
 className="text-foreground-light hover:text-primary hover:bg-primary/10"
 >
 <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
 Refresh
 </Button>
 </div>
 )}

 {/* Content */}
 <div className="divide-y divide-border/30">
 {isLoading ? (
          // Loading Skeleton - Enhanced
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
          // Error State - Enhanced
 <div className="flex flex-col items-center justify-center text-center p-10">
 <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 ring-1 ring-red-500/20">
 <AlertCircle className="w-8 h-8 text-red-500" />
 </div>
              <h3 className="font-semibold text-foreground mb-2">Failed to Load Data</h3>
 <p className="text-sm text-foreground-light mb-4 max-w-xs">{error}</p>
 <Button 
 variant="outline" 
 size="sm" 
 onClick={handleRefresh}
 className="border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5"
 >
 <RefreshCw className="w-4 h-4 mr-2" />
 Retry
 </Button>
 </div>
 ) : executions.length === 0 ? (
 // Empty State - Enhanced
 <div className="flex flex-col items-center justify-center text-center p-10">
 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 ring-1 ring-primary/20">
 <Zap className="w-8 h-8 text-primary" />
 </div>
 <h3 className="font-semibold text-foreground mb-2">No execution records</h3>
 <p className="text-sm text-foreground-light max-w-xs">
              Execution records will appear here after running a workflow
 </p>
 </div>
 ) : (
          // Execution List - Enhanced
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
              {/* Status Icon */}
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

              {/* Execution Info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Execution #{execution.id.slice(-6)}
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
 <div className="flex items-center gap-3 text-xs text-foreground-light">
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
 {execution.trigger?.type || "Manual"}
 </span>
 </div>
 {execution.error && (
 <p className="text-xs text-red-500 mt-1.5 truncate px-2 py-1 rounded-md bg-red-500/5">
 Error: {execution.error.message}
 </p>
 )}
 </div>

            {/* Action Buttons */}
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
 className="text-foreground-light hover:text-primary hover:bg-primary/10 h-8 w-8 p-0"
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
 className="text-foreground-light hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0"
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
 <ChevronRight className="w-4 h-4 text-foreground-light group-hover:text-primary transition-colors" />
 </div>
 )}
 </div>
 </div>
 );
 })
 )}
 </div>

 {/* View more - Enhanced */}
 {executions.length > 0 && executions.length >= limit && (
 <div className="px-6 py-4 border-t border-border/50 bg-gradient-to-r from-muted/20 via-transparent to-muted/20">
 <Button
 variant="ghost"
 size="sm"
 className="w-full text-foreground-light hover:text-primary hover:bg-primary/10 group"
 >
            View more records
 <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
 </Button>
 </div>
 )}
 </Card>
 );
}
