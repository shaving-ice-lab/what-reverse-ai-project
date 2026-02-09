"use client"

/**
 * Accordion Component - Enhanced
 * 
 * Support: 
 * - Multiple type style variants
 * - Smooth animation
 * - Icon custom
 * - Nested support
 */

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown, Plus, Minus } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Accordion Component
const Accordion = AccordionPrimitive.Root

// AccordionItem Variant
const accordionItemVariants = cva(
 "transition-all duration-200",
 {
 variants: {
 variant: {
 default: "border-b border-border",
 card: "bg-surface-100 border border-border rounded-xl mb-2 overflow-hidden",
 ghost: "border-b border-transparent hover:border-border",
 separated: "bg-surface-200/50 rounded-lg mb-2 overflow-hidden",
 outline: "border border-border rounded-lg mb-2 overflow-hidden",
 },
 },
 defaultVariants: {
 variant: "default",
 },
 }
)

interface AccordionItemProps
 extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>,
 VariantProps<typeof accordionItemVariants> {}

const AccordionItem = React.forwardRef<
 React.ElementRef<typeof AccordionPrimitive.Item>,
 AccordionItemProps
>(({ className, variant, ...props }, ref) => (
 <AccordionPrimitive.Item
 ref={ref}
 className={cn(accordionItemVariants({ variant }), className)}
 {...props}
 />
))
AccordionItem.displayName = "AccordionItem"

// AccordionTrigger Variant
const accordionTriggerVariants = cva(
 [
 "flex flex-1 items-center justify-between py-4 text-sm font-medium",
 "transition-all duration-200",
 "hover:text-foreground",
 "[&[data-state=open]>svg]:rotate-180",
 "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2",
 ],
 {
 variants: {
 variant: {
 default: "px-0",
 card: "px-4 hover:bg-surface-200/50",
 ghost: "px-0",
 separated: "px-4 hover:bg-surface-200",
 outline: "px-4 hover:bg-surface-200/50",
 },
 },
 defaultVariants: {
 variant: "default",
 },
 }
)

type IconType = "chevron" | "plus-minus" | "none"

interface AccordionTriggerProps
 extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>,
 VariantProps<typeof accordionTriggerVariants> {
 /** IconType */
 iconType?: IconType
 /** Left sideIcon */
 leftIcon?: React.ReactNode
 /** Subtitle */
 subtitle?: string
}

const AccordionTrigger = React.forwardRef<
 React.ElementRef<typeof AccordionPrimitive.Trigger>,
 AccordionTriggerProps
>(({ className, children, variant, iconType = "chevron", leftIcon, subtitle, ...props }, ref) => {
 const [isOpen, setIsOpen] = React.useState(false)

 return (
 <AccordionPrimitive.Header className="flex">
 <AccordionPrimitive.Trigger
 ref={ref}
 className={cn(accordionTriggerVariants({ variant }), className)}
 onPointerDown={() => {
 // DetectCurrentStatus
 const trigger = document.activeElement as HTMLElement
 const state = trigger?.getAttribute?.("data-state")
 setIsOpen(state === "closed")
 }}
 {...props}
 >
 <div className="flex items-center gap-3">
 {leftIcon && (
 <span className="shrink-0 text-foreground-muted">{leftIcon}</span>
 )}
 <div className="text-left">
 <div>{children}</div>
 {subtitle && (
 <div className="text-xs text-foreground-muted font-normal mt-0.5">
 {subtitle}
 </div>
 )}
 </div>
 </div>
 
 {iconType === "chevron" && (
 <ChevronDown className="h-4 w-4 shrink-0 text-foreground-muted transition-transform duration-300" />
 )}
 {iconType === "plus-minus" && (
 <div className="shrink-0 text-foreground-muted">
 {isOpen ? (
 <Minus className="h-4 w-4" />
 ) : (
 <Plus className="h-4 w-4" />
 )}
 </div>
 )}
 </AccordionPrimitive.Trigger>
 </AccordionPrimitive.Header>
 )
})
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

// AccordionContent Variant
const accordionContentVariants = cva(
 [
 "overflow-hidden text-sm",
 "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
 ],
 {
 variants: {
 variant: {
 default: "",
 card: "border-t border-border",
 ghost: "",
 separated: "border-t border-border/50",
 outline: "border-t border-border",
 },
 },
 defaultVariants: {
 variant: "default",
 },
 }
)

interface AccordionContentProps
 extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>,
 VariantProps<typeof accordionContentVariants> {}

const AccordionContent = React.forwardRef<
 React.ElementRef<typeof AccordionPrimitive.Content>,
 AccordionContentProps
>(({ className, children, variant, ...props }, ref) => (
 <AccordionPrimitive.Content
 ref={ref}
 className={cn(accordionContentVariants({ variant }), className)}
 {...props}
 >
 <div className={cn(
 "pb-4 pt-0 text-foreground-muted",
 variant === "default" || variant === "ghost" ? "" : "px-4"
 )}>
 {children}
 </div>
 </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

/**
 * SimpleAccordion - SimpleWrapper
 */
interface SimpleAccordionItem {
 value: string
 title: string
 subtitle?: string
 content: React.ReactNode
 icon?: React.ReactNode
 disabled?: boolean
}

interface SimpleAccordionProps {
 items: SimpleAccordionItem[]
 type?: "single" | "multiple"
 defaultValue?: string | string[]
 variant?: "default" | "card" | "ghost" | "separated" | "outline"
 iconType?: IconType
 collapsible?: boolean
 className?: string
}

function SimpleAccordion({
 items,
 type = "single",
 defaultValue,
 variant = "default",
 iconType = "chevron",
 collapsible = true,
 className,
}: SimpleAccordionProps) {
 const accordionProps = type === "single" 
 ? { 
 type: "single" as const, 
 defaultValue: defaultValue as string | undefined,
 collapsible,
 }
 : { 
 type: "multiple" as const, 
 defaultValue: defaultValue as string[] | undefined,
 }

 return (
 <Accordion {...accordionProps} className={className}>
 {items.map((item) => (
 <AccordionItem key={item.value} value={item.value} variant={variant} disabled={item.disabled}>
 <AccordionTrigger 
 variant={variant} 
 iconType={iconType}
 leftIcon={item.icon}
 subtitle={item.subtitle}
 >
 {item.title}
 </AccordionTrigger>
 <AccordionContent variant={variant}>
 {item.content}
 </AccordionContent>
 </AccordionItem>
 ))}
 </Accordion>
 )
}

/**
 * FAQAccordion - FAQ style
 */
interface FAQItem {
 question: string
 answer: string | React.ReactNode
}

interface FAQAccordionProps {
 items: FAQItem[]
 className?: string
}

function FAQAccordion({ items, className }: FAQAccordionProps) {
 return (
 <Accordion type="single" collapsible className={className}>
 {items.map((item, index) => (
 <AccordionItem key={index} value={`faq-${index}`} variant="card">
 <AccordionTrigger variant="card" iconType="plus-minus">
 {item.question}
 </AccordionTrigger>
 <AccordionContent variant="card">
 {item.answer}
 </AccordionContent>
 </AccordionItem>
 ))}
 </Accordion>
 )
}

// CSS Animation
const accordionStyles = `
 @keyframes accordion-down {
 from {
 height: 0;
 opacity: 0;
 }
 to {
 height: var(--radix-accordion-content-height);
 opacity: 1;
 }
 }

 @keyframes accordion-up {
 from {
 height: var(--radix-accordion-content-height);
 opacity: 1;
 }
 to {
 height: 0;
 opacity: 0;
 }
 }

 .animate-accordion-down {
 animation: accordion-down 0.2s ease-out;
 }

 .animate-accordion-up {
 animation: accordion-up 0.2s ease-out;
 }
`

// enterstyle
if (typeof document !== "undefined") {
 const styleId = "accordion-styles"
 if (!document.getElementById(styleId)) {
 const style = document.createElement("style")
 style.id = styleId
 style.textContent = accordionStyles
 document.head.appendChild(style)
 }
}

export {
 Accordion,
 AccordionItem,
 AccordionTrigger,
 AccordionContent,
 SimpleAccordion,
 FAQAccordion,
 accordionItemVariants,
 accordionTriggerVariants,
 accordionContentVariants,
}
export type {
 AccordionItemProps,
 AccordionTriggerProps,
 AccordionContentProps,
 SimpleAccordionProps,
 FAQAccordionProps,
}