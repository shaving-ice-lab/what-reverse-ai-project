"use client";

/**
 * 条件判断节点 - 极简风格
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface ConditionNodeProps extends NodeProps {
  data: WorkflowNodeData;
  isConnectable?: boolean;
}

export const ConditionNode = memo(function ConditionNode({
  data,
  selected,
  isConnectable = true,
}: ConditionNodeProps) {
  return (
    <div
      className={cn(
        "min-w-[160px] rounded-lg border bg-surface-100 transition-all",
        selected
          ? "border-warning shadow-md shadow-warning/10"
          : "border-border hover:border-warning/40"
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
      <div className="flex items-center gap-2.5 border-b border-border/70 px-3 py-2.5 bg-warning/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-warning text-background">
          <GitBranch className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{data.label || "条件判断"}</h3>
          <p className="text-xs text-foreground-muted">If / Else</p>
        </div>
      </div>

      {/* 输出端口区域 */}
      <div className="py-2.5 space-y-1.5">
        {/* True 分支 */}
        <div className="flex items-center justify-end pr-3 gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-brand-200 text-xs">
            <CheckCircle2 className="h-3 w-3 text-brand-500" />
            <span className="text-brand-500">True</span>
          </div>
          <Handle
            id="true"
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            className="relative! transform-none! w-3! h-3! border-2! border-background! rounded-full! bg-brand-500!"
          />
        </div>

        {/* False 分支 */}
        <div className="flex items-center justify-end pr-3 gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-destructive-200 text-xs">
            <XCircle className="h-3 w-3 text-destructive" />
            <span className="text-destructive">False</span>
          </div>
          <Handle
            id="false"
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            className="relative! transform-none! w-3! h-3! border-2! border-background! rounded-full! bg-destructive!"
          />
        </div>
      </div>
    </div>
  );
});
