"use client"

/**
 * ScrollArea 滚动区域组件 - 增强版
 * 
 * 支持：
 * - 渐变边缘
 * - 自动隐藏滚动条
 * - 滚动到顶部按钮
 * - 滚动阴影
 */

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  /** 是否显示渐变边缘 */
  fadeEdges?: boolean
  /** 渐变边缘方向 */
  fadeDirection?: "vertical" | "horizontal" | "both"
  /** 是否自动隐藏滚动条 */
  autoHide?: boolean
  /** 是否显示滚动到顶部按钮 */
  showScrollToTop?: boolean
  /** 滚动到顶部阈值 */
  scrollToTopThreshold?: number
  /** 是否显示滚动阴影 */
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

  // 监听滚动
  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport
      
      // 滚动到顶部按钮
      if (showScrollToTop) {
        setShowTopButton(scrollTop > scrollToTopThreshold)
      }

      // 滚动阴影
      if (showShadow) {
        setScrollState({
          top: scrollTop > 0,
          bottom: scrollTop < scrollHeight - clientHeight - 1,
        })
      }
    }

    viewport.addEventListener("scroll", handleScroll)
    handleScroll() // 初始检查

    return () => viewport.removeEventListener("scroll", handleScroll)
  }, [showScrollToTop, scrollToTopThreshold, showShadow])

  // 滚动到顶部
  const scrollToTop = () => {
    viewportRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {/* 滚动阴影 - 顶部 */}
      {showShadow && scrollState.top && (
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
      )}

      {/* 渐变边缘 - 顶部 */}
      {fadeEdges && (fadeDirection === "vertical" || fadeDirection === "both") && (
        <div className="absolute top-0 left-0 right-2 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
      )}

      <ScrollAreaPrimitive.Viewport 
        ref={viewportRef}
        className="h-full w-full rounded-[inherit]"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>

      {/* 渐变边缘 - 底部 */}
      {fadeEdges && (fadeDirection === "vertical" || fadeDirection === "both") && (
        <div className="absolute bottom-0 left-0 right-2 h-6 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      )}

      {/* 渐变边缘 - 左侧 */}
      {fadeEdges && (fadeDirection === "horizontal" || fadeDirection === "both") && (
        <div className="absolute top-0 left-0 bottom-2 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      )}

      {/* 渐变边缘 - 右侧 */}
      {fadeEdges && (fadeDirection === "horizontal" || fadeDirection === "both") && (
        <div className="absolute top-0 right-2 bottom-2 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      )}

      {/* 滚动阴影 - 底部 */}
      {showShadow && scrollState.bottom && (
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      )}

      {/* 滚动到顶部按钮 */}
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
  /** 滚动条尺寸 */
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
 * VirtualScrollArea - 虚拟滚动区域（用于大列表）
 */
interface VirtualScrollAreaProps {
  /** 项目总数 */
  itemCount: number
  /** 项目高度 */
  itemHeight: number
  /** 可见区域高度 */
  height: number
  /** 渲染项目 */
  renderItem: (index: number) => React.ReactNode
  /** 缓冲区大小 */
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
