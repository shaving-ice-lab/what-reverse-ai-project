"use client";

/**
 * GradientBorder - 渐变边框组件
 * 
 * 提供多种渐变边框效果：
 * - 静态渐变
 * - 旋转渐变（动画）
 * - 悬停发光效果
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GradientBorderProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  borderWidth?: number;
  borderRadius?: string;
  gradient?: string;
  animate?: boolean;
  animationDuration?: number;
  glowOnHover?: boolean;
  glowIntensity?: "sm" | "md" | "lg";
}

// 预设渐变
export const gradients = {
  primary: "linear-gradient(135deg, hsl(var(--primary)) 0%, #2a6348 50%, hsl(var(--primary)/0.9) 100%)",
  rainbow: "linear-gradient(135deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7, #FF6B6B)",
  sunset: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFC837 100%)",
  ocean: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6B8DD6 100%)",
  aurora: "linear-gradient(135deg, #00C9FF 0%, #92FE9D 50%, #00C9FF 100%)",
  neon: "linear-gradient(135deg, #FF00FF 0%, #00FFFF 50%, #FF00FF 100%)",
  fire: "linear-gradient(135deg, #FF4B2B 0%, #FF416C 50%, #FF4B2B 100%)",
  emerald: "linear-gradient(135deg, hsl(var(--primary)) 0%, #10B981 50%, #059669 100%)",
};

export function GradientBorder({
  children,
  className,
  containerClassName,
  borderWidth = 1,
  borderRadius = "0.75rem",
  gradient = gradients.primary,
  animate = false,
  animationDuration = 3,
  glowOnHover = false,
  glowIntensity = "md",
}: GradientBorderProps) {
  const glowSizes = {
    sm: "0 0 10px",
    md: "0 0 20px",
    lg: "0 0 30px",
  };

  return (
    <div
      className={cn(
        "relative p-[var(--border-width)] overflow-hidden group",
        containerClassName
      )}
      style={{
        "--border-width": `${borderWidth}px`,
        borderRadius,
      } as React.CSSProperties}
    >
      {/* 渐变边框背景 */}
      <div
        className={cn(
          "absolute inset-0",
          animate && "animate-spin-slow",
          glowOnHover && "group-hover:opacity-100 opacity-80 transition-opacity"
        )}
        style={{
          background: gradient,
          borderRadius,
          animationDuration: animate ? `${animationDuration}s` : undefined,
        }}
      />
      
      {/* 发光效果 */}
      {glowOnHover && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-md"
          style={{
            background: gradient,
            borderRadius,
          }}
        />
      )}
      
      {/* 内容区域 */}
      <div
        className={cn(
          "relative bg-card",
          className
        )}
        style={{ borderRadius: `calc(${borderRadius} - ${borderWidth}px)` }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * AnimatedGradientBorder - 动画渐变边框
 * 
 * 带有流动动画效果的渐变边框
 */
interface AnimatedGradientBorderProps {
  children: ReactNode;
  className?: string;
  borderWidth?: number;
  borderRadius?: string;
  colors?: string[];
  speed?: "slow" | "normal" | "fast";
}

export function AnimatedGradientBorder({
  children,
  className,
  borderWidth = 2,
  borderRadius = "0.75rem",
  colors = ["hsl(var(--primary))", "hsl(var(--primary)/0.9)", "#3B82F6", "#8B5CF6", "hsl(var(--primary))"],
  speed = "normal",
}: AnimatedGradientBorderProps) {
  const speedMap = {
    slow: 6,
    normal: 4,
    fast: 2,
  };

  const gradient = `linear-gradient(90deg, ${colors.join(", ")})`;

  return (
    <div
      className="relative p-[var(--border-width)] overflow-hidden"
      style={{
        "--border-width": `${borderWidth}px`,
        borderRadius,
      } as React.CSSProperties}
    >
      {/* 动画渐变背景 */}
      <div
        className="absolute inset-0 animate-gradient-flow"
        style={{
          background: gradient,
          backgroundSize: "200% 100%",
          animationDuration: `${speedMap[speed]}s`,
          borderRadius,
        }}
      />
      
      {/* 内容区域 */}
      <div
        className={cn("relative bg-card", className)}
        style={{ borderRadius: `calc(${borderRadius} - ${borderWidth}px)` }}
      >
        {children}
      </div>
      
      <style jsx>{`
        @keyframes gradient-flow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-flow {
          animation: gradient-flow linear infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * GlowCard - 发光卡片
 * 
 * 悬停时带有发光效果的卡片
 */
interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  glowSize?: "sm" | "md" | "lg" | "xl";
  borderRadius?: string;
}

export function GlowCard({
  children,
  className,
  glowColor = "rgba(62, 207, 142, 0.5)",
  glowSize = "md",
  borderRadius = "0.75rem",
}: GlowCardProps) {
  const glowSizes = {
    sm: 10,
    md: 20,
    lg: 30,
    xl: 40,
  };

  return (
    <div
      className={cn(
        "relative bg-card border border-border group",
        "transition-all duration-300",
        "hover:border-transparent",
        className
      )}
      style={{ borderRadius }}
    >
      {/* 发光效果 */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
        style={{
          borderRadius,
          boxShadow: `0 0 ${glowSizes[glowSize]}px ${glowColor}`,
        }}
      />
      
      {/* 边框发光 */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          borderRadius,
          background: `linear-gradient(135deg, ${glowColor}, transparent 50%, ${glowColor})`,
          padding: "1px",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      
      {children}
    </div>
  );
}

/**
 * SpotlightCard - 聚光灯卡片
 * 
 * 鼠标跟随的聚光灯效果
 */
interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  spotlightSize?: number;
  borderRadius?: string;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(62, 207, 142, 0.15)",
  spotlightSize = 200,
  borderRadius = "0.75rem",
}: SpotlightCardProps) {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    e.currentTarget.style.setProperty("--spotlight-x", `${x}px`);
    e.currentTarget.style.setProperty("--spotlight-y", `${y}px`);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn(
        "relative bg-card border border-border overflow-hidden",
        "transition-all duration-300",
        className
      )}
      style={{
        borderRadius,
        "--spotlight-size": `${spotlightSize}px`,
        "--spotlight-color": spotlightColor,
      } as React.CSSProperties}
    >
      {/* 聚光灯效果 */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(var(--spotlight-size) circle at var(--spotlight-x) var(--spotlight-y), var(--spotlight-color), transparent)`,
        }}
      />
      
      {children}
    </div>
  );
}

export default GradientBorder;
