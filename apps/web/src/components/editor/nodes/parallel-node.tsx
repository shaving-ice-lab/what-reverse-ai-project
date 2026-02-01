"use client";

/**
 * 并行执行节点 - 极简风格
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch, ArrowRight, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface ParallelNodeProps extends NodeProps {
  data: WorkflowNodeData;
  isConnectable?: boolean;
}

export const ParallelNode = memo(function ParallelNode({
  data,
  selected,
  isConnectable = true,
}: ParallelNodeProps) {
  const config = data.config as {
    branchCount?: number;
    waitAll?: boolean;
    timeout?: number;
    failFast?: boolean;
  };

  const branchCount = config.branchCount || 2;
  const waitAll = config.waitAll !== false;

  return (
    <div
      className={cn(
        "min-w-[200px] rounded-lg border bg-surface-100 transition-all",
        selected
          ? "border-brand-500 shadow-md shadow-brand-500/10"
          : "border-border hover:border-brand-500/40"
      )}
    >
      {/* 输入端口 */}
      <Handle
        id="input"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3! h-3! border-2! border-background! rounded-full! top-[38px]! -left-1.5! bg-foreground-muted!"
      />

      {/* 头部 */}
      <div className="flex items-center gap-2.5 border-b border-border/70 px-3 py-2.5 bg-brand-200/30">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-background">
          <GitBranch className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{data.label || "并行执行"}</h3>
          <p className="text-xs text-foreground-muted flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {branchCount} 个分支
          </p>
        </div>
      </div>

      {/* 内容 */}
      <div className="px-3 py-2.5 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-foreground-muted">等待模式:</span>
          <span className={cn(
            "px-1.5 py-0.5 rounded",
            waitAll 
              ? "bg-brand-200/60 text-brand-500" 
              : "bg-warning-200 text-warning"
          )}>
            {waitAll ? "等待全部" : "任一完成"}
          </span>
        </div>
        {config.timeout && (
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-foreground-muted" />
            <span className="text-foreground-muted">超时:</span>
            <span className="font-mono">{config.timeout}ms</span>
          </div>
        )}
        {config.failFast && (
          <span className="inline-flex px-1.5 py-0.5 rounded bg-warning-200 text-warning">
            快速失败模式
          </span>
        )}
      </div>

      {/* 分支指示 */}
      <div className="px-3 py-2 border-t border-border bg-surface-200 text-xs">
        <div className="flex flex-col gap-1">
          {Array.from({ length: branchCount }).map((_, i) => (
            <div key={i} className="flex items-center justify-between text-foreground-muted">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                分支 {i + 1}
              </span>
              <ArrowRight className="h-3 w-3 text-brand-500" />
            </div>
          ))}
          <div className="flex items-center justify-between text-foreground-muted pt-1 border-t border-border">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              汇合
            </span>
            <ArrowRight className="h-3 w-3 text-brand-500" />
          </div>
        </div>
      </div>

      {/* 多个输出端口 */}
      {Array.from({ length: branchCount }).map((_, i) => (
        <Handle
          key={`branch-${i}`}
          id={`branch-${i}`}
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          style={{ top: `${35 + i * (40 / branchCount)}%` }}
          className="w-3! h-3! border-2! border-background! rounded-full! -right-1.5! bg-brand-500!"
        />
      ))}

      {/* 汇合输出端口 */}
      <Handle
        id="join"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ top: "88%" }}
        className="w-3! h-3! border-2! border-background! rounded-full! -right-1.5! bg-brand-500!"
      />
    </div>
  );
});
