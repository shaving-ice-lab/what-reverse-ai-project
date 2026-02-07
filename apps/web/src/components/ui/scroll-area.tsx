"use client"

/**
 * ScrollArea ScrollRegionComponent - Enhanced
 * 
 * Support: 
 * - GradientEdge
 * - AutoHideScroll
 * - ScrolltoTopButton
 * - ScrollShadow
 */

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
 /** isnoDisplayGradientEdge */
 fadeEdges?: boolean
 /** GradientEdgemethod */
 fadeDirection?: "vertical" | "horizontal" | "both"
 /** isnoAutoHideScroll */
 autoHide?: boolean
 /** isnoDisplayScrolltoTopButton */
 showScrollToTop?: boolean
 /** ScrolltoTopvalue */
 scrollToTopThreshold?: number
 /** isnoDisplayScrollShadow */
 showShadow?: boolean
}

const ScrollArea = React.forwardRef<
 React.ElementRef<typeof ScrollAreaPrimitive.Root>,
 ScrollAreaProps
>(({ 
 className, 
 children, 
 fadeEdges = false,
 fadeDirection = "vertical",
 autoHide = false,
 showScrollToTop = false,
 scrollToTopThreshold = 200,
 showShadow = false,
 ...props 
}, ref) => {
 const viewportRef = React.useRef<HTMLDivElement>(null)
 const [showTopButton, setShowTopButton] = React.useState(false)
 const [scrollState, setScrollState] = React.useState({ top: false, bottom: false })

 // ListenScroll
 React.useEffect(() => {
 const viewport = viewportRef.current
 if (!viewport) return

 const handleScroll = () => {
 const { scrollTop, scrollHeight, clientHeight } = viewport
 
 // ScrolltoTopButton
 if (showScrollToTop) {
 setShowTopButton(scrollTop > scrollToTopThreshold)
 }

 // ScrollShadow
 if (showShadow) {
 setScrollState({
 top: scrollTop > 0,
 bottom: scrollTop < scrollHeight - clientHeight - 1,
 })
 }
 }

 viewport.addEventListener("scroll", handleScroll)
 handleScroll() // InitialCheck

 return () => viewport.removeEventListener("scroll", handleScroll)
 }, [showScrollToTop, scrollToTopThreshold, showShadow])

 // ScrolltoTop
 const scrollToTop = () => {
 viewportRef.current?.scrollTo({ top: 0, behavior: "smooth" })
 }

 return (
 <ScrollAreaPrimitive.Root
 ref={ref}
 className={cn("relative overflow-hidden", className)}
 {...props}
 >
 {/* ScrollShadow - Top */}
 {showShadow && scrollState.top && (
 <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
 )}

 {/* GradientEdge - Top */}
 {fadeEdges && (fadeDirection === "vertical" || fadeDirection === "both") && (
 <div className="absolute top-0 left-0 right-2 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
 )}

 <ScrollAreaPrimitive.Viewport 
 ref={viewportRef}
 className="h-full w-full rounded-[inherit]"
 >
 {children}
 </ScrollAreaPrimitive.Viewport>

 {/* GradientEdge - Footer */}
 {fadeEdges && (fadeDirection === "vertical" || fadeDirection === "both") && (
 <div className="absolute bottom-0 left-0 right-2 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
 )}

 {/* GradientEdge - Left side */}
 {fadeEdges && (fadeDirection === "horizontal" || fadeDirection === "both") && (
 <div className="absolute top-0 left-0 bottom-2 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
 )}

 {/* GradientEdge - Right side */}
 {fadeEdges && (fadeDirection === "horizontal" || fadeDirection === "both") && (
 <div className="absolute top-0 right-2 bottom-2 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
 )}

 {/* ScrollShadow - Footer */}
 {showShadow && scrollState.bottom && (
 <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
 )}

 {/* ScrolltoTopButton */}
 {showScrollToTop && (
 <button
 onClick={scrollToTop}
 className={cn(
 "absolute bottom-4 right-4 z-20",
 "w-8 h-8 rounded-full",
 "bg-card border border-border shadow-lg",
 "flex items-center justify-center",
 "text-muted-foreground hover:text-foreground",
 "transition-all duration-200",
 showTopButton 
 ? "opacity-100 translate-y-0" 
 : "opacity-0 translate-y-4 pointer-events-none"
 )}
 >
 <ChevronUp className="w-4 h-4" />
 </button>
 )}

 <ScrollBar className={autoHide ? "opacity-0 hover:opacity-100 transition-opacity" : ""} />
 <ScrollBar orientation="horizontal" className={autoHide ? "opacity-0 hover:opacity-100 transition-opacity" : ""} />
 <ScrollAreaPrimitive.Corner />
 </ScrollAreaPrimitive.Root>
 )
})
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

interface ScrollBarProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
 /** ScrollDimension */
 size?: "thin" | "default" | "thick"
}

const ScrollBar = React.forwardRef<
 React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
 ScrollBarProps
>(({ className, orientation = "vertical", size = "default", ...props }, ref) => {
 const sizeStyles = {
 thin: orientation === "vertical" ? "w-1.5" : "h-1.5",
 default: orientation === "vertical" ? "w-2" : "h-2",
 thick: orientation === "vertical" ? "w-2.5" : "h-2.5",
 }

 return (
 <ScrollAreaPrimitive.ScrollAreaScrollbar
 ref={ref}
 orientation={orientation}
 className={cn(
 "flex touch-none select-none transition-all duration-150",
 orientation === "vertical" && cn("h-full border-l border-l-transparent p-[1px]", sizeStyles[size]),
 orientation === "horizontal" && cn("flex-col border-t border-t-transparent p-[1px]", sizeStyles[size]),
 className
 )}
 {...props}
 >
 <ScrollAreaPrimitive.ScrollAreaThumb 
 className={cn(
 "relative flex-1 rounded-full",
 "bg-border hover:bg-muted-foreground/50",
 "transition-colors duration-150"
 )}
 />
 </ScrollAreaPrimitive.ScrollAreaScrollbar>
 )
})
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

/**
 * VirtualScrollArea - VirtualScrollRegion(Used forlargeList)
 */
interface VirtualScrollAreaProps {
 /** itemTotal */
 itemCount: number
 /** itemHeight */
 itemHeight: number
 /** canRegionHeight */
 height: number
 /** Renderitem */
 renderItem: (index: number) => React.ReactNode
 /** BufferSize */
 overscan?: number
 className?: string
}

function VirtualScrollArea({
 itemCount,
 itemHeight,
 height,
 renderItem,
 overscan = 3,
 className,
}: VirtualScrollAreaProps) {
 const [scrollTop, setScrollTop] = React.useState(0)
 const containerRef = React.useRef<HTMLDivElement>(null)

 const totalHeight = itemCount * itemHeight
 const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
 const endIndex = Math.min(
 itemCount - 1,
 Math.floor((scrollTop + height) / itemHeight) + overscan
 )

 const visibleItems = []
 for (let i = startIndex; i <= endIndex; i++) {
 visibleItems.push(
 <div
 key={i}
 style={{
 position: "absolute",
 top: i * itemHeight,
 left: 0,
 right: 0,
 height: itemHeight,
 }}
 >
 {renderItem(i)}
 </div>
 )
 }

 const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
 setScrollTop(e.currentTarget.scrollTop)
 }

 return (
 <div
 ref={containerRef}
 className={cn("relative overflow-auto", className)}
 style={{ height }}
 onScroll={handleScroll}
 >
 <div style={{ height: totalHeight, position: "relative" }}>
 {visibleItems}
 </div>
 </div>
 )
}

export { ScrollArea, ScrollBar, VirtualScrollArea }
export type { ScrollAreaProps, ScrollBarProps, VirtualScrollAreaProps }
