"use client"

/**
 * NumberInput countcharInputComponent

 * 

 * Support: 

 * - Stepper button

 * - Minimum/Maximum value limit

 * - Format display

 * - Precision control
 */

import * as React from "react"
import { Minus, Plus, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "size"> {
 /** Currentvalue */

 value?: number

 /** Defaultvalue */

 defaultValue?: number

 /** valueCallback */

 onChange?: (value: number | undefined) => void

 /** Minimumvalue */

 min?: number

 /** Maximumvalue */

 max?: number

 /** Stepper value */

 step?: number

 /** Decimal precision */

 precision?: number

 /** Dimension */

  size?: "sm" | "default" | "lg"

  /** Whether to display stepper */

  showStepper?: boolean

 /** Stepper position */

 stepperPosition?: "right" | "sides"

 /** Prefix */

 prefix?: React.ReactNode

 /** Suffix */

 suffix?: React.ReactNode

 /** Format display */

 formatter?: (value: number | undefined) => string

  /** Parse input */

  parser?: (value: string) => number | undefined

  /** Whether to allow empty value */

  allowEmpty?: boolean

 /** ErrorStatus */

 error?: boolean
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
 ({
 className", value: controlledValue,

 defaultValue,

 onChange,

 min,

 max,

 step = 1,

 precision,

 size = "default",

 showStepper = true,

 stepperPosition = "right",

 prefix,

 suffix,

 formatter,

 parser,

 allowEmpty = true,

 error = false,

 disabled,

 ...props

 }, ref) => {
 const [internalValue, setInternalValue] = React.useState<number | undefined>(defaultValue)

 const [inputValue, setInputValue] = React.useState<string>("")

 const [isFocused, setIsFocused] = React.useState(false)

 const inputRef = React.useRef<HTMLInputElement>(null)

 // and ref

 React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

 const value = controlledValue !== undefined ? controlledValue : internalValue

 // Formatcountvalue

 const formatValue = React.useCallback((val: number | undefined): string => {
 if (val === undefined) return ""

 if (formatter) return formatter(val)

 if (precision !== undefined) return val.toFixed(precision)

 return String(val)

 }, [formatter, precision])

 // Parse input

 const parseValue = React.useCallback((str: string): number | undefined => {
 if (!str || str === "-") return undefined

 if (parser) return parser(str)

 const num = parseFloat(str)

 return isNaN(num) ? undefined : num

 }, [parser])

 // LimitRange

 const clampValue = React.useCallback((val: number | undefined): number | undefined => {
 if (val === undefined) return undefined

 let clamped = val

 if (min !== undefined) clamped = Math.max(min, clamped)

 if (max !== undefined) clamped = Math.min(max, clamped)

 if (precision !== undefined) {
 clamped = parseFloat(clamped.toFixed(precision))

 }

 return clamped

 }, [min, max, precision])

 // UpdateDisplayvalue

 React.useEffect(() => {
 if (!isFocused) {
 setInputValue(formatValue(value))

 }

 }, [value, isFocused, formatValue])

 // Updatevalue

 const updateValue = (newValue: number | undefined) => {
 const clamped = clampValue(newValue)

 if (controlledValue === undefined) {
 setInternalValue(clamped)

 }

 onChange?.(clamped)

 }

 // Increase

 const increment = () => {
 const current = value ?? (min ?? 0)

 updateValue(current + step)

 }

 // few

 const decrement = () => {
 const current = value ?? (max ?? 0)

 updateValue(current - step)

 }

 // ProcessInput

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const str = e.target.value

 setInputValue(str)

 if (str === "" && allowEmpty) {
 updateValue(undefined)

 return

 }

 const parsed = parseValue(str)

 if (parsed !== undefined) {
 updateValue(parsed)

 }

 }

 // Process

 const handleBlur = () => {
 setIsFocused(false)

 setInputValue(formatValue(value))

 }

 // Processkey

 const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === "ArrowUp") {
 e.preventDefault()

 increment()

 } else if (e.key === "ArrowDown") {
 e.preventDefault()

 decrement()

 }

 }

 // Dimensionstyle

 const sizeStyles = {
 sm: "h-8 text-sm",

 default: "h-10",

 lg: "h-12 text-lg",

 }

 const buttonSizeStyles = {
 sm: "w-6 h-6",

 default: "w-8 h-8",

 lg: "w-10 h-10",

 }

 const canIncrement = max === undefined || (value ?? 0) < max

 const canDecrement = min === undefined || (value ?? 0) > min

 return (
 <div

 className={cn(
 "relative flex items-center",

 "bg-background border rounded-lg",

 "transition-all duration-200",

 error 

 ? "border-destructive focus-within:ring-2 focus-within:ring-destructive/20" 

 : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-brand-500/20",

 disabled && "opacity-50 cursor-not-allowed",

 sizeStyles[size],

 className

 )}

 >

 {/* Left sideStepper */}

 {showStepper && stepperPosition === "sides" && (
 <button

 type="button"

 onClick={decrement}

 disabled={disabled || !canDecrement}

 className={cn(
 "flex items-center justify-center shrink-0",

 "text-foreground-light hover:text-foreground",

 "disabled:opacity-30 disabled:cursor-not-allowed",

 "transition-colors",

 buttonSizeStyles[size]

 )}

 tabIndex={-1}

 >

 <Minus className="w-4 h-4" />

 </button>

  )}

 {/* Prefix */}

 {prefix && (
 <span className="pl-3 text-foreground-light shrink-0">{prefix}</span>

 )}

 {/* Input */}

 <input

 ref={inputRef}

 type="text"

 inputMode="decimal"

 value={inputValue}

 onChange={handleChange}

 onFocus={() => setIsFocused(true)}

 onBlur={handleBlur}

 onKeyDown={handleKeyDown}

 disabled={disabled}

 className={cn(
 "flex-1 w-full min-w-0 bg-transparent",

 "text-center tabular-nums",

 "focus:outline-none",

 "disabled:cursor-not-allowed",

 !prefix && "pl-3",

 !suffix && !showStepper && "pr-3",

 )}

 {...props}

  />

 {/* Suffix */}

 {suffix && (
 <span className="pr-3 text-foreground-light shrink-0">{suffix}</span>

 )}

 {/* Right sideStepper */}

 {showStepper && stepperPosition === "right" && (
 <div className="flex flex-col border-l border-border shrink-0">

 <button

 type="button"

 onClick={increment}

 disabled={disabled || !canIncrement}

 className={cn(
 "flex items-center justify-center px-2 flex-1",

 "text-foreground-light hover:text-foreground hover:bg-surface-200",

 "disabled:opacity-30 disabled:cursor-not-allowed",

 "transition-colors border-b border-border",

 )}

 tabIndex={-1}

 >

 <ChevronUp className="w-3 h-3" />

 </button>

 <button

 type="button"

 onClick={decrement}

 disabled={disabled || !canDecrement}

 className={cn(
 "flex items-center justify-center px-2 flex-1",

 "text-foreground-light hover:text-foreground hover:bg-surface-200",

 "disabled:opacity-30 disabled:cursor-not-allowed",

 "transition-colors",

 )}

 tabIndex={-1}

 >

 <ChevronDown className="w-3 h-3" />

 </button>

 </div>

 )}

 {/* EdgeStepper - Right side */}

 {showStepper && stepperPosition === "sides" && (
 <button

 type="button"

 onClick={increment}

 disabled={disabled || !canIncrement}

 className={cn(
 "flex items-center justify-center shrink-0",

 "text-foreground-light hover:text-foreground",

 "disabled:opacity-30 disabled:cursor-not-allowed",

 "transition-colors",

 buttonSizeStyles[size]

 )}

 tabIndex={-1}

 >

 <Plus className="w-4 h-4" />

 </button>

 )}

 </div>

 )

 }
)

NumberInput.displayName = "NumberInput"

/**
 * CurrencyInput - CurrencyInput
 */

interface CurrencyInputProps extends Omit<NumberInputProps, "prefix" | "formatter" | "parser" | "precision"> {
 /** CurrencySymbol */

 currency?: string

 /** Currency */

 currencyPosition?: "prefix" | "suffix"

 /** smallcountcount */

 decimals?: number
}

function CurrencyInput({
 currency = "",

 currencyPosition = "prefix",

 decimals = 2,

 ...props
}: CurrencyInputProps) {
 return (
 <NumberInput

 precision={decimals}

 prefix={currencyPosition === "prefix" ? currency : undefined}

 suffix={currencyPosition === "suffix" ? currency : undefined}

 formatter={(val) => val !== undefined ? val.toFixed(decimals) : ""}

 {...props}

 />

 )
}

/**
 * PercentInput - PercentageInput
 */

interface PercentInputProps extends Omit<NumberInputProps, "suffix" | "formatter" | "parser" | "min" | "max"> {
 /** smallcountcount */

 decimals?: number
}

function PercentInput({
 decimals = 0,

 ...props
}: PercentInputProps) {
 return (
 <NumberInput

 min={0}

 max={100}

 precision={decimals}

 suffix="%"

 {...props}

 />

 )
}

/**
 * QuantityInput - CountInput(count)
 */

interface QuantityInputProps extends Omit<NumberInputProps, "precision" | "step"> {
  /** Whether to use compact mode */

  compact?: boolean
}

function QuantityInput({
 compact = false,

 min = 0,

 showStepper = true,

 stepperPosition = "sides",

 ...props
}: QuantityInputProps) {
 return (
 <NumberInput

 precision={0}

 step={1}

 min={min}

 showStepper={showStepper}

 stepperPosition={stepperPosition}

 className={compact ? "w-32" : undefined}

 {...props}

 />

 )
}

export {
 NumberInput,

 CurrencyInput,

 PercentInput,

 QuantityInput,
}

export type {
 NumberInputProps,

 CurrencyInputProps,

 PercentInputProps,

 QuantityInputProps,
}