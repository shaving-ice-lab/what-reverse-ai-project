"use client";

/**
 * 数据转换节点 - 极简风格
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Shuffle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface TransformNodeProps extends NodeProps {
  data: WorkflowNodeData;
  isConnectable?: boolean;
}

const transformTypeLabels: Record<string, string> = {
  jsonParse: "JSON 解析",
  jsonStringify: "JSON 序列化",
  toArray: "转为数组",
  toObject: "转为对象",
  toString: "转为字符串",
  toNumber: "转为数字",
  toBoolean: "转为布尔",
  flatten: "扁平化",
  pick: "选取字段",
  omit: "排除字段",
  map: "映射转换",
  filter: "过滤",
  sort: "排序",
  reverse: "反转",
  unique: "去重",
  groupBy: "分组",
};

export const TransformNode = memo(function TransformNode({
  data,
  selected,
  isConnectable = true,
}: TransformNodeProps) {
  const config = data.config as {
    transformType?: string;
    expression?: string;
    fields?: string[];
    sortKey?: string;
    sortOrder?: "asc" | "desc";
    groupKey?: string;
  };

  const transformType = config.transformType || "jsonParse";

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
          <Shuffle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{data.label || "数据转换"}</h3>
          <p className="text-xs text-foreground-muted">
            {transformTypeLabels[transformType] || transformType}
          </p>
        </div>
      </div>

      {/* 内容 */}
      <div className="px-3 py-2.5 space-y-2 text-xs">
        <div className="flex items-center justify-center gap-2 p-2 rounded-md bg-surface-200">
          <span className="px-1.5 py-0.5 rounded bg-surface-100 text-foreground-muted">输入</span>
          <ArrowRight className="h-3 w-3 text-brand-500" />
          <span className="px-1.5 py-0.5 rounded bg-brand-200/60 text-brand-500">
            {transformTypeLabels[transformType]?.split(" ")[0] || "转换"}
          </span>
        </div>
        {config.fields && config.fields.length > 0 && (
          <div className="text-foreground-muted">
            字段: <span className="font-mono">{config.fields.join(", ")}</span>
          </div>
        )}
        {config.sortKey && (
          <div className="text-foreground-muted">
            排序: <span className="font-mono">{config.sortKey}</span>
            <span className={cn(
              "ml-1.5 px-1 py-0.5 rounded text-[10px] uppercase",
              config.sortOrder === "desc" 
                ? "bg-destructive-200 text-destructive" 
                : "bg-brand-200 text-brand-500"
            )}>
              {config.sortOrder || "asc"}
            </span>
          </div>
        )}
        {config.expression && (
          <div className="font-mono text-foreground-muted p-2 rounded-md bg-surface-200 truncate">
            {config.expression}
          </div>
        )}
      </div>

      {/* 底部 */}
      <div className="flex justify-between px-3 py-2 border-t border-border text-xs text-foreground-muted bg-surface-200">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
          输入
        </span>
        <span className="flex items-center gap-1">
          输出
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
