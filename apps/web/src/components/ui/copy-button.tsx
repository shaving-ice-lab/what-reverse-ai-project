"use client"

/**
 * CopyButton 复制按钮组件
 * 
 * 支持：
 * - 复制文本/值
 * - 成功/失败状态反馈
 * - 多种样式变体
 */

import * as React from "react"
import { Check, Copy, ClipboardCopy, Link, AlertCircle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// CopyButton 变体
const copyButtonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium transition-all duration-200",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-muted text-muted-foreground",
          "hover:bg-muted/80 hover:text-foreground",
        ],
        ghost: [
          "text-muted-foreground",
          "hover:bg-muted hover:text-foreground",
        ],
        outline: [
          "border border-border text-muted-foreground",
          "hover:bg-muted hover:text-foreground",
        ],
        primary: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90",
        ],
      },
      size: {
        xs: "h-6 w-6 rounded",
        sm: "h-8 w-8 rounded-md",
        default: "h-9 px-3 rounded-lg text-sm",
        lg: "h-10 px-4 rounded-lg",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "icon",
    },
  }
)

type CopyState = "idle" | "copying" | "copied" | "error"

export interface CopyButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof copyButtonVariants> {
  /** 要复制的值 */
  value: string
  /** 复制成功后的显示时间（毫秒） */
  timeout?: number
  /** 显示文字标签 */
  showLabel?: boolean
  /** 复制成功回调 */
  onCopySuccess?: () => void
  /** 复制失败回调 */
  onCopyError?: (error: Error) => void
}

function CopyButton({
  className,
  variant,
  size,
  value,
  timeout = 2000,
  showLabel = false,
  onCopySuccess,
  onCopyError,
  ...props
}: CopyButtonProps) {
  const [state, setState] = React.useState<CopyState>("idle")

  const handleCopy = async () => {
    if (state === "copying") return

    setState("copying")
    
    try {
      await navigator.clipboard.writeText(value)
      setState("copied")
      onCopySuccess?.()
      
      setTimeout(() => {
        setState("idle")
      }, timeout)
    } catch (error) {
      setState("error")
      onCopyError?.(error as Error)
      
      setTimeout(() => {
        setState("idle")
      }, timeout)
    }
  }

  const getIcon = () => {
    switch (state) {
      case "copying":
        return <Copy className="w-4 h-4 animate-pulse" />
      case "copied":
        return <Check className="w-4 h-4 text-primary" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />
      default:
        return <Copy className="w-4 h-4" />
    }
  }

  const getLabel = () => {
    switch (state) {
      case "copying":
        return "复制中..."
      case "copied":
        return "已复制"
      case "error":
        return "复制失败"
      default:
        return "复制"
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={state === "copying"}
      className={cn(
        copyButtonVariants({ variant, size }),
        state === "copied" && "text-primary",
        state === "error" && "text-destructive",
        className
      )}
      {...props}
    >
      {getIcon()}
      {showLabel && <span>{getLabel()}</span>}
    </button>
  )
}

/**
 * CopyField - 带复制按钮的字段
 */
interface CopyFieldProps {
  value: string
  label?: string
  className?: string
}

function CopyField({ value, label, className }: CopyFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground font-mono truncate">
          {value}
        </div>
        <CopyButton value={value} variant="outline" size="sm" />
      </div>
    </div>
  )
}

/**
 * CopyLink - 复制链接组件
 */
interface CopyLinkProps {
  url: string
  label?: string
  showFullUrl?: boolean
  className?: string
}

function CopyLink({ 
  url, 
  label = "复制链接", 
  showFullUrl = false,
  className,
}: CopyLinkProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  // 解析 URL 显示
  const displayUrl = React.useMemo(() => {
    if (showFullUrl) return url
    try {
      const parsed = new URL(url)
      return parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : "")
    } catch {
      return url
    }
  }, [url, showFullUrl])

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
        "bg-muted/50 border border-border",
        "text-sm text-muted-foreground",
        "hover:bg-muted hover:text-foreground",
        "transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        className
      )}
    >
      <Link className="w-4 h-4 shrink-0" />
      <span className="truncate max-w-[200px]">{displayUrl}</span>
      <span className="shrink-0 ml-1">
        {copied ? (
          <Check className="w-4 h-4 text-primary" />
        ) : (
          <ClipboardCopy className="w-4 h-4" />
        )}
      </span>
    </button>
  )
}

/**
 * CopyCode - 复制代码块
 */
interface CopyCodeProps {
  code: string
  language?: string
  className?: string
}

function CopyCode({ code, language, className }: CopyCodeProps) {
  return (
    <div className={cn("relative group", className)}>
      {/* 代码块 */}
      <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
        <code className="text-sm font-mono text-foreground">{code}</code>
      </pre>

      {/* 语言标签 */}
      {language && (
        <span className="absolute top-2 left-3 text-xs text-muted-foreground">
          {language}
        </span>
      )}

      {/* 复制按钮 */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton value={code} variant="default" size="xs" />
      </div>
    </div>
  )
}

/**
 * CopyInput - 可复制的输入框
 */
interface CopyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value"> {
  value: string
  label?: string
  onCopy?: () => void
}

const CopyInput = React.forwardRef<HTMLInputElement, CopyInputProps>(
  ({ value, label, onCopy, className, ...props }, ref) => {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        onCopy?.()
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy:", error)
      }
    }

    return (
      <div className={cn("space-y-1.5", className)}>
        {label && (
          <label className="text-sm font-medium text-foreground">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="text"
            value={value}
            readOnly
            className={cn(
              "w-full h-10 px-3 pr-10 rounded-lg",
              "bg-background border border-border",
              "text-sm font-mono text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            )}
            {...props}
          />
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2",
              "p-2 rounded-md",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
              "transition-colors"
            )}
          >
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    )
  }
)
CopyInput.displayName = "CopyInput"

export {
  CopyButton,
  CopyField,
  CopyLink,
  CopyCode,
  CopyInput,
  copyButtonVariants,
}
export type {
  CopyFieldProps,
  CopyLinkProps,
  CopyCodeProps,
  CopyInputProps,
}