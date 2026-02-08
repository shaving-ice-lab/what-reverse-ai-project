"use client";

/**
 * DataFilterNode - Minimalist Style
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Filter, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface FilterNodeProps extends NodeProps {
 data: WorkflowNodeData;
 isConnectable?: boolean;
}

const filterTypeLabels: Record<string, string> = {
 condition: "Condition Filter",
 field: "Field Filter",
 type: "Type Filter",
 notNull: "Not Empty Filter",
 range: "Range Filter",
 contains: "Contains Filter",
 regex: "Regex Filter",
};

export const FilterNode = memo(function FilterNode({
 data,
 selected,
 isConnectable = true,
}: FilterNodeProps) {
 const config = data.config as {
 filterType?: string;
 condition?: string;
 field?: string;
 operator?: string;
 value?: string | number;
 minValue?: number;
 maxValue?: number;
 pattern?: string;
 invert?: boolean;
 };

 const filterType = config.filterType || "condition";

 return (
 <div
 className={cn(
 "min-w-[200px] rounded-lg border bg-surface-100 transition-all",
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
 <Filter className="h-4 w-4" />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-medium text-sm truncate">{data.label || "Data Filter"}</h3>
 <p className="text-xs text-foreground-muted">
 {filterTypeLabels[filterType] || filterType}
 </p>
 </div>
 </div>

 {/* Content */}
 <div className="px-3 py-2.5 space-y-2 text-xs">
 {config.field && (
 <div className="flex items-center gap-2">
 <span className="text-foreground-muted">Field:</span>
 <span className="font-mono px-1.5 py-0.5 rounded bg-surface-200">
 {config.field}
 </span>
 </div>
 )}
 {config.operator && config.value !== undefined && (
 <div className="flex items-center gap-2 p-2 rounded-md bg-surface-200">
 <span className="font-mono px-1.5 py-0.5 rounded bg-brand-200/60 text-brand-500">
 {config.operator}
 </span>
 <ArrowRightLeft className="h-3 w-3 text-foreground-muted" />
 <span className="font-mono px-1.5 py-0.5 rounded bg-surface-100">
 {String(config.value)}
 </span>
 </div>
 )}
 {filterType === "range" && (
 <div className="text-foreground-muted px-1.5 py-1 rounded bg-surface-200">
 Range: <span className="font-mono">{config.minValue ?? "-∞"}</span> ~ <span className="font-mono">{config.maxValue ?? "+∞"}</span>
 </div>
 )}
 {config.pattern && (
 <div className="font-mono text-foreground-muted p-2 rounded-md bg-surface-200 truncate">
 /{config.pattern}/
 </div>
 )}
 {config.invert && (
 <span className="inline-flex px-1.5 py-0.5 rounded bg-warning-200 text-warning">
 Invert Result
 </span>
 )}
 </div>

 {/* Footer */}
 <div className="flex justify-between px-3 py-2 border-t border-border text-xs text-foreground-muted bg-surface-200">
 <span className="flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
 Input
 </span>
 <span className="flex items-center gap-1">
 Filtered
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
