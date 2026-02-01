"use client"

/**
 * Divider 分割线组件
 * 
 * 支持：
 * - 水平/垂直方向
 * - 多种样式变体
 * - 带文字分割
 * - 渐变效果
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Divider 变体
const dividerVariants = cva(
  "shrink-0",
  {
    variants: {
      orientation: {
        horizontal: "w-full h-px",
        vertical: "h-full w-px",
      },
      variant: {
        solid: "bg-border",
        dashed: "bg-transparent border-border",
        dotted: "bg-transparent border-border",
        gradient: "bg-gradient-to-r from-transparent via-border to-transparent",
        "gradient-primary": "bg-gradient-to-r from-transparent via-primary/50 to-transparent",
        fade: "bg-gradient-to-r from-border via-border to-transparent",
        "fade-both": "bg-gradient-to-r from-transparent via-border to-transparent",
      },
      spacing: {
        none: "",
        xs: "",
        sm: "",
        default: "",
        lg: "",
        xl: "",
      },
    },
    compoundVariants: [
      // 水平方向间距
      { orientation: "horizontal", spacing: "xs", className: "my-1" },
      { orientation: "horizontal", spacing: "sm", className: "my-2" },
      { orientation: "horizontal", spacing: "default", className: "my-4" },
      { orientation: "horizontal", spacing: "lg", className: "my-6" },
      { orientation: "horizontal", spacing: "xl", className: "my-8" },
      // 垂直方向间距
      { orientation: "vertical", spacing: "xs", className: "mx-1" },
      { orientation: "vertical", spacing: "sm", className: "mx-2" },
      { orientation: "vertical", spacing: "default", className: "mx-4" },
      { orientation: "vertical", spacing: "lg", className: "mx-6" },
      { orientation: "vertical", spacing: "xl", className: "mx-8" },
      // 虚线样式
      { variant: "dashed", orientation: "horizontal", className: "h-0 border-t border-dashed" },
      { variant: "dashed", orientation: "vertical", className: "w-0 border-l border-dashed" },
      { variant: "dotted", orientation: "horizontal", className: "h-0 border-t border-dotted" },
      { variant: "dotted", orientation: "vertical", className: "w-0 border-l border-dotted" },
    ],
    defaultVariants: {
      orientation: "horizontal",
      variant: "solid",
      spacing: "default",
    },
  }
)

export interface DividerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dividerVariants> {
  /** 分割线厚度 */
  thickness?: number
}

function Divider({
  className,
  orientation,
  variant,
  spacing,
  thickness,
  style,
  ...props
}: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation || "horizontal"}
      className={cn(dividerVariants({ orientation, variant, spacing }), className)}
      style={{
        ...style,
        ...(thickness && orientation === "horizontal" && { height: thickness }),
        ...(thickness && orientation === "vertical" && { width: thickness }),
      }}
      {...props}
    />
  )
}

/**
 * DividerWithText - 带文字的分割线
 */
interface DividerWithTextProps extends Omit<DividerProps, "orientation"> {
  /** 文字位置 */
  textPosition?: "left" | "center" | "right"
  /** 文字内容 */
  children?: React.ReactNode
}

function DividerWithText({
  className,
  variant = "solid",
  spacing = "default",
  textPosition = "center",
  children,
  ...props
}: DividerWithTextProps) {
  const lineClass = cn(
    "flex-1 h-px",
    variant === "solid" && "bg-border",
    variant === "gradient" && "bg-gradient-to-r from-transparent via-border to-transparent",
    variant === "gradient-primary" && "bg-gradient-to-r from-transparent via-primary/50 to-transparent",
    variant === "dashed" && "border-t border-dashed border-border",
    variant === "dotted" && "border-t border-dotted border-border"
  )

  const spacingClass = {
    none: "",
    xs: "my-1",
    sm: "my-2",
    default: "my-4",
    lg: "my-6",
    xl: "my-8",
  }

  return (
    <div
      role="separator"
      className={cn(
        "flex items-center gap-3",
        spacingClass[spacing || "default"],
        className
      )}
      {...props}
    >
      {(textPosition === "center" || textPosition === "right") && (
        <div className={cn(lineClass, textPosition === "right" && "flex-[3]")} />
      )}
      
      {children && (
        <span className="text-xs text-foreground-light whitespace-nowrap px-2">
          {children}
        </span>
      )}
      
      {(textPosition === "center" || textPosition === "left") && (
        <div className={cn(lineClass, textPosition === "left" && "flex-[3]")} />
      )}
    </div>
  )
}

/**
 * DividerWithIcon - 带图标的分割线
 */
interface DividerWithIconProps extends Omit<DividerProps, "orientation"> {
  /** 图标 */
  icon: React.ReactNode
  /** 图标背景色 */
  iconBg?: string
}

function DividerWithIcon({
  className,
  variant = "solid",
  spacing = "default",
  icon,
  iconBg,
  ...props
}: DividerWithIconProps) {
  const lineClass = cn(
    "flex-1 h-px",
    variant === "solid" && "bg-border",
    variant === "gradient" && "bg-gradient-to-r from-transparent via-border to-transparent",
    variant === "gradient-primary" && "bg-gradient-to-r from-transparent via-primary/50 to-transparent"
  )

  const spacingClass = {
    none: "",
    xs: "my-1",
    sm: "my-2",
    default: "my-4",
    lg: "my-6",
    xl: "my-8",
  }

  return (
    <div
      role="separator"
      className={cn(
        "flex items-center gap-3",
        spacingClass[spacing || "default"],
        className
      )}
      {...props}
    >
      <div className={lineClass} />
      
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          "text-foreground-light",
          iconBg || "bg-surface-200"
        )}
      >
        {icon}
      </div>
      
      <div className={lineClass} />
    </div>
  )
}

/**
 * SectionDivider - 章节分割线
 */
interface SectionDividerProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

function SectionDivider({
  title,
  description,
  action,
  className,
}: SectionDividerProps) {
  return (
    <div className={cn("py-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-foreground-light mt-0.5">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <Divider variant="gradient" spacing="none" />
    </div>
  )
}

/**
 * ListDivider - 列表项分割线
 */
interface ListDividerProps {
  /** 缩进（用于有图标的列表） */
  inset?: boolean
  /** 缩进量 */
  insetSize?: number
  className?: string
}

function ListDivider({
  inset = false,
  insetSize = 48,
  className,
}: ListDividerProps) {
  return (
    <Divider
      className={className}
      spacing="none"
      style={{
        marginLeft: inset ? insetSize : 0,
        width: inset ? `calc(100% - ${insetSize}px)` : "100%",
      }}
    />
  )
}

export {
  Divider,
  DividerWithText,
  DividerWithIcon,
  SectionDivider,
  ListDivider,
  dividerVariants,
}
export type {
  DividerProps,
  DividerWithTextProps,
  DividerWithIconProps,
  SectionDividerProps,
  ListDividerProps,
}