"use client";

/**
 * LoadingScreen - 全屏加载组件
 * 
 * 提供多种加载效果：
 * - Logo 动画
 * - 进度条
 * - 骨架屏
 * - 文字提示
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Layers, Loader2 } from "lucide-react";

interface LoadingScreenProps {
  variant?: "default" | "minimal" | "branded" | "skeleton";
  text?: string;
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

export function LoadingScreen({
  variant = "default",
  text = "加载中...",
  showProgress = false,
  progress: externalProgress,
  className,
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(externalProgress ?? 0);
  
  // 模拟进度（如果没有传入外部进度）
  useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress);
      return;
    }
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, [externalProgress]);

  // 极简版本
  if (variant === "minimal") {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-background/80 backdrop-blur-sm",
        className
      )}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          {text && (
            <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
          )}
        </div>
      </div>
    );
  }

  // 品牌版本
  if (variant === "branded") {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-background",
        className
      )}>
        {/* 背景光效 */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(62,207,142,0.5) 0%, transparent 70%)' }}
          />
        </div>
        
        <div className="relative flex flex-col items-center gap-6">
          {/* Logo 动画 */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-logo-pulse">
              <Layers className="w-8 h-8 text-primary-foreground" />
            </div>
            {/* 光环效果 */}
            <div className="absolute inset-0 rounded-2xl animate-logo-ring">
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/50" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-foreground">AgentFlow</h1>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
          
          {/* 进度条 */}
          {showProgress && (
            <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          
          {/* 加载点动画 */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-loading-dot"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
        
        <style jsx>{`
          @keyframes logo-pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          @keyframes logo-ring {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
          
          @keyframes loading-dot {
            0%, 80%, 100% {
              transform: scale(0.6);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          .animate-logo-pulse {
            animation: logo-pulse 2s ease-in-out infinite;
          }
          
          .animate-logo-ring {
            animation: logo-ring 1.5s ease-out infinite;
          }
          
          .animate-loading-dot {
            animation: loading-dot 1.4s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // 骨架屏版本
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-6 p-6", className)}>
        {/* 头部骨架 */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
        </div>
        
        {/* 统计卡片骨架 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 bg-card border border-border rounded-xl">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        
        {/* 内容区骨架 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-card border border-border rounded-xl">
            <div className="h-5 w-24 bg-muted rounded animate-pulse mb-4" />
            <div className="h-40 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="p-6 bg-card border border-border rounded-xl">
            <div className="h-5 w-24 bg-muted rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
                  <div className="h-4 flex-1 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 默认版本
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-background/95 backdrop-blur-md",
      className
    )}>
      <div className="flex flex-col items-center gap-6">
        {/* 旋转 Logo */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
            <Layers className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        {text && (
          <p className="text-sm text-muted-foreground">{text}</p>
        )}
        
        {showProgress && (
          <div className="w-48 space-y-2">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * PageLoader - 页面级加载指示器
 */
interface PageLoaderProps {
  className?: string;
}

export function PageLoader({ className }: PageLoaderProps) {
  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 h-1",
      className
    )}>
      <div className="h-full bg-primary animate-page-load" />
      
      <style jsx>{`
        @keyframes page-load {
          0% {
            width: 0;
            opacity: 1;
          }
          50% {
            width: 70%;
            opacity: 1;
          }
          100% {
            width: 100%;
            opacity: 0;
          }
        }
        .animate-page-load {
          animation: page-load 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

/**
 * SpinnerLoader - 简单旋转加载器
 */
interface SpinnerLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SpinnerLoader({ size = "md", className }: SpinnerLoaderProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <Loader2 className={cn(sizes[size], "animate-spin text-primary", className)} />
  );
}

/**
 * PulseLoader - 脉冲加载器
 */
interface PulseLoaderProps {
  count?: number;
  className?: string;
}

export function PulseLoader({ count = 3, className }: PulseLoaderProps) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse-dot"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
      
      <style jsx>{`
        @keyframes pulse-dot {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-pulse-dot {
          animation: pulse-dot 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default LoadingScreen;
