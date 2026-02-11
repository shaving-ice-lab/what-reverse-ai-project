'use client'

import React from 'react'
import type { DetailViewConfig } from '../types'

interface DetailViewBlockProps {
  config: DetailViewConfig
  data?: Record<string, unknown>
}

export function DetailViewBlock({ config, data }: DetailViewBlockProps) {
  if (!data) {
    return (
      <div className="border border-border rounded-lg p-4 text-center text-xs text-foreground-muted">
        No record selected
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg divide-y divide-border">
      {config.fields.map((field) => (
        <div key={field.key} className="flex px-4 py-2.5">
          <span className="text-xs font-medium text-foreground-muted w-36 shrink-0">{field.label}</span>
          <span className="text-sm text-foreground flex-1">
            {formatValue(data[field.key], field.type)}
          </span>
        </div>
      ))}
    </div>
  )
}

function formatValue(value: unknown, type?: string): string {
  if (value === null || value === undefined) return '—'
  if (type === 'date') return new Date(String(value)).toLocaleDateString()
  return String(value)
}
