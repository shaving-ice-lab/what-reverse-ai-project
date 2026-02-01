"use client"

/**
 * Progress 进度组件 - 增强版
 * 
 * 支持：
 * - 线性进度条
 * - 环形进度
 * - 分段进度
 * - 动画效果
 */

import * as React from "react"
import { cn } from "@/lib/utils"

// ============ 线性进度条 ============

interface ProgressProps {
  /** 进度值 (0-100) */
  value?: number
  /** 最大值 */
  max?: number
  /** 尺寸 */
  size?: "xs" | "sm" | "default" | "lg"
  /** 颜色变体 */
  variant?: "default" | "success" | "warning" | "error" | "gradient"
  /** 是否显示条纹 */
  striped?: boolean
  /** 条纹是否动画 */
  animated?: boolean
  /** 是否不确定状态 */
  indeterminate?: boolean
  /** 是否显示数值 */
  showValue?: boolean
  /** 格式化数值显示 */
  formatValue?: (value: number, max: number) => string
  /** 标签 */
  label?: string
  className?: string
}

const sizeStyles = {
  xs: "h-1",
  sm: "h-1.5",
  default: "h-2",
  lg: "h-3",
}

const variantStyles = {
  default: "bg-brand-500",
  success: "bg-brand-500",
  warning: "bg-warning",
  error: "bg-destructive",
  gradient: "bg-gradient-to-r from-brand-500 to-brand-400",
}

function Progress({
  value = 0,
  max = 100,
  size = "default",
  variant = "default",
  striped = false,
  animated = false,
  indeterminate = false,
  showValue = false,
  formatValue,
  label,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const displayValue = formatValue 
    ? formatValue(value, max) 
    : `${Math.round(percentage)}%`

  return (
    <div className={cn("w-full", className)}>
      {/* 标签和数值 */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {showValue && (
            <span className="text-sm tabular-nums text-foreground-muted">
              {displayValue}
            </span>
          )}
        </div>
      )}
      
      {/* 进度条容器 */}
      <div 
        className={cn(
          "w-full bg-surface-200 rounded-full overflow-hidden",
          sizeStyles[size]
        )}
      >
        {/* 进度条 */}
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantStyles[variant],
            striped && "progress-striped",
            animated && striped && "progress-animated",
            indeterminate && "progress-indeterminate"
          )}
          style={{
            width: indeterminate ? "100%" : `${percentage}%`,
          }}
        />
      </div>

      <style jsx>{`
        .progress-striped {
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.15) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0.15) 75%,
            transparent 75%,
            transparent
          );
          background-size: 1rem 1rem;
        }
        
        .progress-animated {
          animation: progress-stripes 1s linear infinite;
        }
        
        .progress-indeterminate {
          width: 30% !important;
          animation: progress-indeterminate 1.5s ease-in-out infinite;
        }
        
        @keyframes progress-stripes {
          from {
            background-position: 1rem 0;
          }
          to {
            background-position: 0 0;
          }
        }
        
        @keyframes progress-indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  )
}

// ============ 环形进度 ============

interface CircularProgressProps {
  /** 进度值 (0-100) */
  value?: number
  /** 尺寸 (px) */
  size?: number
  /** 线条宽度 */
  strokeWidth?: number
  /** 颜色变体 */
  variant?: "default" | "success" | "warning" | "error" | "gradient"
  /** 是否不确定状态 */
  indeterminate?: boolean
  /** 是否显示数值 */
  showValue?: boolean
  /** 格式化数值显示 */
  formatValue?: (value: number) => string
  /** 中心内容 */
  children?: React.ReactNode
  /** 轨道颜色 */
  trackColor?: string
  className?: string
}

const circularVariantColors = {
  default: "hsl(var(--primary))",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  gradient: "url(#progress-gradient)",
}

function CircularProgress({
  value = 0,
  size = 80,
  strokeWidth = 8,
  variant = "default",
  indeterminate = false,
  showValue = false,
  formatValue,
  children,
  trackColor,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min(Math.max(value, 0), 100)
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const displayValue = formatValue 
    ? formatValue(value) 
    : `${Math.round(percentage)}%`

  return (
    <div 
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className={cn(
          "transform -rotate-90",
          indeterminate && "animate-spin"
        )}
      >
        {/* 渐变定义 */}
        {variant === "gradient" && (
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="#2a9d6a" />
            </linearGradient>
          </defs>
        )}
        
        {/* 轨道 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor || "currentColor"}
          strokeWidth={strokeWidth}
          className={!trackColor ? "text-foreground-muted" : ""}
        />
        
        {/* 进度 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={circularVariantColors[variant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : strokeDashoffset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      
      {/* 中心内容 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showValue && (
          <span className="text-sm font-medium tabular-nums text-foreground">
            {displayValue}
          </span>
        ))}
      </div>
    </div>
  )
}

// ============ 分段进度 ============

interface SegmentedProgressProps {
  /** 分段数据 */
  segments: Array<{
    value: number
    color?: string
    label?: string
  }>
  /** 总值 */
  total?: number
  /** 尺寸 */
  size?: "sm" | "default" | "lg"
  /** 是否显示标签 */
  showLabels?: boolean
  /** 分段间隙 */
  gap?: number
  className?: string
}

function SegmentedProgress({
  segments,
  total,
  size = "default",
  showLabels = false,
  gap = 2,
  className,
}: SegmentedProgressProps) {
  const totalValue = total || segments.reduce((sum, s) => sum + s.value, 0)
  
  const sizeMap = {
    sm: "h-1.5",
    default: "h-2.5",
    lg: "h-4",
  }

  const defaultColors = [
    "hsl(var(--primary))",
    "#3B82F6",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ]

  return (
    <div className={cn("w-full", className)}>
      {/* 进度条 */}
      <div 
        className={cn(
          "flex w-full rounded-full overflow-hidden bg-surface-200",
          sizeMap[size]
        )}
        style={{ gap }}
      >
        {segments.map((segment, index) => {
          const percentage = (segment.value / totalValue) * 100
          return (
            <div
              key={index}
              className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${percentage}%`,
                backgroundColor: segment.color || defaultColors[index % defaultColors.length],
              }}
            />
          )
        })}
      </div>

      {/* 标签 */}
      {showLabels && (
        <div className="flex flex-wrap gap-3 mt-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: segment.color || defaultColors[index % defaultColors.length],
                }}
              />
              <span className="text-xs text-foreground-muted">
                {segment.label || `段 ${index + 1}`}: {segment.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ 步骤进度 ============

interface StepProgressProps {
  /** 步骤 */
  steps: Array<{
    label: string
    description?: string
  }>
  /** 当前步骤 (从 0 开始) */
  current: number
  /** 方向 */
  direction?: "horizontal" | "vertical"
  /** 尺寸 */
  size?: "sm" | "default" | "lg"
  className?: string
}

function StepProgress({
  steps,
  current,
  direction = "horizontal",
  size = "default",
  className,
}: StepProgressProps) {
  const sizeMap = {
    sm: { circle: "w-6 h-6 text-xs", line: "h-0.5" },
    default: { circle: "w-8 h-8 text-sm", line: "h-0.5" },
    lg: { circle: "w-10 h-10 text-base", line: "h-1" },
  }

  return (
    <div 
      className={cn(
        "flex",
        direction === "vertical" ? "flex-col" : "flex-row items-start",
        className
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = index < current
        const isCurrent = index === current
        const isLast = index === steps.length - 1

        return (
          <div
            key={index}
            className={cn(
              "flex",
              direction === "vertical" 
                ? "flex-row items-start" 
                : "flex-col items-center flex-1"
            )}
          >
            <div className={cn(
              "flex items-center",
              direction === "vertical" && "flex-col"
            )}>
              {/* 圆圈 */}
              <div
                className={cn(
                  "rounded-full flex items-center justify-center font-medium transition-all duration-300",
                  sizeMap[size].circle,
                  isCompleted && "bg-brand-500 text-foreground",
                  isCurrent && "bg-brand-500 text-foreground ring-4 ring-brand-500/20",
                  !isCompleted && !isCurrent && "bg-surface-200 text-foreground-muted"
                )}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* 连接线 */}
              {!isLast && (
                <div
                  className={cn(
                    "transition-all duration-300",
                    direction === "vertical" 
                      ? "w-0.5 h-8 mx-auto my-1" 
                      : cn("flex-1 mx-2", sizeMap[size].line),
                    isCompleted ? "bg-brand-500" : "bg-surface-200"
                  )}
                />
              )}
            </div>

            {/* 标签 */}
            <div className={cn(
              direction === "vertical" ? "ml-3" : "mt-2 text-center",
              "min-w-0"
            )}>
              <div
                className={cn(
                  "font-medium text-sm",
                  (isCompleted || isCurrent) ? "text-foreground" : "text-foreground-muted"
                )}
              >
                {step.label}
              </div>
              {step.description && (
                <div className="text-xs text-foreground-muted mt-0.5 line-clamp-2">
                  {step.description}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============ 进度环组 ============

interface ProgressRingGroupProps {
  /** 环形进度数据 */
  rings: Array<{
    value: number
    color?: string
    label?: string
  }>
  /** 基础尺寸 */
  size?: number
  /** 线条宽度 */
  strokeWidth?: number
  /** 环间距 */
  gap?: number
  className?: string
}

function ProgressRingGroup({
  rings,
  size = 120,
  strokeWidth = 10,
  gap = 4,
  className,
}: ProgressRingGroupProps) {
  const defaultColors = ["hsl(var(--primary))", "#3B82F6", "#F59E0B", "#EF4444"]

  return (
    <div 
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {rings.map((ring, index) => {
          const ringRadius = (size / 2) - (strokeWidth / 2) - (index * (strokeWidth + gap))
          const circumference = ringRadius * 2 * Math.PI
          const percentage = Math.min(Math.max(ring.value, 0), 100)
          const strokeDashoffset = circumference - (percentage / 100) * circumference
          const color = ring.color || defaultColors[index % defaultColors.length]

          return (
            <React.Fragment key={index}>
              {/* 轨道 */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-foreground-muted"
              />
              {/* 进度 */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={ringRadius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
              />
            </React.Fragment>
          )
        })}
      </svg>
    </div>
  )
}

export {
  Progress,
  CircularProgress,
  SegmentedProgress,
  StepProgress,
  ProgressRingGroup,
}
export type {
  ProgressProps,
  CircularProgressProps,
  SegmentedProgressProps,
  StepProgressProps,
  ProgressRingGroupProps,
}