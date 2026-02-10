'use client'

/**
 * FormFieldComponent - Minimalist Style
 */

import { forwardRef } from 'react'
import { AlertCircle, Info } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  hint?: string
  className?: string
  children: React.ReactNode
}

export function FormField({ label, error, required, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className={cn('text-sm', error && 'text-destructive')}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive p-2 rounded-md bg-destructive-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
      {hint && !error && (
        <p className="flex items-center gap-1 text-xs text-foreground-muted">
          <Info className="h-3 w-3 shrink-0" />
          {hint}
        </p>
      )}
    </div>
  )
}

interface ValidatedInputProps extends React.ComponentPropsWithoutRef<typeof Input> {
  label: string
  error?: string
  required?: boolean
  hint?: string
  onValueChange?: (value: string) => void
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ label, error, required, hint, onValueChange, onChange, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      onValueChange?.(e.target.value)
    }

    return (
      <FormField label={label} error={error} required={required} hint={hint}>
        <Input
          ref={ref}
          className={cn(error && 'border-destructive', className)}
          onChange={handleChange}
          {...props}
        />
      </FormField>
    )
  }
)
ValidatedInput.displayName = 'ValidatedInput'

interface ValidatedTextareaProps extends React.ComponentPropsWithoutRef<typeof Textarea> {
  label: string
  error?: string
  required?: boolean
  hint?: string
  onValueChange?: (value: string) => void
}

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ label, error, required, hint, onValueChange, onChange, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e)
      onValueChange?.(e.target.value)
    }

    return (
      <FormField label={label} error={error} required={required} hint={hint}>
        <Textarea
          ref={ref}
          className={cn(error && 'border-destructive', className)}
          onChange={handleChange}
          {...props}
        />
      </FormField>
    )
  }
)
ValidatedTextarea.displayName = 'ValidatedTextarea'

interface ValidatedNumberInputProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  'type' | 'onChange'
> {
  label: string
  error?: string
  required?: boolean
  hint?: string
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export const ValidatedNumberInput = forwardRef<HTMLInputElement, ValidatedNumberInputProps>(
  (
    { label, error, required, hint, value, onValueChange, min, max, step, className, ...props },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseFloat(e.target.value)
      if (!isNaN(numValue)) {
        onValueChange(numValue)
      }
    }

    return (
      <FormField label={label} error={error} required={required} hint={hint}>
        <Input
          ref={ref}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          className={cn(error && 'border-destructive', className)}
          onChange={handleChange}
          {...props}
        />
      </FormField>
    )
  }
)
ValidatedNumberInput.displayName = 'ValidatedNumberInput'
