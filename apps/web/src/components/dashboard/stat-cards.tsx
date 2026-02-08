"use client";

/**
 * Statistics Data Card Components
 * Reusable data showcase component collection
 */

import { ReactNode } from "react";
import {
 TrendingUp,
 TrendingDown,
 Minus,
 ArrowUpRight,
 ArrowDownRight,
 LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Basic Statistics Card
// ============================================

interface StatCardProps {
 title: string;
 value: string | number;
 change?: number;
 changeLabel?: string;
 icon?: LucideIcon;
 iconColor?: string;
 iconBgColor?: string;
 trend?: "up" | "down" | "neutral";
 className?: string;
}

export function StatCard({
 title,
 value,
 change,
 changeLabel,
 icon: Icon,
 iconColor = "text-primary",
 iconBgColor = "bg-primary/10",
 trend,
 className,
}: StatCardProps) {
 const getTrendColor = () => {
 if (!trend) return "text-foreground-light";
 if (trend === "up") return "text-emerald-500";
 if (trend === "down") return "text-red-500";
 return "text-foreground-light";
 };

 const getTrendIcon = () => {
 if (!trend || trend === "neutral") return Minus;
 return trend === "up" ? TrendingUp : TrendingDown;
 };

 const TrendIcon = getTrendIcon();

 return (
 <div
 className={cn(
 "p-5 rounded-lg bg-surface-100 border border-border hover:border-border-strong transition-colors",
 className
 )}
 >
 <div className="flex items-center justify-between mb-4">
 {Icon && (
 <div className={cn("w-9 h-9 rounded-md flex items-center justify-center", iconBgColor)}>
 <Icon className={cn("w-4 h-4", iconColor)} />
 </div>
 )}
 {change !== undefined && (
 <span
 className={cn(
 "flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full",
 getTrendColor(),
 trend === "up" ? "bg-emerald-500/10" : trend === "down" ? "bg-red-500/10" : "bg-surface-200"
 )}
 >
 <TrendIcon className="w-3 h-3" />
 {Math.abs(change)}%
 </span>
 )}
 </div>
 <p className="text-2xl font-semibold text-foreground mb-1">{value}</p>
 <p className="text-[13px] text-foreground-light">{title}</p>
 {changeLabel && (
 <p className="text-[11px] text-foreground-muted mt-2">{changeLabel}</p>
 )}
 </div>
 );
}

// ============================================
// Mini Statistics Card
// ============================================

interface MiniStatCardProps {
 title: string;
 value: string | number;
 icon?: LucideIcon;
 iconColor?: string;
 className?: string;
}

export function MiniStatCard({
 title,
 value,
 icon: Icon,
 iconColor = "text-foreground-light",
 className,
}: MiniStatCardProps) {
 return (
 <div
 className={cn(
 "p-4 rounded-lg bg-surface-100 border border-border",
 className
 )}
 >
 <div className="flex items-center gap-3">
 {Icon && (
 <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
 <Icon className={cn("w-4 h-4", iconColor)} />
 </div>
 )}
 <div>
 <p className="text-lg font-semibold text-foreground">{value}</p>
 <p className="text-[11px] text-foreground-muted">{title}</p>
 </div>
 </div>
 </div>
 );
}

// ============================================
// Progress Statistics Card
// ============================================

interface ProgressStatCardProps {
 title: string;
 current: number;
 total: number;
 unit?: string;
 icon?: LucideIcon;
 iconColor?: string;
 iconBgColor?: string;
 showPercentage?: boolean;
 className?: string;
}

export function ProgressStatCard({
 title,
 current,
 total,
 unit = "",
 icon: Icon,
 iconColor = "text-primary",
 iconBgColor = "bg-primary/10",
 showPercentage = true,
 className,
}: ProgressStatCardProps) {
 const percentage = total > 0 ? (current / total) * 100 : 0;
 const isWarning = percentage > 80;
 const isDanger = percentage > 95;

 return (
 <div
 className={cn(
 "p-5 rounded-lg bg-surface-100 border border-border",
 className
 )}
 >
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 {Icon && (
 <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", iconBgColor)}>
 <Icon className={cn("w-4 h-4", iconColor)} />
 </div>
 )}
 <span className="text-[13px] font-medium text-foreground">{title}</span>
 </div>
 <span className="text-[11px] text-foreground-muted">
 {current.toLocaleString()}{unit} / {total.toLocaleString()}{unit}
 </span>
 </div>
 <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
 <div
 className={cn(
 "h-full rounded-full transition-all",
 isDanger ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-primary"
 )}
 style={{ width: `${Math.min(percentage, 100)}%` }}
 />
 </div>
 {showPercentage && (
 <p className="text-[11px] text-foreground-muted mt-2">
 {percentage.toFixed(1)}% used
 </p>
 )}
 </div>
 );
}

// ============================================
// Comparative Statistics Card
// ============================================

interface CompareStatCardProps {
 title: string;
 currentValue: number;
 previousValue: number;
 unit?: string;
 icon?: LucideIcon;
 iconColor?: string;
 iconBgColor?: string;
 className?: string;
}

export function CompareStatCard({
 title,
 currentValue,
 previousValue,
 unit = "",
 icon: Icon,
 iconColor = "text-primary",
 iconBgColor = "bg-primary/10",
 className,
}: CompareStatCardProps) {
 const change = previousValue > 0 
 ? ((currentValue - previousValue) / previousValue) * 100 
 : 0;
 const isPositive = change >= 0;

 return (
 <div
 className={cn(
 "p-5 rounded-lg bg-surface-100 border border-border",
 className
 )}
 >
 <div className="flex items-center gap-3 mb-4">
 {Icon && (
 <div className={cn("w-9 h-9 rounded-md flex items-center justify-center", iconBgColor)}>
 <Icon className={cn("w-4 h-4", iconColor)} />
 </div>
 )}
 <span className="text-[13px] text-foreground-light">{title}</span>
 </div>
 
 <div className="flex items-end justify-between">
 <div>
 <p className="text-2xl font-semibold text-foreground">
 {currentValue.toLocaleString()}{unit}
 </p>
 <p className="text-[11px] text-foreground-muted mt-1">
 on: {previousValue.toLocaleString()}{unit}
 </p>
 </div>
 
 <div className={cn(
 "flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium",
 isPositive 
 ? "bg-emerald-500/10 text-emerald-500" 
 : "bg-red-500/10 text-red-500"
 )}>
 {isPositive ? (
 <ArrowUpRight className="w-3 h-3" />
 ) : (
 <ArrowDownRight className="w-3 h-3" />
 )}
 {Math.abs(change).toFixed(1)}%
 </div>
 </div>
 </div>
 );
}

// ============================================
// Statistics Card Grid
// ============================================

interface StatGridProps {
 children: ReactNode;
 columns?: 2 | 3 | 4;
 className?: string;
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
 const gridCols = {
 2: "md:grid-cols-2",
 3: "md:grid-cols-3",
 4: "md:grid-cols-2 lg:grid-cols-4",
 };

 return (
 <div className={cn("grid gap-4", gridCols[columns], className)}>
 {children}
 </div>
 );
}

// ============================================
// Real-time Data Card
// ============================================

interface LiveStatCardProps {
 title: string;
 value: string | number;
 subtitle?: string;
 icon?: LucideIcon;
 iconColor?: string;
 iconBgColor?: string;
 isLive?: boolean;
 liveColor?: string;
 className?: string;
}

export function LiveStatCard({
 title,
 value,
 subtitle,
 icon: Icon,
 iconColor = "text-primary",
 iconBgColor = "bg-primary/10",
 isLive = false,
 liveColor = "bg-emerald-500",
 className,
}: LiveStatCardProps) {
 return (
 <div
 className={cn(
 "p-5 rounded-lg bg-surface-100 border border-border relative overflow-hidden",
 className
 )}
 >
 {/* Real-time Indicator */}
 {isLive && (
 <div className="absolute top-4 right-4 flex items-center gap-2">
 <span className={cn("w-2 h-2 rounded-full animate-pulse", liveColor)} />
 <span className="text-[11px] text-foreground-muted">Real-time</span>
 </div>
 )}

 <div className="flex items-center gap-3 mb-3">
 {Icon && (
 <div className={cn("w-9 h-9 rounded-md flex items-center justify-center", iconBgColor)}>
 <Icon className={cn("w-4 h-4", iconColor)} />
 </div>
 )}
 </div>
 
 <p className="text-2xl font-semibold text-foreground tracking-tight">{value}</p>
 <p className="text-[13px] text-foreground-light mt-1">{title}</p>
 {subtitle && (
 <p className="text-[11px] text-foreground-muted mt-2">{subtitle}</p>
 )}
 </div>
 );
}
