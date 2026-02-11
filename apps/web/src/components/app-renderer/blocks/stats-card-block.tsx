'use client'

import React, { useEffect, useState } from 'react'
import {
  TrendingUp, TrendingDown,
  Users, ShoppingCart, Truck, DollarSign, Package, BarChart3,
  Activity, Clock, CheckCircle, AlertTriangle, Star, Heart,
  FileText, Database, Globe, Zap, Mail, Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDataProvider } from '../data-provider'
import type { StatsCardConfig } from '../types'
import type { DataSource } from '../types'

const statsIconMap: Record<string, React.ElementType> = {
  Users, ShoppingCart, Truck, DollarSign, Package, BarChart3,
  Activity, Clock, CheckCircle, AlertTriangle, Star, Heart,
  FileText, Database, Globe, Zap, Mail, Calendar,
  TrendingUp, TrendingDown,
}

interface StatsCardBlockProps {
  config: StatsCardConfig
  data?: Record<string, unknown>
  dataSource?: DataSource
}

const colorMap: Record<string, string> = {
  default: 'text-foreground',
  green: 'text-emerald-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
  amber: 'text-amber-600',
}

const bgMap: Record<string, string> = {
  default: 'bg-surface-200/50',
  green: 'bg-emerald-500/5',
  red: 'bg-red-500/5',
  blue: 'bg-blue-500/5',
  amber: 'bg-amber-500/5',
}

export function StatsCardBlock({ config, data: externalData, dataSource }: StatsCardBlockProps) {
  const { queryRows, onTableChange } = useDataProvider()
  const [fetchedData, setFetchedData] = useState<Record<string, unknown> | null>(null)

  const aggregation = dataSource?.aggregation?.[0]
  const needsAllRows = aggregation && (aggregation.function === 'sum' || aggregation.function === 'avg')

  const computeAggregation = (result: { rows: Record<string, unknown>[]; total: number }) => {
    if (aggregation) {
      const alias = aggregation.alias || config.value_key
      if (aggregation.function === 'count') {
        return { [alias]: result.total }
      }
      if (aggregation.function === 'sum' || aggregation.function === 'avg') {
        const col = aggregation.column
        const nums = result.rows.map((r) => Number(r[col] ?? 0)).filter((n) => !isNaN(n))
        const sum = nums.reduce((s, v) => s + v, 0)
        return { [alias]: aggregation.function === 'avg' ? (nums.length ? sum / nums.length : 0) : sum }
      }
    }
    if (result.rows.length > 0) return result.rows[0]
    return { [config.value_key]: result.total }
  }

  useEffect(() => {
    if (externalData || !dataSource?.table) return
    let cancelled = false
    const load = async () => {
      try {
        const result = await queryRows(dataSource.table, {
          limit: needsAllRows ? 10000 : 1,
        })
        if (!cancelled) setFetchedData(computeAggregation(result))
      } catch { /* ignore */ }
    }
    load()
    return () => { cancelled = true }
  }, [externalData, dataSource, queryRows, config.value_key])

  // Auto-refresh when the underlying table changes
  useEffect(() => {
    if (!dataSource?.table) return
    return onTableChange((table) => {
      if (table !== dataSource.table) return
      queryRows(dataSource.table, { limit: needsAllRows ? 10000 : 1 })
        .then((result) => setFetchedData(computeAggregation(result)))
        .catch(() => {})
    })
  }, [onTableChange, dataSource, queryRows, config.value_key])

  const isLoading = !externalData && !fetchedData && !!dataSource?.table
  const data = externalData || fetchedData
  const value = data?.[config.value_key] ?? '—'
  const trend = config.trend_key ? (data?.[config.trend_key] as number | undefined) : undefined
  const color = config.color || 'default'

  let formattedValue = String(value)
  if (config.format === 'currency' && typeof value === 'number') {
    formattedValue = `$${value.toLocaleString()}`
  } else if (config.format === 'percent' && typeof value === 'number') {
    formattedValue = `${value.toFixed(1)}%`
  } else if (typeof value === 'number') {
    formattedValue = value.toLocaleString()
  }

  const IconComponent = config.icon ? statsIconMap[config.icon] : null

  if (isLoading) {
    return (
      <div className={cn('rounded-lg border border-border p-4 animate-pulse', bgMap[color])}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="h-3 w-16 bg-foreground/10 rounded mb-2" />
            <div className="h-7 w-20 bg-foreground/10 rounded" />
          </div>
          {config.icon && <div className="w-9 h-9 rounded-lg bg-foreground/10" />}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border border-border p-4', bgMap[color])}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-foreground-muted mb-1">{config.label}</div>
          <div className={cn('text-2xl font-semibold', colorMap[color])}>{formattedValue}</div>
        </div>
        {IconComponent && (
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', bgMap[color])}>
            <IconComponent className={cn('w-4.5 h-4.5', colorMap[color])} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={cn('flex items-center gap-1 mt-1.5 text-xs', trend >= 0 ? 'text-emerald-600' : 'text-red-600')}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  )
}
