"use client"

/**
 * Tooltip TooltipComponent - Enhanced
 * 
 * Supportmultipletypestyle, ColorThemeandContent
 */

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = React.forwardRef<
 React.ElementRef<typeof TooltipPrimitive.Trigger>,
 React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ children, asChild, ...props }, ref) => {
 if (asChild && React.isValidElement(children) && children.type === React.Fragment) {
 return (
 <TooltipPrimitive.Trigger ref={ref} asChild {...props}>
 <span className="contents">{children.props.children}</span>
 </TooltipPrimitive.Trigger>
 )
 }

 return (
 <TooltipPrimitive.Trigger ref={ref} asChild={asChild} {...props}>
 {children}
 </TooltipPrimitive.Trigger>
 )
})
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName

// Tooltip ContentstyleVariant - Supabase Style
const tooltipVariants = cva(
 [
 "z-50 overflow-hidden rounded-md text-xs",
 "animate-in fade-in-0 zoom-in-95",
 "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
 "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
 "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
 ],
 {
 variants: {
 variant: {
 default: "bg-surface-100 text-foreground px-2.5 py-1.5 border border-border shadow-md shadow-black/20",
 dark: "bg-surface-200 text-foreground px-2.5 py-1.5 border border-border",
 light: "bg-surface-100 text-foreground px-2.5 py-1.5 border border-border shadow-lg",
 primary: "bg-brand-500 text-background px-2.5 py-1.5 shadow-lg shadow-brand-500/20",
 info: "bg-surface-200 text-foreground-light px-2.5 py-1.5 border border-border shadow-lg",
 warning: "bg-warning-200 text-warning px-2.5 py-1.5 border border-warning/30 shadow-lg",
 error: "bg-destructive-200 text-destructive px-2.5 py-1.5 border border-destructive/30 shadow-lg",
 glass: [
 "bg-surface-100",
 "text-foreground px-3 py-2",
 "border border-border",
 "shadow-md shadow-black/20",
 ].join(""),
 },
 size: {
 sm: "text-[11px] px-2 py-1 rounded-md",
 default: "text-xs px-2.5 py-1.5",
 lg: "text-sm px-3 py-2",
 },
 },
 defaultVariants: {
 variant: "default",
 size: "default",
 },
 }
)

export interface TooltipContentProps
 extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
 VariantProps<typeof tooltipVariants> {
 showArrow?: boolean
}

const TooltipContent = React.forwardRef<
 React.ElementRef<typeof TooltipPrimitive.Content>,
 TooltipContentProps
>(({ className, sideOffset = 4, variant, size, showArrow = false, children, ...props }, ref) => (
 <TooltipPrimitive.Portal>
 <TooltipPrimitive.Content
 ref={ref}
 sideOffset={sideOffset}
 className={cn(tooltipVariants({ variant, size }), className)}
 {...props}
 >
 {children}
 {showArrow && (
 <TooltipPrimitive.Arrow 
 className={cn(
 "fill-current",
 variant === "default" && "fill-surface-100",
 variant === "dark" && "fill-surface-200",
 variant === "light" && "fill-surface-100",
 variant === "primary" && "fill-brand-500",
 variant === "info" && "fill-surface-200",
 variant === "warning" && "fill-warning-200",
 variant === "error" && "fill-destructive-200",
 )}
 />
 )}
 </TooltipPrimitive.Content>
 </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

/**
 * RichTooltip - Content Tooltip
 * 
 * SupportTitle, Description, Icon, Shortcutkeyetc
 */
interface RichTooltipProps {
 trigger: React.ReactNode
 title?: string
 description?: string
 icon?: React.ReactNode
 shortcut?: string[]
 side?: "top" | "right" | "bottom" | "left"
 align?: "start" | "center" | "end"
 delayDuration?: number
 className?: string
 children?: React.ReactNode
}

export function RichTooltip({
 trigger,
 title,
 description,
 icon,
 shortcut,
 side = "top",
 align = "center",
 delayDuration = 200,
 className,
 children,
}: RichTooltipProps) {
 return (
 <TooltipProvider delayDuration={delayDuration}>
 <Tooltip>
 <TooltipTrigger asChild>{trigger}</TooltipTrigger>
 <TooltipContent
 side={side}
 align={align}
 variant="default"
 size="lg"
 className={cn("max-w-xs", className)}
 >
 <div className="flex items-start gap-3">
 {icon && (
 <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
 {icon}
 </div>
 )}
 <div className="flex-1 min-w-0">
 {title && (
 <div className="font-medium text-foreground mb-0.5">{title}</div>
 )}
 {description && (
 <div className="text-foreground-light text-[11px] leading-relaxed">
 {description}
 </div>
 )}
 {children}
 </div>
 </div>
 {shortcut && shortcut.length > 0 && (
 <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
 {shortcut.map((key, i) => (
 <React.Fragment key={i}>
 <kbd className="px-1.5 py-0.5 rounded bg-surface-200 text-[10px] font-mono text-foreground-light">
 {key}
 </kbd>
 {i < shortcut.length - 1 && (
 <span className="text-foreground-light/50 text-[10px]">+</span>
 )}
 </React.Fragment>
 ))}
 </div>
 )}
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>
 )
}

/**
 * SimpleTooltip - Simple Tooltip Wrapper
 */
interface SimpleTooltipProps {
 children: React.ReactNode
 content: React.ReactNode
 side?: "top" | "right" | "bottom" | "left"
 align?: "start" | "center" | "end"
 delayDuration?: number
 variant?: VariantProps<typeof tooltipVariants>["variant"]
}

export function SimpleTooltip({
 children,
 content,
 side = "top",
 align = "center",
 delayDuration = 200,
 variant = "default",
}: SimpleTooltipProps) {
 return (
 <TooltipProvider delayDuration={delayDuration}>
 <Tooltip>
 <TooltipTrigger asChild>{children}</TooltipTrigger>
 <TooltipContent side={side} align={align} variant={variant}>
 {content}
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>
 )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, tooltipVariants }
