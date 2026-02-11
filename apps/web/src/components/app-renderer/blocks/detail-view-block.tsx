'use client'

import React, { useEffect, useState } from 'react'
import { useDataProvider } from '../data-provider'
import type { DetailViewConfig } from '../types'
import type { DataSource } from '../types'

interface DetailViewBlockProps {
  config: DetailViewConfig
  data?: Record<string, unknown>
  dataSource?: DataSource
}

export function DetailViewBlock({ config, data: externalData, dataSource }: DetailViewBlockProps) {
  const { queryRows, onTableChange } = useDataProvider()
  const [fetchedData, setFetchedData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  const tableName = dataSource?.table || config.table_name || ''

  useEffect(() => {
    if (externalData || !tableName) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const result = await queryRows(tableName, { limit: 1 })
        if (!cancelled && result.rows.length > 0) setFetchedData(result.rows[0])
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [externalData, tableName, queryRows])

  useEffect(() => {
    if (externalData || !tableName) return
    return onTableChange((changedTable) => {
      if (changedTable !== tableName) return
      queryRows(tableName, { limit: 1 })
        .then((result) => { if (result.rows.length > 0) setFetchedData(result.rows[0]) })
        .catch(() => {})
    })
  }, [externalData, tableName, queryRows, onTableChange])

  const data = externalData || fetchedData

  if (loading && !data) {
    return (
      <div className="border border-border rounded-lg p-4 animate-pulse space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-3 w-28 bg-foreground/10 rounded" />
            <div className="h-3 w-40 bg-foreground/10 rounded" />
          </div>
        ))}
      </div>
    )
  }

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

function formatValue(value: unknown, type?: string): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-foreground-muted">—</span>
  if (type === 'boolean' || typeof value === 'boolean') {
    return <span className={`text-xs px-1.5 py-0.5 rounded ${value ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>{value ? 'Yes' : 'No'}</span>
  }
  if (type === 'date') {
    const d = new Date(String(value))
    if (!isNaN(d.getTime())) return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  if (type === 'number' || typeof value === 'number') {
    return Number(value).toLocaleString()
  }
  if (typeof value === 'object') {
    return <code className="text-xs bg-surface-200/50 px-1.5 py-0.5 rounded font-mono break-all">{JSON.stringify(value)}</code>
  }
  const str = String(value)
  // Auto-detect ISO date strings
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T|\s)/.test(str)) {
    const d = new Date(str)
    if (!isNaN(d.getTime())) return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  // Auto-detect URLs
  if (typeof value === 'string' && /^https?:\/\//.test(str)) {
    return <a href={str} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline break-all">{str}</a>
  }
  return str
}
