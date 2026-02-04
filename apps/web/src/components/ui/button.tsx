import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Button 按钮组件 - Supabase 风格：品牌绿色主按钮
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md font-medium cursor-pointer",
    "transition-all duration-150 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "select-none touch-manipulation",
  ].join(" "),
  {
    variants: {
      variant: {
        // 主按钮 - Supabase 品牌绿色
        default: [
          "bg-brand-500 text-background",
          "hover:bg-brand-600",
          "active:bg-brand-400",
        ].join(" "),
        // 次要按钮 - Supabase surface 背景
        secondary: [
          "bg-surface-100 text-foreground border border-border",
          "hover:bg-surface-200 hover:border-border-strong",
          "active:bg-surface-400",
        ].join(" "),
        // 破坏性按钮 - 轮廓
        destructive: [
          "bg-transparent text-destructive-400 border border-destructive-400/50",
          "hover:bg-destructive-200 hover:text-destructive hover:border-destructive-400",
        ].join(" "),
        // 破坏性按钮 - 填充
        "destructive-fill": [
          "bg-destructive-400 text-white",
          "hover:bg-destructive",
        ].join(" "),
        // 幽灵按钮 - Supabase 风格
        ghost: [
          "bg-transparent text-foreground-light",
          "hover:bg-surface-200 hover:text-foreground",
          "active:bg-surface-300",
        ].join(" "),
        // 链接按钮
        link: [
          "text-brand-500 underline-offset-4",
          "hover:underline hover:text-brand-600",
          "p-0 h-auto font-normal",
        ].join(" "),
        // 轮廓按钮 - Supabase 风格
        outline: [
          "border border-border bg-transparent text-foreground-light",
          "hover:bg-surface-200 hover:text-foreground hover:border-border-strong",
          "active:bg-surface-300",
        ].join(" "),
        // 品牌轮廓按钮
        "outline-primary": [
          "border border-brand-500/40 bg-transparent text-brand-500",
          "hover:bg-brand-200 hover:border-brand-500",
        ].join(" "),
        // CTA 按钮
        cta: [
          "bg-brand-500 text-background-studio font-semibold",
          "hover:bg-brand-600",
        ].join(" "),
        // 渐变按钮
        gradient: [
          "bg-brand-500 text-background-studio font-semibold",
          "hover:bg-brand-600",
          "border-0",
        ].join(" "),
        // 发光按钮
        glow: [
          "bg-brand-500 text-background-studio font-semibold",
          "hover:bg-brand-600 hover:shadow-brand-500/25 hover:shadow-lg",
        ].join(" "),
        // 玻璃按钮
        glass: [
          "bg-surface-100/60 text-foreground border border-border/50 backdrop-blur-sm",
          "hover:bg-surface-200/80",
        ].join(" "),
        // 警告按钮
        warning: [
          "bg-warning-200 text-warning border border-warning/30",
          "hover:bg-warning/20 hover:text-warning",
        ].join(" "),
      },
      size: {
        xs: "h-6 px-2 text-[10px] rounded-md",
        sm: "h-7 px-3 text-[11px] rounded-md",
        default: "h-8 px-3 text-[12px]",
        lg: "h-9 px-3.5 text-[13px]",
        xl: "h-10 px-4 text-[14px]",
        icon: "h-8 w-8 min-w-0 p-0",
        "icon-xs": "h-6 w-6 rounded-md min-w-0 p-0",
        "icon-sm": "h-7 w-7 rounded-md min-w-0 p-0",
        "icon-lg": "h-9 w-9 min-w-0 p-0",
        "icon-xl": "h-10 w-10 min-w-0 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false, 
    loadingText,
    leftIcon,
    rightIcon,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // 加载图标
    const LoadingSpinner = (
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    )
    
    const content = loading ? (
      <>
        {LoadingSpinner}
        <span>{loadingText || children}</span>
      </>
    ) : (
      <>
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </>
    )

    const slottedChildren =
      asChild && React.isValidElement(children) && children.type === React.Fragment
        ? <span className="contents">{children.props.children}</span>
        : children

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? slottedChildren : content}
      </Comp>
    )
  }
)
Button.displayName = "Button"

/**
 * IconButton - 图标按钮包装器
 */
interface IconButtonProps extends Omit<ButtonProps, "children" | "leftIcon" | "rightIcon"> {
  icon: React.ReactNode
  "aria-label": string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = "icon", ...props }, ref) => {
    return (
      <Button ref={ref} size={size} {...props}>
        {icon}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

/**
 * ButtonGroup - 按钮组
 */
interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  attached?: boolean
}

function ButtonGroup({ children, className, attached = false }: ButtonGroupProps) {
  return (
    <div 
      className={cn(
        "inline-flex",
        attached && [
          "[&>button]:rounded-none",
          "[&>button:first-child]:rounded-l-lg",
          "[&>button:last-child]:rounded-r-lg",
          "[&>button:not(:last-child)]:border-r-0",
        ],
        !attached && "gap-2",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Button, IconButton, ButtonGroup, buttonVariants }
