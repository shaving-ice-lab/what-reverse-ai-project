"use client"

/**
 * Tag 标签组件
 * 
 * 支持：
 * - 多种颜色变体
 * - 可关闭/可选择
 * - 图标和头像
 * - 输入标签
 */

import * as React from "react"
import { X, Plus, Check, type LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Tag 变体
const tagVariants = cva(
  [
    "inline-flex items-center gap-1.5",
    "font-medium transition-all duration-200",
    "select-none",
  ],
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-primary/10 text-primary border border-primary/20",
        secondary: "bg-secondary text-secondary-foreground",
        success: "bg-primary/10 text-primary border border-primary/20",
        warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        error: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
        info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
        violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20",
        pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20",
        outline: "bg-transparent border border-border text-foreground",
        ghost: "bg-transparent text-muted-foreground hover:bg-muted",
      },
      size: {
        xs: "h-5 px-1.5 text-[10px] rounded",
        sm: "h-6 px-2 text-xs rounded-md",
        default: "h-7 px-2.5 text-sm rounded-md",
        lg: "h-8 px-3 text-sm rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {
  /** 前置图标 */
  icon?: LucideIcon | React.ReactNode
  /** 头像 URL */
  avatar?: string
  /** 是否可关闭 */
  closable?: boolean
  /** 关闭回调 */
  onClose?: () => void
  /** 是否可选择 */
  selectable?: boolean
  /** 是否选中 */
  selected?: boolean
  /** 选择回调 */
  onSelect?: (selected: boolean) => void
  /** 是否禁用 */
  disabled?: boolean
}

function Tag({
  className,
  variant,
  size,
  icon,
  avatar,
  closable = false,
  onClose,
  selectable = false,
  selected = false,
  onSelect,
  disabled = false,
  children,
  onClick,
  ...props
}: TagProps) {
  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (disabled) return
    if (selectable) {
      onSelect?.(!selected)
    }
    onClick?.(e)
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled) {
      onClose?.()
    }
  }

  // 渲染图标
  const renderIcon = () => {
    if (avatar) {
      return (
        <img
          src={avatar}
          alt=""
          className="w-4 h-4 rounded-full object-cover"
        />
      )
    }
    if (icon) {
      if (React.isValidElement(icon)) return icon
      const IconComponent = icon as LucideIcon
      return <IconComponent className="w-3.5 h-3.5" />
    }
    if (selectable && selected) {
      return <Check className="w-3.5 h-3.5" />
    }
    return null
  }

  return (
    <span
      className={cn(
        tagVariants({ variant, size }),
        selectable && "cursor-pointer",
        selectable && selected && "ring-2 ring-primary/30",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {renderIcon()}
      <span className="truncate">{children}</span>
      {closable && (
        <button
          onClick={handleClose}
          disabled={disabled}
          className={cn(
            "ml-0.5 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10",
            "transition-colors",
            "disabled:cursor-not-allowed"
          )}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

/**
 * TagGroup - 标签组
 */
interface TagGroupProps {
  children: React.ReactNode
  className?: string
}

function TagGroup({ children, className }: TagGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {children}
    </div>
  )
}

/**
 * TagInput - 标签输入
 */
interface TagInputProps {
  /** 标签列表 */
  value?: string[]
  /** 值变化回调 */
  onChange?: (tags: string[]) => void
  /** 占位符 */
  placeholder?: string
  /** 最大标签数 */
  maxTags?: number
  /** 是否允许重复 */
  allowDuplicates?: boolean
  /** 标签变体 */
  tagVariant?: TagProps["variant"]
  /** 是否禁用 */
  disabled?: boolean
  /** 验证函数 */
  validate?: (tag: string) => boolean | string
  className?: string
}

function TagInput({
  value = [],
  onChange,
  placeholder = "输入后按回车添加标签",
  maxTags,
  allowDuplicates = false,
  tagVariant = "default",
  disabled = false,
  validate,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault()
      addTag(inputValue.trim())
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  const addTag = (tag: string) => {
    setError(null)

    // 验证
    if (validate) {
      const result = validate(tag)
      if (result !== true) {
        setError(typeof result === "string" ? result : "无效的标签")
        return
      }
    }

    // 检查重复
    if (!allowDuplicates && value.includes(tag)) {
      setError("标签已存在")
      return
    }

    // 检查最大数量
    if (maxTags && value.length >= maxTags) {
      setError(`最多只能添加 ${maxTags} 个标签`)
      return
    }

    onChange?.([...value, tag])
    setInputValue("")
  }

  const removeTag = (index: number) => {
    const newTags = [...value]
    newTags.splice(index, 1)
    onChange?.(newTags)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 p-2",
          "bg-background border border-border rounded-lg",
          "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary",
          "transition-all duration-200",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, index) => (
          <Tag
            key={index}
            variant={tagVariant}
            size="sm"
            closable
            onClose={() => removeTag(index)}
            disabled={disabled}
          >
            {tag}
          </Tag>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          className={cn(
            "flex-1 min-w-[120px] bg-transparent",
            "text-sm outline-none",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed"
          )}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

/**
 * SelectableTags - 可选择标签组
 */
interface SelectableTagsProps {
  options: { value: string; label: string; icon?: LucideIcon }[]
  value?: string[]
  onChange?: (value: string[]) => void
  multiple?: boolean
  variant?: TagProps["variant"]
  size?: TagProps["size"]
  className?: string
}

function SelectableTags({
  options,
  value = [],
  onChange,
  multiple = true,
  variant = "outline",
  size = "default",
  className,
}: SelectableTagsProps) {
  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]
      onChange?.(newValue)
    } else {
      onChange?.(value.includes(optionValue) ? [] : [optionValue])
    }
  }

  return (
    <TagGroup className={className}>
      {options.map((option) => (
        <Tag
          key={option.value}
          variant={value.includes(option.value) ? "primary" : variant}
          size={size}
          icon={option.icon}
          selectable
          selected={value.includes(option.value)}
          onSelect={() => handleSelect(option.value)}
        >
          {option.label}
        </Tag>
      ))}
    </TagGroup>
  )
}

/**
 * AddTag - 添加标签按钮
 */
interface AddTagProps {
  onClick?: () => void
  label?: string
  size?: TagProps["size"]
  className?: string
}

function AddTag({
  onClick,
  label = "添加标签",
  size = "default",
  className,
}: AddTagProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        tagVariants({ variant: "ghost", size }),
        "border border-dashed border-border",
        "hover:border-primary hover:text-primary",
        "cursor-pointer",
        className
      )}
    >
      <Plus className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  )
}

export {
  Tag,
  TagGroup,
  TagInput,
  SelectableTags,
  AddTag,
  tagVariants,
}
export type {
  TagProps,
  TagGroupProps,
  TagInputProps,
  SelectableTagsProps,
  AddTagProps,
}