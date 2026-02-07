/**
 * Skeleton SkeletonComponent - Enhanced
 * 
 * SupportmultipletypeAnimationEffectandPresetLayout
 */

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
 variant?: "default" | "shimmer" | "pulse" | "wave"
 rounded?: "none" | "sm" | "md" | "lg" | "full"
}

function Skeleton({
 className,
 variant = "pulse",
 rounded = "md",
 ...props
}: SkeletonProps) {
 const roundedStyles = {
 none: "rounded-none",
 sm: "rounded-sm",
 md: "rounded-md",
 lg: "rounded-lg",
 full: "rounded-full",
 }

 const variantStyles = {
 default: "bg-surface-200",
 pulse: "bg-surface-200 animate-pulse",
 shimmer: "bg-surface-200 overflow-hidden relative before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent",
 wave: "bg-surface-200 animate-skeleton-wave",
 }

 return (
 <div
 className={cn(
 roundedStyles[rounded],
 variantStyles[variant],
 className
 )}
 {...props}
 />
 )
}

/**
 * SkeletonText - TextSkeleton
 */
interface SkeletonTextProps {
 lines?: number
 className?: string
 lastLineWidth?: string
 variant?: SkeletonProps["variant"]
}

function SkeletonText({ 
 lines = 3, 
 className,
 lastLineWidth = "60%",
 variant = "pulse",
}: SkeletonTextProps) {
 return (
 <div className={cn("space-y-2", className)}>
 {Array.from({ length: lines }).map((_, i) => (
 <Skeleton
 key={i}
 variant={variant}
 className="h-4"
 style={{ 
 width: i === lines - 1 ? lastLineWidth : "100%",
 animationDelay: `${i * 100}ms`,
 }}
 />
 ))}
 </div>
 )
}

/**
 * SkeletonAvatar - AvatarSkeleton
 */
interface SkeletonAvatarProps {
 size?: "xs" | "sm" | "md" | "lg" | "xl"
 className?: string
 variant?: SkeletonProps["variant"]
}

function SkeletonAvatar({ 
 size = "md", 
 className,
 variant = "pulse",
}: SkeletonAvatarProps) {
 const sizes = {
 xs: "w-6 h-6",
 sm: "w-8 h-8",
 md: "w-10 h-10",
 lg: "w-12 h-12",
 xl: "w-16 h-16",
 }

 return (
 <Skeleton
 variant={variant}
 rounded="full"
 className={cn(sizes[size], className)}
 />
 )
}

/**
 * SkeletonCard - CardSkeleton
 */
interface SkeletonCardProps {
 hasImage?: boolean
 hasAvatar?: boolean
 className?: string
 variant?: SkeletonProps["variant"]
}

function SkeletonCard({ 
 hasImage = true, 
 hasAvatar = false,
 className,
 variant = "pulse",
}: SkeletonCardProps) {
 return (
 <div className={cn("bg-surface-100 border border-border rounded-xl overflow-hidden", className)}>
 {hasImage && (
 <Skeleton variant={variant} rounded="none" className="w-full aspect-video" />
 )}
 <div className="p-4 space-y-3">
 {hasAvatar && (
 <div className="flex items-center gap-3">
 <SkeletonAvatar size="sm" variant={variant} />
 <div className="flex-1 space-y-1.5">
 <Skeleton variant={variant} className="h-3 w-24" />
 <Skeleton variant={variant} className="h-2.5 w-16" />
 </div>
 </div>
 )}
 <Skeleton variant={variant} className="h-5 w-3/4" />
 <SkeletonText lines={2} variant={variant} />
 <div className="flex gap-2 pt-2">
 <Skeleton variant={variant} className="h-4 w-16" />
 <Skeleton variant={variant} className="h-4 w-12" />
 </div>
 </div>
 </div>
 )
}

/**
 * SkeletonTable - TableSkeleton
 */
interface SkeletonTableProps {
 rows?: number
 columns?: number
 className?: string
 variant?: SkeletonProps["variant"]
}

function SkeletonTable({ 
 rows = 5, 
 columns = 4,
 className,
 variant = "pulse",
}: SkeletonTableProps) {
 return (
 <div className={cn("w-full border border-border rounded-lg overflow-hidden", className)}>
 {/* Header */}
 <div className="bg-surface-75 px-4 py-3 flex gap-4 border-b border-border">
 {Array.from({ length: columns }).map((_, i) => (
 <Skeleton 
 key={i} 
 variant={variant}
 className="h-4 flex-1"
 style={{ animationDelay: `${i * 50}ms` }}
 />
 ))}
 </div>
 {/* Rows */}
 {Array.from({ length: rows }).map((_, rowIndex) => (
 <div 
 key={rowIndex} 
 className={cn(
 "px-4 py-3 flex gap-4",
 rowIndex < rows - 1 && "border-b border-border"
 )}
 >
 {Array.from({ length: columns }).map((_, colIndex) => (
 <Skeleton 
 key={colIndex} 
 variant={variant}
 className="h-4 flex-1"
 style={{ animationDelay: `${(rowIndex * columns + colIndex) * 30}ms` }}
 />
 ))}
 </div>
 ))}
 </div>
 )
}

/**
 * SkeletonList - ListSkeleton
 */
interface SkeletonListProps {
 items?: number
 hasAvatar?: boolean
 hasAction?: boolean
 className?: string
 variant?: SkeletonProps["variant"]
}

function SkeletonList({ 
 items = 5, 
 hasAvatar = true,
 hasAction = false,
 className,
 variant = "pulse",
}: SkeletonListProps) {
 return (
 <div className={cn("space-y-1", className)}>
 {Array.from({ length: items }).map((_, i) => (
 <div 
 key={i} 
 className="flex items-center gap-3 p-3 rounded-lg"
 style={{ animationDelay: `${i * 50}ms` }}
 >
 {hasAvatar && <SkeletonAvatar size="sm" variant={variant} />}
 <div className="flex-1 space-y-1.5">
 <Skeleton variant={variant} className="h-4 w-2/3" />
 <Skeleton variant={variant} className="h-3 w-1/3" />
 </div>
 {hasAction && <Skeleton variant={variant} className="h-8 w-8 rounded-md" />}
 </div>
 ))}
 </div>
 )
}

/**
 * SkeletonStats - StatisticsCardSkeleton
 */
interface SkeletonStatsProps {
 count?: number
 className?: string
 variant?: SkeletonProps["variant"]
}

function SkeletonStats({ 
 count = 4,
 className,
 variant = "pulse",
}: SkeletonStatsProps) {
 return (
 <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
 {Array.from({ length: count }).map((_, i) => (
 <div 
 key={i} 
 className="p-5 bg-surface-100 border border-border rounded-xl"
 style={{ animationDelay: `${i * 50}ms` }}
 >
 <div className="flex items-start justify-between">
 <div className="space-y-3">
 <Skeleton variant={variant} className="h-4 w-20" />
 <Skeleton variant={variant} className="h-8 w-24" />
 <Skeleton variant={variant} className="h-3 w-16" />
 </div>
 <Skeleton variant={variant} className="h-10 w-10 rounded-lg" />
 </div>
 </div>
 ))}
 </div>
 )
}

/**
 * SkeletonForm - FormSkeleton
 */
interface SkeletonFormProps {
 fields?: number
 hasButton?: boolean
 className?: string
 variant?: SkeletonProps["variant"]
}

function SkeletonForm({ 
 fields = 3,
 hasButton = true,
 className,
 variant = "pulse",
}: SkeletonFormProps) {
 return (
 <div className={cn("space-y-4", className)}>
 {Array.from({ length: fields }).map((_, i) => (
 <div 
 key={i} 
 className="space-y-2"
 style={{ animationDelay: `${i * 50}ms` }}
 >
 <Skeleton variant={variant} className="h-4 w-24" />
 <Skeleton variant={variant} className="h-10 w-full rounded-lg" />
 </div>
 ))}
 {hasButton && (
 <Skeleton variant={variant} className="h-10 w-full rounded-lg mt-6" />
 )}
 </div>
 )
}

// CSS Animation
const skeletonStyles = `
 @keyframes shimmer {
 100% {
 transform: translateX(100%);
 }
 }
 
 @keyframes skeleton-wave {
 0% {
 opacity: 1;
 }
 50% {
 opacity: 0.4;
 }
 100% {
 opacity: 1;
 }
 }
 
 .animate-shimmer {
 animation: shimmer 2s infinite;
 }
 
 .animate-skeleton-wave {
 animation: skeleton-wave 1.5s ease-in-out infinite;
 }
`

// enterstyle
if (typeof document !== "undefined") {
 const styleId = "skeleton-styles"
 if (!document.getElementById(styleId)) {
 const style = document.createElement("style")
 style.id = styleId
 style.textContent = skeletonStyles
 document.head.appendChild(style)
 }
}

export { 
 Skeleton, 
 SkeletonText, 
 SkeletonAvatar, 
 SkeletonCard, 
 SkeletonTable, 
 SkeletonList,
 SkeletonStats,
 SkeletonForm,
}
