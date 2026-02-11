'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDataProvider } from '../data-provider'
import type { FormConfig } from '../types'

interface FormBlockProps {
  config: FormConfig
  onSubmit?: (data: Record<string, unknown>) => void
}

export function FormBlock({ config, onSubmit }: FormBlockProps) {
  const { insertRow, executeWorkflow } = useDataProvider()
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {}
    for (const field of config.fields) {
      initial[field.name] = field.default_value ?? ''
    }
    return initial
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSubmitting(true)
    try {
      if (config.table_name) {
        await insertRow(config.table_name, values)
      }
      if (config.workflow_id) {
        await executeWorkflow(config.workflow_id, values)
      }
      onSubmit?.(values)
      setSuccess(true)
      // Reset form
      const reset: Record<string, unknown> = {}
      for (const field of config.fields) {
        reset[field.name] = field.default_value ?? ''
      }
      setValues(reset)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err?.message || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 space-y-3">
      {config.fields.map((field) => (
        <div key={field.name}>
          <label className="text-xs font-medium text-foreground-light mb-1 block">
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              value={String(values[field.name] ?? '')}
              onChange={(e) => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
            />
          ) : field.type === 'select' ? (
            <select
              value={String(values[field.name] ?? '')}
              onChange={(e) => updateField(field.name, e.target.value)}
              required={field.required}
              className="w-full h-9 rounded border border-border bg-background px-3 text-sm"
            >
              <option value="">— Select —</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : field.type === 'checkbox' ? (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(values[field.name])}
                onChange={(e) => updateField(field.name, e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground-light">{field.placeholder || field.label}</span>
            </label>
          ) : (
            <Input
              type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
              value={String(values[field.name] ?? '')}
              onChange={(e) => updateField(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="h-9 text-sm"
            />
          )}
        </div>
      ))}

      {error && <div className="text-xs text-destructive">{error}</div>}
      {success && <div className="text-xs text-emerald-600">Submitted successfully!</div>}

      <Button type="submit" size="sm" disabled={submitting} className="w-full h-9">
        {submitting ? 'Submitting...' : (config.submit_label || 'Submit')}
      </Button>
    </form>
  )
}
