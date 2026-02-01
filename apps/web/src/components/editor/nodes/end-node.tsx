"use client";

/**
 * 结束节点 - 优化版
 */

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Square, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface EndNodeProps extends NodeProps {
  data: WorkflowNodeData;
  isConnectable?: boolean;
}

export const EndNode = memo(function EndNode({
  data,
  selected,
  isConnectable = true,
}: EndNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-xl border px-5 py-3",
        "bg-linear-to-r from-destructive/10 to-destructive-200/20",
        "backdrop-blur-sm transition-all duration-200",
        // 边框和阴影
        "border-destructive/30",
        "shadow-lg shadow-destructive/10",
        // 悬浮效果
        isHovered && !selected && [
          "border-destructive/50",
          "shadow-lg shadow-destructive/20",
          "-translate-y-0.5"
        ],
        // 选中效果
        selected && [
          "border-destructive",
          "shadow-[0_0_20px_rgba(239,68,68,0.3)]",
          "ring-1 ring-destructive/30"
        ]
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 输入端口 */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className={cn(
          "w-3.5! h-3.5! border-2! border-background! rounded-full! -left-1.5!",
          "bg-destructive! transition-all! duration-200!",
          "hover:scale-125! hover:ring-4! hover:ring-destructive/30!"
        )}
      />

      {/* 图标容器 */}
      <div className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-lg",
        "bg-linear-to-br from-destructive to-destructive-400",
        "shadow-lg shadow-destructive/30",
        "transition-transform duration-200",
        isHovered && "scale-105"
      )}>
        <Square className="h-5 w-5 text-destructive-foreground" />
      </div>

      {/* 标签 */}
      <div className="flex flex-col">
        <span className="font-semibold text-sm text-destructive">
          {data.label || "结束"}
        </span>
        <span className="text-[10px] text-destructive/70 flex items-center gap-1">
          <Flag className="w-2.5 h-2.5" />
          工作流出口
        </span>
      </div>

      {/* 选中指示器 */}
      {selected && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-destructive/50" />
      )}
    </div>
  );
});
