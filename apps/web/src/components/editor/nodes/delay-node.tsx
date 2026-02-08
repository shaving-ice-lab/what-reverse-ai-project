"use client";

/**
 * LatencyNode - Minimalist Style
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Timer, Clock, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface DelayNodeProps extends NodeProps {
 data: WorkflowNodeData;
 isConnectable?: boolean;
}

function formatDuration(ms: number): string {
 if (ms < 1000) {
 return `${ms}ms`;
 } else if (ms < 60000) {
 return `${(ms / 1000).toFixed(1)}s`;
 } else if (ms < 3600000) {
 return `${(ms / 60000).toFixed(1)}m`;
 } else {
 return `${(ms / 3600000).toFixed(1)}h`;
 }
}

export const DelayNode = memo(function DelayNode({
 data,
 selected,
 isConnectable = true,
}: DelayNodeProps) {
 const config = data.config as {
 duration?: number;
 unit?: "ms" | "s" | "m" | "h";
 mode?: "fixed" | "random";
 minDuration?: number;
 maxDuration?: number;
 };

 const unit = config.unit || "s";
 const multiplier = {
 ms: 1,
 s: 1000,
 m: 60000,
 h: 3600000,
 }[unit];

 const duration = (config.duration || 1) * multiplier;
 const isRandom = config.mode === "random";

 const minDuration = (config.minDuration || 0) * multiplier;
 const maxDuration = (config.maxDuration || 10) * multiplier;

 return (
 <div
 className={cn(
 "min-w-[180px] rounded-lg border bg-surface-100 transition-all",
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
 <div className="flex items-center gap-2.5 border-b border-border/70 px-3 py-2.5 bg-surface-200">
 <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-300 text-foreground">
 <Timer className="h-4 w-4" />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-medium text-sm truncate">{data.label || "Latency"}</h3>
 <p className="text-xs text-foreground-muted">
 {isRandom ? "Random Delay" : "Fixed Delay"}
 </p>
 </div>
 </div>

 {/* Content */}
 <div className="px-3 py-2.5 space-y-2">
 {isRandom ? (
 <div className="flex items-center gap-2 p-2 rounded-md bg-surface-200">
 <Clock className="h-3.5 w-3.5 text-foreground-muted" />
 <span className="text-xs text-foreground-muted">Range:</span>
 <span className="font-mono text-sm font-medium">
 {formatDuration(minDuration)} - {formatDuration(maxDuration)}
 </span>
 </div>
 ) : (
 <div className="flex items-center gap-2 p-2 rounded-md bg-surface-200">
 <Clock className="h-3.5 w-3.5 text-foreground-muted" />
 <span className="text-xs text-foreground-muted">Latency:</span>
 <span className="font-mono text-base font-semibold">
 {formatDuration(duration)}
 </span>
 </div>
 )}

 <span
 className={cn(
 "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
 isRandom
 ? "bg-warning-200 text-warning"
 : "bg-surface-200 text-foreground-muted"
 )}
 >
 {isRandom ? <Shuffle className="h-3 w-3" /> : <Timer className="h-3 w-3" />}
 {isRandom ? "Random": "Fixed"}
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
