"use client";

/**
 * StatCard - StatisticsCardComponent
 * 
 * Used for Dashboard ShowcasekeyMetrics
 * Contains: Animationcount, TrendIndicator, youChart, IconAnimation
 */

import { ReactNode, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AnimatedCounter, CountUpOnView } from "./animated-counter";
import {
 TrendingUp,
 TrendingDown,
 Minus,
 ArrowUpRight,
 ArrowDownRight,
 LucideIcon,
 Sparkles,
} from "lucide-react";

interface StatCardProps {
 title: string;
 value: number;
 previousValue?: number;
 format?: "number" | "percentage" | "currency" | "compact";
 prefix?: string;
 suffix?: string;
 decimals?: number;
 icon?: LucideIcon;
 iconColor?: string;
 description?: string;
 trend?: "up" | "down" | "neutral";
 trendValue?: number;
 trendLabel?: string;
 sparklineData?: number[];
 className?: string;
 onClick?: () => void;
 loading?: boolean;
}

export function StatCard({
 title,
 value,
 previousValue,
 format = "number",
 prefix = "",
 suffix = "",
 decimals = 0,
 icon: Icon,
 iconColor = "hsl(var(--primary))",
 description,
 trend,
 trendValue,
 trendLabel,
 sparklineData,
 className,
 onClick,
 loading = false,
}: StatCardProps) {
 const [isHovered, setIsHovered] = useState(false);
 const cardRef = useRef<HTMLDivElement>(null);
 
 // AutoCalculateTrend
 const calculatedTrend = trend || (
 previousValue !== undefined
 ? value > previousValue ? "up" : value < previousValue ? "down" : "neutral"
 : undefined
 );
 
 const calculatedTrendValue = trendValue ?? (
 previousValue !== undefined && previousValue !== 0
 ? Math.abs(((value - previousValue) / previousValue) * 100)
 : undefined
 );
 
 // MouseTrack
 const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
 if (!cardRef.current) return;
 const rect = cardRef.current.getBoundingClientRect();
 const x = e.clientX - rect.left;
 const y = e.clientY - rect.top;
 cardRef.current.style.setProperty("--mouse-x", `${x}px`);
 cardRef.current.style.setProperty("--mouse-y", `${y}px`);
 };
 
 if (loading) {
 return <StatCardSkeleton className={className} />;
 }

 return (
 <div
 ref={cardRef}
 onMouseMove={handleMouseMove}
 onMouseEnter={() => setIsHovered(true)}
 onMouseLeave={() => setIsHovered(false)}
 onClick={onClick}
 className={cn(
 "group relative bg-card border border-border rounded-xl p-5 overflow-hidden",
 "transition-all duration-300",
 onClick && "cursor-pointer hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5",
 "hover:border-primary/30",
 className
 )}
 >
 {/* MouseFollowLight Effect */}
 <div 
 className={cn(
 "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
 "bg-[radial-gradient(150px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(62,207,142,0.08),transparent)]"
 )}
 />
 
 {/* Header */}
 <div className="flex items-start justify-between mb-4">
 <div className="flex-1">
 <h3 className="text-sm font-medium text-muted-foreground mb-1">
 {title}
 </h3>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-bold text-foreground">
 <CountUpOnView
 value={value}
 format={format}
 prefix={prefix}
 suffix={suffix}
 decimals={decimals}
 duration={1200}
 easing="easeOut"
 />
 </span>
 </div>
 </div>
 
 {Icon && (
 <div 
 className={cn(
 "w-10 h-10 rounded-xl flex items-center justify-center",
 "transition-all duration-300",
 "group-hover:scale-110 group-hover:shadow-lg"
 )}
 style={{ 
 backgroundColor: `${iconColor}15`,
 boxShadow: isHovered ? `0 4px 20px ${iconColor}30` : "none"
 }}
 >
 <Icon 
 className={cn(
 "w-5 h-5 transition-transform duration-300",
 isHovered && "scale-110"
 )} 
 style={{ color: iconColor }} 
 />
 </div>
 )}
 </div>
 
 {/* TrendIndicator */}
 {calculatedTrend && calculatedTrendValue !== undefined && (
 <div className="flex items-center gap-2 mb-3">
 <span
 className={cn(
 "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
 "transition-all duration-200",
 calculatedTrend === "up" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
 calculatedTrend === "down" && "bg-red-500/10 text-red-600 dark:text-red-400",
 calculatedTrend === "neutral" && "bg-muted text-muted-foreground"
 )}
 >
 {calculatedTrend === "up" && <TrendingUp className="w-3 h-3" />}
 {calculatedTrend === "down" && <TrendingDown className="w-3 h-3" />}
 {calculatedTrend === "neutral" && <Minus className="w-3 h-3" />}
 {calculatedTrend !== "neutral" && (
 <span>
 {calculatedTrend === "up" ? "+" : "-"}
 {calculatedTrendValue.toFixed(1)}%
 </span>
 )}
 </span>
 {trendLabel && (
 <span className="text-xs text-muted-foreground">{trendLabel}</span>
 )}
 </div>
 )}
 
 {/* Description */}
 {description && (
 <p className="text-xs text-muted-foreground">{description}</p>
 )}
 
 {/* youSparkline Chart */}
 {sparklineData && sparklineData.length > 0 && (
 <div className="mt-4 h-8">
 <MiniSparkline data={sparklineData} color={iconColor} />
 </div>
 )}
 
 {/* ClickIndicator */}
 {onClick && (
 <div className={cn(
 "absolute bottom-3 right-3 opacity-0 group-hover:opacity-100",
 "transition-all duration-200"
 )}>
 <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
 </div>
 )}
 </div>
 );
}

/**
 * MiniSparkline - youLine Chart
 */
interface MiniSparklineProps {
 data: number[];
 color?: string;
 className?: string;
}

function MiniSparkline({ data, color = "hsl(var(--primary))", className }: MiniSparklineProps) {
 const svgRef = useRef<SVGSVGElement>(null);
 const [pathLength, setPathLength] = useState(0);
 
 const min = Math.min(...data);
 const max = Math.max(...data);
 const range = max - min || 1;
 
 const points = data.map((value, index) => {
 const x = (index / (data.length - 1)) * 100;
 const y = 100 - ((value - min) / range) * 100;
 return `${x},${y}`;
 }).join("");
 
 // CreateSmoothline
 const pathD = data.length > 0
 ? `M ${points.split("").map((p, i) => {
 if (i === 0) return p;
 const [x, y] = p.split(",");
 const [prevX, prevY] = points.split("")[i - 1].split(",");
 const cpX = (parseFloat(x) + parseFloat(prevX)) / 2;
 return `C ${cpX},${prevY} ${cpX},${y} ${x},${y}`;
 }).join("")}`
 : "";
 
 useEffect(() => {
 if (svgRef.current) {
 const path = svgRef.current.querySelector("path");
 if (path) {
 setPathLength(path.getTotalLength());
 }
 }
 }, [data]);

 return (
 <svg
 ref={svgRef}
 viewBox="0 0 100 100"
 preserveAspectRatio="none"
 className={cn("w-full h-full", className)}
 >
 {/* GradientFill */}
 <defs>
 <linearGradient id={`sparkline-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={color} stopOpacity="0.3" />
 <stop offset="100%" stopColor={color} stopOpacity="0" />
 </linearGradient>
 </defs>
 
 {/* FillRegion */}
 <path
 d={`${pathD} L 100,100 L 0,100 Z`}
 fill={`url(#sparkline-gradient-${color})`}
 />
 
 {/* line */}
 <polyline
 points={points}
 fill="none"
 stroke={color}
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 className="animate-draw-line"
 style={{
 strokeDasharray: pathLength,
 strokeDashoffset: pathLength,
 animation: `draw-sparkline 1.5s ease-out forwards`,
 }}
 />
 
 {/* mostafter1 */}
 {data.length > 0 && (
 <circle
 cx="100"
 cy={100 - ((data[data.length - 1] - min) / range) * 100}
 r="3"
 fill={color}
 className="animate-pulse-dot"
 />
 )}
 
 <style>{`
 @keyframes draw-sparkline {
 to {
 stroke-dashoffset: 0;
 }
 }
 @keyframes pulse-dot {
 0%, 100% {
 opacity: 1;
 transform: scale(1);
 }
 50% {
 opacity: 0.7;
 transform: scale(1.2);
 }
 }
 .animate-pulse-dot {
 animation: pulse-dot 2s ease-in-out infinite;
 transform-origin: center;
 transform-box: fill-box;
 }
 `}</style>
 </svg>
 );
}

/**
 * StatCardSkeleton - StatisticsCardSkeleton
 */
function StatCardSkeleton({ className }: { className?: string }) {
 return (
 <div className={cn(
 "bg-card border border-border rounded-xl p-5",
 className
 )}>
 <div className="flex items-start justify-between mb-4">
 <div className="flex-1">
 <div className="h-4 w-20 bg-muted rounded animate-pulse mb-2" />
 <div className="h-8 w-32 bg-muted rounded animate-pulse" />
 </div>
 <div className="w-10 h-10 bg-muted rounded-xl animate-pulse" />
 </div>
 <div className="h-5 w-24 bg-muted rounded-full animate-pulse mb-3" />
 <div className="h-3 w-full bg-muted rounded animate-pulse" />
 </div>
 );
}

/**
 * StatCardGrid - StatisticsCardGridLayout
 */
interface StatCardGridProps {
 children: ReactNode;
 columns?: 2 | 3 | 4;
 className?: string;
}

export function StatCardGrid({
 children,
 columns = 4,
 className,
}: StatCardGridProps) {
 const gridCols = {
 2: "grid-cols-1 sm:grid-cols-2",
 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
 4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
 };

 return (
 <div className={cn("grid gap-4", gridCols[columns], className)}>
 {children}
 </div>
 );
}

/**
 * CompactStatCard - CompactStatisticsCard
 */
interface CompactStatCardProps {
 title: string;
 value: number | string;
 icon?: LucideIcon;
 iconColor?: string;
 trend?: "up" | "down" | "neutral";
 trendValue?: number;
 className?: string;
}

export function CompactStatCard({
 title,
 value,
 icon: Icon,
 iconColor = "hsl(var(--primary))",
 trend,
 trendValue,
 className,
}: CompactStatCardProps) {
 return (
 <div className={cn(
 "flex items-center gap-3 p-3 bg-card border border-border rounded-lg",
 "transition-all duration-200 hover:border-primary/30",
 className
 )}>
 {Icon && (
 <div 
 className="w-8 h-8 rounded-lg flex items-center justify-center"
 style={{ backgroundColor: `${iconColor}15` }}
 >
 <Icon className="w-4 h-4" style={{ color: iconColor }} />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <p className="text-xs text-muted-foreground truncate">{title}</p>
 <p className="text-sm font-semibold text-foreground">
 {typeof value === "number" ? (
 <AnimatedCounter value={value} duration={800} />
 ) : (
 value
 )}
 </p>
 </div>
 {trend && trendValue !== undefined && (
 <span
 className={cn(
 "text-xs font-medium",
 trend === "up" && "text-emerald-500",
 trend === "down" && "text-red-500",
 trend === "neutral" && "text-muted-foreground"
 )}
 >
 {trend === "up" ? "+" : trend === "down" ? "-" : ""}
 {trendValue.toFixed(1)}%
 </span>
 )}
 </div>
 );
}

export default StatCard;
