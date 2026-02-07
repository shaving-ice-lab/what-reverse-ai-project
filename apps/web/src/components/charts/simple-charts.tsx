"use client";

/**
 * SimpleChartComponentCollection
 * CSS/SVG Implement'sDatacanvisualComponent
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";

// ============================================
// SimpleBar Chart
// ============================================

interface BarChartProps {
 data: { label: string; value: number; color?: string }[];
 height?: number;
 showLabels?: boolean;
 showValues?: boolean;
 animated?: boolean;
 className?: string;
}

export function SimpleBarChart({
 data,
 height = 200,
 showLabels = true,
 showValues = true,
 animated = true,
 className,
}: BarChartProps) {
 const maxValue = Math.max(...data.map((d) => d.value));

 return (
 <div className={cn("w-full", className)}>
 <div
 className="flex items-end justify-between gap-2"
 style={{ height }}
 >
 {data.map((item, index) => {
 const percentage = (item.value / maxValue) * 100;
 return (
 <div
 key={index}
 className="flex-1 flex flex-col items-center gap-2"
 >
 {showValues && (
 <span className="text-xs text-muted-foreground font-medium">
 {item.value.toLocaleString()}
 </span>
 )}
 <div
 className={cn(
 "w-full rounded-t-md transition-all duration-500",
 item.color || "bg-primary"
 )}
 style={{
 height: animated ? `${percentage}%` : 0,
 animationDelay: `${index * 50}ms`,
 }}
 />
 </div>
 );
 })}
 </div>
 {showLabels && (
 <div className="flex justify-between gap-2 mt-2">
 {data.map((item, index) => (
 <span
 key={index}
 className="flex-1 text-xs text-muted-foreground text-center truncate"
 >
 {item.label}
 </span>
 ))}
 </div>
 )}
 </div>
 );
}

// ============================================
// SimpleLine Chart(Usage SVG)
// ============================================

interface LineChartProps {
 data: { label: string; value: number }[];
 height?: number;
 strokeColor?: string;
 fillColor?: string;
 showDots?: boolean;
 showLabels?: boolean;
 showGrid?: boolean;
 className?: string;
}

export function SimpleLineChart({
 data,
 height = 200,
 strokeColor = "stroke-primary",
 fillColor = "fill-primary/10",
 showDots = true,
 showLabels = true,
 showGrid = true,
 className,
}: LineChartProps) {
 const maxValue = Math.max(...data.map((d) => d.value));
 const minValue = Math.min(...data.map((d) => d.value));
 const padding = 20;
 const chartHeight = height - (showLabels ? 30 : 0);

 const points = useMemo(() => {
 return data.map((item, index) => {
 const x = padding + (index / (data.length - 1)) * (100 - padding * 2);
 const y =
 chartHeight -
 padding -
 ((item.value - minValue) / (maxValue - minValue || 1)) * (chartHeight - padding * 2);
 return { x: `${x}%`, y, value: item.value, label: item.label };
 });
 }, [data, chartHeight, maxValue, minValue]);

 const pathD = useMemo(() => {
 if (points.length < 2) return "";
 return points
 .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
 .join("");
 }, [points]);

 const areaD = useMemo(() => {
 if (points.length < 2) return "";
 return `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;
 }, [pathD, points, chartHeight]);

 return (
 <div className={cn("w-full", className)}>
 <svg
 width="100%"
 height={height}
 viewBox={`0 0 100 ${height}`}
 preserveAspectRatio="none"
 className="overflow-visible"
 >
 {/* Gridline */}
 {showGrid && (
 <g className="stroke-border">
 {[0, 25, 50, 75, 100].map((y) => (
 <line
 key={y}
 x1={`${padding}%`}
 y1={padding + ((100 - y) / 100) * (chartHeight - padding * 2)}
 x2={`${100 - padding}%`}
 y2={padding + ((100 - y) / 100) * (chartHeight - padding * 2)}
 strokeDasharray="2,2"
 strokeWidth="0.5"
 />
 ))}
 </g>
 )}

 {/* FillRegion */}
 <path
 d={areaD}
 className={cn(fillColor, "transition-all duration-500")}
 />

 {/* line */}
 <path
 d={pathD}
 fill="none"
 className={cn(strokeColor, "transition-all duration-500")}
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 />

 {/* Data */}
 {showDots &&
 points.map((p, index) => (
 <g key={index}>
 <circle
 cx={p.x}
 cy={p.y}
 r="4"
 className={cn("fill-background", strokeColor)}
 strokeWidth="2"
 />
 </g>
 ))}
 </svg>

 {/* Tags */}
 {showLabels && (
 <div className="flex justify-between px-[20%]">
 {data.map((item, index) => (
 <span
 key={index}
 className="text-xs text-muted-foreground"
 >
 {item.label}
 </span>
 ))}
 </div>
 )}
 </div>
 );
}

// ============================================
// SimplePie Chart
// ============================================

interface PieChartProps {
 data: { label: string; value: number; color: string }[];
 size?: number;
 donut?: boolean;
 showLegend?: boolean;
 className?: string;
}

export function SimplePieChart({
 data,
 size = 160,
 donut = false,
 showLegend = true,
 className,
}: PieChartProps) {
 const total = data.reduce((sum, d) => sum + d.value, 0);
 const radius = size / 2;
 const innerRadius = donut ? radius * 0.6 : 0;

 const segments = useMemo(() => {
 let currentAngle = -90;
 return data.map((item) => {
 const angle = (item.value / total) * 360;
 const startAngle = currentAngle;
 const endAngle = currentAngle + angle;
 currentAngle = endAngle;

 const startRad = (startAngle * Math.PI) / 180;
 const endRad = (endAngle * Math.PI) / 180;

 const x1 = radius + radius * Math.cos(startRad);
 const y1 = radius + radius * Math.sin(startRad);
 const x2 = radius + radius * Math.cos(endRad);
 const y2 = radius + radius * Math.sin(endRad);

 const ix1 = radius + innerRadius * Math.cos(startRad);
 const iy1 = radius + innerRadius * Math.sin(startRad);
 const ix2 = radius + innerRadius * Math.cos(endRad);
 const iy2 = radius + innerRadius * Math.sin(endRad);

 const largeArc = angle > 180 ? 1 : 0;

 const d = donut
 ? `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`
 : `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

 return { ...item, d, percentage: (item.value / total) * 100 };
 });
 }, [data, total, radius, innerRadius, donut]);

 return (
 <div className={cn("flex items-center gap-6", className)}>
 <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
 {segments.map((segment, index) => (
 <path
 key={index}
 d={segment.d}
 className={cn(
 "transition-all duration-300 hover:opacity-80 fill-current",
 segment.color
 )}
 />
 ))}
 {donut && (
 <circle
 cx={radius}
 cy={radius}
 r={innerRadius - 5}
 className="fill-background"
 />
 )}
 </svg>

 {showLegend && (
 <div className="flex flex-col gap-2">
 {segments.map((segment, index) => (
 <div key={index} className="flex items-center gap-2">
 <span className={cn("w-3 h-3 rounded-full bg-current", segment.color)} />
 <span className="text-sm text-foreground">{segment.label}</span>
 <span className="text-xs text-muted-foreground">
 {segment.percentage.toFixed(1)}%
 </span>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

// ============================================
// Progress
// ============================================

interface ProgressRingProps {
 value: number;
 max?: number;
 size?: number;
 strokeWidth?: number;
 color?: string;
 trackColor?: string;
 showValue?: boolean;
 label?: string;
 className?: string;
}

export function ProgressRing({
 value,
 max = 100,
 size = 120,
 strokeWidth = 10,
 color = "stroke-primary",
 trackColor = "stroke-muted",
 showValue = true,
 label,
 className,
}: ProgressRingProps) {
 const radius = (size - strokeWidth) / 2;
 const circumference = radius * 2 * Math.PI;
 const percentage = Math.min((value / max) * 100, 100);
 const offset = circumference - (percentage / 100) * circumference;

 return (
 <div className={cn("relative inline-flex items-center justify-center", className)}>
 <svg width={size} height={size} className="-rotate-90">
 {/* BackgroundOrbit */}
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="none"
 className={trackColor}
 strokeWidth={strokeWidth}
 />
 {/* Progress */}
 <circle
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="none"
 className={cn(color, "transition-all duration-500")}
 strokeWidth={strokeWidth}
 strokeDasharray={circumference}
 strokeDashoffset={offset}
 strokeLinecap="round"
 />
 </svg>
 {showValue && (
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-2xl font-bold text-foreground">
 {percentage.toFixed(0)}%
 </span>
 {label && (
 <span className="text-xs text-muted-foreground">{label}</span>
 )}
 </div>
 )}
 </div>
 );
}

// ============================================
// youTrend(Sparkline)
// ============================================

interface SparklineProps {
 data: number[];
 width?: number;
 height?: number;
 color?: string;
 showDot?: boolean;
 className?: string;
}

export function Sparkline({
 data,
 width = 100,
 height = 30,
 color = "stroke-primary",
 showDot = true,
 className,
}: SparklineProps) {
 const maxValue = Math.max(...data);
 const minValue = Math.min(...data);
 const range = maxValue - minValue || 1;

 const points = data.map((value, index) => {
 const x = (index / (data.length - 1)) * width;
 const y = height - ((value - minValue) / range) * height;
 return `${x},${y}`;
 });

 const lastPoint = points[points.length - 1].split(",");

 return (
 <svg
 width={width}
 height={height}
 viewBox={`0 0 ${width} ${height}`}
 className={cn("overflow-visible", className)}
 >
 <polyline
 points={points.join("")}
 fill="none"
 className={color}
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 {showDot && (
 <circle
 cx={lastPoint[0]}
 cy={lastPoint[1]}
 r="3"
 className={cn("fill-background", color)}
 strokeWidth="2"
 />
 )}
 </svg>
 );
}

// ============================================
// countvalueforcompare
// ============================================

interface ComparisonBarProps {
 value1: number;
 value2: number;
 label1?: string;
 label2?: string;
 color1?: string;
 color2?: string;
 showValues?: boolean;
 className?: string;
}

export function ComparisonBar({
 value1,
 value2,
 label1 = "A",
 label2 = "B",
 color1 = "bg-primary",
 color2 = "bg-muted-foreground",
 showValues = true,
 className,
}: ComparisonBarProps) {
 const total = value1 + value2;
 const percentage1 = (value1 / total) * 100;
 const percentage2 = (value2 / total) * 100;

 return (
 <div className={cn("w-full", className)}>
 {showValues && (
 <div className="flex justify-between mb-2 text-sm">
 <span className="text-foreground">
 {label1}: <span className="font-medium">{value1.toLocaleString()}</span>
 </span>
 <span className="text-muted-foreground">
 {label2}: <span className="font-medium">{value2.toLocaleString()}</span>
 </span>
 </div>
 )}
 <div className="flex h-4 rounded-full overflow-hidden bg-muted">
 <div
 className={cn(color1, "transition-all duration-500")}
 style={{ width: `${percentage1}%` }}
 />
 <div
 className={cn(color2, "transition-all duration-500")}
 style={{ width: `${percentage2}%` }}
 />
 </div>
 <div className="flex justify-between mt-1 text-xs text-muted-foreground">
 <span>{percentage1.toFixed(1)}%</span>
 <span>{percentage2.toFixed(1)}%</span>
 </div>
 </div>
 );
}
