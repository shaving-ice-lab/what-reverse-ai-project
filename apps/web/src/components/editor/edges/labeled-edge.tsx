"use client";

/**
 * 带标签的自定义边 - 优化版
 * 
 * 特性:
 * - 渐变色连接线
 * - 平滑动画效果
 * - 悬浮高亮
 * - 选中状态发光
 */

import { memo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import { X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LabeledEdgeData {
  label?: string;
  sourcePortName?: string;
  targetPortName?: string;
  animated?: boolean;
}

export type LabeledEdgeType = Edge<LabeledEdgeData, "labeled">;

// 边的基础样式
const edgeColors = {
  default: "var(--color-border)",
  hover: "var(--color-border-strong)",
  selected: "var(--color-brand-500)",
  success: "var(--color-brand-500)",
  error: "var(--color-destructive)",
};

export const LabeledEdge = memo(function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps<LabeledEdgeType>) {
  const [isHovered, setIsHovered] = useState(false);
  
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const label = data?.label || data?.sourcePortName;
  const strokeColor = selected ? edgeColors.selected : isHovered ? edgeColors.hover : edgeColors.default;

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 透明的宽路径用于更容易的交互 */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: "pointer" }}
      />
      
      {/* 选中/悬浮时的发光效果 */}
      {(selected || isHovered) && (
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={8}
          strokeOpacity={0.15}
          className="transition-all duration-200"
        />
      )}
      
      {/* 主边线 */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: selected ? 2.5 : isHovered ? 2 : 1.5,
          transition: "stroke 0.2s, stroke-width 0.2s",
        }}
      />
      
      {/* 动画流动效果 - 选中时显示 */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke={edgeColors.selected}
          strokeWidth={2}
          strokeDasharray="8 4"
          className="animate-[edge-flow_1s_linear_infinite]"
          style={{ strokeLinecap: "round" }}
        />
      )}

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium",
              "bg-surface-100 border border-border",
              "shadow-lg shadow-black/20",
              "transition-all duration-200",
              "flex items-center gap-1.5",
              selected && "border-brand-500/40 bg-brand-200/40 text-brand-500",
              isHovered && !selected && "border-border bg-surface-100"
            )}
          >
            <ArrowRight className="w-3 h-3 opacity-50" />
            <span className="text-foreground">{label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
});

export const DeletableEdge = memo(function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps<LabeledEdgeType>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    import("@/stores/useWorkflowStore").then(({ useWorkflowStore }) => {
      useWorkflowStore.getState().removeEdges([id]);
    });
  };

  return (
    <>
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke="var(--color-foreground)"
          strokeWidth={6}
          className="opacity-10"
        />
      )}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? "var(--color-foreground)" : "var(--color-border)",
          strokeWidth: selected ? 2 : 1.5,
        }}
        className="transition-all"
      />

      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <button
              onClick={onDelete}
              className={cn(
                "flex items-center justify-center",
                "w-5 h-5 rounded",
                "bg-destructive text-destructive-foreground",
                "hover:bg-destructive/80 transition-colors"
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

export const AnimatedEdge = memo(function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps<LabeledEdgeType>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={1.5}
      />
      <path
        d={edgePath}
        fill="none"
        stroke={selected ? "var(--color-success)" : "var(--color-success)"}
        strokeWidth={selected ? 2 : 1.5}
        strokeDasharray="6 4"
        className="edge-animated"
        markerEnd={markerEnd as string}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
            }}
            className="px-2 py-0.5 rounded text-xs font-medium bg-brand-200 text-brand-500 border border-brand-500/30"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

export const ExecutingEdge = memo(function ExecutingEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        stroke="var(--color-foreground)"
        strokeWidth={6}
        className="opacity-10"
      />
      <path
        d={edgePath}
        fill="none"
        stroke="var(--color-foreground)"
        strokeWidth={2}
        strokeDasharray="6 3"
        className="edge-executing"
        markerEnd={markerEnd as string}
      />
    </>
  );
});

export const ConditionalEdge = memo(function ConditionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const isTrue = sourceHandleId === "true";
  const label = isTrue ? "True" : "False";
  const color = isTrue ? edgeColors.success : edgeColors.error;
  const activeColor = color;

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 透明交互层 */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: "pointer" }}
      />
      
      {/* 发光效果 */}
      {(selected || isHovered) && (
        <path
          d={edgePath}
          fill="none"
          stroke={activeColor}
          strokeWidth={8}
          strokeOpacity={0.2}
          className="transition-all duration-200"
        />
      )}
      
      {/* 主边线 */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected || isHovered ? activeColor : edgeColors.default,
          strokeWidth: selected ? 2.5 : isHovered ? 2 : 1.5,
          transition: "stroke 0.2s, stroke-width 0.2s",
        }}
      />

      {/* 标签 */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "none",
          }}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[11px] font-semibold",
            "shadow-lg transition-all duration-200",
            isTrue
              ? "bg-brand-200/50 text-brand-500 border border-brand-500/30 shadow-brand-500/10"
              : "bg-destructive-200 text-destructive border border-destructive/30 shadow-destructive/10",
            (selected || isHovered) && isTrue && "bg-brand-200/70 border-brand-500/50",
            (selected || isHovered) && !isTrue && "bg-destructive-200/70 border-destructive/50"
          )}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </g>
  );
});
