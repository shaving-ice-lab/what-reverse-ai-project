import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Input InputComponent - Supabase Style: DarkBackground, Green
 */
const inputVariants = cva(
 [
 "flex w-full rounded-md border text-[13px] text-foreground",
 "bg-surface-100",
 "transition-all duration-150 ease-in-out",
 "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
 "placeholder:text-foreground-muted",
 "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-100",
 "selection:bg-brand-500/30",
 ].join(""),
 {
 variants: {
 variant: {
 // Supabase DefaultInputstyle
 default: [
 "border-border bg-surface-100",
 "hover:border-border-strong",
 "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500",
 ].join(""),
 // moreBackground
 dark: [
 "bg-surface-200 border-border",
 "hover:border-border-strong",
 "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500",
 ].join(""),
 // TransparentBackground
 ghost: [
 "border-transparent bg-surface-100",
 "hover:bg-surface-200 hover:border-border",
 "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:bg-surface-200",
 ].join(""),
 // ErrorStatus
 error: [
 "border-destructive-400/60 bg-surface-200",
 "focus:outline-none focus:ring-1 focus:ring-destructive/30 focus:border-destructive-400",
 ].join(""),
 // SuccessStatus
 success: [
 "border-brand-500/60 bg-surface-200",
 "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500",
 ].join(""),
 // Search Boxstyle
 search: [
 "border-border bg-surface-100",
 "hover:bg-surface-200",
 "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:bg-surface-200 focus:border-brand-500",
 ].join(""),
 },
 inputSize: {
 // Supabase Dimension
 default: "h-8 px-3 py-1.5",
 sm: "h-7 text-[12px] px-3 py-1",
 lg: "h-10 px-4 py-2",
 xl: "h-11 text-[14px] px-4 py-2.5",
 },
 },
 defaultVariants: {
 variant: "default",
 inputSize: "default",
 },
 }
)

export interface InputProps
 extends Omit<React.ComponentProps<"input">, "size">,
 VariantProps<typeof inputVariants> {
 /** ErrorStatus */
 error?: boolean
 /** Left sideIcon */
 leftIcon?: React.ReactNode
 /** Right sideIcon */
 rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
 ({ className, type, variant, inputSize, error, leftIcon, rightIcon, ...props }, ref) => {
 const inputElement = (
 <input
 type={type}
 className={cn(
 inputVariants({ 
 variant: error ? "error" : variant, 
 inputSize, 
 className: leftIcon || rightIcon ? "" : className 
 }),
 leftIcon && "pl-9",
 rightIcon && "pr-9",
 )}
 ref={ref}
 {...props}
 />
 )

 if (leftIcon || rightIcon) {
 return (
 <div className={cn("relative", className)}>
 {leftIcon && (
 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
 {leftIcon}
 </div>
 )}
 {inputElement}
 {rightIcon && (
 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
 {rightIcon}
 </div>
 )}
 </div>
 )
 }

 return inputElement
 }
)
Input.displayName = "Input"

export { Input, inputVariants }
