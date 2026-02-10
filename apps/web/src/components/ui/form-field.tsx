'use client'

/**
 * FormField wrapper with label, hint, and error states.
 */

import { forwardRef, useId } from 'react'
import type { ChangeEvent, ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react'
import { AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from './label'
import { Input } from './input'
import { Textarea } from './textarea'

interface FormFieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  optional?: boolean
  controlId?: string
  className?: string
  children: ReactNode
}

export function FormField({
  label,
  hint,
  error,
  required,
  optional,
  controlId,
  className,
  children,
}: FormFieldProps) {
  const labelVariant = required ? 'required' : optional ? 'optional' : 'default'

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label
        htmlFor={controlId}
        variant={labelVariant}
        className={cn('text-sm', error && 'text-destructive')}
      >
        {label}
      </Label>
      {children}
      {error ? <FormError>{error}</FormError> : hint ? <FormHint>{hint}</FormHint> : null}
    </div>
  )
}

interface FormHintProps extends HTMLAttributes<HTMLParagraphElement> {
  icon?: ReactNode
}

export function FormHint({ children, icon, className, ...props }: FormHintProps) {
  return (
    <p
      className={cn('flex items-center gap-1 text-xs text-foreground-muted', className)}
      {...props}
    >
      {icon ?? <Info className="h-3 w-3 shrink-0" />}
      {children}
    </p>
  )
}

interface FormErrorProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode
}

export function FormError({ children, icon, className, ...props }: FormErrorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs text-destructive p-2 rounded-md bg-destructive-200',
        className
      )}
      {...props}
    >
      {icon ?? <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </div>
  )
}

interface ValidatedInputProps extends Omit<ComponentPropsWithoutRef<typeof Input>, 'error'> {
  label: string
  hint?: string
  error?: string
  required?: boolean
  optional?: boolean
  onValueChange?: (value: string) => void
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ label, hint, error, required, optional, onValueChange, onChange, id, ...props }, ref) => {
    const generatedId = useId()
    const controlId = id ?? generatedId

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event)
      onValueChange?.(event.target.value)
    }

    return (
      <FormField
        label={label}
        hint={hint}
        error={error}
        required={required}
        optional={optional}
        controlId={controlId}
      >
        <Input ref={ref} id={controlId} error={Boolean(error)} onChange={handleChange} {...props} />
      </FormField>
    )
  }
)
ValidatedInput.displayName = 'ValidatedInput'

interface ValidatedTextareaProps extends ComponentPropsWithoutRef<typeof Textarea> {
  label: string
  hint?: string
  error?: string
  required?: boolean
  optional?: boolean
  onValueChange?: (value: string) => void
}

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  (
    { label, hint, error, required, optional, onValueChange, onChange, id, className, ...props },
    ref
  ) => {
    const generatedId = useId()
    const controlId = id ?? generatedId

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(event)
      onValueChange?.(event.target.value)
    }

    return (
      <FormField
        label={label}
        hint={hint}
        error={error}
        required={required}
        optional={optional}
        controlId={controlId}
      >
        <Textarea
          ref={ref}
          id={controlId}
          className={cn(
            error &&
              'border-destructive-400/60 focus-visible:ring-destructive/30 focus-visible:border-destructive-400',
            className
          )}
          onChange={handleChange}
          {...props}
        />
      </FormField>
    )
  }
)
ValidatedTextarea.displayName = 'ValidatedTextarea'

interface ValidatedNumberInputProps extends Omit<
  ComponentPropsWithoutRef<typeof Input>,
  'type' | 'error' | 'onChange'
> {
  label: string
  hint?: string
  error?: string
  required?: boolean
  optional?: boolean
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export const ValidatedNumberInput = forwardRef<HTMLInputElement, ValidatedNumberInputProps>(
  (
    { label, hint, error, required, optional, value, onValueChange, min, max, step, id, ...props },
    ref
  ) => {
    const generatedId = useId()
    const controlId = id ?? generatedId

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = parseFloat(event.target.value)
      if (!Number.isNaN(nextValue)) {
        onValueChange(nextValue)
      }
    }

    return (
      <FormField
        label={label}
        hint={hint}
        error={error}
        required={required}
        optional={optional}
        controlId={controlId}
      >
        <Input
          ref={ref}
          id={controlId}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          error={Boolean(error)}
          onChange={handleChange}
          {...props}
        />
      </FormField>
    )
  }
)
ValidatedNumberInput.displayName = 'ValidatedNumberInput'
