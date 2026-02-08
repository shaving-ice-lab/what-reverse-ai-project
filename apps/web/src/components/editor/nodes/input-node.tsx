"use client";

/**
 * UserInputNode - Minimalist Style
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FormInput, Type, Hash, ToggleLeft, List, Asterisk } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface InputNodeProps extends NodeProps {
 data: WorkflowNodeData;
 isConnectable?: boolean;
}

const inputTypeIcons: Record<string, React.ReactNode> = {
 text: <Type className="h-3 w-3" />,
 number: <Hash className="h-3 w-3" />,
 boolean: <ToggleLeft className="h-3 w-3" />,
 select: <List className="h-3 w-3" />,
};

const inputTypeLabels: Record<string, string> = {
 text: "Text",
 number: "Number",
 boolean: "Toggle",
 select: "Select",
 textarea: "Text",
 password: "Password",
 email: "Email",
 url: "Link",
};

export const InputNode = memo(function InputNode({
 data,
 selected,
 isConnectable = true,
}: InputNodeProps) {
 const config = data.config as {
 inputType?: string;
 name?: string;
 label?: string;
 placeholder?: string;
 defaultValue?: string | number | boolean;
 required?: boolean;
 options?: Array<{ label: string; value: string }>;
 validation?: {
 min?: number;
 max?: number;
 pattern?: string;
 };
 };

 const inputType = config.inputType || "text";
 const inputName = config.name || "input";
 const inputLabel = config.label || "User Input";

 return (
 <div
 className={cn(
 "min-w-[200px] rounded-lg border bg-surface-100 transition-all",
 selected
 ? "border-brand-500 shadow-md shadow-brand-500/10"
 : "border-border hover:border-brand-500/40"
 )}
 >
 {/* Header */}
 <div className="flex items-center gap-2.5 border-b border-border/70 px-3 py-2.5 bg-brand-200/30">
 <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-background">
 <FormInput className="h-4 w-4" />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-medium text-sm truncate">{data.label || "User Input"}</h3>
 <p className="text-xs text-foreground-muted flex items-center gap-1">
 {inputTypeIcons[inputType]}
 {inputTypeLabels[inputType] || inputType}
 </p>
 </div>
 </div>

 {/* Content */}
 <div className="px-3 py-2.5 space-y-2 text-xs">
 <div className="flex items-center gap-2">
 <span className="text-foreground-muted">Field:</span>
 <span className="font-mono px-1.5 py-0.5 rounded bg-surface-200">
 {inputName}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-foreground-muted">Tags:</span>
 <span>{inputLabel}</span>
 </div>
 {config.required && (
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-destructive bg-destructive-200">
 <Asterisk className="h-3 w-3" />
 Required
 </span>
 )}
 {config.defaultValue !== undefined && (
 <div className="flex items-center gap-2">
 <span className="text-foreground-muted">Default:</span>
 <span className="font-mono px-1.5 py-0.5 rounded bg-brand-200/60 text-brand-500 truncate max-w-[100px]">
 {String(config.defaultValue)}
 </span>
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="flex justify-end px-3 py-2 border-t border-border text-xs text-foreground-muted bg-surface-200">
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
