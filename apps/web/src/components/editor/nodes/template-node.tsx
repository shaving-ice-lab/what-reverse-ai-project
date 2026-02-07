"use client";

/**
 * TemplateNode - Minimalist Style
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileText, Braces } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface TemplateNodeProps extends NodeProps {
 data: WorkflowNodeData;
 isConnectable?: boolean;
}

export const TemplateNode = memo(function TemplateNode({
 data,
 selected,
 isConnectable = true,
}: TemplateNodeProps) {
 const config = data.config as {
 template?: string;
 };

 const templatePreview = config.template
 ? config.template.substring(0, 80)
: "InputTemplateContent...";

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
 <FileText className="h-4 w-4" />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-medium text-sm truncate">{data.label || "TextTemplate"}</h3>
 <p className="text-xs text-foreground-muted flex items-center gap-1">
 <Braces className="h-3 w-3" />
 TemplateRender
 </p>
 </div>
 </div>

 {/* TemplatePreview */}
 <div className="px-3 py-2.5">
 <p className="text-xs text-foreground-muted line-clamp-2 p-2 rounded-md bg-surface-200">
 {templatePreview}
 </p>
 </div>

 {/* Footer */}
 <div className="flex justify-between px-3 py-2 border-t border-border text-xs text-foreground-muted bg-surface-200">
 <span className="flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
 Variable
 </span>
 <span className="flex items-center gap-1">
 Text
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
