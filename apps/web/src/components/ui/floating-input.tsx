'use client'

/**
 * FloatingInput - Floating label input component
 *
 * Supports:
 * - Floating label animation
 * - Validation status
 * - Character count
 * - Clear button
 * - Password show/hide
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, X, Check, AlertCircle, Info, Loader2 } from 'lucide-react'

interface FloatingInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  error?: string
  success?: string
  hint?: string
  showCount?: boolean
  maxLength?: number
  clearable?: boolean
  loading?: boolean
  inputSize?: 'sm' | 'default' | 'lg'
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      success,
      hint,
      showCount = false,
      maxLength,
      clearable = false,
      loading = false,
      inputSize = 'default',
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [showPassword, setShowPassword] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(value || '')
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const currentValue = value !== undefined ? value : internalValue
    const hasValue = currentValue !== '' && currentValue !== undefined
    const isFloating = isFocused || hasValue
    const isPassword = type === 'password'
    const actualType = isPassword && showPassword ? 'text' : type

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
    }

    const handleClear = () => {
      if (value === undefined) {
        setInternalValue('')
      }
      const event = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>
      onChange?.(event)
      inputRef.current?.focus()
    }

    // Status color
    const statusColor = error
      ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
      : success
        ? 'border-primary focus:border-primary focus:ring-primary/20'
        : 'border-border focus:border-primary focus:ring-primary/20'

    // Size styles
    const sizeStyles = {
      sm: 'h-10 text-sm',
      default: 'h-12 text-sm',
      lg: 'h-14 text-base',
    }

    const labelSizeStyles = {
      sm: isFloating ? 'text-[10px] -top-2' : 'text-sm top-2.5',
      default: isFloating ? 'text-xs -top-2.5' : 'text-sm top-3.5',
      lg: isFloating ? 'text-xs -top-2.5' : 'text-base top-4',
    }

    const charCount = typeof currentValue === 'string' ? currentValue.length : 0

    return (
      <div className={cn('relative', className)}>
        {/* Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type={actualType}
            value={currentValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled || loading}
            maxLength={maxLength}
            className={cn(
              'peer w-full rounded-lg border bg-background text-foreground',
              'px-4 pt-4 pb-2',
              'transition-all duration-200',
              'placeholder-transparent',
              'focus:outline-none focus:ring-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              sizeStyles[inputSize],
              statusColor,
              (clearable || isPassword || loading) && 'pr-10',
              clearable && isPassword && 'pr-16'
            )}
            placeholder={label}
            {...props}
          />

          {/* Floating label */}
          <label
            className={cn(
              'absolute left-4 px-1 bg-background',
              'pointer-events-none',
              'transition-all duration-200 ease-out',
              labelSizeStyles[inputSize],
              isFloating ? 'text-muted-foreground' : 'text-muted-foreground/70',
              isFocused && !error && !success && 'text-primary',
              error && 'text-destructive',
              success && 'text-primary'
            )}
          >
            {label}
          </label>

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

            {!loading && clearable && hasValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                tabIndex={-1}
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {!loading && isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}

            {!loading && error && !clearable && !isPassword && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}

            {!loading && success && !clearable && !isPassword && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between mt-1.5 px-1">
          <div className="flex-1">
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
            {success && !error && (
              <p className="text-xs text-primary flex items-center gap-1">
                <Check className="h-3 w-3" />
                {success}
              </p>
            )}
            {hint && !error && !success && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                {hint}
              </p>
            )}
          </div>

          {showCount && maxLength && (
            <p
              className={cn(
                'text-xs tabular-nums',
                charCount > maxLength * 0.9 ? 'text-amber-500' : 'text-muted-foreground',
                charCount >= maxLength && 'text-destructive'
              )}
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }
)
FloatingInput.displayName = 'FloatingInput'

/**
 * FloatingTextarea - Floating label textarea
 */
interface FloatingTextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size'
> {
  label: string
  error?: string
  success?: string
  hint?: string
  showCount?: boolean
  maxLength?: number
}

const FloatingTextarea = React.forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  (
    {
      className,
      label,
      error,
      success,
      hint,
      showCount = false,
      maxLength,
      disabled,
      value,
      onChange,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(value || '')

    const currentValue = value !== undefined ? value : internalValue
    const hasValue = currentValue !== '' && currentValue !== undefined
    const isFloating = isFocused || hasValue

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
    }

    const statusColor = error
      ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
      : success
        ? 'border-primary focus:border-primary focus:ring-primary/20'
        : 'border-border focus:border-primary focus:ring-primary/20'

    const charCount = typeof currentValue === 'string' ? currentValue.length : 0

    return (
      <div className={cn('relative', className)}>
        <div className="relative">
          <textarea
            ref={ref}
            value={currentValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            maxLength={maxLength}
            rows={rows}
            className={cn(
              'peer w-full rounded-lg border bg-background text-foreground',
              'px-4 pt-6 pb-2 text-sm',
              'transition-all duration-200',
              'placeholder-transparent resize-none',
              'focus:outline-none focus:ring-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              statusColor
            )}
            placeholder={label}
            {...props}
          />

          <label
            className={cn(
              'absolute left-4 px-1 bg-background',
              'pointer-events-none',
              'transition-all duration-200 ease-out',
              isFloating ? 'text-xs -top-2.5' : 'text-sm top-4',
              isFloating ? 'text-muted-foreground' : 'text-muted-foreground/70',
              isFocused && !error && !success && 'text-primary',
              error && 'text-destructive',
              success && 'text-primary'
            )}
          >
            {label}
          </label>
        </div>

        <div className="flex items-center justify-between mt-1.5 px-1">
          <div className="flex-1">
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
            {success && !error && (
              <p className="text-xs text-primary flex items-center gap-1">
                <Check className="h-3 w-3" />
                {success}
              </p>
            )}
            {hint && !error && !success && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                {hint}
              </p>
            )}
          </div>

          {showCount && maxLength && (
            <p
              className={cn(
                'text-xs tabular-nums',
                charCount > maxLength * 0.9 ? 'text-amber-500' : 'text-muted-foreground',
                charCount >= maxLength && 'text-destructive'
              )}
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }
)
FloatingTextarea.displayName = 'FloatingTextarea'

/**
 * SearchInput - Search input component
 */
interface SearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  onSearch?: (value: string) => void
  loading?: boolean
  inputSize?: 'sm' | 'default' | 'lg'
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { className, onSearch, loading = false, inputSize = 'default', value, onChange, ...props },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(value || '')
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const currentValue = value !== undefined ? value : internalValue
    const hasValue = currentValue !== '' && currentValue !== undefined

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
    }

    const handleClear = () => {
      if (value === undefined) {
        setInternalValue('')
      }
      const event = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>
      onChange?.(event)
      onSearch?.('')
      inputRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSearch?.(currentValue as string)
      }
    }

    const sizeStyles = {
      sm: 'h-9 text-sm pl-9 pr-9',
      default: 'h-10 text-sm pl-10 pr-10',
      lg: 'h-12 text-base pl-11 pr-11',
    }

    const iconSizes = {
      sm: 'w-4 h-4',
      default: 'w-4 h-4',
      lg: 'w-5 h-5',
    }

    return (
      <div className={cn('relative', className)}>
        {/* Search icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {loading ? (
            <Loader2 className={cn(iconSizes[inputSize], 'animate-spin')} />
          ) : (
            <svg
              className={iconSizes[inputSize]}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={currentValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full rounded-lg border border-border bg-background text-foreground',
            'transition-all duration-200',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
            sizeStyles[inputSize]
          )}
          {...props}
        />

        {/* Clear button */}
        {hasValue && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            tabIndex={-1}
          >
            <X className={iconSizes[inputSize]} />
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = 'SearchInput'

export { FloatingInput, FloatingTextarea, SearchInput }
