"use client";

/**
 * Admin Chart Styles & Color System
 * Unified visual style for all charts, consistent with Supabase design system
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================
// Chart color system
// ============================================

export const CHART_COLORS = {
  // Primary series - brand green gradient
  primary: {
    solid: "#3ECF8E",
    light: "#5fd9a3",
    dark: "#2a6348",
    gradient: ["#3ECF8E", "#5fd9a3"],
    area: "rgba(62, 207, 142, 0.2)",
  },
  // Secondary series - blue
  secondary: {
    solid: "#3b82f6",
    light: "#60a5fa",
    dark: "#1d4ed8",
    gradient: ["#3b82f6", "#60a5fa"],
    area: "rgba(59, 130, 246, 0.2)",
  },
  // Third series - purple
  tertiary: {
    solid: "#8b5cf6",
    light: "#a78bfa",
    dark: "#6d28d9",
    gradient: ["#8b5cf6", "#a78bfa"],
    area: "rgba(139, 92, 246, 0.2)",
  },
  // Fourth series - orange
  quaternary: {
    solid: "#f59e0b",
    light: "#fbbf24",
    dark: "#d97706",
    gradient: ["#f59e0b", "#fbbf24"],
    area: "rgba(245, 158, 11, 0.2)",
  },
  // Semantic colors
  success: {
    solid: "#3ECF8E",
    light: "#5fd9a3",
    dark: "#2a6348",
    area: "rgba(62, 207, 142, 0.2)",
  },
  warning: {
    solid: "#f59e0b",
    light: "#fbbf24",
    dark: "#d97706",
    area: "rgba(245, 158, 11, 0.2)",
  },
  error: {
    solid: "#ef4444",
    light: "#f87171",
    dark: "#dc2626",
    area: "rgba(239, 68, 68, 0.2)",
  },
  // Neutral colors
  neutral: {
    solid: "#6b7280",
    light: "#9ca3af",
    dark: "#4b5563",
    area: "rgba(107, 114, 128, 0.2)",
  },
} as const;

// Palette - for multi-series charts
export const CHART_PALETTE = [
  CHART_COLORS.primary.solid,
  CHART_COLORS.secondary.solid,
  CHART_COLORS.tertiary.solid,
  CHART_COLORS.quaternary.solid,
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
];

// ============================================
// Chart base style configuration
// ============================================

export const CHART_THEME = {
  // Background color
  background: "transparent",
  // Text color
  text: {
    primary: "#ededed",
    secondary: "#b0b0b0",
    muted: "#7a7a7a",
  },
  // Grid lines
  grid: {
    color: "#2a2a2a",
    strokeWidth: 1,
  },
  // Axis lines
  axis: {
    color: "#2a2a2a",
    strokeWidth: 1,
    tickSize: 4,
    tickColor: "#7a7a7a",
  },
  // Legend
  legend: {
    fontSize: 11,
    fontWeight: 500,
    color: "#b0b0b0",
  },
  // Tooltip
  tooltip: {
    background: "#1f1f1f",
    border: "#2a2a2a",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
    color: "#ededed",
    shadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  },
  // Animation
  animation: {
    duration: 300,
    easing: "ease-out",
  },
} as const;

// ============================================
// Chart size presets
// ============================================

export const CHART_SIZES = {
  xs: { width: 200, height: 100 },
  sm: { width: 300, height: 150 },
  md: { width: 400, height: 200 },
  lg: { width: 600, height: 300 },
  xl: { width: 800, height: 400 },
  full: { width: "100%", height: 300 },
} as const;

// ============================================
// Simple chart component - mini sparkline
// ============================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = CHART_COLORS.primary.solid,
  showArea = true,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - ((value - min) / range) * height * 0.8 - height * 0.1,
  }));

  const pathD = points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    )
    .join(" ");

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
    >
      {showArea && (
        <path
          d={areaD}
          fill={color}
          fillOpacity={0.15}
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2}
        fill={color}
      />
    </svg>
  );
}

// ============================================
// Simple chart component - mini bar chart
// ============================================

interface MiniBarChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  gap?: number;
  className?: string;
}

export function MiniBarChart({
  data,
  width = 80,
  height = 24,
  color = CHART_COLORS.primary.solid,
  gap = 2,
  className,
}: MiniBarChartProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
    >
      {data.map((value, index) => {
        const barHeight = (value / max) * height * 0.9;
        return (
          <rect
            key={index}
            x={index * (barWidth + gap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            fill={color}
            fillOpacity={0.8}
            rx={1}
          />
        );
      })}
    </svg>
  );
}

// ============================================
// Simple chart component - progress ring
// ============================================

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  className?: string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  color = CHART_COLORS.primary.solid,
  bgColor = "#2a2a2a",
  showLabel = true,
  className,
}: ProgressRingProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-[10px] font-medium text-foreground">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

// ============================================
// Chart legend component
// ============================================

interface ChartLegendItem {
  label: string;
  color: string;
  value?: string | number;
}

interface ChartLegendProps {
  items: ChartLegendItem[];
  direction?: "horizontal" | "vertical";
  className?: string;
}

export function ChartLegend({
  items,
  direction = "horizontal",
  className,
}: ChartLegendProps) {
  return (
    <div
      className={cn(
        "flex gap-4",
        direction === "vertical" ? "flex-col gap-2" : "flex-wrap",
        className
      )}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[11px] text-foreground-light">{item.label}</span>
          {item.value !== undefined && (
            <span className="text-[11px] font-medium text-foreground">
              {item.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Chart tooltip component
// ============================================

interface ChartTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  title?: string;
  items: { label: string; value: string | number; color?: string }[];
  className?: string;
}

export function ChartTooltip({
  visible,
  x,
  y,
  title,
  items,
  className,
}: ChartTooltipProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "absolute z-50 pointer-events-none",
        "bg-surface-100 border border-border rounded-md shadow-lg",
        "px-3 py-2 min-w-[120px]",
        "animate-fade-in",
        className
      )}
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -100%)",
      }}
    >
      {title && (
        <div className="text-[10px] text-foreground-muted mb-1.5">{title}</div>
      )}
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {item.color && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-[11px] text-foreground-light">
                {item.label}
              </span>
            </div>
            <span className="text-[11px] font-medium text-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Chart container component
// ============================================

interface ChartContainerProps {
  title?: string;
  description?: string;
  legend?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export function ChartContainer({
  title,
  description,
  legend,
  actions,
  children,
  className,
  loading = false,
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        "bg-surface-100 border border-border rounded-lg p-4",
        className
      )}
    >
      {/* Header */}
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h3 className="text-[13px] font-medium text-foreground">{title}</h3>
            )}
            {description && (
              <p className="text-[11px] text-foreground-muted mt-0.5">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Chart content */}
      <div className="relative">
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-pulse text-[11px] text-foreground-muted">
              Loading...
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Legend */}
      {legend && <div className="mt-4 pt-3 border-t border-border">{legend}</div>}
    </div>
  );
}

// ============================================
// Stat change indicator
// ============================================

interface StatChangeProps {
  value: number;
  suffix?: string;
  positive?: "up" | "down" | "auto";
  showIcon?: boolean;
  className?: string;
}

export function StatChange({
  value,
  suffix = "%",
  positive = "auto",
  showIcon = true,
  className,
}: StatChangeProps) {
  const isPositive =
    positive === "auto" ? value > 0 : positive === "up" ? value > 0 : value < 0;
  const displayValue = Math.abs(value);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium",
        isPositive ? "text-success" : "text-destructive",
        className
      )}
    >
      {showIcon && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          className={cn(!isPositive && "rotate-180")}
        >
          <path d="M6 3L10 7H2L6 3Z" />
        </svg>
      )}
      {value > 0 && "+"}
      {displayValue}
      {suffix}
    </span>
  );
}

