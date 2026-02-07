"use client";

/**
 * Interaction State Components
 * Unified visual representation of hover/active/disabled/loading states
 */

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Interaction state configuration
// ============================================

export const INTERACTION_STATES = {
  // Default state
  default: {
    background: "bg-surface-100",
    text: "text-foreground",
    border: "border-border",
  },
  // Hover state
  hover: {
    background: "hover:bg-surface-200",
    text: "hover:text-foreground",
    border: "hover:border-border-strong",
    transition: "transition-all duration-150 ease-in-out",
  },
  // Active/pressed state
  active: {
    background: "active:bg-surface-300",
    text: "active:text-foreground",
    border: "active:border-border-stronger",
  },
  // Focus state
  focus: {
    ring: "focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-1 focus:ring-offset-background",
    outline: "focus:outline-none",
    border: "focus:border-brand-500",
  },
  // Disabled state
  disabled: {
    opacity: "opacity-50",
    cursor: "cursor-not-allowed",
    pointer: "pointer-events-none",
  },
  // Selected state
  selected: {
    background: "bg-brand-200/20",
    text: "text-brand-500",
    border: "border-brand-500/40",
  },
  // Danger state
  danger: {
    background: "bg-destructive-200",
    text: "text-destructive",
    border: "border-destructive/30",
    hover: "hover:bg-destructive/20",
  },
  // Warning state
  warning: {
    background: "bg-warning-200",
    text: "text-warning",
    border: "border-warning/30",
    hover: "hover:bg-warning/20",
  },
  // Success state
  success: {
    background: "bg-success-200",
    text: "text-success",
    border: "border-success/30",
    hover: "hover:bg-success/20",
  },
} as const;

// ============================================
// Loading state indicator
// ============================================

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  color?: "brand" | "white" | "muted";
}

export const SPINNER_SIZES = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export const SPINNER_COLORS = {
  brand: "text-brand-500",
  white: "text-white",
  muted: "text-foreground-muted",
};

export function LoadingSpinner({
  size = "sm",
  className,
  color = "brand",
}: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin",
        SPINNER_SIZES[size],
        SPINNER_COLORS[color],
        className
      )}
    />
  );
}

// ============================================
// Loading overlay
// ============================================

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  blur?: boolean;
  className?: string;
}

export function LoadingOverlay({
  visible,
  message = "Loading...",
  blur = true,
  className,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex flex-col items-center justify-center",
        blur ? "bg-background/80 backdrop-blur-sm" : "bg-background/90",
        className
      )}
    >
      <LoadingSpinner size="lg" />
      {message && (
        <p className="mt-3 text-[12px] text-foreground-muted">{message}</p>
      )}
    </div>
  );
}

// ============================================
// Disabled container
// ============================================

interface DisabledContainerProps {
  disabled?: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

export function DisabledContainer({
  disabled = false,
  message,
  children,
  className,
}: DisabledContainerProps) {
  return (
    <div
      className={cn(
        "relative",
        disabled && "pointer-events-none select-none",
        className
      )}
    >
      {children}
      {disabled && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
          {message && (
            <div className="px-3 py-1.5 rounded-md bg-surface-200 border border-border">
              <p className="text-[11px] text-foreground-muted">{message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Interactive area
// ============================================

interface InteractiveAreaBaseProps {
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}

type InteractiveAreaProps =
  | (InteractiveAreaBaseProps &
      { as?: "div" } &
      React.HTMLAttributes<HTMLDivElement>)
  | (InteractiveAreaBaseProps &
      { as: "button" } &
      React.ButtonHTMLAttributes<HTMLButtonElement>);

export function InteractiveArea({
  as = "div",
  disabled = false,
  loading = false,
  selected = false,
  danger = false,
  children,
  className,
  ...props
}: InteractiveAreaProps) {
  const sharedClassName = cn(
    // Base styles
    "relative rounded-lg border",
    INTERACTION_STATES.default.background,
    INTERACTION_STATES.default.border,
    INTERACTION_STATES.hover.transition,
    // Interaction states
    !disabled && !loading && [
      INTERACTION_STATES.hover.background,
      INTERACTION_STATES.hover.border,
      INTERACTION_STATES.active.background,
    ],
    // Focus state
    as === "button" && [
      INTERACTION_STATES.focus.outline,
      INTERACTION_STATES.focus.ring,
    ],
    // Selected state
    selected && [
      INTERACTION_STATES.selected.background,
      INTERACTION_STATES.selected.border,
    ],
    // Danger state
    danger && [
      INTERACTION_STATES.danger.background,
      INTERACTION_STATES.danger.border,
      !disabled && INTERACTION_STATES.danger.hover,
    ],
    // Disabled state
    (disabled || loading) && [
      INTERACTION_STATES.disabled.opacity,
      INTERACTION_STATES.disabled.cursor,
      INTERACTION_STATES.disabled.pointer,
    ],
    className
  );

  if (as === "button") {
    const buttonProps = props as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        className={sharedClassName}
        disabled={disabled || loading}
        {...buttonProps}
      >
        {children}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </button>
    );
  }

  const divProps = props as React.HTMLAttributes<HTMLDivElement>;
  return (
    <div className={sharedClassName} {...divProps}>
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
}

// ============================================
// Status indicator dot
// ============================================

interface StatusDotProps {
  status: "success" | "warning" | "error" | "info" | "muted";
  pulse?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export const STATUS_DOT_COLORS = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  info: "bg-brand-500",
  muted: "bg-foreground-muted",
};

export const STATUS_DOT_SIZES = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
};

export function StatusDot({
  status,
  pulse = false,
  size = "sm",
  className,
}: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full",
        STATUS_DOT_COLORS[status],
        STATUS_DOT_SIZES[size],
        pulse && "animate-pulse",
        className
      )}
    />
  );
}

// ============================================
// Status label
// ============================================

interface StatusLabelProps {
  status: "success" | "warning" | "error" | "info" | "muted";
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
}

export const STATUS_LABEL_STYLES = {
  success: "bg-success-200 text-success border-success/20",
  warning: "bg-warning-200 text-warning border-warning/20",
  error: "bg-destructive-200 text-destructive border-destructive/20",
  info: "bg-brand-200 text-brand-500 border-brand-500/20",
  muted: "bg-surface-200 text-foreground-muted border-border",
};

export function StatusLabel({
  status,
  children,
  showDot = true,
  className,
}: StatusLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border",
        STATUS_LABEL_STYLES[status],
        className
      )}
    >
      {showDot && <StatusDot status={status} size="xs" />}
      {children}
    </span>
  );
}

// ============================================
// Progress bar
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "xs" | "sm" | "md";
  color?: "brand" | "success" | "warning" | "error";
  showLabel?: boolean;
  className?: string;
}

export const PROGRESS_SIZES = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
};

export const PROGRESS_COLORS = {
  brand: "bg-brand-500",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
};

export function ProgressBar({
  value,
  max = 100,
  size = "sm",
  color = "brand",
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full rounded-full bg-surface-200 overflow-hidden",
          PROGRESS_SIZES[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            PROGRESS_COLORS[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-[10px] text-foreground-muted text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}

// ============================================
// Pulse animation container
// ============================================

interface PulseContainerProps {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function PulseContainer({
  active = true,
  children,
  className,
}: PulseContainerProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {active && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500" />
        </span>
      )}
    </div>
  );
}

// ============================================
// Skeleton loading animation
// ============================================

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  className?: string;
}

export const SKELETON_ROUNDED = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

export function SkeletonLoader({
  width,
  height,
  rounded = "md",
  className,
}: SkeletonLoaderProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-surface-200",
        SKELETON_ROUNDED[rounded],
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}

