/**
 * Textarea Text AreaComponent - Minimalist Style
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.ComponentProps<"textarea"> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md px-3 py-2 text-[13px]",
          "bg-surface-200 text-foreground",
          "border border-border",
          "placeholder:text-foreground-muted",
          "transition-all duration-150",
          "hover:border-border-strong",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500/30 focus-visible:border-brand-500",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-100",
          "resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
