"use client";

/**
 * AnimationEdgeComponent
 *
 * Features: 
 * - ExecuteConnectionAnimation
 * - DataTransferBlink
 * - DataTypeColorDistinguish
 */

import { memo, useMemo } from "react";
import {
 EdgeProps,
 getBezierPath,
 EdgeLabelRenderer,
 BaseEdge,
} from "reactflow";
import { cn } from "@/lib/utils";

// ========== TypeDefinition ==========

export type EdgeStatus = "idle" | "running" | "completed" | "error";
export type DataType = "string" | "number" | "boolean" | "object" | "array" | "any";

export interface AnimatedEdgeData {
 /** EdgeStatus */
 status?: EdgeStatus;
 /** DataType */
 dataType?: DataType;
 /** Tags */
 label?: string;
 /** isnoDisplayAnimation */
 animated?: boolean;
 /** CustomColor */
 color?: string;
}

// DataTypeColorMapping
const DATA_TYPE_COLORS: Record<DataType, string> = {
 string: "var(--color-brand-500)",
 number: "var(--color-foreground-light)",
 boolean: "var(--color-warning)",
 object: "var(--color-brand-400)",
 array: "var(--color-brand-300)",
 any: "var(--color-foreground-muted)",
};

// StatusColorMapping
const STATUS_COLORS: Record<EdgeStatus, string> = {
 idle: "var(--color-border-strong)",
 running: "var(--color-brand-500)",
 completed: "var(--color-brand-500)",
 error: "var(--color-destructive)",
};

// ========== Component ==========

function AnimatedEdge({
 id,
 sourceX,
 sourceY,
 targetX,
 targetY,
 sourcePosition,
 targetPosition,
 style = {},
 data,
 markerEnd,
 selected,
}: EdgeProps<AnimatedEdgeData>) {
 const {
 status = "idle",
 dataType = "any",
 label,
 animated = false,
 color,
 } = data || {};

 // CalculatePath
 const [edgePath, labelX, labelY] = getBezierPath({
 sourceX,
 sourceY,
 sourcePosition,
 targetX,
 targetY,
 targetPosition,
 });

 // CalculateColor
 const edgeColor = useMemo(() => {
 if (color) return color;
 if (status === "running" || status === "completed" || status === "error") {
 return STATUS_COLORS[status];
 }
 return DATA_TYPE_COLORS[dataType];
 }, [color, status, dataType]);

 // isnoDisplayAnimation
 const showAnimation = animated || status === "running";

 // Animation ID
 const animationId = `flow-${id}`;
 const gradientId = `gradient-${id}`;
 const filterId = `glow-${id}`;

 return (
 <>
 {/* SVG Definition */}
 <defs>
 {/* GlowEffect */}
 <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
 <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
 <feMerge>
 <feMergeNode in="blur" />
 <feMergeNode in="SourceGraphic" />
 </feMerge>
 </filter>

 {/* GradientEffect */}
 {showAnimation && (
 <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
 <stop offset="0%" stopColor={edgeColor} stopOpacity="0.2" />
 <stop offset="50%" stopColor={edgeColor} stopOpacity="1">
 <animate
 attributeName="offset"
 values="0;1"
 dur="1.5s"
 repeatCount="indefinite"
 />
 </stop>
 <stop offset="100%" stopColor={edgeColor} stopOpacity="0.2" />
 </linearGradient>
 )}
 </defs>

 {/* Backgroundline(more, Used forClickRegion) */}
 <path
 d={edgePath}
 fill="none"
 strokeWidth={20}
 stroke="transparent"
 className="react-flow__edge-interaction"
 />

 {/* GlowBackground(Execute) */}
 {showAnimation && (
 <path
 d={edgePath}
 fill="none"
 strokeWidth={4}
 stroke={edgeColor}
 strokeOpacity={0.3}
 filter={`url(#${filterId})`}
 className="pointer-events-none"
 />
 )}

 {/* mainline */}
 <BaseEdge
 id={id}
 path={edgePath}
 markerEnd={markerEnd}
 style={{
 ...style,
 stroke: showAnimation ? `url(#${gradientId})` : edgeColor,
 strokeWidth: selected ? 2.5 : 2,
 strokeOpacity: status === "idle" ? 0.6 : 1,
 transition: "stroke 0.3s, stroke-width 0.2s",
 }}
 />

 {/* FlowAnimation */}
 {showAnimation && (
 <circle r="3" fill={edgeColor}>
 <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
 </circle>
 )}

 {/* DataAnimation(Transfer) */}
 {status === "running" && (
 <>
 <circle r="4" fill={edgeColor} opacity="0.8">
 <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
 </circle>
 <circle r="4" fill={edgeColor} opacity="0.5">
 <animateMotion
 dur="1s"
 repeatCount="indefinite"
 path={edgePath}
 begin="0.3s"
 />
 </circle>
 </>
 )}

 {/* Tags */}
 {label && (
 <EdgeLabelRenderer>
 <div
 className={cn(
 "absolute px-2 py-0.5 rounded text-[10px] font-medium",
 "bg-surface-100 border border-border",
 "pointer-events-none nodrag nopan",
 selected && "border-brand-500"
 )}
 style={{
 transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
 color: edgeColor,
 }}
 >
 {label}
 </div>
 </EdgeLabelRenderer>
 )}

 {/* DataTypeIndicator */}
 {dataType !== "any" && (
 <EdgeLabelRenderer>
 <div
 className="absolute pointer-events-none nodrag nopan"
 style={{
 transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 12}px)`,
 }}
 >
 <div
 className="w-2 h-2 rounded-full"
 style={{ backgroundColor: DATA_TYPE_COLORS[dataType] }}
 />
 </div>
 </EdgeLabelRenderer>
 )}
 </>
 );
}

export default memo(AnimatedEdge);

// ========== EdgeTypeSign Up ==========

export const animatedEdgeTypes = {
 animated: AnimatedEdge,
};
