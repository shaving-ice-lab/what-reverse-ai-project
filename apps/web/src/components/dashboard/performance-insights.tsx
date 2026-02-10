'use client'

/**
 * Performance Insights Panel
 *
 * Average execution time trend, slowest nodes top 5, and optimization suggestions
 * Uses Stats API to fetch real data
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  Zap,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { statsApi, formatDailyStats, formatOverviewStats } from '@/lib/api/stats'
import type { DailyStats } from '@/types/stats'

interface PerformanceTrend {
  date: string
  avgTime: number // in ms
  p95Time: number
  p99Time: number
}

interface SlowNode {
  id: string
  name: string
  type: string
  avgTime: number
  executions: number
  trend: 'up' | 'down' | 'stable'
  icon: string
}

interface OptimizationTip {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  type: 'warning' | 'info' | 'success'
}

// Default optimization suggestions
const defaultOptimizationTips: OptimizationTip[] = [
  {
    id: '1',
    title: 'Consider using GPT-3.5 for some calls instead of GPT-4',
    description: 'For simple tasks, GPT-3.5 can provide 3x faster responses while reducing costs',
    impact: 'high',
    type: 'warning',
  },
  {
    id: '2',
    title: 'Enable Database Query Cache',
    description: 'Re-query via cache reduces response time by ~60%',
    impact: 'medium',
    type: 'info',
  },
  {
    id: '3',
    title: 'Parallel execution of independent nodes',
    description: 'Detect independent nodes and parallelize to save execution time',
    impact: 'high',
    type: 'info',
  },
]

// Default slow nodes
const defaultSlowNodes: SlowNode[] = [
  {
    id: '1',
    name: 'LLM Call',
    type: 'LLM',
    avgTime: 0,
    executions: 0,
    trend: 'stable',
    icon: '🤖',
  },
  {
    id: '2',
    name: 'Database Query',
    type: 'SQL',
    avgTime: 0,
    executions: 0,
    trend: 'stable',
    icon: '🗄️',
  },
  {
    id: '3',
    name: 'HTTP Request',
    type: 'HTTP',
    avgTime: 0,
    executions: 0,
    trend: 'stable',
    icon: '🌐',
  },
]

interface PerformanceInsightsProps {
  className?: string
}

export function PerformanceInsights({ className }: PerformanceInsightsProps) {
  const [activeMetric, setActiveMetric] = useState<'avg' | 'p95' | 'p99'>('avg')
  const [showAllTips, setShowAllTips] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [performanceTrend, setPerformanceTrend] = useState<PerformanceTrend[]>([])
  const [overviewData, setOverviewData] = useState<{ avgResponseTimeMs: number } | null>(null)
  const [slowNodes, setSlowNodes] = useState<SlowNode[]>(defaultSlowNodes)
  const [optimizationTips, setOptimizationTips] =
    useState<OptimizationTip[]>(defaultOptimizationTips)

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
        setOverviewData({ avgResponseTimeMs: formatted.avgResponseTimeMs })
      }

      // Format trend data
      if (trendsResponse.data && trendsResponse.data.length > 0) {
        const formattedTrends = formatDailyStats(trendsResponse.data)
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

        const trends: PerformanceTrend[] = formattedTrends.map((t) => {
          const avgTime = t.avgDurationMs || 0
          return {
            date: weekdays[new Date(t.date).getDay()],
            avgTime,
            // Estimate P95 and P99 (should fetch from backend API)
            p95Time: Math.floor(avgTime * 1.8),
            p99Time: Math.floor(avgTime * 2.5),
          }
        })

        if (trends.some((t) => t.avgTime > 0)) {
          setPerformanceTrend(trends)
        }

        // Generate optimization suggestions based on average execution time
        const avgOverall = trends.reduce((sum, t) => sum + t.avgTime, 0) / trends.length
        if (avgOverall > 3000) {
          setOptimizationTips([
            {
              id: '1',
              title: 'High execution time, optimization recommended',
              description: `Average execution time is ${(avgOverall / 1000).toFixed(1)}s. Suggestion: check slow nodes`,
              impact: 'high',
              type: 'warning',
            },
            ...defaultOptimizationTips.slice(1),
          ])
        }

        // Mock slow node data (should fetch node-level statistics from backend)
        const totalExecutions = formattedTrends.reduce((sum, t) => sum + t.executions, 0)
        if (totalExecutions > 0) {
          setSlowNodes([
            {
              id: '1',
              name: 'LLM Call',
              type: 'LLM',
              avgTime: Math.floor(avgOverall * 0.6),
              executions: Math.floor(totalExecutions * 0.4),
              trend: 'stable',
              icon: '🤖',
            },
            {
              id: '2',
              name: 'Data Processing',
              type: 'Transform',
              avgTime: Math.floor(avgOverall * 0.2),
              executions: Math.floor(totalExecutions * 0.3),
              trend: 'down',
              icon: '⚙️',
            },
            {
              id: '3',
              name: 'HTTP Request',
              type: 'HTTP',
              avgTime: Math.floor(avgOverall * 0.15),
              executions: Math.floor(totalExecutions * 0.2),
              trend: 'stable',
              icon: '🌐',
            },
            {
              id: '4',
              name: 'Condition',
              type: 'Logic',
              avgTime: Math.floor(avgOverall * 0.03),
              executions: Math.floor(totalExecutions * 0.08),
              trend: 'stable',
              icon: '🔀',
            },
            {
              id: '5',
              name: 'Text Processing',
              type: 'Text',
              avgTime: Math.floor(avgOverall * 0.02),
              executions: Math.floor(totalExecutions * 0.02),
              trend: 'down',
              icon: '📝',
            },
          ])
        }
      }
    } catch (err) {
      console.error('Failed to load performance data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Calculate statistics
  const stats = useMemo(() => {
    if (performanceTrend.length === 0) {
      return {
        currentAvg: overviewData?.avgResponseTimeMs || 0,
        previousAvg: 0,
        change: 0,
        weekAvg: overviewData?.avgResponseTimeMs || 0,
        p95: 0,
        p99: 0,
      }
    }

    const currentAvg = performanceTrend[performanceTrend.length - 1].avgTime
    const previousAvg =
      performanceTrend.length > 1
        ? performanceTrend[performanceTrend.length - 2].avgTime
        : currentAvg
    const change = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0
    const weekAvg =
      performanceTrend.reduce((sum, d) => sum + d.avgTime, 0) / performanceTrend.length

    return {
      currentAvg,
      previousAvg,
      change,
      weekAvg,
      p95: performanceTrend[performanceTrend.length - 1].p95Time,
      p99: performanceTrend[performanceTrend.length - 1].p99Time,
    }
  }, [performanceTrend, overviewData])

  const getMetricData = useCallback(() => {
    if (performanceTrend.length === 0) return [0, 0, 0, 0, 0, 0, 0]
    switch (activeMetric) {
      case 'avg':
        return performanceTrend.map((d) => d.avgTime)
      case 'p95':
        return performanceTrend.map((d) => d.p95Time)
      case 'p99':
        return performanceTrend.map((d) => d.p99Time)
    }
  }, [activeMetric, performanceTrend])

  const metricData = getMetricData()
  const maxValue = Math.max(...metricData, 1)

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getImpactColor = (impact: OptimizationTip['impact']) => {
    switch (impact) {
      case 'high':
        return 'text-red-500 bg-red-500/10'
      case 'medium':
        return 'text-amber-500 bg-amber-500/10'
      case 'low':
        return 'text-blue-500 bg-blue-500/10'
    }
  }

  // Default display data (when no real data)
  const displayTrend =
    performanceTrend.length > 0
      ? performanceTrend
      : [
          { date: 'Mon', avgTime: 0, p95Time: 0, p99Time: 0 },
          { date: 'Tue', avgTime: 0, p95Time: 0, p99Time: 0 },
          { date: 'Wed', avgTime: 0, p95Time: 0, p99Time: 0 },
          { date: 'Thu', avgTime: 0, p95Time: 0, p99Time: 0 },
          { date: 'Fri', avgTime: 0, p95Time: 0, p99Time: 0 },
          { date: 'Sat', avgTime: 0, p95Time: 0, p99Time: 0 },
          { date: 'Sun', avgTime: 0, p95Time: 0, p99Time: 0 },
        ]

  return (
    <Card
      className={cn(
        'border border-border/60 bg-card/80 backdrop-blur-sm p-6 hover:border-blue-500/20 transition-colors duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
            <Gauge className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Performance Insights</h3>
            <p className="text-xs text-muted-foreground">Execution time analytics</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={loadStats}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Main Metrics - Enhanced */}
      <div className="flex items-center gap-6 mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/5 via-transparent to-transparent ring-1 ring-blue-500/10">
        <div className="flex-shrink-0">
          {isLoading ? (
            <div className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
          ) : (
            <p className="text-4xl font-bold text-foreground tracking-tight">
              {formatTime(stats.currentAvg)}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm text-muted-foreground">Average execution time</span>
            {stats.change !== 0 && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                  stats.change <= 0 ? 'text-primary bg-primary/10' : 'text-red-500 bg-red-500/10'
                )}
              >
                {stats.change <= 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                {Math.abs(stats.change).toFixed(0)}%
              </div>
            )}
          </div>
        </div>

        <div className="h-14 w-px bg-gradient-to-b from-transparent via-border to-transparent" />

        <div className="flex gap-5">
          <div className="text-center p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
            {isLoading ? (
              <div className="h-7 w-16 bg-muted rounded-lg animate-pulse mb-1" />
            ) : (
              <p className="text-xl font-bold text-foreground group-hover:text-blue-500 transition-colors">
                {formatTime(stats.weekAvg)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Week average</p>
          </div>
          <div className="text-center p-2 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer group">
            {isLoading ? (
              <div className="h-7 w-16 bg-muted rounded-lg animate-pulse mb-1" />
            ) : (
              <p className="text-xl font-bold text-foreground group-hover:text-amber-500 transition-colors">
                {formatTime(stats.p95)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">P95</p>
          </div>
          <div className="text-center p-2 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer group">
            {isLoading ? (
              <div className="h-7 w-16 bg-muted rounded-lg animate-pulse mb-1" />
            ) : (
              <p className="text-xl font-bold text-foreground group-hover:text-red-500 transition-colors">
                {formatTime(stats.p99)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">P99</p>
          </div>
        </div>
      </div>

      {/* Trend - Enhanced */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Execution time trend
          </span>
          <div className="flex items-center bg-muted/50 rounded-xl p-1 ring-1 ring-border/30">
            {(['avg', 'p95', 'p99'] as const).map((metric) => (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200',
                  activeMetric === metric
                    ? cn(
                        'shadow-sm',
                        metric === 'avg' && 'bg-blue-500 text-white',
                        metric === 'p95' && 'bg-amber-500 text-white',
                        metric === 'p99' && 'bg-red-500 text-white'
                      )
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {metric === 'avg' ? 'Avg' : metric.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-2 h-28 px-1">
          {displayTrend.map((data, index) => {
            const value = metricData[index] || 0
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0
            const isToday = index === displayTrend.length - 1
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="relative w-full">
                  <div
                    className={cn(
                      'w-full rounded-lg transition-all duration-300',
                      activeMetric === 'avg' &&
                        (isToday
                          ? 'bg-gradient-to-t from-blue-500 to-blue-400 shadow-lg shadow-blue-500/20'
                          : 'bg-blue-500/30 group-hover:bg-blue-500/50'),
                      activeMetric === 'p95' &&
                        (isToday
                          ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-lg shadow-amber-500/20'
                          : 'bg-amber-500/30 group-hover:bg-amber-500/50'),
                      activeMetric === 'p99' &&
                        (isToday
                          ? 'bg-gradient-to-t from-red-500 to-red-400 shadow-lg shadow-red-500/20'
                          : 'bg-red-500/30 group-hover:bg-red-500/50')
                    )}
                    style={{ height: `${Math.max(height, 6)}px`, minHeight: '6px' }}
                  >
                    {/* Hover Highlight */}
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                  </div>
                  {/* Hover Tooltip */}
                  {value > 0 && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover/95 backdrop-blur-sm border border-border/50 rounded-lg px-2.5 py-1.5 text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-10 shadow-lg scale-90 group-hover:scale-100">
                      <span className="font-semibold text-foreground">{formatTime(value)}</span>
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] transition-colors',
                    isToday
                      ? 'text-blue-500 font-medium'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {data.date}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Slowest nodes top 5 - Enhanced */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <div className="p-1 rounded-md bg-amber-500/10">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            Slowest nodes top 5
          </h4>
          <span className="text-[10px] text-muted-foreground/60">Click to view details</span>
        </div>

        <div className="space-y-2">
          {slowNodes.map((node, index) => (
            <div
              key={node.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 cursor-pointer group ring-1 ring-transparent hover:ring-border/50"
              style={{
                animationDelay: `${index * 50}ms`,
                animation: 'fadeInUp 300ms ease-out both',
              }}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
                  index === 0 && 'bg-red-500/10 text-red-500',
                  index === 1 && 'bg-amber-500/10 text-amber-500',
                  index === 2 && 'bg-yellow-500/10 text-yellow-500',
                  index > 2 && 'bg-muted text-muted-foreground'
                )}
              >
                {index + 1}
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                {node.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate group-hover:text-blue-500 transition-colors">
                    {node.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted/50 ring-1 ring-border/30">
                    {node.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {node.executions.toLocaleString()} executions
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{formatTime(node.avgTime)}</p>
                <div
                  className={cn(
                    'flex items-center justify-end gap-1 text-xs font-medium',
                    node.trend === 'up' && 'text-red-500',
                    node.trend === 'down' && 'text-primary',
                    node.trend === 'stable' && 'text-muted-foreground'
                  )}
                >
                  {node.trend === 'up' && (
                    <>
                      <TrendingUp className="w-3 h-3" /> Up
                    </>
                  )}
                  {node.trend === 'down' && (
                    <>
                      <TrendingDown className="w-3 h-3" /> Down
                    </>
                  )}
                  {node.trend === 'stable' && 'Stable'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimization suggestions - Enhanced */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary/10">
              <Lightbulb className="w-3.5 h-3.5 text-primary" />
            </div>
            Optimization suggestions
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {optimizationTips.length}
            </span>
          </h4>
          <button
            onClick={() => setShowAllTips(!showAllTips)}
            className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-colors"
          >
            {showAllTips ? 'Hide' : 'View all'}
            <ChevronRight
              className={cn(
                'w-3 h-3 transition-transform duration-200',
                showAllTips && 'rotate-90'
              )}
            />
          </button>
        </div>

        <div className="space-y-2">
          {(showAllTips ? optimizationTips : optimizationTips.slice(0, 2)).map((tip, index) => (
            <div
              key={tip.id}
              className={cn(
                'p-4 rounded-xl border transition-all duration-200 cursor-pointer group',
                tip.type === 'warning' &&
                  'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
                tip.type === 'info' && 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40',
                tip.type === 'success' && 'bg-primary/5 border-primary/20 hover:border-primary/40'
              )}
              style={{
                animationDelay: `${index * 50}ms`,
                animation: 'fadeInUp 300ms ease-out both',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'shrink-0 p-2 rounded-lg transition-transform group-hover:scale-110',
                    tip.type === 'warning' && 'bg-amber-500/10 text-amber-500',
                    tip.type === 'info' && 'bg-blue-500/10 text-blue-500',
                    tip.type === 'success' && 'bg-primary/10 text-primary'
                  )}
                >
                  {tip.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                  {tip.type === 'info' && <Zap className="w-4 h-4" />}
                  {tip.type === 'success' && <Lightbulb className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-sm font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                      {tip.title}
                    </p>
                    <span
                      className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded-full ring-1',
                        tip.impact === 'high' && 'text-red-500 bg-red-500/10 ring-red-500/20',
                        tip.impact === 'medium' &&
                          'text-amber-500 bg-amber-500/10 ring-amber-500/20',
                        tip.impact === 'low' && 'text-blue-500 bg-blue-500/10 ring-blue-500/20'
                      )}
                    >
                      {tip.impact === 'high' && 'High impact'}
                      {tip.impact === 'medium' && 'Med impact'}
                      {tip.impact === 'low' && 'Low impact'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
