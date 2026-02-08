"use client";

/**
 * Basic Node Component - Optimal Version
 * 
 * Features:
 * - Gradient Background Halo
 * - Smooth Float Animation
 * - Selected Status Glow Effect
 * - Port Pulse Animation
 */

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData, PortDefinition } from "@/types/workflow";

export interface BaseNodeProps extends NodeProps {
 data: WorkflowNodeData;
 isConnectable?: boolean;
}

// NodeTypeColor - Enhanced
export const nodeTypeColors = {
 ai: { 
 bg: "bg-brand-200/60", 
 icon: "text-brand-500", 
 border: "border-brand-500/40",
 glow: "shadow-brand-500/15",
 gradient: "from-brand-500/15 to-brand-600/5"
 },
 logic: { 
 bg: "bg-warning-200/70", 
 icon: "text-warning", 
 border: "border-warning/40",
 glow: "shadow-warning/15",
 gradient: "from-warning/15 to-warning/5"
 },
 data: { 
 bg: "bg-surface-200", 
 icon: "text-foreground-light", 
 border: "border-border",
 glow: "shadow-black/20",
 gradient: "from-surface-200/60 to-surface-100/20"
 },
 integration: { 
 bg: "bg-surface-200", 
 icon: "text-foreground-light", 
 border: "border-border",
 glow: "shadow-black/20",
 gradient: "from-surface-200/60 to-surface-100/20"
 },
 io: { 
 bg: "bg-destructive-200", 
 icon: "text-destructive", 
 border: "border-destructive/30",
 glow: "shadow-destructive/20",
 gradient: "from-destructive/20 to-destructive/5"
 },
 code: { 
 bg: "bg-surface-200", 
 icon: "text-foreground-light", 
 border: "border-border",
 glow: "shadow-black/20",
 gradient: "from-surface-200/60 to-surface-100/20"
 },
 flow: { 
 bg: "bg-brand-200/60", 
 icon: "text-brand-500", 
 border: "border-brand-500/40",
 glow: "shadow-brand-500/15",
 gradient: "from-brand-500/15 to-brand-600/5"
 },
 text: { 
 bg: "bg-surface-200", 
 icon: "text-foreground-light", 
 border: "border-border",
 glow: "shadow-black/20",
 gradient: "from-surface-200/60 to-surface-100/20"
 },
};

// Data Type Color and Style
const typeColors: Record<string, { bg: string; ring: string }> = {
 string: { bg: "!bg-brand-500", ring: "ring-brand-500/30" },
 number: { bg: "!bg-warning", ring: "ring-warning/30" },
 boolean: { bg: "!bg-surface-300", ring: "ring-border-strong/40" },
 object: { bg: "!bg-surface-300", ring: "ring-border-strong/40" },
 array: { bg: "!bg-surface-300", ring: "ring-border-strong/40" },
 any: { bg: "!bg-surface-300", ring: "ring-border-strong/40" },
};

// PortComponent - Enhanced
function Port({
 port,
 type,
 position,
 isConnectable,
 isHovered,
}: {
 port: PortDefinition;
 type: "source" | "target";
 position: Position;
 isConnectable?: boolean;
 isHovered?: boolean;
}) {
 const colors = typeColors[port.type] || typeColors.any;

 return (
 <div className={cn(
 "relative flex items-center gap-2 group/port",
 position === Position.Left ? "flex-row" : "flex-row-reverse"
 )}>
 <Handle
 id={port.id}
 type={type}
 position={position}
 isConnectable={isConnectable}
 className={cn(
 "w-3! h-3! border-2! border-background! rounded-full!",
 "transition-all! duration-200!",
 "hover:scale-125! hover:ring-4!",
 colors.bg,
 `hover:${colors.ring}`,
 isHovered && "scale-110!"
 )}
 />
 <span
 className={cn(
 "text-[11px] text-foreground-muted whitespace-nowrap transition-colors",
 "group-hover/port:text-foreground",
 position === Position.Left ? "ml-1" : "mr-1"
 )}
 >
 {port.name}
 {port.required && <span className="text-destructive ml-0.5">*</span>}
 </span>
 </div>
 );
}

export const BaseNode = memo(function BaseNode({
 data,
 selected,
 isConnectable = true,
}: BaseNodeProps) {
 const [isHovered, setIsHovered] = useState(false);
 const { label, icon, description, inputs = [], outputs = [], nodeColorType } = data;
 const colors = nodeTypeColors[nodeColorType as keyof typeof nodeTypeColors] || nodeTypeColors.code;

 return (
 <div
 className={cn(
 "relative min-w-[220px] rounded-xl transition-all duration-200",
 "bg-surface-100/95 backdrop-blur-sm",
 "border border-border/70",
 // DefaultShadow
 "shadow-lg shadow-black/20",
 // FloatEffect
 isHovered && !selected && [
 "border-border",
 "shadow-xl shadow-black/30",
 "-translate-y-0.5"
 ],
 // selectEffect
 selected && [
 "border-brand-500/60",
 "shadow-[0_0_20px_rgba(62,207,142,0.2)]",
 "ring-1 ring-brand-500/30"
 ]
 )}
 onMouseEnter={() => setIsHovered(true)}
 onMouseLeave={() => setIsHovered(false)}
 >
 {/* TopGradientDecorationline */}
 <div className={cn(
 "absolute top-0 left-4 right-4 h-[2px] rounded-full",
 "bg-linear-to-r",
 colors.gradient,
 "opacity-60",
 selected && "opacity-100"
 )} />

 {/* Header */}
 <div className={cn(
 "flex items-center gap-3 px-4 py-3",
 "bg-linear-to-b from-surface-100 to-transparent",
 "border-b border-border/70 rounded-t-xl"
 )}>
 {icon && (
 <div className={cn(
 "w-8 h-8 rounded-lg flex items-center justify-center",
 "transition-transform duration-200",
 colors.bg,
 isHovered && "scale-105"
 )}>
 <span className={cn(colors.icon, "text-base")}>{icon}</span>
 </div>
 )}
 <div className="flex-1 min-w-0">
 <span className="text-[13px] font-semibold text-foreground truncate block leading-tight">
 {label}
 </span>
 {description && (
 <span className="text-[10px] text-foreground-muted truncate block mt-0.5">
 {description}
 </span>
 )}
 </div>
 </div>

 {/* PortRegion */}
 <div className="px-4 py-3">
 <div className="flex justify-between gap-4">
 {/* Input Port */}
 <div className="flex flex-col gap-2">
 {inputs.map((input) => (
 <Port
 key={input.id}
 port={input}
 type="target"
 position={Position.Left}
 isConnectable={isConnectable}
 isHovered={isHovered}
 />
 ))}
 {inputs.length === 0 && (
 <span className="text-[10px] text-foreground-muted italic">No Input</span>
 )}
 </div>

 {/* OutputPort */}
 <div className="flex flex-col gap-2 items-end">
 {outputs.map((output) => (
 <Port
 key={output.id}
 port={output}
 type="source"
 position={Position.Right}
 isConnectable={isConnectable}
 isHovered={isHovered}
 />
 ))}
 {outputs.length === 0 && (
 <span className="text-[10px] text-foreground-muted italic">No Output</span>
 )}
 </div>
 </div>
 </div>

 {/* Footer Status Indicator - displayed when selected */}
 {selected && (
 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-brand-500/40" />
 )}
 </div>
 );
});
