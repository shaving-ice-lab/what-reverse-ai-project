"use client";

/**
 * LLM Node - Manus Style
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface LLMNodeProps extends NodeProps {
 data: WorkflowNodeData;
 isConnectable?: boolean;
}

export const LLMNode = memo(function LLMNode({
 data,
 selected,
 isConnectable = true,
}: LLMNodeProps) {
 const config = data.config as {
 model?: string;
 systemPrompt?: string;
 temperature?: number;
 };

 return (
 <div
 className={cn(
 "min-w-[200px] rounded-lg transition-all",
 "bg-surface-100 border border-border",
 "shadow-[0_4px_6px_rgba(0,0,0,0.4)]",
 selected && "border-brand-500 shadow-[0_0_0_2px_rgba(62,207,142,0.28)]"
 )}
 >
 {/* InputPort */}
 <Handle
 id="input"
 type="target"
 position={Position.Left}
 isConnectable={isConnectable}
 className="w-[10px]! h-[10px]! border-2! border-background! rounded-full! top-[38px]! -left-[5px]! bg-border! hover:bg-brand-500!"
 />

 {/* Header - Manus Style */}
 <div className="flex items-center gap-2.5 px-3 py-2.5 bg-surface-100 border-b border-border/70 rounded-t-lg">
 <div className="w-7 h-7 rounded-md bg-brand-200/60 flex items-center justify-center">
 <Bot className="w-4 h-4 text-brand-500" />
 </div>
 <div className="flex-1 min-w-0">
 <span className="text-sm font-medium text-foreground">{data.label || "LLM Call"}</span>
 <p className="text-[11px] text-foreground-muted flex items-center gap-1">
 <Sparkles className="h-3 w-3" />
 {config.model || "gpt-4"}
 </p>
 </div>
 </div>

 {/* Content */}
 <div className="px-3 py-3 space-y-2 text-xs">
 {config.systemPrompt && (
 <div className="p-2 rounded-md bg-surface-200 leading-relaxed text-foreground">
 <span className="text-foreground-muted">System: </span>
 <span className="line-clamp-2">{config.systemPrompt}</span>
 </div>
 )}
 <div className="flex items-center gap-2">
 {config.temperature !== undefined && (
 <span className="inline-flex px-1.5 py-0.5 rounded bg-brand-200/60 text-brand-500 text-[11px]">
 T: {config.temperature}
 </span>
 )}
 </div>
 </div>

 {/* FooterPortIndicator */}
 <div className="flex justify-between px-3 py-2 border-t border-border text-[11px] text-foreground-muted">
 <span className="flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-border" />
 Input
 </span>
 <span className="flex items-center gap-1.5">
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
 className="w-[10px]! h-[10px]! border-2! border-background! rounded-full! top-[38px]! -right-[5px]! bg-brand-500! hover:bg-brand-600!"
 />
 </div>
 );
});
