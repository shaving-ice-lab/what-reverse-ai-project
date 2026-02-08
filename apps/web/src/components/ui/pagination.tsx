"use client"

/**
 * Pagination Component
 * 
 * Support: 
 * - Multiple style variants
 * - Page number input navigation
 * - Items per page selection
 * - Clean/Complete modes
 */

import * as React from "react"
import {
 ChevronLeft,
 ChevronRight,
 ChevronsLeft,
 ChevronsRight,
 MoreHorizontal,
} from "lucide-react"

import { cn } from "@/lib/utils"

interface PaginationProps {
  /** Current page number (1-indexed) */
  page: number
  /** Total page count */
  totalPages: number
  /** Page number change callback */
  onPageChange: (page: number) => void
  /** Display page number button count */
  siblingCount?: number
  /** Whether to display first/last page buttons */
  showFirstLast?: boolean
  /** Whether to display page number input */
  showInput?: boolean
  /** Variant */
  variant?: "default" | "outline" | "ghost" | "simple"
  /** Size */
  size?: "sm" | "default" | "lg"
  /** Whether to disable */
  disabled?: boolean
  className?: string
}

function Pagination({
 page,
 totalPages,
 onPageChange,
 siblingCount = 1,
 showFirstLast = true,
 showInput = false,
 variant = "default",
 size = "default",
 disabled = false,
 className,
}: PaginationProps) {
  const [inputValue, setInputValue] = React.useState(String(page))

  // Sync input value
  React.useEffect(() => {
    setInputValue(String(page))
  }, [page])

  // Generate page number range
  const getPageRange = () => {
 const totalNumbers = siblingCount * 2 + 3 // siblings + current + first + last
 const totalBlocks = totalNumbers + 2 // + 2 for dots

 if (totalPages <= totalBlocks) {
 return Array.from({ length: totalPages }, (_, i) => i + 1)
 }

 const leftSiblingIndex = Math.max(page - siblingCount, 1)
 const rightSiblingIndex = Math.min(page + siblingCount, totalPages)

 const shouldShowLeftDots = leftSiblingIndex > 2
 const shouldShowRightDots = rightSiblingIndex < totalPages - 1

 if (!shouldShowLeftDots && shouldShowRightDots) {
 const leftItemCount = 3 + 2 * siblingCount
 const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
 return [...leftRange, "dots", totalPages]
 }

 if (shouldShowLeftDots && !shouldShowRightDots) {
 const rightItemCount = 3 + 2 * siblingCount
 const rightRange = Array.from(
 { length: rightItemCount },
 (_, i) => totalPages - rightItemCount + i + 1
 )
 return [1, "dots", ...rightRange]
 }

 const middleRange = Array.from(
 { length: rightSiblingIndex - leftSiblingIndex + 1 },
 (_, i) => leftSiblingIndex + i
 )
 return [1, "dots", ...middleRange, "dots", totalPages]
 }

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setInputValue(e.target.value)
 }

 const handleInputSubmit = (e: React.FormEvent) => {
 e.preventDefault()
 const newPage = parseInt(inputValue, 10)
 if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
 onPageChange(newPage)
 } else {
 setInputValue(String(page))
 }
 }

 // Size styles
 const sizeStyles = {
 sm: "h-7 min-w-7 text-xs",
 default: "h-9 min-w-9 text-sm",
 lg: "h-11 min-w-11 text-base",
 }

 const iconSizes = {
 sm: "w-3.5 h-3.5",
 default: "w-4 h-4",
 lg: "w-5 h-5",
 }

 // Button styles
 const getButtonStyles = (isActive: boolean, isDisabled: boolean) => {
 const base = cn(
 "inline-flex items-center justify-center rounded-lg font-medium",
 "transition-all duration-200",
 sizeStyles[size],
 "px-2"
 )

 if (isDisabled) {
 return cn(base, "opacity-50 cursor-not-allowed")
 }

 if (variant === "outline") {
 return cn(
 base,
 isActive
 ? "bg-primary text-primary-foreground border border-primary"
 : "border border-border hover:bg-surface-200 hover:border-primary/50"
 )
 }

 if (variant === "ghost") {
 return cn(
 base,
 isActive
 ? "bg-primary text-primary-foreground"
 : "hover:bg-surface-200"
 )
 }

 if (variant === "simple") {
 return cn(
 base,
 isActive
 ? "text-primary font-semibold"
 : "text-foreground-light hover:text-foreground"
 )
 }

 // default
 return cn(
 base,
 isActive
 ? "bg-primary text-primary-foreground shadow-sm"
 : "bg-surface-200/50 hover:bg-surface-200"
 )
 }

 const pages = getPageRange()

 return (
 <nav
 className={cn("flex items-center gap-1", className)}
 aria-label="Pagination"
 >
 {/* First Page Button */}
 {showFirstLast && (
 <button
 onClick={() => onPageChange(1)}
 disabled={disabled || page === 1}
 className={getButtonStyles(false, disabled || page === 1)}
 aria-label="First page"
 >
 <ChevronsLeft className={iconSizes[size]} />
 </button>
 )}

 {/* Previous Page Button */}
 <button
 onClick={() => onPageChange(page - 1)}
 disabled={disabled || page === 1}
 className={getButtonStyles(false, disabled || page === 1)}
 aria-label="Previous page"
 >
 <ChevronLeft className={iconSizes[size]} />
 </button>

 {/* Page Number Buttons */}
 {pages.map((pageNum, index) => {
 if (pageNum === "dots") {
 return (
 <span
 key={`dots-${index}`}
 className={cn(
 "inline-flex items-center justify-center",
 sizeStyles[size],
 "text-foreground-light"
 )}
 >
 <MoreHorizontal className={iconSizes[size]} />
 </span>
 )
 }

 return (
 <button
 key={pageNum}
 onClick={() => onPageChange(pageNum as number)}
 disabled={disabled}
 className={getButtonStyles(page === pageNum, disabled)}
 aria-label={`Page ${pageNum}`}
 aria-current={page === pageNum ? "page" : undefined}
 >
 {pageNum}
 </button>
 )
 })}

 {/* Next Page Button */}
 <button
 onClick={() => onPageChange(page + 1)}
 disabled={disabled || page === totalPages}
 className={getButtonStyles(false, disabled || page === totalPages)}
 aria-label="Next page"
 >
 <ChevronRight className={iconSizes[size]} />
 </button>

 {/* Last Page Button */}
 {showFirstLast && (
 <button
 onClick={() => onPageChange(totalPages)}
 disabled={disabled || page === totalPages}
 className={getButtonStyles(false, disabled || page === totalPages)}
 aria-label="Last page"
 >
 <ChevronsRight className={iconSizes[size]} />
 </button>
 )}

 {/* Page Number Input */}
 {showInput && (
 <form onSubmit={handleInputSubmit} className="flex items-center gap-2 ml-2">
 <span className="text-sm text-foreground-light">Navigate</span>
 <input
 type="text"
 value={inputValue}
 onChange={handleInputChange}
 disabled={disabled}
 className={cn(
 "w-12 text-center rounded-lg border border-border bg-background",
 "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-primary",
 "disabled:opacity-50 disabled:cursor-not-allowed",
 sizeStyles[size]
 )}
 />
 <span className="text-sm text-foreground-light">page</span>
 </form>
 )}
 </nav>
 )
}

/**
 * PaginationInfo - Pagination Information Display
 */
interface PaginationInfoProps {
 page: number
 pageSize: number
 total: number
 className?: string
}

function PaginationInfo({
 page,
 pageSize,
 total,
 className,
}: PaginationInfoProps) {
 const start = (page - 1) * pageSize + 1
 const end = Math.min(page * pageSize, total)

 return (
 <p className={cn("text-sm text-foreground-light", className)}>
 Display <span className="font-medium text-foreground">{start}</span> - <span className="font-medium text-foreground">{end}</span> , 
 <span className="font-medium text-foreground">{total.toLocaleString()}</span> 
 </p>
 )
}

/**
 * PageSizeSelect - Items Per Page Selector
 */
interface PageSizeSelectProps {
 value: number
 onChange: (size: number) => void
 options?: number[]
 disabled?: boolean
 className?: string
}

function PageSizeSelect({
 value,
 onChange,
 options = [10, 20, 50, 100],
 disabled = false,
 className,
}: PageSizeSelectProps) {
 return (
 <div className={cn("flex items-center gap-2", className)}>
 <span className="text-sm text-foreground-light">per page</span>
 <select
 value={value}
 onChange={(e) => onChange(Number(e.target.value))}
 disabled={disabled}
 className={cn(
 "h-9 px-2 rounded-lg border border-border bg-background",
 "text-sm",
 "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-primary",
 "disabled:opacity-50 disabled:cursor-not-allowed"
 )}
 >
 {options.map((option) => (
 <option key={option} value={option}>
 {option}
 </option>
 ))}
 </select>
 <span className="text-sm text-foreground-light"></span>
 </div>
 )
}

/**
 * Full Pagination - Complete Pagination Component
 */
interface FullPaginationProps extends PaginationProps {
  /** Items per page */
  pageSize: number
  /** Total data count */
  total: number
  /** Page size change callback */
  onPageSizeChange?: (size: number) => void
  /** Page size options */
  pageSizeOptions?: number[]
  /** Whether to display pagination info */
  showInfo?: boolean
  /** Whether to display page size selector */
  showSizeChanger?: boolean
}

function FullPagination({
 page,
 totalPages,
 pageSize,
 total,
 onPageChange,
 onPageSizeChange,
 pageSizeOptions = [10, 20, 50, 100],
 showInfo = true,
 showSizeChanger = true,
 showInput = true,
 disabled = false,
 className,
 ...paginationProps
}: FullPaginationProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-center justify-between gap-4",
      className
    )}>
      {/* Left side info */}
      <div className="flex items-center gap-4">
 {showInfo && (
 <PaginationInfo
 page={page}
 pageSize={pageSize}
 total={total}
 />
 )}
 {showSizeChanger && onPageSizeChange && (
 <PageSizeSelect
 value={pageSize}
 onChange={onPageSizeChange}
 options={pageSizeOptions}
 disabled={disabled}
 />
 )}
 </div>

 {/* Right Side Pagination */}
 <Pagination
 page={page}
 totalPages={totalPages}
 onPageChange={onPageChange}
 showInput={showInput}
 disabled={disabled}
 {...paginationProps}
 />
 </div>
 )
}

/**
 * SimplePagination - Simple Pagination
 */
interface SimplePaginationProps {
 page: number
 totalPages: number
 onPageChange: (page: number) => void
 disabled?: boolean
 className?: string
}

function SimplePagination({
 page,
 totalPages,
 onPageChange,
 disabled = false,
 className,
}: SimplePaginationProps) {
 return (
 <div className={cn("flex items-center gap-4", className)}>
 <button
 onClick={() => onPageChange(page - 1)}
 disabled={disabled || page === 1}
 className={cn(
 "flex items-center gap-1 px-3 py-2 rounded-lg",
 "text-sm font-medium",
 "border border-border",
 "hover:bg-surface-200 transition-colors",
 "disabled:opacity-50 disabled:cursor-not-allowed"
 )}
 >
 <ChevronLeft className="w-4 h-4" />
 Previous
 </button>

 <span className="text-sm text-foreground-light">
 {page} / {totalPages}
 </span>

 <button
 onClick={() => onPageChange(page + 1)}
 disabled={disabled || page === totalPages}
 className={cn(
 "flex items-center gap-1 px-3 py-2 rounded-lg",
 "text-sm font-medium",
 "border border-border",
 "hover:bg-surface-200 transition-colors",
 "disabled:opacity-50 disabled:cursor-not-allowed"
 )}
 >
 Next
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 )
}

export {
 Pagination,
 PaginationInfo,
 PageSizeSelect,
 FullPagination,
 SimplePagination,
}
export type {
 PaginationProps,
 PaginationInfoProps,
 PageSizeSelectProps,
 FullPaginationProps,
 SimplePaginationProps,
}