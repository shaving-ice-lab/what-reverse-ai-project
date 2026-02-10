'use client'

/**
 * Workflow Analytics Pie Chart Component
 *
 * Status Distribution, Node Type Distribution, Dynamic Load Animation
 */

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PieChart, Layers, Activity, ChevronDown, Loader2 } from 'lucide-react'
import { statsApi } from '@/lib/api'

type ViewType = 'status' | 'nodeType'

interface PieData {
  label: string
  value: number
  color: string
  icon?: string
}

// Default Empty Data
const defaultStatusData: PieData[] = [
  { label: 'Run', value: 0, color: '#3B82F6', icon: '🔄' },
  { label: 'Completed', value: 0, color: 'hsl(var(--primary))', icon: '✅' },
  { label: 'Failed', value: 0, color: '#EF4444', icon: '❌' },
  { label: 'Pending', value: 0, color: '#F59E0B', icon: '⏳' },
]

const defaultNodeTypeData: PieData[] = [
  { label: 'LLM Node', value: 0, color: '#8B5CF6', icon: '🤖' },
  { label: 'HTTP Request', value: 0, color: '#3B82F6', icon: '🌐' },
  { label: 'Condition Branch', value: 0, color: '#10B981', icon: '🔀' },
  { label: 'Data Convert', value: 0, color: '#F59E0B', icon: '🔄' },
  { label: 'Code Execute', value: 0, color: '#EC4899', icon: '💻' },
  { label: 'Other', value: 0, color: '#6B7280', icon: '📦' },
]

interface WorkflowAnalyticsPieProps {
  className?: string
}

export function WorkflowAnalyticsPie({ className }: WorkflowAnalyticsPieProps) {
  const [viewType, setViewType] = useState<ViewType>('status')
  const [animationProgress, setAnimationProgress] = useState(0)
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [statusData, setStatusData] = useState<PieData[]>(defaultStatusData)
  const [nodeTypeData, setNodeTypeData] = useState<PieData[]>(defaultNodeTypeData)
  const [isLoading, setIsLoading] = useState(true)

  // Load Analytics Data
  const loadAnalytics = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await statsApi.getWorkflowAnalytics()
      const analyticsData = response.data

      // Update Status Distribution Data
      if (analyticsData?.status_distribution) {
        const newStatusData = analyticsData.status_distribution.map((item) => ({
          label: item.label,
          value: item.value,
          color: item.color,
          icon: item.icon,
        }))
        setStatusData(newStatusData.length > 0 ? newStatusData : defaultStatusData)
      }

      // Update Node Type Distribution Data
      if (analyticsData?.node_type_distribution) {
        const newNodeTypeData = analyticsData.node_type_distribution.map((item) => ({
          label: item.label,
          value: item.value,
          color: item.color,
          icon: item.icon,
        }))
        setNodeTypeData(newNodeTypeData.length > 0 ? newNodeTypeData : defaultNodeTypeData)
      }
    } catch (err) {
      console.error('Failed to load workflow analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial Load
  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const data = viewType === 'status' ? statusData : nodeTypeData
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Enter Animation
  useEffect(() => {
    setAnimationProgress(0)
    const timer = setTimeout(() => {
      const animate = () => {
        setAnimationProgress((prev) => {
          if (prev >= 1) return 1
          return prev + 0.02
        })
      }
      const interval = setInterval(animate, 16)
      setTimeout(() => clearInterval(interval), 800)
    }, 100)
    return () => clearTimeout(timer)
  }, [viewType])

  // Calculate Pie Chart Path
  const calculatePieSegments = () => {
    const segments: { path: string; data: PieData; startAngle: number; endAngle: number }[] = []
    let currentAngle = -90 // from top start

    data.forEach((item, index) => {
      const angle = (item.value / total) * 360 * animationProgress
      const startAngle = currentAngle
      const endAngle = currentAngle + angle

      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      const radius = hoveredSegment === index ? 42 : 40
      const cx = 50
      const cy = 50

      const x1 = cx + radius * Math.cos(startRad)
      const y1 = cy + radius * Math.sin(startRad)
      const x2 = cx + radius * Math.cos(endRad)
      const y2 = cy + radius * Math.sin(endRad)

      const largeArcFlag = angle > 180 ? 1 : 0

      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`

      segments.push({ path, data: item, startAngle, endAngle })
      currentAngle = endAngle
    })

    return segments
  }

  const segments = calculatePieSegments()

  return (
    <Card
      className={cn(
        'border border-border/60 bg-card/80 backdrop-blur-sm p-6 hover:border-violet-500/20 transition-colors duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20">
            <PieChart className="w-4 h-4 text-violet-500" />
          </div>
          Workflow Analytics
        </h3>

        {/* View Switch Dropdown - Enhanced */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200',
              'bg-muted/50 hover:bg-muted ring-1 ring-transparent hover:ring-border/50',
              isDropdownOpen && 'ring-violet-500/30 bg-violet-500/5'
            )}
          >
            {viewType === 'status' ? (
              <>
                <Activity className="w-4 h-4 text-violet-500" />
                <span className="font-medium text-foreground">By Status</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4 text-violet-500" />
                <span className="font-medium text-foreground">By Node Type</span>
              </>
            )}
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform duration-200',
                isDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-2xl overflow-hidden z-10 min-w-[160px] ring-1 ring-white/5">
              <button
                onClick={() => {
                  setViewType('status')
                  setIsDropdownOpen(false)
                }}
                className={cn(
                  'flex items-center gap-2.5 w-full px-4 py-3 text-sm text-left transition-all duration-200',
                  viewType === 'status'
                    ? 'bg-violet-500/10 text-violet-500'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Activity className="w-4 h-4" />
                <span className="font-medium">By Status Distribution</span>
              </button>
              <div className="h-px bg-border/50 mx-2" />
              <button
                onClick={() => {
                  setViewType('nodeType')
                  setIsDropdownOpen(false)
                }}
                className={cn(
                  'flex items-center gap-2.5 w-full px-4 py-3 text-sm text-left transition-all duration-200',
                  viewType === 'nodeType'
                    ? 'bg-violet-500/10 text-violet-500'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Layers className="w-4 h-4" />
                <span className="font-medium">By Node Type</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chart Region */}
      {isLoading ? (
        // Load Skeleton - Enhanced
        <div className="flex items-center gap-6">
          <div className="relative w-40 h-40 shrink-0">
            <div className="w-full h-full rounded-full bg-muted/50 animate-pulse ring-2 ring-border/30" />
            <div className="absolute inset-6 rounded-full bg-card animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-xl"
                style={{
                  animationDelay: `${i * 100}ms`,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-lg bg-muted animate-pulse" />
                  <div className="h-4 bg-muted rounded-lg w-24 animate-pulse" />
                </div>
                <div className="h-4 bg-muted rounded-lg w-14 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          {/* Pie Chart */}
          <div className="relative w-40 h-40 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-0">
              {segments.map((segment, index) => (
                <path
                  key={index}
                  d={segment.path}
                  fill={segment.data.color}
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    opacity: hoveredSegment === null || hoveredSegment === index ? 1 : 0.5,
                    filter: hoveredSegment === index ? 'brightness(1.1)' : 'none',
                  }}
                  onMouseEnter={() => setHoveredSegment(index)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              ))}

              {/* Center (Optional Ring Effect) */}
              <circle cx="50" cy="50" r="24" fill="hsl(var(--card))" />

              {/* Center Text */}
              <text
                x="50"
                y="47"
                textAnchor="middle"
                className="fill-foreground text-[8px] font-bold"
              >
                {total}
              </text>
              <text x="50" y="56" textAnchor="middle" className="fill-muted-foreground text-[4px]">
                Total
              </text>
            </svg>

            {/* Hover Tooltip */}
            {hoveredSegment !== null && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg shadow-lg px-3 py-2 pointer-events-none z-10 whitespace-nowrap">
                <p className="text-xs font-medium text-foreground flex items-center gap-1">
                  <span>{data[hoveredSegment].icon}</span>
                  {data[hoveredSegment].label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data[hoveredSegment].value} (
                  {((data[hoveredSegment].value / total) * 100).toFixed(1)}%)
                </p>
              </div>
            )}
          </div>

          {/* Legend - Enhanced */}
          <div className="flex-1 space-y-2">
            {data.map((item, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 cursor-pointer group',
                  hoveredSegment === index
                    ? 'bg-muted ring-1 ring-violet-500/30'
                    : 'hover:bg-muted/50 ring-1 ring-transparent hover:ring-border/30'
                )}
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeInUp 300ms ease-out both',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-4 h-4 rounded-lg shrink-0 transition-transform duration-200 ring-2',
                      hoveredSegment === index && 'scale-125'
                    )}
                    style={{
                      backgroundColor: item.color,
                      ringColor: `${item.color}40`,
                    }}
                  />
                  <span className="text-sm font-medium text-foreground flex items-center gap-2 group-hover:text-violet-500 transition-colors">
                    <span className="text-base group-hover:scale-110 transition-transform">
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{item.value}</span>
                  <span className="text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted/50">
                    {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Statistics - Enhanced */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-border/50">
        <div className="text-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
          <p className="text-xl font-bold text-foreground group-hover:text-violet-500 transition-colors">
            {data.length}
          </p>
          <p className="text-xs text-muted-foreground">Categories</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-gradient-to-br from-primary/10 to-transparent ring-1 ring-primary/20 hover:ring-primary/40 transition-all cursor-pointer group">
          <p className="text-xl font-bold text-primary group-hover:scale-110 transition-transform inline-block">
            {total > 0
              ? viewType === 'status'
                ? (
                    ((statusData.find((d) => d.label === 'Completed')?.value || 0) / total) *
                    100
                  ).toFixed(0)
                : (
                    ((nodeTypeData.find((d) => d.label === 'LLM Node')?.value || 0) / total) *
                    100
                  ).toFixed(0)
              : 0}
            %
          </p>
          <p className="text-xs text-muted-foreground">
            {viewType === 'status' ? 'Completion Rate' : 'LLM Ratio'}
          </p>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
          <p className="text-xl font-bold text-foreground group-hover:text-violet-500 transition-colors">
            {data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0}
          </p>
          <p className="text-xs text-muted-foreground">Maximum Value</p>
        </div>
      </div>
    </Card>
  )
}
