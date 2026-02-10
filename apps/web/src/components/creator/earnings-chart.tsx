'use client'

/**
 * EarningsTrendChartComponent - Enhanced
 */

import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MonthlyEarning {
  month: string
  gross: number
  net: number
  count: number
}

interface EarningsChartProps {
  data: MonthlyEarning[]
  className?: string
}

export function EarningsChart({ data, className }: EarningsChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const prevItem = data[index - 1]
      const growthRate = prevItem
        ? (((item.gross - prevItem.gross) / prevItem.gross) * 100).toFixed(1)
        : '0'

      return {
        ...item,
        monthLabel: formatMonth(item.month),
        fullMonth: formatFullMonth(item.month),
        growthRate: parseFloat(growthRate),
      }
    })
  }, [data])

  // Calculate average value used for reference line
  const averageGross = useMemo(() => {
    return data.reduce((sum, item) => sum + item.gross, 0) / data.length
  }, [data])

  return (
    <div className={cn('w-full h-[280px] relative', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
          onMouseMove={(state: any) => {
            if (state?.activeTooltipIndex !== undefined) {
              setActiveIndex(state.activeTooltipIndex)
            }
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            {/* totalEarningsGradient */}
            <linearGradient id="colorGrossEnhanced" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.4} />
              <stop offset="50%" stopColor="var(--color-brand-500)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0} />
            </linearGradient>
            {/* EarningsGradient */}
            <linearGradient id="colorNetEnhanced" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-foreground-light)" stopOpacity={0.4} />
              <stop offset="50%" stopColor="var(--color-foreground-light)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--color-foreground-light)" stopOpacity={0} />
            </linearGradient>
            {/* GlowEffect */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Gridline */}
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="currentColor"
            strokeOpacity={0.08}
            vertical={false}
          />

          {/* Averageline */}
          <ReferenceLine
            y={averageGross}
            stroke="var(--color-brand-500)"
            strokeDasharray="8 8"
            strokeOpacity={0.4}
            label={{
              value: `Average ${(averageGross / 1000).toFixed(1)}k`,
              fill: 'var(--color-brand-500)',
              fontSize: 10,
              position: 'right',
            }}
          />

          {/* X */}
          <XAxis
            dataKey="monthLabel"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: 'currentColor',
              fontSize: 12,
              opacity: 0.5,
            }}
            dy={10}
            interval={0}
          />

          {/* Y */}
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: 'currentColor',
              fontSize: 11,
              opacity: 0.5,
            }}
            tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
            dx={-5}
            width={55}
          />

          {/* Custom Tooltip */}
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: 'var(--color-brand-500)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              strokeOpacity: 0.5,
            }}
          />

          {/* totalEarningsRegion */}
          <Area
            type="monotone"
            dataKey="gross"
            name="totalEarnings"
            stroke="var(--color-brand-500)"
            strokeWidth={2.5}
            fill="url(#colorGrossEnhanced)"
            dot={false}
            activeDot={{
              r: 6,
              fill: 'var(--color-brand-500)',
              stroke: '#fff',
              strokeWidth: 2,
              filter: 'url(#glow)',
            }}
          />

          {/* EarningsRegion */}
          <Area
            type="monotone"
            dataKey="net"
            name="Earnings"
            stroke="var(--color-foreground-light)"
            strokeWidth={2.5}
            fill="url(#colorNetEnhanced)"
            dot={false}
            activeDot={{
              r: 6,
              fill: 'var(--color-foreground-light)',
              stroke: '#fff',
              strokeWidth: 2,
              filter: 'url(#glow)',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Custom Tooltip - Enhanced
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0]?.payload
  const isPositiveGrowth = data?.growthRate >= 0

  return (
    <div className="bg-surface-100 border border-border rounded-lg shadow-xl p-4 min-w-[200px]">
      {/* Title */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <p className="text-sm font-semibold text-foreground">{data?.fullMonth || label}</p>
        {data?.growthRate !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
              isPositiveGrowth
                ? 'text-brand-500 bg-brand-200/60'
                : 'text-destructive-400 bg-destructive-200/70'
            )}
          >
            {isPositiveGrowth ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositiveGrowth ? '+' : ''}
            {data.growthRate}%
          </div>
        )}
      </div>

      {/* Data */}
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-foreground-muted">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Transaction Count */}
      {data?.count && (
        <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
          <span className="text-xs text-foreground-muted">Transaction Count</span>
          <span className="text-xs font-medium text-foreground-muted">{data.count}</span>
        </div>
      )}
    </div>
  )
}

// Format month display (brief)
function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const monthNum = parseInt(m, 10)
  return `${monthNum} ${monthNum === 1 ? 'month' : 'months'}`
}

// Format month display (full)
function formatFullMonth(month: string): string {
  const [year, m] = month.split('-')
  const monthNum = parseInt(m, 10)
  return `${year} ${parseInt(year, 10) === 1 ? 'year' : 'years'}, ${monthNum} ${monthNum === 1 ? 'month' : 'months'}`
}
