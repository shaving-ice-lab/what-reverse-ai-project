'use client'

import React, { useEffect, useState } from 'react'
import { useDataProvider } from '../data-provider'
import type { ChartConfig } from '../types'
import type { DataSource } from '../types'

interface ChartBlockProps {
  config: ChartConfig
  data?: Record<string, unknown>[]
  dataSource?: DataSource
}

export function ChartBlock({ config, data: externalData, dataSource }: ChartBlockProps) {
  const { queryRows, onTableChange } = useDataProvider()
  const [fetchedRows, setFetchedRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (externalData || !dataSource?.table) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const result = await queryRows(dataSource.table, {
          limit: dataSource.limit || 30,
          order_by: dataSource.order_by?.map((o) => ({ column: o.column, direction: o.direction })),
        })
        if (!cancelled) setFetchedRows(result.rows)
      } catch {
        /* ignore */
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [externalData, dataSource, queryRows])

  useEffect(() => {
    if (!dataSource?.table) return
    return onTableChange((table) => {
      if (table !== dataSource.table) return
      queryRows(dataSource.table, {
        limit: dataSource.limit || 30,
        order_by: dataSource.order_by?.map((o) => ({ column: o.column, direction: o.direction })),
      })
        .then((result) => setFetchedRows(result.rows))
        .catch(() => {})
    })
  }, [onTableChange, dataSource, queryRows])

  const rows = externalData || fetchedRows
  const height = config.height || 200
  const color = config.color || '#6366f1'

  if (loading && rows.length === 0) {
    return (
      <div className="border border-border rounded-lg p-4">
        {config.title && (
          <div className="text-sm font-medium text-foreground mb-3">{config.title}</div>
        )}
        <div className="animate-pulse" style={{ height }}>
          <div className="flex items-end gap-2 h-full justify-center">
            {[45, 72, 38, 60, 80, 52].map((h, i) => (
              <div
                key={i}
                className="bg-foreground/10 rounded-t"
                style={{ width: 24, height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="border border-border rounded-lg p-4">
        {config.title && (
          <div className="text-sm font-medium text-foreground mb-3">{config.title}</div>
        )}
        <div
          className="flex items-center justify-center text-xs text-foreground-muted"
          style={{ height }}
        >
          No data available
        </div>
      </div>
    )
  }

  // Extract values — support category_key auto-aggregation for pie charts
  let values: number[]
  let labels: string[]
  const catKey = config.category_key || config.x_key
  const valKey = config.value_key || config.y_key

  if (config.category_key && !config.y_key) {
    // Auto-aggregate: group rows by category_key and count occurrences
    const counts = new Map<string, number>()
    for (const r of rows) {
      const cat = String(r[catKey] || '未知')
      counts.set(cat, (counts.get(cat) || 0) + 1)
    }
    labels = Array.from(counts.keys())
    values = Array.from(counts.values())
  } else {
    values = rows.map((r) => Number(r[valKey] || 0))
    labels = rows.map((r) => String(r[catKey] || ''))
  }
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

      {config.chart_type === 'pie' && <PieChart values={values} labels={labels} color={color} />}

      {config.chart_type === 'area' && (
        <LineChart
          values={values}
          labels={labels}
          maxVal={maxVal}
          height={height}
          color={color}
          filled
        />
      )}
    </div>
  )
}

function BarChart({
  values,
  labels,
  maxVal,
  height,
  color,
}: {
  values: number[]
  labels: string[]
  maxVal: number
  height: number
  color: string
}) {
  const barWidth = Math.max(12, Math.min(40, 300 / values.length))
  const chartH = height - 24
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxVal * f))

  return (
    <div style={{ height }}>
      <div className="relative" style={{ height: chartH }}>
        {ticks.map((tick, i) => {
          const bottom = (tick / maxVal) * 100
          return (
            <div
              key={i}
              className="absolute left-0 right-0 flex items-center"
              style={{ bottom: `${bottom}%` }}
            >
              <span className="text-[8px] text-foreground-muted w-8 text-right pr-1 shrink-0">
                {tick}
              </span>
              <div className="flex-1 border-t border-border/30" />
            </div>
          )
        })}
        <div className="absolute left-8 right-0 bottom-0 top-0 flex items-end gap-1 justify-center">
          {values.map((v, i) => {
            const barH = (v / maxVal) * chartH
            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="text-[8px] text-foreground-muted">{v}</span>
                <div
                  className="rounded-t transition-all hover:opacity-80"
                  style={{ width: barWidth, height: barH, backgroundColor: color }}
                  title={`${labels[i]}: ${v}`}
                />
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex gap-1 justify-center ml-8 mt-1">
        {labels.map((l, i) => (
          <span
            key={i}
            className="text-[9px] text-foreground-muted truncate text-center"
            style={{ width: barWidth + 4 }}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

function LineChart({
  values,
  labels,
  maxVal,
  height,
  color,
  filled,
}: {
  values: number[]
  labels: string[]
  maxVal: number
  height: number
  color: string
  filled?: boolean
}) {
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
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: chartH }}
      >
        {filled && <path d={fillPath} fill={color} opacity={0.1} />}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
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

function PieChart({
  values,
  labels,
  color,
}: {
  values: number[]
  labels: string[]
  color: string
}) {
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
            <div
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-foreground-light">{l}</span>
            <span className="text-foreground-muted ml-auto">
              {values[i]}{' '}
              <span className="opacity-60">({((values[i] / total) * 100).toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
