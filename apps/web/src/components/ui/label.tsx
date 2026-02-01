"use client"

/**
 * Label 标签组件 - 极简风格
 */

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  cn(
    "text-[13px] font-medium leading-none",
    "text-foreground",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
  ),
  {
    variants: {
      variant: {
        default: "",
        required: "after:content-['*'] after:ml-0.5 after:text-destructive",
        optional: "after:content-['(可选)'] after:ml-1 after:text-[11px] after:text-foreground-muted after:font-normal",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, variant, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant }), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label, labelVariants }
