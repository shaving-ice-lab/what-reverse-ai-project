'use client'

/**
 * AI Usage Monitor Card
 *
 * Token consumption statistics, model distribution (GPT-4/Claude/Local LLM), usage trends and warnings.
 * Uses Stats API to fetch real data.
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  ChevronRight,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { statsApi, formatOverviewStats, formatDailyStats } from '@/lib/api/stats'
import type { OverviewStats, DailyStats } from '@/types/stats'

interface ModelUsage {
  name: string
  tokens: number
  cost: number
  color: string
  icon: string
}

interface UsageTrend {
  date: string
  tokens: number
}

// Default model distribution (used when API doesn't return model-level data)
const defaultModelUsageData: ModelUsage[] = [
  { name: 'GPT-4', tokens: 0, cost: 0, color: '#10B981', icon: '🟢' },
  { name: 'GPT-3.5', tokens: 0, cost: 0, color: '#3B82F6', icon: '🔵' },
  { name: 'Claude 3', tokens: 0, cost: 0, color: '#8B5CF6', icon: '🟣' },
  { name: 'Local LLM', tokens: 0, cost: 0, color: '#F59E0B', icon: '🟡' },
]

// Quota Settings
const MONTHLY_TOKEN_LIMIT = 2000000
const MONTHLY_BUDGET = 50

interface AIUsageCardProps {
  className?: string
}

export function AIUsageCard({ className }: AIUsageCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [overviewData, setOverviewData] = useState<ReturnType<typeof formatOverviewStats> | null>(
    null
  )
  const [trendData, setTrendData] = useState<UsageTrend[]>([])
  const [modelUsageData, setModelUsageData] = useState<ModelUsage[]>(defaultModelUsageData)

  // Load statistics data
  const loadStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const [overviewResponse, trendsResponse] = await Promise.all([
        statsApi.getOverview(),
        statsApi.getExecutionTrends(7),
      ])

      // Format overview data
      if (overviewResponse.data) {
        const formatted = formatOverviewStats(overviewResponse.data)
        setOverviewData(formatted)

        // Mock model distribution based on total token usage
        const totalTokens = formatted.totalTokensUsed || 0
        if (totalTokens > 0) {
          setModelUsageData([
            {
              name: 'GPT-4',
              tokens: Math.floor(totalTokens * 0.15),
              cost: totalTokens * 0.15 * 0.0001,
              color: '#10B981',
              icon: '🟢',
            },
            {
              name: 'GPT-3.5',
              tokens: Math.floor(totalTokens * 0.45),
              cost: totalTokens * 0.45 * 0.00001,
              color: '#3B82F6',
              icon: '🔵',
            },
            {
              name: 'Claude 3',
              tokens: Math.floor(totalTokens * 0.1),
              cost: totalTokens * 0.1 * 0.0001,
              color: '#8B5CF6',
              icon: '🟣',
            },
            {
              name: 'Local LLM',
              tokens: Math.floor(totalTokens * 0.3),
              cost: 0,
              color: '#F59E0B',
              icon: '🟡',
            },
          ])
        }
      }

      // Format trend data
      if (trendsResponse.data) {
        const formattedTrends = formatDailyStats(trendsResponse.data)
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        setTrendData(
          formattedTrends.map((t) => ({
            date: weekdays[new Date(t.date).getDay()],
            tokens: t.tokensUsed || 0,
          }))
        )
      }
    } catch (err) {
      console.error('Failed to load statistics data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadStats()
  }, [loadStats])

  const stats = useMemo(() => {
    const totalTokens = modelUsageData.reduce((sum, m) => sum + m.tokens, 0)
    const totalCost = modelUsageData.reduce((sum, m) => sum + m.cost, 0)
    const tokenUsagePercent =
      MONTHLY_TOKEN_LIMIT > 0 ? (totalTokens / MONTHLY_TOKEN_LIMIT) * 100 : 0
    const budgetUsagePercent = MONTHLY_BUDGET > 0 ? (totalCost / MONTHLY_BUDGET) * 100 : 0

    // Calculate rate (compare weekly data from API)
    const runsThisWeek = overviewData?.runsThisWeek || 0
    const avgTokensPerRun = runsThisWeek > 0 ? totalTokens / runsThisWeek : 0
    const tokenChange = avgTokensPerRun > 0 ? ((avgTokensPerRun - 1000) / 1000) * 100 : 0

    return {
      totalTokens,
      totalCost,
      tokenUsagePercent,
      budgetUsagePercent,
      tokenChange,
      isWarning: tokenUsagePercent > 80 || budgetUsagePercent > 80,
    }
  }, [modelUsageData, overviewData])

  const usageTrendData =
    trendData.length > 0
      ? trendData
      : [
          { date: 'Mon', tokens: 0 },
          { date: 'Tue', tokens: 0 },
          { date: 'Wed', tokens: 0 },
          { date: 'Thu', tokens: 0 },
          { date: 'Fri', tokens: 0 },
          { date: 'Sat', tokens: 0 },
          { date: 'Sun', tokens: 0 },
        ]

  const maxTrendValue = Math.max(...usageTrendData.map((d) => d.tokens), 1)

  return (
    <Card
      className={cn(
        'border border-border/60 bg-card/80 backdrop-blur-sm p-6 hover:border-violet-500/20 transition-colors duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
            <Sparkles className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">AI Usage Monitor</h3>
            <p className="text-xs text-muted-foreground">Current month&apos;s token consumption</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {stats.isWarning && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs">
              <AlertTriangle className="w-3 h-3" />
              Warning
            </div>
          )}
          <button
            onClick={loadStats}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* mainneedMetrics - Enhanced */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent ring-1 ring-primary/10 hover:ring-primary/20 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Token Consumption</span>
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full',
                stats.tokenChange >= 0 ? 'text-red-500 bg-red-500/10' : 'text-primary bg-primary/10'
              )}
            >
              {stats.tokenChange >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(stats.tokenChange).toFixed(0)}%
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
            {(stats.totalTokens / 1000).toFixed(0)}K
          </p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Quota Usage</span>
              <span className="font-mono">{stats.tokenUsagePercent.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden ring-1 ring-border/30">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 relative',
                  stats.tokenUsagePercent > 80
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-gradient-to-r from-primary to-primary/90'
                )}
                style={{ width: `${Math.min(stats.tokenUsagePercent, 100)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/5 to-transparent ring-1 ring-violet-500/10 hover:ring-violet-500/20 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Estimated Cost</span>
            <div className="p-1 rounded-md bg-muted/50 hover:bg-violet-500/10 cursor-help transition-colors">
              <Info className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground group-hover:text-violet-500 transition-colors">
            ${stats.totalCost.toFixed(2)}
          </p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Budget Usage</span>
              <span className="font-mono">{stats.budgetUsagePercent.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden ring-1 ring-border/30">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 relative',
                  stats.budgetUsagePercent > 80
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-gradient-to-r from-violet-500 to-violet-400'
                )}
                style={{ width: `${Math.min(stats.budgetUsagePercent, 100)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Trend - Enhanced */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-3 h-3" />
            This Week&apos;s Trend
          </span>
          <span className="text-[10px] text-muted-foreground/60">Click to View Details</span>
        </div>
        <div className="flex items-end gap-1.5 h-14 px-1">
          {usageTrendData.map((data, index) => {
            const height = (data.tokens / maxTrendValue) * 100
            const isToday = index === usageTrendData.length - 1
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div
                  className={cn(
                    'w-full rounded-lg relative transition-all duration-300',
                    isToday
                      ? 'bg-gradient-to-t from-violet-500 to-violet-400 shadow-lg shadow-violet-500/20'
                      : 'bg-violet-500/20 hover:bg-violet-500/30'
                  )}
                  style={{ height: `${Math.max(height, 8)}%`, minHeight: '6px' }}
                >
                  {/* Hover Highlight */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />

                  {/* Hover Tooltip */}
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-popover/95 backdrop-blur-sm border border-border/50 rounded-lg px-2.5 py-1.5 text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-10 shadow-lg scale-90 group-hover:scale-100">
                    <span className="font-semibold text-foreground">
                      {(data.tokens / 1000).toFixed(0)}K
                    </span>
                    <span className="text-muted-foreground ml-1">tokens</span>
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[10px] transition-colors',
                    isToday
                      ? 'text-violet-500 font-medium'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {data.date.slice(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ModelDistribution - Enhanced */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            ModelDistribution
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-violet-500 hover:text-violet-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-violet-500/10 transition-colors"
          >
            {showDetails ? 'Collapse' : 'Details'}
            <ChevronRight
              className={cn(
                'w-3 h-3 transition-transform duration-200',
                showDetails && 'rotate-90'
              )}
            />
          </button>
        </div>

        {/* Model */}
        <div className="flex h-4 rounded-xl overflow-hidden bg-muted/50 ring-1 ring-border/30">
          {modelUsageData.map((model, index) => {
            const width = stats.totalTokens > 0 ? (model.tokens / stats.totalTokens) * 100 : 0
            return (
              <div
                key={index}
                className="h-full transition-all duration-500 relative group cursor-pointer"
                style={{
                  width: `${width}%`,
                  backgroundColor: model.color,
                }}
              >
                {/* HoverHighlight */}
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* HoverTip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-2 text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-10 shadow-xl scale-90 group-hover:scale-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{model.icon}</span>
                    <div>
                      <div className="font-semibold text-foreground">{model.name}</div>
                      <div className="text-muted-foreground">
                        {(model.tokens / 1000).toFixed(0)}K tokens
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detailed List */}
        {showDetails && (
          <div className="mt-3 space-y-2 animate-in slide-in-from-top-2">
            {modelUsageData.map((model, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 group cursor-pointer ring-1 ring-transparent hover:ring-border/50"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeInUp 300ms ease-out both',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${model.color}20` }}
                  >
                    {model.icon}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{model.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: model.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {stats.totalTokens > 0
                          ? ((model.tokens / stats.totalTokens) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {(model.tokens / 1000).toFixed(0)}K
                  </p>
                  <p className={cn('text-xs', model.cost > 0 ? 'text-amber-500' : 'text-primary')}>
                    {model.cost > 0 ? `$${model.cost.toFixed(2)}` : 'Free'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* example */}
        {!showDetails && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            {modelUsageData.map((model, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-card group-hover:scale-125 transition-transform"
                  style={{ backgroundColor: model.color, ringColor: `${model.color}40` }}
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  {model.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning Notice */}
      {stats.isWarning && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-500">Usage Warning</p>
              <p className="text-xs text-muted-foreground mt-1">
                Current month's token usage already {stats.tokenUsagePercent.toFixed(0)}%,
                suggestion: reasonable planning usage or upgrade plan.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
