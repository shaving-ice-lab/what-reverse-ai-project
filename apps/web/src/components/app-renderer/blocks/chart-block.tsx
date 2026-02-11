'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { ChartConfig } from '../types'

interface ChartBlockProps {
  config: ChartConfig
  data?: Record<string, unknown>[]
}

export function ChartBlock({ config, data }: ChartBlockProps) {
  const rows = data || []
  const height = config.height || 200
  const color = config.color || '#6366f1'

  if (rows.length === 0) {
    return (
      <div className="border border-border rounded-lg p-4 flex items-center justify-center" style={{ height }}>
        <span className="text-xs text-foreground-muted">No chart data</span>
      </div>
    )
  }

  // Extract values
  const values = rows.map((r) => Number(r[config.y_key] || 0))
  const labels = rows.map((r) => String(r[config.x_key] || ''))
  const maxVal = Math.max(...values, 1)

  return (
    <div className="border border-border rounded-lg p-4">
      {config.title && (
        <div className="text-sm font-medium text-foreground mb-3">{config.title}</div>
      )}

      {config.chart_type === 'bar' && (
        <BarChart values={values} labels={labels} maxVal={maxVal} height={height} color={color} />
      )}

      {config.chart_type === 'line' && (
        <LineChart values={values} labels={labels} maxVal={maxVal} height={height} color={color} />
      )}

      {config.chart_type === 'pie' && (
        <PieChart values={values} labels={labels} color={color} />
      )}

      {config.chart_type === 'area' && (
        <LineChart values={values} labels={labels} maxVal={maxVal} height={height} color={color} filled />
      )}
    </div>
  )
}

function BarChart({ values, labels, maxVal, height, color }: { values: number[]; labels: string[]; maxVal: number; height: number; color: string }) {
  const barWidth = Math.max(12, Math.min(40, 300 / values.length))

  return (
    <div className="flex items-end gap-1 justify-center" style={{ height }}>
      {values.map((v, i) => {
        const barH = (v / maxVal) * (height - 24)
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="rounded-t transition-all hover:opacity-80"
              style={{ width: barWidth, height: barH, backgroundColor: color }}
              title={`${labels[i]}: ${v}`}
            />
            <span className="text-[9px] text-foreground-muted truncate" style={{ maxWidth: barWidth + 8 }}>
              {labels[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function LineChart({ values, labels, maxVal, height, color, filled }: { values: number[]; labels: string[]; maxVal: number; height: number; color: string; filled?: boolean }) {
  const chartH = height - 20
  const points = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * 100
    const y = 100 - (v / maxVal) * 100
    return { x, y }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const fillPath = filled ? `${pathD} L 100 100 L 0 100 Z` : ''

  return (
    <div style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height: chartH }}>
        {filled && (
          <path d={fillPath} fill={color} opacity={0.1} />
        )}
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} vectorEffect="non-scaling-stroke">
            <title>{`${labels[i]}: ${values[i]}`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-foreground-muted">{labels[0]}</span>
        <span className="text-[9px] text-foreground-muted">{labels[labels.length - 1]}</span>
      </div>
    </div>
  )
}

function PieChart({ values, labels, color }: { values: number[]; labels: string[]; color: string }) {
  const total = values.reduce((s, v) => s + v, 0)
  if (total === 0) return null

  const colors = [color, '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4']
  let cumAngle = 0

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-32 h-32 shrink-0">
        {values.map((v, i) => {
          const angle = (v / total) * 360
          const startAngle = cumAngle
          cumAngle += angle
          const large = angle > 180 ? 1 : 0

          const rad1 = ((startAngle - 90) * Math.PI) / 180
          const rad2 = ((startAngle + angle - 90) * Math.PI) / 180
          const x1 = 50 + 40 * Math.cos(rad1)
          const y1 = 50 + 40 * Math.sin(rad1)
          const x2 = 50 + 40 * Math.cos(rad2)
          const y2 = 50 + 40 * Math.sin(rad2)

          return (
            <path
              key={i}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${large} 1 ${x2} ${y2} Z`}
              fill={colors[i % colors.length]}
              opacity={0.8}
            >
              <title>{`${labels[i]}: ${v}`}</title>
            </path>
          )
        })}
      </svg>
      <div className="space-y-1">
        {labels.map((l, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-foreground-light">{l}</span>
            <span className="text-foreground-muted ml-auto">{values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
