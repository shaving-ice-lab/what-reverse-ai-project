"use client";

/**
 * ExpressionCalculateNode - Minimalist Style
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Calculator, Variable } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface ExpressionNodeProps extends NodeProps {
  data: WorkflowNodeData;
  isConnectable?: boolean;
}

export const ExpressionNode = memo(function ExpressionNode({
  data,
  selected,
  isConnectable = true,
}: ExpressionNodeProps) {
  const config = data.config as {
    expression?: string;
    outputName?: string;
    description?: string;
  };

  const expressionPreview = config.expression
    ? config.expression.length > 40
      ? config.expression.slice(0, 40) + "..."
      : config.expression
: "// InputExpression...";

  return (
    <div
      className={cn(
        "min-w-[220px] rounded-lg border bg-surface-100 transition-all",
        selected
          ? "border-brand-500 shadow-md shadow-brand-500/10"
          : "border-border hover:border-brand-500/40"
      )}
    >
 {/* Input Port */}
      <Handle
        id="input"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3! h-3! border-2! border-background! rounded-full! top-[38px]! -left-1.5! bg-foreground-muted!"
      />

 {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border/70 px-3 py-2.5 bg-brand-200/30">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-background">
          <Calculator className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
 <h3 className="font-medium text-sm truncate">{data.label || "Expression"}</h3>
 <p className="text-xs text-foreground-muted">Calculate Expression</p>
        </div>
      </div>

 {/* ExpressionPreview */}
      <div className="px-3 py-2.5">
        <div className="text-xs font-mono text-foreground-muted p-2 rounded-md bg-surface-200 overflow-hidden">
          <code className="line-clamp-2">{expressionPreview}</code>
        </div>
        {config.outputName && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <Variable className="h-3.5 w-3.5 text-foreground-muted" />
 <span className="text-foreground-muted">Output:</span>
            <span className="font-mono px-1.5 py-0.5 rounded bg-brand-200/60 text-brand-500">
              {config.outputName}
            </span>
          </div>
        )}
      </div>

 {/* Footer */}
      <div className="flex justify-between px-3 py-2 border-t border-border text-xs text-foreground-muted bg-surface-200">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
 Input
        </span>
        <span className="flex items-center gap-1">
 Output
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
        </span>
      </div>

 {/* OutputPort */}
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
