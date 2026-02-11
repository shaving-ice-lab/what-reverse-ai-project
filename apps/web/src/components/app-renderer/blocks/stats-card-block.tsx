'use client'

import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatsCardConfig } from '../types'

interface StatsCardBlockProps {
  config: StatsCardConfig
  data?: Record<string, unknown>
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

export function StatsCardBlock({ config, data }: StatsCardBlockProps) {
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

  return (
    <div className={cn('rounded-lg border border-border p-4', bgMap[color])}>
      <div className="text-xs text-foreground-muted mb-1">{config.label}</div>
      <div className={cn('text-2xl font-semibold', colorMap[color])}>{formattedValue}</div>
      {trend !== undefined && (
        <div className={cn('flex items-center gap-1 mt-1 text-xs', trend >= 0 ? 'text-emerald-600' : 'text-red-600')}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  )
}
