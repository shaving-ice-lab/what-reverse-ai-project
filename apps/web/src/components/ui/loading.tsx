"use client";

/**
 * 加载状态组件 - Manus 风格（支持亮/暗主题）
 */

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2 className={cn("animate-spin text-primary", sizeMap[size], className)} />
  );
}

interface PageLoaderProps {
  message?: string;
  className?: string;
}

export function PageLoader({ message = "加载中...", className }: PageLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[300px] gap-3", className)}>
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface ContentLoaderProps {
  className?: string;
  rows?: number;
}

export function ContentLoader({ className, rows = 3 }: ContentLoaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-lg animate-shimmer bg-muted"
          style={{ 
            width: `${Math.max(50, 100 - i * 15)}%`,
          }}
        />
      ))}
    </div>
  );
}

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={cn(
      "rounded-xl p-6 space-y-3 border border-border bg-card",
      className
    )}>
      <div className="h-4 rounded-lg w-3/4 animate-shimmer bg-muted" />
      <div 
        className="h-3 rounded-lg w-full animate-shimmer bg-muted"
        style={{ animationDelay: "100ms" }}
      />
      <div 
        className="h-3 rounded-lg w-2/3 animate-shimmer bg-muted"
        style={{ animationDelay: "200ms" }}
      />
    </div>
  );
}

interface ListSkeletonProps {
  rows?: number;
  className?: string;
}

export function ListSkeleton({ rows = 5, className }: ListSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
        >
          <div className="h-8 w-8 rounded-lg shrink-0 animate-shimmer bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded-lg w-1/3 animate-shimmer bg-muted" />
            <div 
              className="h-2.5 rounded-lg w-1/2 animate-shimmer bg-muted"
              style={{ animationDelay: "100ms" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface FullscreenLoaderProps {
  visible: boolean;
  message?: string;
}

export function FullscreenLoader({ visible, message = "加载中..." }: FullscreenLoaderProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[8px]">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border border-border shadow-2xl">
        <Spinner size="xl" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
}

/**
 * Skeleton 基础组件 - 使用 shimmer 动画
 */
interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div 
      className={cn("rounded-lg animate-shimmer bg-muted", className)}
      style={style}
    />
  );
}
