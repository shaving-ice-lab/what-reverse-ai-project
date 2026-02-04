"use client"

/**
 * Pagination 分页组件
 *
 * 支持：
 * - 多种样式变体
 * - 页码输入跳转
 * - 每页数量选择
 * - 简洁/完整模式
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
  /** 当前页码（1-indexed） */
  page: number
  /** 总页数 */
  totalPages: number
  /** 页码变化回调 */
  onPageChange: (page: number) => void
  /** 显示的页码按钮数量 */
  siblingCount?: number
  /** 是否显示首尾页按钮 */
  showFirstLast?: boolean
  /** 是否显示页码输入 */
  showInput?: boolean
  /** 变体 */
  variant?: "default" | "outline" | "ghost" | "simple"
  /** 尺寸 */
  size?: "sm" | "default" | "lg"
  /** 是否禁用 */
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

  React.useEffect(() => {
    setInputValue(String(page))
  }, [page])

  const getPageRange = () => {
    const totalNumbers = siblingCount * 2 + 3
    const totalBlocks = totalNumbers + 2

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
      aria-label="分页导航"
    >
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={disabled || page === 1}
          className={getButtonStyles(false, disabled || page === 1)}
          aria-label="第一页"
        >
          <ChevronsLeft className={iconSizes[size]} />
        </button>
      )}

      <button
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page === 1}
        className={getButtonStyles(false, disabled || page === 1)}
        aria-label="上一页"
      >
        <ChevronLeft className={iconSizes[size]} />
      </button>

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
            aria-label={`第 ${pageNum} 页`}
            aria-current={page === pageNum ? "page" : undefined}
          >
            {pageNum}
          </button>
        )
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page === totalPages}
        className={getButtonStyles(false, disabled || page === totalPages)}
        aria-label="下一页"
      >
        <ChevronRight className={iconSizes[size]} />
      </button>

      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || page === totalPages}
          className={getButtonStyles(false, disabled || page === totalPages)}
          aria-label="最后一页"
        >
          <ChevronsRight className={iconSizes[size]} />
        </button>
      )}

      {showInput && (
        <form onSubmit={handleInputSubmit} className="flex items-center gap-2 ml-2">
          <span className="text-sm text-foreground-light">跳转</span>
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
          <span className="text-sm text-foreground-light">页</span>
        </form>
      )}
    </nav>
  )
}

/**
 * PaginationInfo - 分页信息
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
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = total === 0 ? 0 : Math.min(page * pageSize, total)

  return (
    <p className={cn("text-sm text-foreground-light", className)}>
      显示 <span className="font-medium text-foreground">{start}</span> -{" "}
      <span className="font-medium text-foreground">{end}</span> 条，共{" "}
      <span className="font-medium text-foreground">{total.toLocaleString()}</span>{" "}
      条
    </p>
  )
}

/**
 * PageSizeSelect - 每页数量选择
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
      <span className="text-sm text-foreground-light">每页</span>
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
      <span className="text-sm text-foreground-light">条</span>
    </div>
  )
}

/**
 * FullPagination - 完整分页组件
 */
interface FullPaginationProps extends PaginationProps {
  /** 每页数量 */
  pageSize: number
  /** 总数据条数 */
  total: number
  /** 每页数量变化回调 */
  onPageSizeChange?: (size: number) => void
  /** 每页数量选项 */
  pageSizeOptions?: number[]
  /** 是否显示分页信息 */
  showInfo?: boolean
  /** 是否显示每页数量选择 */
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
 * SimplePagination - 简洁分页
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
        上一页
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
        下一页
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
