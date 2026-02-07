"use client";

/**
 * LoopNode - Minimalist Style
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Repeat, RefreshCw, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface LoopNodeProps extends NodeProps {
 data: WorkflowNodeData;
 isConnectable?: boolean;
}

export const LoopNode = memo(function LoopNode({
 data,
 selected,
 isConnectable = true,
}: LoopNodeProps) {
 const config = data.config as {
 mode?: string;
 maxIterations?: number;
 };

 const modeLabels: Record<string, string> = {
 forEach: "Traversecountgroup",
 while: "ConditionLoop",
 count: "Fixedtimescount",
 };

 return (
 <div
 className={cn(
 "min-w-[180px] rounded-lg border bg-surface-100 transition-all",
 selected
 ? "border-brand-500 shadow-md shadow-brand-500/10"
 : "border-border hover:border-brand-500/40"
 )}
 >
 {/* InputPort */}
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
 <Repeat className="h-4 w-4" />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-medium text-sm truncate">{data.label || "Loop"}</h3>
 <p className="text-xs text-foreground-muted">
 {modeLabels[config.mode || "forEach"] || "LoopExecute"}
 </p>
 </div>
 </div>

 {/* OutputPort */}
 <div className="py-2.5 space-y-1.5">
 <div className="flex items-center justify-end pr-3 gap-1.5">
 <div className="flex items-center gap-1 px-2 py-1 rounded bg-brand-200/60 text-xs">
 <RefreshCw className="h-3 w-3 text-brand-500" />
 <span className="text-brand-500">Loop</span>
 </div>
 <Handle
 id="loop"
 type="source"
 position={Position.Right}
 isConnectable={isConnectable}
 className="relative! transform-none! w-3! h-3! border-2! border-background! rounded-full! bg-brand-500!"
 />
 </div>

 <div className="flex items-center justify-end pr-3 gap-1.5">
 <div className="flex items-center gap-1 px-2 py-1 rounded bg-brand-200 text-xs">
 <CheckCircle className="h-3 w-3 text-brand-500" />
 <span className="text-brand-500">Done</span>
 </div>
 <Handle
 id="done"
 type="source"
 position={Position.Right}
 isConnectable={isConnectable}
 className="relative! transform-none! w-3! h-3! border-2! border-background! rounded-full! bg-brand-500!"
 />
 </div>
 </div>

 {config.maxIterations && (
 <div className="px-3 pb-2.5">
 <span className="text-xs px-1.5 py-0.5 rounded bg-brand-200/60 text-brand-500">
 MaximumIteration: {config.maxIterations}
 </span>
 </div>
 )}
 </div>
 );
});
