'use client'

/**
 * Color Picker Component
 *
 * Support:
 * - Preset colors
 * - Custom color input
 * - Opacity control
 * - Gradient selection
 */

import * as React from 'react'
import { Check, Pipette, Copy, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// Preset colors
const presetColors = [
  // Theme - Manus Orange
  '#f97316',
  '#fb923c',
  '#ea580c',
  // Blue
  '#3B82F6',
  '#2563EB',
  '#1D4ED8',
  // Purple
  '#8B5CF6',
  '#7C3AED',
  '#6D28D9',
  // Pink
  '#EC4899',
  '#DB2777',
  '#BE185D',
  // Red
  '#EF4444',
  '#DC2626',
  '#B91C1C',
  // Orange
  '#F97316',
  '#EA580C',
  '#C2410C',
  // Yellow
  '#EAB308',
  '#CA8A04',
  '#A16207',
  // Gray
  '#6B7280',
  '#4B5563',
  '#374151',
  // Monochrome
  '#000000',
  '#FFFFFF',
]

interface ColorPickerProps {
  /** Current color value */
  value?: string
  /** Default color */
  defaultValue?: string
  /** Color change callback */
  onChange?: (color: string) => void
  /** Preset color list */
  presets?: string[]
  /** Whether to display opacity control */
  showAlpha?: boolean
  /** Whether to display input field */
  showInput?: boolean
  /** Whether to allow custom colors */
  allowCustom?: boolean
  /** Whether disabled */
  disabled?: boolean
  className?: string
}

function ColorPicker({
  value: controlledValue,
  defaultValue = 'hsl(var(--primary))',
  onChange,
  presets = presetColors,
  showAlpha = false,
  showInput = true,
  allowCustom = true,
  disabled = false,
  className,
}: ColorPickerProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [inputValue, setInputValue] = React.useState(defaultValue)
  const [copied, setCopied] = React.useState(false)

  const value = controlledValue ?? internalValue

  // Sync input value
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleColorChange = (color: string) => {
    if (disabled) return
    if (controlledValue === undefined) {
      setInternalValue(color)
    }
    setInputValue(color)
    onChange?.(color)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Verify color format
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue) || /^#[0-9A-Fa-f]{3}$/.test(newValue)) {
      handleColorChange(newValue)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Current color preview */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-lg border border-border shadow-sm"
          style={{ backgroundColor: value }}
        />

        {showInput && (
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                disabled={disabled}
                className={cn(
                  'w-full h-10 px-3 pr-20 rounded-lg',
                  'bg-background border border-border',
                  'text-sm font-mono uppercase',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                placeholder="#000000"
              />

              {/* Action buttons */}
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {allowCustom && (
                  <label className="p-2 rounded-md hover:bg-muted cursor-pointer transition-colors">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="sr-only"
                    />
                    <Pipette className="w-4 h-4 text-muted-foreground" />
                  </label>
                )}
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-md hover:bg-muted transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preset colors */}
      <div className="grid grid-cols-8 gap-2">
        {presets.map((color) => (
          <button
            key={color}
            onClick={() => handleColorChange(color)}
            disabled={disabled}
            className={cn(
              'relative w-8 h-8 rounded-lg',
              'border-2 transition-all duration-200',
              'hover:scale-110',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              value.toLowerCase() === color.toLowerCase()
                ? 'border-foreground shadow-md'
                : 'border-transparent hover:border-border'
            )}
            style={{ backgroundColor: color }}
          >
            {value.toLowerCase() === color.toLowerCase() && (
              <Check
                className={cn(
                  'absolute inset-0 m-auto w-4 h-4',
                  isLightColor(color) ? 'text-black' : 'text-white'
                )}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * ColorSwatch - Color swatch
 */
interface ColorSwatchProps {
  color: string
  selected?: boolean
  size?: 'sm' | 'default' | 'lg'
  onClick?: () => void
  className?: string
}

function ColorSwatch({
  color,
  selected = false,
  size = 'default',
  onClick,
  className,
}: ColorSwatchProps) {
  const sizeStyles = {
    sm: 'w-6 h-6 rounded',
    default: 'w-8 h-8 rounded-lg',
    lg: 'w-10 h-10 rounded-xl',
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative border-2 transition-all duration-200',
        'hover:scale-110 active:scale-95',
        sizeStyles[size],
        selected ? 'border-foreground shadow-md' : 'border-transparent hover:border-border',
        className
      )}
      style={{ backgroundColor: color }}
    >
      {selected && (
        <Check
          className={cn(
            'absolute inset-0 m-auto',
            size === 'sm' ? 'w-3 h-3' : 'w-4 h-4',
            isLightColor(color) ? 'text-black' : 'text-white'
          )}
        />
      )}
    </button>
  )
}

/**
 * ColorPalette - Color palette
 */
interface ColorPaletteProps {
  colors: string[][]
  value?: string
  onChange?: (color: string) => void
  className?: string
}

function ColorPalette({ colors, value, onChange, className }: ColorPaletteProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {colors.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          {row.map((color) => (
            <ColorSwatch
              key={color}
              color={color}
              selected={value?.toLowerCase() === color.toLowerCase()}
              size="sm"
              onClick={() => onChange?.(color)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * GradientPicker - Gradient selector
 */
interface GradientPickerProps {
  value?: string
  onChange?: (gradient: string) => void
  presets?: string[]
  className?: string
}

const gradientPresets = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
]

function GradientPicker({
  value,
  onChange,
  presets = gradientPresets,
  className,
}: GradientPickerProps) {
  return (
    <div className={cn('grid grid-cols-4 gap-2', className)}>
      {presets.map((gradient, index) => (
        <button
          key={index}
          onClick={() => onChange?.(gradient)}
          className={cn(
            'h-12 rounded-lg transition-all duration-200',
            'border-2 hover:scale-105',
            value === gradient
              ? 'border-foreground shadow-md'
              : 'border-transparent hover:border-border'
          )}
          style={{ background: gradient }}
        />
      ))}
    </div>
  )
}

/**
 * SimpleColorPicker - Color Picker
 */
interface SimpleColorPickerProps {
  value?: string
  onChange?: (color: string) => void
  colors?: string[]
  columns?: number
  className?: string
}

function SimpleColorPicker({
  value,
  onChange,
  colors = presetColors.slice(0, 12),
  columns = 6,
  className,
}: SimpleColorPickerProps) {
  return (
    <div
      className={cn('grid gap-2', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {colors.map((color) => (
        <ColorSwatch
          key={color}
          color={color}
          selected={value?.toLowerCase() === color.toLowerCase()}
          onClick={() => onChange?.(color)}
        />
      ))}
    </div>
  )
}

/**
 * ColorPickerPopover - Popover color picker
 */
interface ColorPickerPopoverProps extends ColorPickerProps {
  /** Trigger */
  trigger?: React.ReactNode
}

function ColorPickerPopover({
  value: controlledValue,
  defaultValue = 'hsl(var(--primary))',
  onChange,
  trigger,
  ...props
}: ColorPickerPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(defaultValue)

  const value = controlledValue ?? internalValue

  const handleChange = (color: string) => {
    if (controlledValue === undefined) {
      setInternalValue(color)
    }
    onChange?.(color)
  }

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
        {trigger || (
          <div
            className="w-10 h-10 rounded-lg border border-border shadow-sm cursor-pointer hover:border-primary transition-colors"
            style={{ backgroundColor: value }}
          />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 z-50 p-4 bg-popover border border-border rounded-xl shadow-lg">
            <ColorPicker value={value} onChange={handleChange} {...props} />
          </div>
        </>
      )}
    </div>
  )
}

// Helper Functions: Determine if Color is Light
function isLightColor(color: string): boolean {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}

export {
  ColorPicker,
  ColorSwatch,
  ColorPalette,
  GradientPicker,
  SimpleColorPicker,
  ColorPickerPopover,
  presetColors,
  gradientPresets,
}
export type {
  ColorPickerProps,
  ColorSwatchProps,
  ColorPaletteProps,
  GradientPickerProps,
  SimpleColorPickerProps,
  ColorPickerPopoverProps,
}
