"use client";

/**
 * @deprecated 请使用 Card 组件代替
 * 
 * GlassCard 组件已被弃用，所有功能已整合到 Card 组件中
 * 使用 Card 组件的 variant="glass" 或 variant="glass-subtle" 来获得相同效果
 * 
 * 迁移指南：
 * - GlassCard variant="default" -> Card variant="glass"
 * - GlassCard variant="subtle" -> Card variant="glass-subtle"
 * - GlassCard variant="solid" -> Card variant="default"
 * - GlassCard padding="sm|default|lg" -> Card padding="sm|default|lg"
 * - GlassCard hover="lift" -> Card hover="lift"
 */

import * as React from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  type CardProps,
  type CardHeaderProps,
  type CardTitleProps,
  type CardContentProps,
  type CardFooterProps,
} from "./card";
import { cn } from "@/lib/utils";

// 类型别名以保持向后兼容
export interface GlassCardProps extends CardProps {
  /** @deprecated 使用 Card 的 padding prop */
  glowBorder?: boolean;
}

/** @deprecated 使用 Card 组件代替 */
const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = "glass", glowBorder, className, ...props }, ref) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "GlassCard is deprecated. Please use Card with variant=\"glass\" instead."
      );
    }
    return (
      <Card 
        ref={ref} 
        variant={variant === "default" ? "glass" : variant}
        className={cn(glowBorder && "ring-1 ring-primary/20", className)}
        {...props} 
      />
    );
  }
);
GlassCard.displayName = "GlassCard";

export interface GlassCardHeaderProps extends CardHeaderProps {}

/** @deprecated 使用 CardHeader 组件代替 */
const GlassCardHeader = React.forwardRef<HTMLDivElement, GlassCardHeaderProps>(
  (props, ref) => {
    if (process.env.NODE_ENV === "development") {
      console.warn("GlassCardHeader is deprecated. Please use CardHeader instead.");
    }
    return <CardHeader ref={ref} {...props} />;
  }
);
GlassCardHeader.displayName = "GlassCardHeader";

export interface GlassCardTitleProps extends CardTitleProps {}

/** @deprecated 使用 CardTitle 组件代替 */
const GlassCardTitle = React.forwardRef<HTMLDivElement, GlassCardTitleProps>(
  (props, ref) => {
    if (process.env.NODE_ENV === "development") {
      console.warn("GlassCardTitle is deprecated. Please use CardTitle instead.");
    }
    return <CardTitle ref={ref} {...props} />;
  }
);
GlassCardTitle.displayName = "GlassCardTitle";

/** @deprecated 使用 CardDescription 组件代替 */
const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>((props, ref) => {
  if (process.env.NODE_ENV === "development") {
    console.warn("GlassCardDescription is deprecated. Please use CardDescription instead.");
  }
  return <CardDescription ref={ref as React.Ref<HTMLDivElement>} {...props} />;
});
GlassCardDescription.displayName = "GlassCardDescription";

export interface GlassCardContentProps extends CardContentProps {}

/** @deprecated 使用 CardContent 组件代替 */
const GlassCardContent = React.forwardRef<HTMLDivElement, GlassCardContentProps>(
  (props, ref) => {
    if (process.env.NODE_ENV === "development") {
      console.warn("GlassCardContent is deprecated. Please use CardContent instead.");
    }
    return <CardContent ref={ref} {...props} />;
  }
);
GlassCardContent.displayName = "GlassCardContent";

export interface GlassCardFooterProps extends CardFooterProps {}

/** @deprecated 使用 CardFooter 组件代替 */
const GlassCardFooter = React.forwardRef<HTMLDivElement, GlassCardFooterProps>(
  (props, ref) => {
    if (process.env.NODE_ENV === "development") {
      console.warn("GlassCardFooter is deprecated. Please use CardFooter instead.");
    }
    return <CardFooter ref={ref} {...props} />;
  }
);
GlassCardFooter.displayName = "GlassCardFooter";

// Badge 组件保留但简化
export interface GlassCardBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}

/** @deprecated 请使用 Badge 组件 */
const GlassCardBadge = React.forwardRef<HTMLSpanElement, GlassCardBadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClass = {
      default: "bg-muted text-muted-foreground",
      primary: "bg-[var(--color-primary-muted)] text-primary",
      success: "bg-[var(--color-success-muted)] text-[var(--color-success)]",
      warning: "bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
      danger: "bg-[var(--color-destructive-muted)] text-destructive",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
          variantClass[variant],
          className
        )}
        {...props}
      />
    );
  }
);
GlassCardBadge.displayName = "GlassCardBadge";

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
  GlassCardBadge,
};
