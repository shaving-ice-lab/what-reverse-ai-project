"use client"

/**
 * Dialog Component - Enhanced
 * 
 * Support: 
 * - Multiple type animation effects
 * - Multiple type dimensions
 * - Variant
 * - Icon and status
 */

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

// Overlay Variant
const overlayVariants = cva(
 [
 "fixed inset-0 z-50",
 "data-[state=open]:animate-in data-[state=closed]:animate-out",
 "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
 ],
 {
 variants: {
 blur: {
 none: "bg-black/60",
 sm: "bg-black/60",
 default: "bg-black/70",
 lg: "bg-black/80",
 },
 },
 defaultVariants: {
 blur: "none",
 },
 }
)

interface DialogOverlayProps
 extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>,
 VariantProps<typeof overlayVariants> {}

const DialogOverlay = React.forwardRef<
 React.ElementRef<typeof DialogPrimitive.Overlay>,
 DialogOverlayProps
>(({ className, blur, ...props }, ref) => (
 <DialogPrimitive.Overlay
 ref={ref}
 className={cn(overlayVariants({ blur }), className)}
 {...props}
 />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// Content Variant - Supabase Style
const contentVariants = cva(
 [
 "fixed z-50 w-full",
 "bg-surface-100 border border-border rounded-lg",
 "shadow-2xl shadow-black/50",
 "data-[state=open]:animate-in data-[state=closed]:animate-out",
 "duration-200",
 ],
 {
 variants: {
 position: {
 center: "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]",
 top: "left-[50%] top-[10%] translate-x-[-50%]",
 bottom: "left-[50%] bottom-[10%] translate-x-[-50%]",
 },
 animation: {
 default: [
 "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
 "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
 ],
 slide: [
 "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
 "data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4",
 ],
 "slide-up": [
 "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
 "data-[state=closed]:slide-out-to-top-4 data-[state=open]:slide-in-from-top-4",
 ],
 scale: [
 "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
 "data-[state=closed]:scale-95 data-[state=open]:scale-100",
 ],
 none: "",
 },
 size: {
 xs: "max-w-xs",
 sm: "max-w-sm",
 default: "max-w-md",
 lg: "max-w-lg",
 xl: "max-w-2xl",
 "2xl": "max-w-3xl",
 "3xl": "max-w-4xl",
 full: "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]",
 },
 },
 defaultVariants: {
 position: "center",
 animation: "default",
 size: "default",
 },
 }
)

interface DialogContentProps
 extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
 VariantProps<typeof contentVariants> {
 showClose?: boolean
 overlayBlur?: DialogOverlayProps["blur"]
}

const DialogContent = React.forwardRef<
 React.ElementRef<typeof DialogPrimitive.Content>,
 DialogContentProps
>(({ 
 className, 
 children, 
 position,
 animation,
 size, 
 showClose = true, 
 overlayBlur,
 ...props 
}, ref) => {
 return (
 <DialogPortal>
 <DialogOverlay blur={overlayBlur} />
 <DialogPrimitive.Content
 ref={ref}
 className={cn(
 contentVariants({ position, animation, size }),
 "p-6",
 className
 )}
 {...props}
 >
 {children}
 {showClose && (
 <DialogPrimitive.Close className={cn(
 "absolute right-4 top-4 rounded-md p-1.5",
 "text-foreground-muted hover:text-foreground hover:bg-surface-200",
 "transition-all duration-150",
 "focus:outline-none focus:ring-2 focus:ring-brand-500/50",
 "disabled:pointer-events-none",
 "hover:rotate-90"
 )}>
 <X className="h-4 w-4" />
 <span className="sr-only">Close</span>
 </DialogPrimitive.Close>
 )}
 </DialogPrimitive.Content>
 </DialogPortal>
 )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

// Header Enhanced
interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
 /** Icon */
 icon?: React.ReactNode
 /** IconColor/Variant */
 iconVariant?: "default" | "success" | "warning" | "error" | "info"
}

const iconVariantStyles = {
 default: "bg-surface-200 text-foreground",
 success: "bg-brand-200 text-brand-500",
 warning: "bg-warning-200 text-warning-400",
 error: "bg-destructive-200 text-destructive-400",
 info: "bg-surface-300 text-foreground-light",
}

const DialogHeader = ({
 className,
 icon,
 iconVariant = "default",
 children,
 ...props
}: DialogHeaderProps) => (
 <div
 className={cn(
 "flex flex-col mb-4",
 icon && "items-center text-center",
 className
 )}
 {...props}
 >
 {icon && (
 <div className={cn(
 "w-12 h-12 rounded-full flex items-center justify-center mb-4",
 iconVariantStyles[iconVariant]
 )}>
 {icon}
 </div>
 )}
 <div className="space-y-1">
 {children}
 </div>
 </div>
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
 className,
 ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
 <div
 className={cn(
 "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-6",
 className
 )}
 {...props}
 />
)
DialogFooter.displayName = "DialogFooter"

// Title Enhanced
interface DialogTitleProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {
 size?: "sm" | "default" | "lg"
}

const DialogTitle = React.forwardRef<
 React.ElementRef<typeof DialogPrimitive.Title>,
 DialogTitleProps
>(({ className, size = "default", ...props }, ref) => (
 <DialogPrimitive.Title
 ref={ref}
 className={cn(
 "font-semibold text-foreground",
 size === "sm" && "text-sm",
 size === "default" && "text-base",
 size === "lg" && "text-lg",
 className
 )}
 {...props}
 />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
 React.ElementRef<typeof DialogPrimitive.Description>,
 React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
 <DialogPrimitive.Description
 ref={ref}
 className={cn("text-[13px] text-foreground-light", className)}
 {...props}
 />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

/**
 * AlertDialog - WarningDialog
 */
interface AlertDialogProps {
 open?: boolean
 onOpenChange?: (open: boolean) => void
 title: string
 description?: string
 type?: "info" | "success" | "warning" | "error"
 confirmText?: string
 cancelText?: string
 onConfirm?: () => void
 onCancel?: () => void
 loading?: boolean
}

const alertIcons = {
 info: <Info className="w-6 h-6" />,
 success: <CheckCircle2 className="w-6 h-6" />,
 warning: <AlertTriangle className="w-6 h-6" />,
 error: <AlertCircle className="w-6 h-6" />,
}

const alertIconVariants: Record<string, DialogHeaderProps["iconVariant"]> = {
 info: "info",
 success: "success",
 warning: "warning",
 error: "error",
}

function AlertDialog({
 open,
 onOpenChange,
 title,
 description,
 type = "info",
 confirmText = "Confirm",
 cancelText = "Cancel",
 onConfirm,
 onCancel,
 loading = false,
}: AlertDialogProps) {
 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent size="sm" animation="scale" showClose={false}>
 <DialogHeader icon={alertIcons[type]} iconVariant={alertIconVariants[type]}>
 <DialogTitle className="text-center">{title}</DialogTitle>
 {description && (
 <DialogDescription className="text-center">{description}</DialogDescription>
 )}
 </DialogHeader>
 <DialogFooter className="sm:justify-center">
 <button
 onClick={() => {
 onCancel?.()
 onOpenChange?.(false)
 }}
 className={cn(
 "px-4 py-2 rounded-md text-sm font-medium",
 "bg-surface-200 text-foreground hover:bg-surface-300 border border-border",
 "transition-colors"
 )}
 >
 {cancelText}
 </button>
 <button
 onClick={() => {
 onConfirm?.()
 if (!loading) onOpenChange?.(false)
 }}
 disabled={loading}
 className={cn(
 "px-4 py-2 rounded-md text-sm font-medium",
 "bg-brand-500 text-background hover:bg-brand-600",
 "transition-colors",
 "disabled:opacity-50 disabled:cursor-not-allowed",
 type === "error" && "bg-destructive-400 hover:bg-destructive",
 type === "warning" && "bg-warning-400 hover:bg-warning text-background"
 )}
 >
 {loading ? (
 <span className="flex items-center gap-2">
 <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
 </svg>
 Processing...
 </span>
 ) : confirmText}
 </button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 )
}

/**
 * DrawerDialog - DrawerDialog
 */
interface DrawerDialogProps {
 open?: boolean
 onOpenChange?: (open: boolean) => void
 title?: string
 description?: string
 children?: React.ReactNode
 side?: "left" | "right" | "top" | "bottom"
 size?: "sm" | "default" | "lg" | "xl" | "full"
}

const drawerSideStyles = {
 left: "left-0 top-0 h-full rounded-r-2xl rounded-l-none data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
 right: "right-0 top-0 h-full rounded-l-2xl rounded-r-none data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
 top: "top-0 left-0 w-full rounded-b-2xl rounded-t-none data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
 bottom: "bottom-0 left-0 w-full rounded-t-2xl rounded-b-none data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
}

const drawerSizeStyles = {
 left: { sm: "w-72", default: "w-80", lg: "w-96", xl: "w-[480px]", full: "w-screen" },
 right: { sm: "w-72", default: "w-80", lg: "w-96", xl: "w-[480px]", full: "w-screen" },
 top: { sm: "h-48", default: "h-64", lg: "h-80", xl: "h-96", full: "h-screen" },
 bottom: { sm: "h-48", default: "h-64", lg: "h-80", xl: "h-96", full: "h-screen" },
}

function DrawerDialog({
 open,
 onOpenChange,
 title,
 description,
 children,
 side = "right",
 size = "default",
}: DrawerDialogProps) {
 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogPortal>
 <DialogOverlay blur="none" />
 <DialogPrimitive.Content
 className={cn(
 "fixed z-50 bg-surface-100 border border-border shadow-2xl shadow-black/50",
 "data-[state=open]:animate-in data-[state=closed]:animate-out",
 "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
 "duration-300",
 drawerSideStyles[side],
 drawerSizeStyles[side][size],
 "p-6"
 )}
 >
 <DialogPrimitive.Close className={cn(
 "absolute right-4 top-4 rounded-md p-1.5",
 "text-foreground-muted hover:text-foreground hover:bg-surface-200",
 "transition-colors duration-150",
 "focus:outline-none focus:ring-2 focus:ring-brand-500/50"
 )}>
 <X className="h-4 w-4" />
 <span className="sr-only">Close</span>
 </DialogPrimitive.Close>
 
 {(title || description) && (
 <DialogHeader>
 {title && <DialogTitle>{title}</DialogTitle>}
 {description && <DialogDescription>{description}</DialogDescription>}
 </DialogHeader>
 )}
 
 {children}
 </DialogPrimitive.Content>
 </DialogPortal>
 </Dialog>
 )
}

export {
 Dialog,
 DialogPortal,
 DialogOverlay,
 DialogTrigger,
 DialogClose,
 DialogContent,
 DialogHeader,
 DialogFooter,
 DialogTitle,
 DialogDescription,
 AlertDialog,
 DrawerDialog,
 contentVariants,
 overlayVariants,
}
export type {
 DialogContentProps,
 DialogOverlayProps,
 DialogHeaderProps,
 DialogTitleProps,
 AlertDialogProps,
 DrawerDialogProps,
}
