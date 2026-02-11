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
  const { insertRow, executeWorkflow, notifyTableChange } = useDataProvider()
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

    // Client-side required validation
    for (const field of config.fields) {
      if (field.required) {
        const v = values[field.name]
        if (v === '' || v === null || v === undefined) {
          setError(`${field.label || field.name} is required`)
          return
        }
      }
    }

    setSubmitting(true)
    try {
      // Coerce types before sending
      const payload: Record<string, unknown> = {}
      for (const field of config.fields) {
        const v = values[field.name]
        if (field.type === 'number' && v !== '' && v !== null && v !== undefined) {
          payload[field.name] = Number(v)
        } else if (field.type === 'checkbox') {
          payload[field.name] = Boolean(v)
        } else {
          payload[field.name] = v
        }
      }

      let dataSaved = false
      if (config.table_name) {
        await insertRow(config.table_name, payload)
        notifyTableChange(config.table_name)
        dataSaved = true
      }
      if (config.workflow_id) {
        try {
          await executeWorkflow(config.workflow_id, payload)
        } catch (wfErr: any) {
          if (dataSaved) {
            // Data was saved but workflow failed — reset form but show warning
            const reset: Record<string, unknown> = {}
            for (const field of config.fields) { reset[field.name] = field.default_value ?? '' }
            setValues(reset)
            setError(`Data saved but workflow failed: ${wfErr?.message || 'Unknown error'}`)
            setSubmitting(false)
            return
          }
          throw wfErr
        }
      }
      onSubmit?.(payload)
      setSuccess(true)
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
    if (error) setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 space-y-3">
      {(config.title || config.description) && (
        <div className="mb-1">
          {config.title && <h3 className="text-sm font-semibold text-foreground">{config.title}</h3>}
          {config.description && <p className="text-xs text-foreground-muted mt-0.5">{config.description}</p>}
        </div>
      )}
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
              onChange={(e) => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="h-9 text-sm"
            />
          )}
        </div>
      ))}

      {error && <div className="text-xs text-destructive">{error}</div>}
      {success && <div className="text-xs text-emerald-600">Submitted successfully!</div>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting} className="flex-1 h-9">
          {submitting ? 'Submitting...' : (config.submit_label || 'Submit')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9"
          onClick={() => {
            const reset: Record<string, unknown> = {}
            for (const field of config.fields) { reset[field.name] = field.default_value ?? '' }
            setValues(reset)
            setError('')
            setSuccess(false)
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  )
}
