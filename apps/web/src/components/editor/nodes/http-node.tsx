"use client";

/**
 * HTTP 请求节点 - 极简风格
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Globe, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface HTTPNodeProps extends NodeProps {
  data: WorkflowNodeData;
  isConnectable?: boolean;
}

const methodColors: Record<string, string> = {
  GET: "bg-brand-200 text-brand-500",
  POST: "bg-surface-200 text-foreground-light",
  PUT: "bg-warning-200 text-warning",
  PATCH: "bg-warning-200 text-warning",
  DELETE: "bg-destructive-200 text-destructive",
};

export const HTTPNode = memo(function HTTPNode({
  data,
  selected,
  isConnectable = true,
}: HTTPNodeProps) {
  const config = data.config as {
    method?: string;
    url?: string;
  };

  const method = config.method || "GET";
  const methodStyle = methodColors[method] || methodColors.GET;

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
          <Globe className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{data.label || "HTTP 请求"}</h3>
          <p className="text-xs text-foreground-muted flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            API 调用
          </p>
        </div>
      </div>

      {/* 内容 */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-xs">
          <span className={cn("px-1.5 py-0.5 rounded font-mono font-medium", methodStyle)}>
            {method}
          </span>
          <span className="text-foreground-muted truncate flex-1 font-mono bg-surface-200 px-1.5 py-0.5 rounded">
            {config.url || "https://..."}
          </span>
        </div>
      </div>

      {/* 底部 */}
      <div className="flex justify-between px-3 py-2 border-t border-border text-xs text-foreground-muted bg-surface-200">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
          输入
        </span>
        <span className="flex items-center gap-1">
          响应
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
        </span>
      </div>

      {/* 输出端口 */}
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3! h-3! border-2! border-background! rounded-full! top-[38px]! -right-1.5! bg-brand-500!"
      />
    </div>
  );
});
