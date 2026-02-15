'use client'

import React, { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useDataProvider } from '../data-provider'
import type { FormConfig } from '../types'

interface FormDialogBlockProps {
  config: FormConfig & {
    trigger_label?: string
    trigger_variant?: 'default' | 'outline' | 'ghost'
    trigger_icon?: string
    dialog_size?: 'sm' | 'default' | 'lg' | 'xl'
  }
}

function fieldId(field: { name?: string; key?: string }): string {
  return field.key || field.name || ''
}

export function FormDialogBlock({ config }: FormDialogBlockProps) {
  const { insertRow, updateRow, notifyTableChange } = useDataProvider()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const resetForm = useCallback(() => {
    const initial: Record<string, unknown> = {}
    for (const field of config.fields) {
      initial[fieldId(field)] = field.default_value ?? ''
    }
    setValues(initial)
    setError('')
    setSuccess(false)
  }, [config.fields])

  const handleOpen = () => {
    resetForm()
    setOpen(true)
  }

  const updateField = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    for (const field of config.fields) {
      if (field.required) {
        const fid = fieldId(field)
        const v = values[fid]
        if (v === '' || v === null || v === undefined) {
          setError(`${field.label || fid} 为必填项`)
          return
        }
      }
    }

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {}
      for (const field of config.fields) {
        const fid = fieldId(field)
        const v = values[fid]
        if (field.type === 'number' && v !== '' && v !== null && v !== undefined) {
          payload[fid] = Number(v)
        } else if (field.type === 'checkbox') {
          payload[fid] = Boolean(v)
        } else {
          payload[fid] = v
        }
      }

      if (config.table_name) {
        await insertRow(config.table_name, payload)
        notifyTableChange(config.table_name)
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
      }, 800)
    } catch (err: any) {
      setError(err?.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const triggerLabel = config.trigger_label || config.submit_label || '新建'
  const dialogSize = config.dialog_size || 'lg'

  return (
    <>
      <Button
        size="sm"
        className="gap-1.5"
        onClick={handleOpen}
      >
        <Plus className="w-3.5 h-3.5" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size={dialogSize} animation="slide">
          <DialogHeader>
            <DialogTitle size="default">
              {config.title || '新建记录'}
            </DialogTitle>
            {config.description && (
              <DialogDescription>{config.description}</DialogDescription>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {config.fields.map((field) => {
                const fid = fieldId(field)
                // Hidden field: has default_value but no label — skip rendering
                if (!field.label && field.default_value !== undefined) return null
                return (
                  <div
                    key={fid}
                    className={cn(
                      field.type === 'textarea' && 'md:col-span-2'
                    )}
                  >
                    <label className="text-xs font-medium text-foreground-light mb-1 block">
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-0.5">*</span>
                      )}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={String(values[fid] ?? '')}
                        onChange={(e) => updateField(fid, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[72px] resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={String(values[fid] ?? '')}
                        onChange={(e) => updateField(fid, e.target.value)}
                        required={field.required}
                        className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                      >
                        <option value="">— 请选择 —</option>
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 mt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(values[fid])}
                          onChange={(e) => updateField(fid, e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-foreground-light">
                          {field.placeholder || field.label}
                        </span>
                      </label>
                    ) : (
                      <Input
                        type={
                          field.type === 'number'
                            ? 'number'
                            : field.type === 'email'
                              ? 'email'
                              : field.type === 'date'
                                ? 'date'
                                : field.type === 'datetime'
                                  ? 'datetime-local'
                                  : 'text'
                        }
                        value={String(values[fid] ?? '')}
                        onChange={(e) => updateField(fid, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="h-9 text-sm"
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/5 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="text-xs text-emerald-600 bg-emerald-500/5 rounded-md px-3 py-2">
                提交成功！
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 min-w-[100px]"
                disabled={submitting || success}
              >
                {submitting ? '提交中...' : success ? '已提交' : config.submit_label || '提交'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
