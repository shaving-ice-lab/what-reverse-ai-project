"use client"

/**
 * Stepper 步骤指示器组件
 * 
 * 支持：
 * - 水平/垂直布局
 * - 可点击导航
 * - 多种样式变体
 * - 错误/完成状态
 */

import * as React from "react"
import { Check, X, Loader2, ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// 步骤状态
type StepStatus = "pending" | "current" | "completed" | "error"

// 步骤配置
interface StepConfig {
  /** 标题 */
  title: string
  /** 描述 */
  description?: string
  /** 图标 */
  icon?: LucideIcon | React.ReactNode
  /** 状态（自动计算） */
  status?: StepStatus
  /** 是否可选（可跳过） */
  optional?: boolean
  /** 自定义内容 */
  content?: React.ReactNode
}

interface StepperProps {
  /** 步骤配置 */
  steps: StepConfig[]
  /** 当前步骤（0-indexed） */
  currentStep: number
  /** 步骤变化回调 */
  onStepChange?: (step: number) => void
  /** 布局方向 */
  orientation?: "horizontal" | "vertical"
  /** 变体 */
  variant?: "default" | "circle" | "dots" | "simple"
  /** 尺寸 */
  size?: "sm" | "default" | "lg"
  /** 是否可点击导航 */
  clickable?: boolean
  /** 是否线性（必须按顺序） */
  linear?: boolean
  /** 是否显示连接线 */
  showConnector?: boolean
  /** 错误步骤列表 */
  errorSteps?: number[]
  /** 是否加载中 */
  loading?: boolean
  className?: string
}

function Stepper({
  steps,
  currentStep,
  onStepChange,
  orientation = "horizontal",
  variant = "default",
  size = "default",
  clickable = false,
  linear = true,
  showConnector = true,
  errorSteps = [],
  loading = false,
  className,
}: StepperProps) {
  // 计算步骤状态
  const getStepStatus = (index: number): StepStatus => {
    if (errorSteps.includes(index)) return "error"
    if (index < currentStep) return "completed"
    if (index === currentStep) return "current"
    return "pending"
  }

  // 是否可以点击
  const canClick = (index: number): boolean => {
    if (!clickable) return false
    if (linear && index > currentStep) return false
    return true
  }

  const handleStepClick = (index: number) => {
    if (canClick(index)) {
      onStepChange?.(index)
    }
  }

  // 尺寸样式
  const sizeStyles = {
    sm: {
      indicator: "w-6 h-6 text-xs",
      title: "text-sm",
      description: "text-xs",
      connector: orientation === "horizontal" ? "h-0.5" : "w-0.5",
    },
    default: {
      indicator: "w-8 h-8 text-sm",
      title: "text-sm font-medium",
      description: "text-xs",
      connector: orientation === "horizontal" ? "h-0.5" : "w-0.5",
    },
    lg: {
      indicator: "w-10 h-10 text-base",
      title: "text-base font-medium",
      description: "text-sm",
      connector: orientation === "horizontal" ? "h-1" : "w-1",
    },
  }

  return (
    <div
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row items-start" : "flex-col",
        className
      )}
    >
      {steps.map((step, index) => {
        const status = step.status || getStepStatus(index)
        const isLast = index === steps.length - 1
        const isClickable = canClick(index)

        return (
          <React.Fragment key={index}>
            <div
              className={cn(
                "flex",
                orientation === "horizontal" 
                  ? "flex-col items-center" 
                  : "flex-row items-start gap-3",
                isClickable && "cursor-pointer"
              )}
              onClick={() => handleStepClick(index)}
            >
              {/* 步骤指示器 */}
              <StepIndicator
                step={index + 1}
                status={status}
                icon={step.icon}
                variant={variant}
                size={sizeStyles[size].indicator}
                loading={loading && status === "current"}
              />

              {/* 步骤内容 */}
              <div className={cn(
                orientation === "horizontal" ? "mt-2 text-center" : "",
                "flex flex-col"
              )}>
                <span className={cn(
                  sizeStyles[size].title,
                  status === "current" && "text-primary",
                  status === "completed" && "text-foreground",
                  status === "pending" && "text-foreground-light",
                  status === "error" && "text-destructive"
                )}>
                  {step.title}
                  {step.optional && (
                    <span className="ml-1 text-foreground-light font-normal">(可选)</span>
                  )}
                </span>
                
                {step.description && (
                  <span className={cn(
                    sizeStyles[size].description,
                    "text-foreground-light mt-0.5"
                  )}>
                    {step.description}
                  </span>
                )}
              </div>
            </div>

            {/* 连接线 */}
            {showConnector && !isLast && (
              <div className={cn(
                "flex-1",
                orientation === "horizontal" 
                  ? cn("mx-2 mt-4", sizeStyles[size].connector)
                  : cn("ml-4 my-2 min-h-8", sizeStyles[size].connector),
                status === "completed" || index < currentStep
                  ? "bg-primary"
                  : "bg-border"
              )} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/**
 * StepIndicator - 步骤指示器
 */
interface StepIndicatorProps {
  step: number
  status: StepStatus
  icon?: LucideIcon | React.ReactNode
  variant?: "default" | "circle" | "dots" | "simple"
  size?: string
  loading?: boolean
}

function StepIndicator({
  step,
  status,
  icon,
  variant = "default",
  size = "w-8 h-8 text-sm",
  loading = false,
}: StepIndicatorProps) {
  // 获取内容
  const getContent = () => {
    if (loading) {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }
    if (status === "completed") {
      return <Check className="w-4 h-4" />
    }
    if (status === "error") {
      return <X className="w-4 h-4" />
    }
    if (icon) {
      if (React.isValidElement(icon)) return icon
      const IconComponent = icon as LucideIcon
      return <IconComponent className="w-4 h-4" />
    }
    return step
  }

  // 变体样式
  if (variant === "dots") {
    return (
      <div className={cn(
        "w-3 h-3 rounded-full transition-all duration-200",
        status === "current" && "bg-primary scale-125",
        status === "completed" && "bg-primary",
        status === "pending" && "bg-border",
        status === "error" && "bg-destructive"
      )} />
    )
  }

  if (variant === "simple") {
    return (
      <span className={cn(
        "font-medium",
        status === "current" && "text-primary",
        status === "completed" && "text-primary",
        status === "pending" && "text-foreground-light",
        status === "error" && "text-destructive"
      )}>
        {status === "completed" ? "✓" : step}
      </span>
    )
  }

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center font-medium transition-all duration-200",
      size,
      status === "current" && "bg-primary text-primary-foreground ring-4 ring-brand-500/20",
      status === "completed" && "bg-primary text-primary-foreground",
      status === "pending" && "bg-surface-200 text-foreground-light border-2 border-border",
      status === "error" && "bg-destructive text-destructive-foreground"
    )}>
      {getContent()}
    </div>
  )
}

/**
 * StepContent - 步骤内容容器
 */
interface StepContentProps {
  step: number
  currentStep: number
  children: React.ReactNode
  className?: string
}

function StepContent({
  step,
  currentStep,
  children,
  className,
}: StepContentProps) {
  if (step !== currentStep) return null

  return (
    <div className={cn(
      "animate-in fade-in-0 slide-in-from-right-4 duration-300",
      className
    )}>
      {children}
    </div>
  )
}

/**
 * StepperActions - 步骤操作按钮
 */
interface StepperActionsProps {
  currentStep: number
  totalSteps: number
  onPrevious?: () => void
  onNext?: () => void
  onComplete?: () => void
  previousLabel?: string
  nextLabel?: string
  completeLabel?: string
  loading?: boolean
  className?: string
}

function StepperActions({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onComplete,
  previousLabel = "上一步",
  nextLabel = "下一步",
  completeLabel = "完成",
  loading = false,
  className,
}: StepperActionsProps) {
  const isFirst = currentStep === 0
  const isLast = currentStep === totalSteps - 1

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <button
        onClick={onPrevious}
        disabled={isFirst || loading}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium",
          "border border-border text-foreground",
          "hover:bg-surface-200 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {previousLabel}
      </button>

      <button
        onClick={isLast ? onComplete : onNext}
        disabled={loading}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium",
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "inline-flex items-center gap-2"
        )}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLast ? completeLabel : nextLabel}
        {!isLast && !loading && <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  )
}

/**
 * ProgressStepper - 带进度条的步骤指示器
 */
interface ProgressStepperProps {
  steps: string[]
  currentStep: number
  className?: string
}

function ProgressStepper({
  steps,
  currentStep,
  className,
}: ProgressStepperProps) {
  const progress = (currentStep / (steps.length - 1)) * 100

  return (
    <div className={cn("space-y-4", className)}>
      {/* 进度条 */}
      <div className="relative h-2 bg-surface-200 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 步骤标签 */}
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <span
            key={index}
            className={cn(
              "text-sm",
              index <= currentStep ? "text-primary font-medium" : "text-foreground-light"
            )}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  )
}

export {
  Stepper,
  StepIndicator,
  StepContent,
  StepperActions,
  ProgressStepper,
}
export type {
  StepConfig,
  StepStatus,
  StepperProps,
  StepIndicatorProps,
  StepContentProps,
  StepperActionsProps,
  ProgressStepperProps,
}