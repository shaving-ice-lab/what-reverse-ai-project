"use client";

/**
 * Alert 提示组件 - 极简风格
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

const alertVariants = cva(
  [
    "relative w-full rounded-md border p-3 text-sm",
    "[&>svg]:absolute [&>svg]:left-3 [&>svg]:top-3",
    "[&:has(svg)]:pl-9",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-surface-200",
          "border-border",
          "text-foreground",
        ].join(" "),
        info: [
          "bg-surface-200",
          "border-border",
          "[&>svg]:text-foreground-light",
        ].join(" "),
        success: [
          "bg-brand-200",
          "border-brand-400/30",
          "[&>svg]:text-brand-500",
        ].join(" "),
        warning: [
          "bg-warning-200",
          "border-warning/30",
          "[&>svg]:text-warning",
        ].join(" "),
        destructive: [
          "bg-destructive-200",
          "border-destructive/30",
          "[&>svg]:text-destructive",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap: Record<string, LucideIcon> = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: LucideIcon;
  showIcon?: boolean;
  closable?: boolean;
  onClose?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "default",
      icon,
      showIcon = true,
      closable,
      onClose,
      children,
      ...props
    },
    ref
  ) => {
    const Icon = icon || iconMap[variant || "default"];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {showIcon && <Icon className="h-4 w-4" />}
        <div className="flex-1">{children}</div>
        {closable && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 opacity-70 hover:opacity-100"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-medium leading-none", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-foreground-light mt-1", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
