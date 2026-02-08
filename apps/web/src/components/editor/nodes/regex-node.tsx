"use client";

/**
 * Currently Then Extract Node - Minimalist Style
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Regex, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface RegexNodeProps extends NodeProps {
 data: WorkflowNodeData;
 isConnectable?: boolean;
}

export const RegexNode = memo(function RegexNode({
 data,
 selected,
 isConnectable = true,
}: RegexNodeProps) {
 const config = data.config as {
 pattern?: string;
 flags?: string;
 extractMode?: "first" | "all" | "groups" | "test";
 groupNames?: string[];
 };

 const pattern = config.pattern || "";
 const flags = config.flags || "g";
 const extractMode = config.extractMode || "all";

 const modeLabels: Record<string, string> = {
 first: "Match",
 all: "All Matches",
    groups: "Group Extract",
    test: "Test Match",
 };

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
 <Regex className="h-4 w-4" />
 </div>
 <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{data.label || "Currently Then Extract"}</h3>
 <p className="text-xs text-foreground-muted flex items-center gap-1">
 <Search className="h-3 w-3" />
 {modeLabels[extractMode]}
 </p>
 </div>
 </div>

        {/* Currently Then Expression Preview */}
 <div className="px-3 py-2.5 space-y-2 text-xs">
 {pattern ? (
 <div className="font-mono p-2 rounded-md bg-surface-200 overflow-hidden">
 <span className="text-brand-500">/</span>
 <span className="truncate">{pattern}</span>
 <span className="text-brand-500">/{flags}</span>
 </div>
 ) : (
 <div className="text-foreground-muted p-2 rounded-md bg-surface-200 border border-dashed border-border">
          Please enter currently then expression...
 </div>
 )}
 {config.groupNames && config.groupNames.length > 0 && (
 <div className="flex items-center gap-2">
 <span className="text-foreground-muted">Group:</span>
 <div className="flex flex-wrap gap-1">
 {config.groupNames.map((name, i) => (
 <span key={i} className="px-1.5 py-0.5 rounded font-mono bg-brand-200/60 text-brand-500">
 {name}
 </span>
 ))}
 </div>
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
