"use client";

/**
 * CodeNode - Minimalist Style
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Code2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface CodeNodeProps extends NodeProps {
 data: WorkflowNodeData;
 isConnectable?: boolean;
}

export const CodeNode = memo(function CodeNode({
 data,
 selected,
 isConnectable = true,
}: CodeNodeProps) {
 const config = data.config as {
 code?: string;
 language?: string;
 };

 const codePreview = config.code
 ? config.code.split("\n").slice(0, 3).join("\n")
: "// WriteCode...";

 return (
 <div
 className={cn(
 "min-w-[220px] rounded-lg border bg-surface-100 transition-all",
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
 <Code2 className="h-4 w-4" />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-medium text-sm truncate">{data.label || "Code"}</h3>
 <p className="text-xs text-foreground-muted flex items-center gap-1">
 <Terminal className="h-3 w-3" />
 {config.language || "JavaScript"}
 </p>
 </div>
 </div>

 {/* CodePreview */}
 <div className="px-3 py-2.5">
 <pre className="text-xs font-mono text-foreground-muted p-2 rounded-md bg-surface-200 overflow-hidden">
 <code className="line-clamp-3">{codePreview}</code>
 </pre>
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
