"use client";

/**
 * TextSplit/andNode - Minimalist Style
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { SplitSquareHorizontal, Combine, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface TextSplitNodeProps extends NodeProps {
 data: WorkflowNodeData;
 isConnectable?: boolean;
}

const modeLabels: Record<string, string> = {
 split: "SplitText",
 join: "andText",
 splitLines: "byrowSplit",
 splitParagraphs: "byParagraphSplit",
 chunk: "block",
};

export const TextSplitNode = memo(function TextSplitNode({
 data,
 selected,
 isConnectable = true,
}: TextSplitNodeProps) {
 const config = data.config as {
 mode?: string;
 separator?: string;
 joinSeparator?: string;
 chunkSize?: number;
 chunkOverlap?: number;
 keepEmpty?: boolean;
 trim?: boolean;
 };

 const mode = config.mode || "split";
 const isSplit = mode !== "join";

 return (
 <div
 className={cn(
 "min-w-[200px] rounded-lg border bg-surface-100 transition-all",
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
 {isSplit ? <SplitSquareHorizontal className="h-4 w-4" /> : <Combine className="h-4 w-4" />}
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-medium text-sm truncate">
 {data.label || (isSplit ? "TextSplit": "Textand")}
 </h3>
 <p className="text-xs text-foreground-muted flex items-center gap-1">
 <Scissors className="h-3 w-3" />
 {modeLabels[mode] || mode}
 </p>
 </div>
 </div>

 {/* Content */}
 <div className="px-3 py-2.5 space-y-2 text-xs">
 {mode === "split" && config.separator && (
 <div className="flex items-center gap-2">
 <span className="text-foreground-muted">Delimiter:</span>
 <span className="font-mono px-1.5 py-0.5 rounded bg-brand-200/60 text-brand-500">
 {config.separator === "\n" ? "\\n" : config.separator === "\t" ? "\\t" : `"${config.separator}"`}
 </span>
 </div>
 )}
 {mode === "join" && config.joinSeparator && (
 <div className="flex items-center gap-2">
 <span className="text-foreground-muted">Connect:</span>
 <span className="font-mono px-1.5 py-0.5 rounded bg-brand-200/60 text-brand-500">
 {config.joinSeparator === "\n" ? "\\n" : `"${config.joinSeparator}"`}
 </span>
 </div>
 )}
 {mode === "chunk" && (
 <div className="space-y-1.5 p-2 rounded-md bg-surface-200">
 <div className="flex items-center gap-2">
 <span className="text-foreground-muted">blockSize:</span>
 <span className="font-mono px-1.5 py-0.5 rounded bg-brand-200/60 text-brand-500">
 {config.chunkSize || 1000}
 </span>
 </div>
 {config.chunkOverlap !== undefined && (
 <div className="flex items-center gap-2">
 <span className="text-foreground-muted">re-:</span>
 <span className="font-mono">{config.chunkOverlap}</span>
 </div>
 )}
 </div>
 )}
 {config.trim && (
 <span className="inline-flex px-1.5 py-0.5 rounded bg-surface-200 text-foreground-muted">
 goEmpty
 </span>
 )}
 </div>

 {/* Footer */}
 <div className="flex justify-between px-3 py-2 border-t border-border text-xs text-foreground-muted bg-surface-200">
 <span className="flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
 {isSplit ? "Text": "countgroup"}
 </span>
 <span className="flex items-center gap-1">
 {isSplit ? "countgroup": "Text"}
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
