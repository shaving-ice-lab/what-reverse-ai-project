"use client";

/**
 * Execution Trend Chart Component
 * 
 * Supports line chart / area chart toggle, time range selection, and hover detail display
 * Uses real API data
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
 TrendingUp,
 TrendingDown,
 BarChart2,
 LineChart,
 AreaChart,
 Calendar,
 Loader2,
 RefreshCw,
} from "lucide-react";
import { statsApi } from "@/lib/api";
import type { DailyStats } from "@/types/stats";

type ChartType = "line" | "area";
type TimeRange = "7d" | "30d" | "90d";

interface DataPoint {
 date: string;
 label: string;
 current: number;
 success: number;
 failed: number;
}

interface ExecutionTrendChartProps {
 className?: string;
}

export function ExecutionTrendChart({ className }: ExecutionTrendChartProps) {
 const [chartType, setChartType] = useState<ChartType>("area");
 const [timeRange, setTimeRange] = useState<TimeRange>("7d");
 const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
 const [data, setData] = useState<DataPoint[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 const timeRangeConfig = {
 "7d": { label: "7 days", days: 7 },
 "30d": { label: "30 days", days: 30 },
 "90d": { label: "90 days", days: 90 },
 };

 // Load data
 const loadData = useCallback(async () => {
 setIsLoading(true);
 setError(null);
 
 try {
 const response = await statsApi.getExecutionTrends(timeRangeConfig[timeRange].days);
 const trends = response.data || [];
 
 // Convert to chart data format
 const chartData: DataPoint[] = trends.map((t: DailyStats) => {
 const date = new Date(t.date);
 return {
 date: t.date,
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
 current: t.executions,
 success: t.successful_runs,
 failed: t.failed_runs,
 };
 });
 
 setData(chartData);
 } catch (err) {
 console.error("Failed to load execution trend:", err);
 setError(err instanceof Error ? err.message : "Failed to load trend data");
 // Use empty data as fallback
 setData([]);
 } finally {
 setIsLoading(false);
 }
 }, [timeRange]);

 // Load data on mount and when time range changes
 useEffect(() => {
 loadData();
 }, [loadData]);

 // Calculate statistics data
 const stats = useMemo(() => {
 if (data.length === 0) {
 return { total: 0, change: 0, successRate: 0 };
 }
 
 const totalCurrent = data.reduce((sum, d) => sum + d.current, 0);
 const totalSuccess = data.reduce((sum, d) => sum + d.success, 0);
 const successRate = totalCurrent > 0 ? ((totalSuccess / totalCurrent) * 100) : 0;
 
 // Calculate change by comparing first half vs second half
 const midPoint = Math.floor(data.length / 2);
 const firstHalf = data.slice(0, midPoint).reduce((sum, d) => sum + d.current, 0);
 const secondHalf = data.slice(midPoint).reduce((sum, d) => sum + d.current, 0);
 const change = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100) : 0;
 
 return {
 total: totalCurrent,
 change: parseFloat(change.toFixed(1)),
 successRate: parseFloat(successRate.toFixed(1)),
 };
 }, [data]);

 const maxValue = useMemo(() => {
 if (data.length === 0) return 100;
 return Math.max(...data.map(d => d.current), 1);
 }, [data]);
 
 // Display Data Count
 const displayData = useMemo(() => {
 if (data.length === 0) return [];
 if (timeRange === "7d") return data;
 const displayPoints = Math.min(data.length, 15);
 return data.filter((_, i) => i % Math.ceil(data.length / displayPoints) === 0);
 }, [data, timeRange]);

 // Generate SVG Path
 const generatePath = (points: number[], type: "line" | "area") => {
 if (points.length === 0) return "";
 
 const width = 100;
 const height = 100;
 const padding = 5;
 
 const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
 const yScale = maxValue > 0 ? (height - padding * 2) / maxValue : 1;
 
 const pathPoints = points.map((value, index) => {
 const x = padding + index * xStep;
 const y = height - padding - value * yScale;
 return `${x},${y}`;
 });
 
 if (type === "line") {
 return `M ${pathPoints.join(" L ")}`;
 } else {
 // Area chart fill path
 const firstX = padding;
 const lastX = padding + (points.length - 1) * xStep;
 return `M ${firstX},${height - padding} L ${pathPoints.join(" L ")} L ${lastX},${height - padding} Z`;
 }
 };

 const currentPath = generatePath(displayData.map(d => d.current), chartType);

 return (
 <Card className={cn("border border-border/60 bg-card/80 backdrop-blur-sm p-6 hover:border-primary/20 transition-colors duration-300", className)}>
 {/* Header */}
 <div className="flex items-start justify-between mb-6">
 <div className="space-y-1">
 <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
 <div className="p-1.5 rounded-lg bg-primary/10 ring-1 ring-primary/20">
 <BarChart2 className="w-4 h-4 text-primary" />
 </div>
            Execution Trend
 </h3>
 {isLoading ? (
 <div className="h-8 w-24 bg-muted rounded animate-pulse" />
 ) : (
 <div className="flex items-center gap-4">
 <span className="text-2xl font-bold text-foreground">
 {stats.total.toLocaleString()}
 </span>
 {stats.change !== 0 && (
 <div className={cn(
 "flex items-center gap-1 text-sm font-medium",
 stats.change >= 0 ? "text-primary" : "text-red-500"
 )}>
 {stats.change >= 0 ? (
 <TrendingUp className="w-4 h-4" />
 ) : (
 <TrendingDown className="w-4 h-4" />
 )}
 {stats.change >= 0 ? "+" : ""}{stats.change}%
 </div>
 )}
 </div>
 )}
 <p className="text-sm text-muted-foreground">
 Success Rate {stats.successRate}%
 </p>
 </div>
 
 {/* Control - Enhanced */}
 <div className="flex items-center gap-2">
 {/* Refresh Button */}
 <button
 onClick={loadData}
 disabled={isLoading}
 className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
 >
 <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
 </button>
 
 {/* Chart Type Switch */}
 <div className="flex items-center bg-muted/50 rounded-xl p-1 ring-1 ring-border/30">
 <button
 onClick={() => setChartType("line")}
 className={cn(
 "p-2 rounded-lg transition-all duration-200",
 chartType === "line" 
 ? "bg-primary text-white shadow-sm shadow-primary/30" 
 : "text-muted-foreground hover:text-foreground hover:bg-muted"
 )}
 title="Line Chart"
 >
 <LineChart className="w-4 h-4" />
 </button>
 <button
 onClick={() => setChartType("area")}
 className={cn(
 "p-2 rounded-lg transition-all duration-200",
 chartType === "area" 
 ? "bg-primary text-white shadow-sm shadow-primary/30" 
 : "text-muted-foreground hover:text-foreground hover:bg-muted"
 )}
 title="Area Chart"
 >
 <AreaChart className="w-4 h-4" />
 </button>
 </div>
 
 {/* Time Range Select */}
 <div className="flex items-center bg-muted/50 rounded-xl p-1 ring-1 ring-border/30">
 {(Object.keys(timeRangeConfig) as TimeRange[]).map((range) => (
 <button
 key={range}
 onClick={() => setTimeRange(range)}
 className={cn(
 "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200",
 timeRange === range 
 ? "bg-card text-foreground shadow-sm ring-1 ring-border/50" 
 : "text-muted-foreground hover:text-foreground hover:bg-muted"
 )}
 >
 {timeRangeConfig[range].label}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Chart Region */}
 <div 
 className="relative h-48"
 onMouseLeave={() => setHoveredIndex(null)}
 >
 {isLoading ? (
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 ring-1 ring-primary/20">
 <Loader2 className="w-7 h-7 animate-spin text-primary" />
 </div>
 <p className="text-sm text-muted-foreground">Loading trend data...</p>
 </div>
 ) : error ? (
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-3 ring-1 ring-red-500/20">
 <TrendingDown className="w-7 h-7 text-red-500" />
 </div>
 <p className="text-sm font-medium text-foreground mb-1">Failed to Load Chart</p>
 <p className="text-xs text-muted-foreground mb-3">{error}</p>
 <button 
 onClick={loadData}
 className="text-sm text-primary hover:text-primary/90 font-medium px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all"
 >
 Retry
 </button>
 </div>
 ) : displayData.length === 0 ? (
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3 ring-1 ring-border/50">
 <BarChart2 className="w-7 h-7 text-muted-foreground" />
 </div>
 <p className="text-sm font-medium text-foreground">No data available</p>
 <p className="text-xs text-muted-foreground mt-1">Run workflows to see trend here</p>
 </div>
 ) : (
 <>
 {/* SVG Chart */}
 <svg 
 viewBox="0 0 100 100" 
 className="w-full h-full"
 preserveAspectRatio="none"
 >
 {/* Grid Lines */}
 <defs>
 <pattern id="grid" width="10" height="20" patternUnits="userSpaceOnUse">
 <path d="M 10 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-border" />
 </pattern>
 </defs>
 <rect width="100" height="100" fill="url(#grid)" opacity="0.5" />
 
 {/* Current Data */}
 {currentPath && (
 <path
 d={currentPath}
 fill={chartType === "area" ? "rgba(62, 207, 142, 0.2)" : "none"}
 stroke="currentColor"
 className="text-primary"
 strokeWidth="0.8"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 )}
 
 {/* Data Points */}
 {displayData.map((point, index) => {
 const x = 5 + (displayData.length > 1 ? index * ((100 - 10) / (displayData.length - 1)) : 45);
 const y = 100 - 5 - (point.current / maxValue) * (100 - 10);
 return (
 <circle
 key={index}
 cx={x}
 cy={y}
 r={hoveredIndex === index ? "2" : "1.2"}
 fill="currentColor"
 className="text-primary transition-all cursor-pointer"
 onMouseEnter={() => setHoveredIndex(index)}
 />
 );
 })}
 </svg>
 
 {/* Hover Tooltip */}
 {hoveredIndex !== null && displayData[hoveredIndex] && (
 <div 
 className="absolute z-10 bg-popover border border-border rounded-lg shadow-lg p-3 pointer-events-none"
 style={{
 left: `${displayData.length > 1 ? (hoveredIndex / (displayData.length - 1)) * 100 : 50}%`,
 top: "10%",
 transform: hoveredIndex > displayData.length / 2 ? "translateX(-100%)" : "translateX(0)",
 }}
 >
 <p className="text-xs text-muted-foreground mb-1">
 <Calendar className="w-3 h-3 inline mr-1" />
 {displayData[hoveredIndex].label}
 </p>
 <div className="space-y-1">
 <p className="text-sm">
 <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2" />
 Total Executions: <span className="font-semibold text-foreground">{displayData[hoveredIndex].current}</span>
 </p>
 <p className="text-xs text-muted-foreground">
 Success: {displayData[hoveredIndex].success} / Failed: {displayData[hoveredIndex].failed}
 </p>
 </div>
 </div>
 )}
 
 {/* X-Axis Labels */}
 <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
 {displayData.filter((_, i) => i % Math.ceil(displayData.length / 5) === 0 || i === displayData.length - 1).map((point, index) => (
 <span key={index} className="text-[10px] text-muted-foreground">
 {point.label}
 </span>
 ))}
 </div>
 </>
 )}
 </div>

 {/* Legend - Enhanced */}
 <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50">
 <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group">
 <div className="w-3 h-3 rounded-md bg-gradient-to-br from-primary to-primary/80 shadow-sm shadow-primary/30 group-hover:scale-125 transition-transform" />
 <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Execution Count</span>
 </div>
 <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group">
 <div className="w-3 h-3 rounded-md bg-primary/30 ring-1 ring-primary/20 group-hover:scale-125 transition-transform" />
 <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Success</span>
 </div>
 <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group">
 <div className="w-3 h-3 rounded-md bg-red-500/30 ring-1 ring-red-500/20 group-hover:scale-125 transition-transform" />
 <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Failed</span>
 </div>
 </div>
 </Card>
 );
}
