'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDataProvider } from '../data-provider'
import { usePageParams } from '../app-renderer'
import type { ListConfig } from '../types'

interface ListBlockProps {
  config: ListConfig
  dataSource?: {
    table: string
    where?: string
    order_by?: { column: string; direction: string }[]
    limit?: number
  }
}

export function ListBlock({ config, dataSource }: ListBlockProps) {
  const { queryRows, onTableChange } = useDataProvider()
  const { navigateToPage } = usePageParams()
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const tableName = config.table_name || dataSource?.table || ''

  useEffect(() => {
    if (!tableName) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const result = await queryRows(tableName, {
          order_by: dataSource?.order_by,
          limit: dataSource?.limit || 50,
        })
        if (!cancelled) setRows(result.rows)
      } catch {
        if (!cancelled) setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    const unsub = onTableChange((table) => {
      if (table === tableName) load()
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [tableName, dataSource?.order_by, dataSource?.limit, queryRows, onTableChange])

  const layout = config.layout || 'list'
  const columns = config.columns || 1

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-3 animate-pulse">
            <div className="flex gap-3">
              {config.image_key && (
                <div className="w-12 h-12 rounded-md bg-foreground/10 shrink-0" />
              )}
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 bg-foreground/10 rounded" />
                <div className="h-3 w-48 bg-foreground/10 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6 text-center text-xs text-foreground-muted">
        {config.empty_message || 'No items found'}
      </div>
    )
  }

  const getBadgeColor = (val: string) => {
    const v = val.toLowerCase()
    if (/active|enabled|online|approved|published/.test(v))
      return 'bg-emerald-500/10 text-emerald-600'
    if (/inactive|disabled|offline|archived/.test(v)) return 'bg-gray-500/10 text-gray-500'
    if (/pending|review|waiting|draft/.test(v)) return 'bg-amber-500/10 text-amber-600'
    if (/failed|error|rejected|blocked/.test(v)) return 'bg-red-500/10 text-red-600'
    if (/completed|done|success|delivered/.test(v)) return 'bg-blue-500/10 text-blue-600'
    return 'bg-brand-500/10 text-brand-500'
  }

  function ListItemImage({ src }: { src: string }) {
    const [err, setErr] = useState(false)
    if (err) {
      return (
        <div className="w-12 h-12 rounded-md bg-surface-200/50 flex items-center justify-center shrink-0">
          <ImageOff className="w-4 h-4 text-foreground-muted" />
        </div>
      )
    }
    return (
      <div className="w-12 h-12 rounded-md bg-surface-200/50 overflow-hidden shrink-0">
        <img src={src} alt="" className="w-full h-full object-cover" onError={() => setErr(true)} />
      </div>
    )
  }

  return (
    <div
      className={cn(layout === 'grid' ? 'grid gap-3' : 'space-y-2')}
      style={
        layout === 'grid'
          ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {rows.map((row, i) => {
        const title = String(row[config.title_key] ?? '')
        const subtitle = config.subtitle_key ? String(row[config.subtitle_key] ?? '') : ''
        const description = config.description_key ? String(row[config.description_key] ?? '') : ''
        const image = config.image_key ? String(row[config.image_key] ?? '') : ''
        const badge = config.badge_key ? String(row[config.badge_key] ?? '') : ''

        const isExpanded = expandedIdx === i

        return (
          <div
            key={i}
            className={cn(
              'border border-border rounded-lg p-3',
              (config.clickable || config.click_action) &&
                'cursor-pointer hover:bg-surface-200/30 transition-colors'
            )}
            onClick={() => {
              if (config.click_action?.type === 'navigate') {
                const paramKey = config.click_action.param_key || 'id'
                const pkValue = row[paramKey] ?? row['id']
                navigateToPage(config.click_action.target_page, { [paramKey]: pkValue })
                return
              }
              if (config.clickable) setExpandedIdx(isExpanded ? null : i)
            }}
          >
            <div className="flex gap-3">
              {image && <ListItemImage src={image} />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{title}</span>
                  {badge && (
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0',
                        getBadgeColor(badge)
                      )}
                    >
                      {badge}
                    </span>
                  )}
                  {config.clickable && (
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-foreground-muted ml-auto shrink-0 transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  )}
                </div>
                {subtitle && (
                  <p className="text-xs text-foreground-muted mt-0.5 truncate">{subtitle}</p>
                )}
                {!isExpanded && description && (
                  <p className="text-xs text-foreground-light mt-1 line-clamp-2">{description}</p>
                )}
              </div>
            </div>
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {Object.entries(row).map(([key, val]) => (
                  <div key={key}>
                    <span className="text-[10px] text-foreground-muted">{key}</span>
                    <div className="text-xs text-foreground-light truncate">
                      {val === null || val === undefined ? '—' : String(val)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
