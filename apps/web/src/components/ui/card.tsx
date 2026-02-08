"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Card Component - Supabase Style: Dark Theme, Surface Hierarchy
 */
const cardVariants = cva(
 "rounded-lg text-foreground transition-colors duration-150 ease-in-out",
 {
 variants: {
 variant: {
      // Default card - Supabase surface-100
      default: [
        "bg-surface-100 border border-border",
      ].join(""),
      // Elevated card with shadow
      elevated: [
        "bg-surface-100 border border-border",
        "shadow-md shadow-black/25",
      ].join(""),
      // Outline card with transparent background
      outline: [
        "bg-transparent border border-border",
      ].join(""),
      // Ghost card with no border
      ghost: [
        "bg-transparent border-0",
      ].join(""),
      // Muted card - Supabase surface-75
      muted: [
        "bg-surface-75 border border-border-muted",
      ].join(""),
      // Glass card with glass effect
      glass: [
        "bg-surface-100/70 backdrop-blur-xl border border-border/50",
      ].join(""),
      // Glass card - more transparent
      "glass-subtle": [
        "bg-surface-100/40 backdrop-blur-lg border border-border/30",
      ].join(""),
      // Gradient border card - brand green
      gradient: [
        "bg-surface-100 border-0 relative",
        "before:absolute before:inset-0 before:rounded-lg before:p-[1px]",
        "before:bg-gradient-to-br before:from-brand-500 before:via-brand-500/50 before:to-transparent",
        "before:-z-10",
      ].join(""),
      // Accent card with left brand border
      accent: [
        "bg-surface-100 border-l-4 border-l-brand-500 border border-border rounded-l-none",
      ].join(""),
      // Panel card - Supabase style panel
      panel: [
        "bg-surface-75 border border-border",
      ].join(""),
      // Statistics card - Supabase dashboard style
      stats: [
        "bg-surface-100 border border-border",
      ].join(""),
      // Brand highlight card with green background
      brand: [
        "bg-brand-200 border border-brand-400/30",
      ].join(""),
      // Warning card
      warning: [
        "bg-warning-200 border border-warning/30",
      ].join(""),
      // Destructive/error card
      destructive: [
        "bg-destructive-200 border border-destructive/30",
      ].join(""),
 },
 hover: {
 none: "",
 border: "hover:border-border-strong",
 shadow: "hover:shadow-lg hover:shadow-black/30",
 lift: "hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5",
      muted: "hover:bg-surface-200",
      // Interactive card: Supabase green border
      glow: "hover:border-brand-500 hover:shadow-brand-500/10",
      "glow-border": "hover:border-brand-500/50 hover:shadow-sm",
      // Scale/zoom effect
      scale: "hover:scale-[1.02]",
      // Combined interactive effect
      interactive: "hover:border-border-strong hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5",
 },
 padding: {
 none: "",
 xs: "p-3",
 sm: "p-4",
 // Default padding: 24px
 default: "p-6",
 lg: "p-8",
 xl: "p-10",
 },
 },
 defaultVariants: {
 variant: "default",
 hover: "none",
 padding: "none",
 },
 }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> {
  /** Whether interactive */
  interactive?: boolean
  /** Entry animation */
  animation?: "none" | "fade" | "slide-up" | "scale"
  /** Animation delay (ms) */
  animationDelay?: number
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
 ({ 
 className, 
 variant, 
 hover, 
 padding, 
 interactive = false,
 animation = "none",
 animationDelay,
 style,
 ...props 
 }, ref) => {
 const animationClass = {
 none: "",
 fade: "animate-fade-in",
 "slide-up": "animate-slide-up",
 scale: "animate-scale-in",
 }

 return (
 <div
 ref={ref}
 className={cn(
 cardVariants({ variant, hover, padding }),
 interactive && "cursor-pointer",
 animation !== "none" && animationClass[animation],
 className
 )}
 style={{
 ...style,
 animationDelay: animationDelay ? `${animationDelay}ms` : undefined,
 }}
 {...props}
 />
 )
 }
)
Card.displayName = "Card"

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to display bottom border */
  bordered?: boolean
  /** Right side action element */
  action?: React.ReactNode
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
 ({ className, bordered, action, children, ...props }, ref) => (
 <div
 ref={ref}
 className={cn(
 "flex flex-col space-y-1 px-5 py-4",
 bordered && "border-b border-border",
 action && "flex-row items-start justify-between gap-4",
 className
 )}
 {...props}
 >
 <div className="flex-1 min-w-0 space-y-1">
 {children}
 </div>
 {action && (
 <div className="shrink-0">{action}</div>
 )}
 </div>
 )
)
CardHeader.displayName = "CardHeader"

interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title size */
  size?: "default" | "sm" | "lg"
}

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
 ({ className, size = "default", ...props }, ref) => (
 <div
 ref={ref}
 className={cn(
 "font-medium leading-tight tracking-tight text-foreground",
 size === "sm" && "text-[13px]",
 size === "default" && "text-[13px]",
 size === "lg" && "text-base",
 className
 )}
 {...props}
 />
 )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
 HTMLDivElement,
 React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
 <div
 ref={ref}
 className={cn("text-[12px] text-foreground-light", className)}
 {...props}
 />
))
CardDescription.displayName = "CardDescription"

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
 /** Content padding */
 padding?: "default" | "sm" | "lg" | "none"
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
 ({ className, padding = "default", ...props }, ref) => (
 <div
 ref={ref}
 className={cn(
 padding === "default" && "p-5",
 padding === "sm" && "p-4",
 padding === "lg" && "p-6",
 padding === "none" && "p-0",
 className
 )}
 {...props}
 />
 )
)
CardContent.displayName = "CardContent"

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to display top border */
  bordered?: boolean
  /** Alignment direction */
  align?: "start" | "center" | "end" | "between"
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
 ({ className, bordered, align = "start", ...props }, ref) => {
 const alignClass = {
 start: "justify-start",
 center: "justify-center",
 end: "justify-end",
 between: "justify-between",
 }

 return (
 <div
 ref={ref}
 className={cn(
 "flex items-center gap-3 px-6 py-4",
 bordered && "border-t border-border bg-surface-75",
 alignClass[align],
 className
 )}
 {...props}
 />
 )
 }
)
CardFooter.displayName = "CardFooter"

/**
 * Spotlight Card - Card with Mouse-Following Light Effect
 */
interface SpotlightCardProps extends CardProps {
  /** Light effect color */
  spotlightColor?: string
  /** Light effect size */
  spotlightSize?: number
}

const SpotlightCard = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
 ({ 
 className, 
 spotlightColor = "rgba(62, 207, 142, 0.15)",
 spotlightSize = 300,
 children,
 ...props 
 }, ref) => {
 const cardRef = React.useRef<HTMLDivElement>(null)
 const [position, setPosition] = React.useState({ x: 0, y: 0 })
 const [isHovered, setIsHovered] = React.useState(false)

 const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
 if (!cardRef.current) return
 const rect = cardRef.current.getBoundingClientRect()
 setPosition({
 x: e.clientX - rect.left,
 y: e.clientY - rect.top,
 })
 }

 return (
 <Card
 ref={(node) => {
 (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node
 if (typeof ref === "function") ref(node)
 else if (ref) ref.current = node
 }}
 className={cn("relative overflow-hidden", className)}
 onMouseMove={handleMouseMove}
 onMouseEnter={() => setIsHovered(true)}
 onMouseLeave={() => setIsHovered(false)}
 {...props}
 >
 {/* Light Effect */}
 <div
 className="pointer-events-none absolute inset-0 transition-opacity duration-300"
 style={{
 opacity: isHovered ? 1 : 0,
 background: `radial-gradient(${spotlightSize}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent)`,
 }}
 />
 {children}
 </Card>
 )
 }
)
SpotlightCard.displayName = "SpotlightCard"

/**
 * GlowCard - Card with glowing edge effect
 */
interface GlowCardProps extends CardProps {
 /** Glow color */
 glowColor?: string
 /** Whether to show glow effect */
 alwaysGlow?: boolean
}

const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
 ({ 
 className, 
 glowColor = "#3ECF8E",
 alwaysGlow = false,
 children,
 ...props 
 }, ref) => {
 return (
 <div className="relative group">
 {/* Glow background */}
 <div
 className={cn(
 "absolute -inset-0.5 rounded-lg blur-sm transition-opacity duration-300",
 alwaysGlow ? "opacity-30" : "opacity-0 group-hover:opacity-30"
 )}
 style={{ backgroundColor: glowColor }}
 />
 <Card
 ref={ref}
 className={cn("relative", className)}
 {...props}
 >
 {children}
 </Card>
 </div>
 )
 }
)
GlowCard.displayName = "GlowCard"

/**
 * FlipCard - Card with flip animation
 */
interface FlipCardProps {
 front: React.ReactNode
 back: React.ReactNode
 className?: string
 flipOnHover?: boolean
 flipped?: boolean
 onFlip?: (flipped: boolean) => void
}

function FlipCard({ 
 front, 
 back, 
 className,
 flipOnHover = true,
 flipped: controlledFlipped,
 onFlip,
}: FlipCardProps) {
 const [internalFlipped, setInternalFlipped] = React.useState(false)
 const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped

 const handleClick = () => {
 if (!flipOnHover) {
 const newFlipped = !isFlipped
 setInternalFlipped(newFlipped)
 onFlip?.(newFlipped)
 }
 }

 return (
 <div 
 className={cn(
 "relative perspective-1000",
 flipOnHover && "group",
 className
 )}
 onClick={handleClick}
 style={{ perspective: "1000px" }}
 >
 <div 
 className={cn(
 "relative w-full h-full transition-transform duration-500 preserve-3d",
 flipOnHover && "group-hover:rotate-y-180",
 !flipOnHover && isFlipped && "rotate-y-180"
 )}
 style={{ 
 transformStyle: "preserve-3d",
 transform: !flipOnHover && isFlipped ? "rotateY(180deg)" : flipOnHover ? undefined : "rotateY(0deg)",
 }}
 >
 {/* Front face */}
 <div 
 className="absolute inset-0 backface-hidden"
 style={{ backfaceVisibility: "hidden" }}
 >
 {front}
 </div>
 {/* Back face */}
 <div 
 className="absolute inset-0 backface-hidden rotate-y-180"
 style={{ 
 backfaceVisibility: "hidden",
 transform: "rotateY(180deg)",
 }}
 >
 {back}
 </div>
 </div>
 </div>
 )
}

/**
 * ExpandableCard - Expandable card component
 */
interface ExpandableCardProps extends CardProps {
 /** Collapsed Content */
 collapsedContent: React.ReactNode
 /** Expandable content section */
 expandedContent: React.ReactNode
 /** Whether expanded */
 expanded?: boolean
 /** Default expanded state */
 defaultExpanded?: boolean
 /** Expand state change callback */
 onExpandedChange?: (expanded: boolean) => void
}

function ExpandableCard({ 
 collapsedContent,
 expandedContent,
 expanded: controlledExpanded,
 defaultExpanded = false,
 onExpandedChange,
 className,
 ...props
}: ExpandableCardProps) {
 const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded)
 const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded

 const toggle = () => {
 const newExpanded = !isExpanded
 setInternalExpanded(newExpanded)
 onExpandedChange?.(newExpanded)
 }

 return (
 <Card className={cn("overflow-hidden", className)} {...props}>
 <div onClick={toggle} className="cursor-pointer">
 {collapsedContent}
 </div>
 <div
 className={cn(
 "grid transition-all duration-300 ease-in-out",
 isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
 )}
 >
 <div className="overflow-hidden">
 {expandedContent}
 </div>
 </div>
 </Card>
 )
}

/**
 * CardStack - Stacked card effect
 */
interface CardStackProps {
 children: React.ReactNode[]
 className?: string
 offset?: number
}

function CardStack({ children, className, offset = 8 }: CardStackProps) {
 return (
 <div className={cn("relative", className)}>
 {React.Children.map(children, (child, index) => (
 <div
 key={index}
 className="absolute inset-0 transition-all duration-300"
 style={{
 transform: `translateY(${index * offset}px) scale(${1 - index * 0.03})`,
 zIndex: children.length - index,
 opacity: 1 - index * 0.15,
 }}
 >
 {child}
 </div>
 ))}
 </div>
 )
}

export { 
 Card, 
 CardHeader, 
 CardFooter, 
 CardTitle, 
 CardDescription, 
 CardContent,
 SpotlightCard,
 GlowCard,
 FlipCard,
 ExpandableCard,
 CardStack,
 cardVariants,
}
export type { 
 CardProps, 
 CardHeaderProps, 
 CardTitleProps, 
 CardContentProps, 
 CardFooterProps,
 SpotlightCardProps,
 GlowCardProps,
 FlipCardProps,
 ExpandableCardProps,
 CardStackProps,
}
