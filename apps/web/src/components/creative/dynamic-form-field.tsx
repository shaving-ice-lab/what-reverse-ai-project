'use client'

/**
 * Dynamic Form Field Component
 *
 * Dynamically renders different form widgets based on input field type definitions.
 * Supports validation, AI suggestions, conditional display, and more.
 */

import { useState, useCallback } from 'react'
import { Sparkles, HelpCircle, AlertCircle, Check, Loader2, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { InputField, InputValidation } from '@/types/creative'

export interface DynamicFormFieldProps {
  field: InputField
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  isRequired?: boolean
  onAISuggest?: (fieldId: string, prompt: string) => Promise<string>
  allValues?: Record<string, unknown>
}

/**
 * Validate field value
 */
export function validateFieldValue(
  value: unknown,
  validation?: InputValidation,
  isRequired?: boolean
): string | undefined {
  // Required validation
  if (isRequired || validation?.required) {
    if (value === undefined || value === null || value === '') {
      return 'This field is required'
    }
    if (Array.isArray(value) && value.length === 0) {
      return 'Please select at least one'
    }
  }

  // If value is empty and not required, skip other validations
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const strValue = String(value)

  // Length validation
  if (validation?.minLength && strValue.length < validation.minLength) {
    return `Must be at least ${validation.minLength} characters`
  }
  if (validation?.maxLength && strValue.length > validation.maxLength) {
    return `Cannot exceed ${validation.maxLength} characters`
  }

  // Numeric range validation
  if (typeof value === 'number') {
    if (validation?.min !== undefined && value < validation.min) {
      return `Cannot be less than ${validation.min}`
    }
    if (validation?.max !== undefined && value > validation.max) {
      return `Cannot be greater than ${validation.max}`
    }
  }

  // Pattern validation
  if (validation?.pattern) {
    const regex = new RegExp(validation.pattern)
    if (!regex.test(strValue)) {
      return validation.patternMessage || 'Invalid format'
    }
  }

  return undefined
}

/**
 * Check conditional display
 */
export function checkShowCondition(field: InputField, allValues: Record<string, unknown>): boolean {
  if (!field.showWhen) return true

  const { field: dependField, operator, value: expectedValue } = field.showWhen
  const actualValue = allValues[dependField]

  switch (operator) {
    case 'eq':
      return actualValue === expectedValue
    case 'neq':
      return actualValue !== expectedValue
    case 'contains':
      if (Array.isArray(actualValue)) {
        return actualValue.includes(expectedValue)
      }
      return String(actualValue).includes(String(expectedValue))
    case 'notEmpty':
      return actualValue !== undefined && actualValue !== null && actualValue !== ''
    default:
      return true
  }
}

/**
 * Dynamic Form Field Component
 */
export function DynamicFormField({
  field,
  value,
  onChange,
  error,
  isRequired,
  onAISuggest,
  allValues = {},
}: DynamicFormFieldProps) {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)

  // Check conditional display
  if (!checkShowCondition(field, allValues)) {
    return null
  }

  // AI suggestion handler
  const handleAISuggest = useCallback(async () => {
    if (!onAISuggest || !field.aiSuggestPrompt) return

    setAiLoading(true)
    try {
      const suggestion = await onAISuggest(field.id, field.aiSuggestPrompt)
      setAiSuggestion(suggestion)
    } catch (err) {
      console.error('AI suggest failed:', err)
    } finally {
      setAiLoading(false)
    }
  }, [onAISuggest, field.id, field.aiSuggestPrompt])

  // Apply AI suggestion
  const applyAISuggestion = useCallback(() => {
    if (aiSuggestion) {
      onChange(aiSuggestion)
      setAiSuggestion(null)
    }
  }, [aiSuggestion, onChange])

  // Render form widget
  const renderControl = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.id}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(
              'bg-white dark:bg-card border-border',
              error && 'border-red-500 dark:border-red-500'
            )}
          />
        )

      case 'textarea':
        return (
          <Textarea
            id={field.id}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={cn(
              'bg-white dark:bg-card border-border resize-none',
              error && 'border-red-500 dark:border-red-500'
            )}
          />
        )

      case 'number':
        return (
          <Input
            id={field.id}
            type="number"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={cn(
              'bg-white dark:bg-card border-border',
              error && 'border-red-500 dark:border-red-500'
            )}
          />
        )

      case 'select':
        return (
          <Select value={String(value || '')} onValueChange={(v) => onChange(v)}>
            <SelectTrigger
              className={cn(
                'bg-white dark:bg-card border-border',
                error && 'border-red-500 dark:border-red-500'
              )}
            >
              <SelectValue placeholder={field.placeholder || 'Please select...'} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-popover border-border">
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {option.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  'w-full justify-between bg-white dark:bg-card border-border',
                  error && 'border-red-500 dark:border-red-500'
                )}
              >
                <span className="truncate">
                  {selectedValues.length > 0
                    ? `${selectedValues.length} selected`
                    : field.placeholder || 'Please select...'}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2 bg-white dark:bg-popover border-border">
              <div className="space-y-1">
                {field.options?.map((option) => {
                  const isSelected = selectedValues.includes(option.value)
                  return (
                    <div
                      key={option.value}
                      onClick={() => {
                        if (isSelected) {
                          onChange(selectedValues.filter((v) => v !== option.value))
                        } else {
                          onChange([...selectedValues, option.value])
                        }
                      }}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors',
                        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center',
                          isSelected ? 'bg-primary border-primary' : 'border-border'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <span>{option.label}</span>
                    </div>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        )

      case 'slider':
        const sliderValue = typeof value === 'number' ? value : field.validation?.min || 0
        return (
          <div className="space-y-3">
            <Slider
              value={[sliderValue]}
              onValueChange={([v]) => onChange(v)}
              min={field.validation?.min || 0}
              max={field.validation?.max || 100}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{field.validation?.min || 0}</span>
              <span className="font-medium text-primary">{sliderValue}</span>
              <span>{field.validation?.max || 100}</span>
            </div>
          </div>
        )

      case 'switch':
        return (
          <div className="flex items-center gap-3">
            <Switch
              id={field.id}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(checked)}
            />
            <Label htmlFor={field.id} className="text-sm text-muted-foreground cursor-pointer">
              {value ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        )

      case 'date':
        return (
          <Input
            id={field.id}
            type="date"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'bg-white dark:bg-card border-border',
              error && 'border-red-500 dark:border-red-500'
            )}
          />
        )

      default:
        return (
          <Input
            id={field.id}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="bg-white dark:bg-card border-border"
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor={field.id} className="text-sm font-medium text-foreground">
            {field.label}
          </Label>
          {isRequired && <span className="text-red-500 text-xs">*</span>}
          {field.helpText && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{field.helpText}</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* AI Suggestion Button */}
        {field.aiSuggest && onAISuggest && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAISuggest}
            disabled={aiLoading}
            className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
          >
            {aiLoading ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 mr-1" />
            )}
            AI Suggestion
          </Button>
        )}
      </div>

      {/* Form Widget */}
      {renderControl()}

      {/* AI Suggestion Result */}
      {aiSuggestion && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1 text-xs text-primary mb-1">
                <Sparkles className="w-3 h-3" />
                AI Suggestion
              </div>
              <p className="text-sm text-foreground">{aiSuggestion}</p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={applyAISuggestion}
              className="h-7 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Error Info */}
      {error && (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      {/* Character count (text types) */}
      {(field.type === 'text' || field.type === 'textarea') && field.validation?.maxLength && (
        <div className="text-right text-xs text-muted-foreground">
          {String(value || '').length} / {field.validation.maxLength}
        </div>
      )}
    </div>
  )
}

export default DynamicFormField
