"use client"

/**
 * Stepper - Step Indicator Component
 * 
 * Supports: 
 * - Horizontal/vertical layout
 * - Clickable navigation
 * - Multiple style variants
 * - Error/completed status
 */

import * as React from "react"
import { Check, X, Loader2, ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// StepStatus
type StepStatus = "pending" | "current" | "completed" | "error"

// StepConfig
interface StepConfig {
 /** Title */
 title: string
 /** Description */
 description?: string
 /** Icon */
 icon?: LucideIcon | React.ReactNode
 /** Status (auto-calculated) */
 status?: StepStatus
 /** Whether this step is optional (can be skipped) */
 optional?: boolean
 /** Custom content */
 content?: React.ReactNode
}

interface StepperProps {
 /** Step configuration */
 steps: StepConfig[]
 /** Current step (0-indexed) */
 currentStep: number
 /** Step change callback */
 onStepChange?: (step: number) => void
 /** Layout orientation */
 orientation?: "horizontal" | "vertical"
 /** Variant */
 variant?: "default" | "circle" | "dots" | "simple"
 /** Dimension */
 size?: "sm" | "default" | "lg"
 /** Whether steps are clickable for navigation */
 clickable?: boolean
 /** Whether steps must be completed in order */
 linear?: boolean
 /** Whether to show connector lines */
 showConnector?: boolean
 /** List of step indices with errors */
 errorSteps?: number[]
 /** Whether loading state is active */
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
 // Calculate step status
 const getStepStatus = (index: number): StepStatus => {
 if (errorSteps.includes(index)) return "error"
 if (index < currentStep) return "completed"
 if (index === currentStep) return "current"
 return "pending"
 }

 // Whether the step is clickable
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

 // Size styles
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
 {/* Step Indicator */}
 <StepIndicator
 step={index + 1}
 status={status}
 icon={step.icon}
 variant={variant}
 size={sizeStyles[size].indicator}
 loading={loading && status === "current"}
 />

 {/* Step Content */}
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
 <span className="ml-1 text-foreground-light font-normal">(Optional)</span>
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

 {/* Connector line */}
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
 * StepIndicator - Individual step indicator
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
 // Get indicator content
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

 // Variant styles
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
 * StepContent - Step content container
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
 * StepperActions - Step action buttons
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
 previousLabel = "Previous",
 nextLabel = "Next",
 completeLabel = "Done",
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
 * ProgressStepper - Progress bar step indicator
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
 {/* Progress Bar */}
 <div className="relative h-2 bg-surface-200 rounded-full overflow-hidden">
 <div
 className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
 style={{ width: `${progress}%` }}
 />
 </div>

 {/* Step Labels */}
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