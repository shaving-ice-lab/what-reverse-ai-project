"use client";

/**
 * DataandNode - Minimalist Style
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Merge, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface MergeNodeProps extends NodeProps {
 data: WorkflowNodeData;
 isConnectable?: boolean;
}

const mergeTypeLabels: Record<string, string> = {
 concat: "countgroupConnect",
 merge: "forand",
 zip: "forand",
 union: "and",
 intersection: "",
 difference: "",
};

export const MergeNode = memo(function MergeNode({
 data,
 selected,
 isConnectable = true,
}: MergeNodeProps) {
 const config = data.config as {
 mergeType?: string;
 inputCount?: number;
 deep?: boolean;
 unique?: boolean;
 };

 const mergeType = config.mergeType || "concat";
 const inputCount = config.inputCount || 2;

 return (
 <div
 className={cn(
 "min-w-[180px] rounded-lg border bg-surface-100 transition-all",
 selected
 ? "border-brand-500 shadow-md shadow-brand-500/10"
 : "border-border hover:border-brand-500/40"
 )}
 >
 {/* multipleInputPort */}
 {Array.from({ length: inputCount }).map((_, i) => (
 <Handle
 key={`input-${i}`}
 id={`input-${i}`}
 type="target"
 position={Position.Left}
 isConnectable={isConnectable}
 style={{ top: `${30 + i * 20}%` }}
 className="w-3! h-3! border-2! border-background! rounded-full! -left-1.5! bg-foreground-muted!"
 />
 ))}

 {/* Header */}
 <div className="flex items-center gap-2.5 border-b border-border/70 px-3 py-2.5 bg-brand-200/30">
 <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-background">
 <Merge className="h-4 w-4" />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-medium text-sm truncate">{data.label || "Dataand"}</h3>
 <p className="text-xs text-foreground-muted flex items-center gap-1">
 <Layers className="h-3 w-3" />
 {mergeTypeLabels[mergeType] || mergeType}
 </p>
 </div>
 </div>

 {/* Content */}
 <div className="px-3 py-2.5 space-y-2 text-xs">
 <div className="flex items-center gap-2">
 <span className="text-foreground-muted">InputCount:</span>
 <span className="font-mono px-1.5 py-0.5 rounded bg-brand-200/60 text-brand-500 font-medium">
 {inputCount}
 </span>
 </div>
 <div className="flex flex-wrap gap-1.5">
 {config.deep && (
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-200/40 text-brand-500">
 <Sparkles className="h-3 w-3" />
 Depthand
 </span>
 )}
 {config.unique && (
 <span className="inline-flex px-1.5 py-0.5 rounded bg-brand-200 text-brand-500">
 gore-
 </span>
 )}
 </div>
 </div>

 {/* Footer */}
 <div className="flex justify-between px-3 py-2 border-t border-border text-xs text-foreground-muted bg-surface-200">
 <span className="flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
 Input x{inputCount}
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
 className="w-3! h-3! border-2! border-background! rounded-full! top-1/2! -right-1.5! bg-brand-500!"
 />
 </div>
 );
});
