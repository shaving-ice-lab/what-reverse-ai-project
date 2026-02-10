'use client'

/**
 * Execution Records Page
 * View and manage workflow execution history
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button, ButtonGroup } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { PageContainer, PageHeader } from '@/components/dashboard/page-layout'
import {
  Play,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  MoreHorizontal,
  ArrowUpDown,
  Download,
  RefreshCw,
  Zap,
  AlertTriangle,
  Timer,
  BarChart3,
  Eye,
  RotateCcw,
  Trash2,
  Copy,
  ChevronRight,
  Activity,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Execution Status Config
const statusConfig = {
  completed: {
    label: 'Success',
    variant: 'success' as const,
    icon: CheckCircle2,
    color: 'text-brand-500',
    bgColor: 'bg-brand-200/60',
    borderColor: 'border-brand-400/40',
  },
  failed: {
    label: 'Failed',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive-200/60',
    borderColor: 'border-destructive/30',
  },
  running: {
    label: 'Running',
    variant: 'warning' as const,
    icon: Loader2,
    color: 'text-warning',
    bgColor: 'bg-warning-200/60',
    borderColor: 'border-warning/30',
  },
  pending: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: Clock,
    color: 'text-foreground-muted',
    bgColor: 'bg-surface-200',
    borderColor: 'border-border',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'outline' as const,
    icon: AlertTriangle,
    color: 'text-foreground-muted',
    bgColor: 'bg-surface-200',
    borderColor: 'border-border',
  },
}

type ExecutionStatus = keyof typeof statusConfig

// Mock Execution Record Data
const mockExecutions = [
  {
    id: 'exec-1',
    workflowId: 'wf-1',
    workflowName: 'Daily Data Sync',
    status: 'completed' as ExecutionStatus,
    trigger: 'scheduled',
    startedAt: '2026-02-03T10:30:00',
    completedAt: '2026-02-03T10:30:45',
    durationMs: 45000,
    nodeCount: 8,
    successNodes: 8,
    failedNodes: 0,
    tokensUsed: 1250,
    error: null,
  },
  {
    id: 'exec-2',
    workflowId: 'wf-2',
    workflowName: 'User Sign-Up Notifications',
    status: 'failed' as ExecutionStatus,
    trigger: 'webhook',
    startedAt: '2026-02-03T10:15:00',
    completedAt: '2026-02-03T10:15:32',
    durationMs: 32000,
    nodeCount: 5,
    successNodes: 3,
    failedNodes: 2,
    tokensUsed: 680,
    error: 'Email service connection timeout',
  },
  {
    id: 'exec-3',
    workflowId: 'wf-3',
    workflowName: 'AI Content Review',
    status: 'running' as ExecutionStatus,
    trigger: 'manual',
    startedAt: '2026-02-03T10:28:00',
    completedAt: null,
    durationMs: null,
    nodeCount: 12,
    successNodes: 7,
    failedNodes: 0,
    tokensUsed: 2100,
    error: null,
  },
  {
    id: 'exec-4',
    workflowId: 'wf-1',
    workflowName: 'Daily Data Sync',
    status: 'completed' as ExecutionStatus,
    trigger: 'scheduled',
    startedAt: '2026-02-02T10:30:00',
    completedAt: '2026-02-02T10:30:38',
    durationMs: 38000,
    nodeCount: 8,
    successNodes: 8,
    failedNodes: 0,
    tokensUsed: 1180,
    error: null,
  },
  {
    id: 'exec-5',
    workflowId: 'wf-4',
    workflowName: 'Order Processing Flow',
    status: 'pending' as ExecutionStatus,
    trigger: 'api',
    startedAt: null,
    completedAt: null,
    durationMs: null,
    nodeCount: 6,
    successNodes: 0,
    failedNodes: 0,
    tokensUsed: 0,
    error: null,
  },
  {
    id: 'exec-6',
    workflowId: 'wf-5',
    workflowName: 'Social Media Publishing',
    status: 'cancelled' as ExecutionStatus,
    trigger: 'manual',
    startedAt: '2026-02-02T15:00:00',
    completedAt: '2026-02-02T15:00:12',
    durationMs: 12000,
    nodeCount: 4,
    successNodes: 1,
    failedNodes: 0,
    tokensUsed: 320,
    error: 'Manually cancelled by user',
  },
  {
    id: 'exec-7',
    workflowId: 'wf-2',
    workflowName: 'User Sign-Up Notifications',
    status: 'completed' as ExecutionStatus,
    trigger: 'webhook',
    startedAt: '2026-02-02T09:45:00',
    completedAt: '2026-02-02T09:45:28',
    durationMs: 28000,
    nodeCount: 5,
    successNodes: 5,
    failedNodes: 0,
    tokensUsed: 720,
    error: null,
  },
  {
    id: 'exec-8',
    workflowId: 'wf-6',
    workflowName: 'Report Generation Task',
    status: 'completed' as ExecutionStatus,
    trigger: 'scheduled',
    startedAt: '2026-02-01T08:00:00',
    completedAt: '2026-02-01T08:02:15',
    durationMs: 135000,
    nodeCount: 15,
    successNodes: 15,
    failedNodes: 0,
    tokensUsed: 4500,
    error: null,
  },
]

// Time Range Options
const timeRanges = [
  { value: 'all', label: 'All Time' },
  { value: 'hour', label: 'Recent 1 h' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Recent 7 days' },
  { value: 'month', label: 'Recent 30 days' },
]

// Trigger Types
const triggerTypes = [
  { value: 'all', label: 'All Triggers' },
  { value: 'manual', label: 'Manual Trigger' },
  { value: 'scheduled', label: 'Scheduled Trigger' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'api', label: 'API Call' },
]

type SortKey = 'startedAt' | 'duration' | 'tokens' | 'status'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'startedAt', label: 'Start Time' },
  { value: 'duration', label: 'Duration' },
  { value: 'tokens', label: 'Token Consumption' },
  { value: 'status', label: 'Status' },
]

// Format Date
function formatDate(dateString: string | null) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// Format Duration
function formatDuration(ms: number | null) {
  if (ms === null) return '-'
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

export default function ExecutionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedTrigger, setSelectedTrigger] = useState('all')
  const [timeRange, setTimeRange] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('startedAt')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [executions, setExecutions] = useState(mockExecutions)

  // Filter and Sort
  const visibleExecutions = useMemo(() => {
    const filtered = executions.filter((exec) => {
      const matchesSearch = exec.workflowName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = selectedStatus === 'all' || exec.status === selectedStatus
      const matchesTrigger = selectedTrigger === 'all' || exec.trigger === selectedTrigger

      let matchesTime = true
      if (timeRange !== 'all' && exec.startedAt) {
        const execDate = new Date(exec.startedAt)
        const now = new Date()
        const diffMs = now.getTime() - execDate.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)
        const diffDays = diffMs / (1000 * 60 * 60 * 24)

        switch (timeRange) {
          case 'hour':
            matchesTime = diffHours <= 1
            break
          case 'today':
            matchesTime = diffDays <= 1
            break
          case 'week':
            matchesTime = diffDays <= 7
            break
          case 'month':
            matchesTime = diffDays <= 30
            break
        }
      }

      return matchesSearch && matchesStatus && matchesTrigger && matchesTime
    })

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'duration':
          return (b.durationMs ?? 0) - (a.durationMs ?? 0)
        case 'tokens':
          return b.tokensUsed - a.tokensUsed
        case 'status':
          return a.status.localeCompare(b.status)
        case 'startedAt':
        default:
          return new Date(b.startedAt ?? 0).getTime() - new Date(a.startedAt ?? 0).getTime()
      }
    })
  }, [executions, searchQuery, selectedStatus, selectedTrigger, timeRange, sortBy])

  // Toggle Selection
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  // Select All
  const toggleSelectAll = () => {
    if (selectedItems.size === visibleExecutions.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(visibleExecutions.map((e) => e.id)))
    }
  }

  // Delete Execution Record
  const deleteExecution = (id: string) => {
    setExecutions((prev) => prev.filter((exec) => exec.id !== id))
    selectedItems.delete(id)
    setSelectedItems(new Set(selectedItems))
  }

  // Bulk Delete
  const bulkDelete = () => {
    setExecutions((prev) => prev.filter((exec) => !selectedItems.has(exec.id)))
    setSelectedItems(new Set())
  }

  // Statistics Data
  const stats = {
    total: executions.length,
    completed: executions.filter((e) => e.status === 'completed').length,
    failed: executions.filter((e) => e.status === 'failed').length,
    running: executions.filter((e) => e.status === 'running').length,
    pending: executions.filter((e) => e.status === 'pending').length,
    successRate:
      executions.length > 0
        ? (executions.filter((e) => e.status === 'completed').length /
            executions.filter((e) => e.status !== 'pending' && e.status !== 'running').length) *
          100
        : 0,
    avgDuration:
      executions.filter((e) => e.durationMs).length > 0
        ? executions.filter((e) => e.durationMs).reduce((sum, e) => sum + (e.durationMs ?? 0), 0) /
          executions.filter((e) => e.durationMs).length
        : 0,
    totalTokens: executions.reduce((sum, e) => sum + e.tokensUsed, 0),
  }

  const hasSelection = selectedItems.size > 0

  const statCards = [
    {
      label: 'Total Executions',
      value: stats.total,
      helper: `${stats.running} Running`,
      icon: Play,
      iconClassName: 'bg-brand-200/60 border-brand-400/40 text-brand-500',
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate.toFixed(1)}%`,
      helper: `${stats.completed} Success / ${stats.failed} Failed`,
      icon: CheckCircle2,
      trend: stats.successRate > 90 ? 5.2 : -2.1,
      iconClassName:
        stats.successRate > 80
          ? 'bg-brand-200/60 border-brand-400/40 text-brand-500'
          : 'bg-warning-200/60 border-warning/30 text-warning',
    },
    {
      label: 'Average Duration',
      value: formatDuration(stats.avgDuration),
      helper: 'Per execution',
      icon: Timer,
      iconClassName: 'bg-surface-200 border-border text-foreground-light',
    },
    {
      label: 'Token Consumption',
      value: `${(stats.totalTokens / 1000).toFixed(1)}K`,
      helper: 'Cumulative this month',
      icon: Zap,
      iconClassName: 'bg-warning-200/60 border-warning/30 text-warning',
    },
  ]

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-3">
          <p className="page-caption">Executions</p>
          <PageHeader
            title="Execution records"
            description="View and manage workflow execution history"
            actions={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                  Export
                </Button>
                <Link href="/dashboard/workflows">
                  <Button size="sm" leftIcon={<Zap className="w-4 h-4" />}>
                    View Workflows
                  </Button>
                </Link>
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
              <span className="inline-flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                {stats.running} Running
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {stats.pending} Pending
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Success Rate {stats.successRate.toFixed(1)}%
              </span>
            </div>
          </PageHeader>
        </div>

        {/* Statistics Cards */}
        <section className="page-section">
          <div className="page-grid grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
              const StatIcon = stat.icon
              return (
                <Card
                  key={stat.label}
                  variant="stats"
                  hover="border"
                  padding="sm"
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs text-foreground-muted">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-stat-number text-foreground tabular-nums">{stat.value}</p>
                      {stat.trend !== undefined && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-0.5 text-[10px] font-medium',
                            stat.trend > 0 ? 'text-brand-500' : 'text-destructive'
                          )}
                        >
                          {stat.trend > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {Math.abs(stat.trend).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-foreground-muted">{stat.helper}</p>
                  </div>
                  <div
                    className={cn(
                      'h-9 w-9 rounded-md border flex items-center justify-center',
                      stat.iconClassName
                    )}
                  >
                    <StatIcon className="w-4 h-4" />
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Filter */}
        <section className="page-panel p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <Input
                variant="dark"
                placeholder="Search workflow name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-surface-200 border border-border text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
              />
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[130px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <SelectValue placeholder="Execution status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTrigger} onValueChange={setSelectedTrigger}>
              <SelectTrigger className="w-[130px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <SelectValue placeholder="Trigger method" />
              </SelectTrigger>
              <SelectContent>
                {triggerTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortKey)}>
              <SelectTrigger className="w-[140px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-foreground-muted" />
                  <SelectValue placeholder="Sort" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <span>
              Display {visibleExecutions.length} / {executions.length}
            </span>
            {selectedStatus !== 'all' && (
              <Badge variant="outline" size="xs">
                Status: {statusConfig[selectedStatus as ExecutionStatus]?.label}
              </Badge>
            )}
            {selectedTrigger !== 'all' && (
              <Badge variant="outline" size="xs">
                Trigger: {triggerTypes.find((t) => t.value === selectedTrigger)?.label}
              </Badge>
            )}
            {timeRange !== 'all' && (
              <Badge variant="outline" size="xs">
                {timeRanges.find((t) => t.value === timeRange)?.label}
              </Badge>
            )}
          </div>
        </section>

        {/* Batch Actions */}
        {hasSelection && (
          <section className="page-panel border-brand-400/40 bg-brand-200/20">
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2 text-[13px] text-foreground">
                <Badge variant="primary" size="sm">
                  {selectedItems.size}
                </Badge>
                {selectedItems.size} selected
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                  Export Selected
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={bulkDelete}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
                  Deselect
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Execution List */}
        <section className="page-panel overflow-hidden">
          <div className="page-panel-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="page-panel-title">Execution List</p>
              <p className="page-panel-description">{visibleExecutions.length} execution records</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="border-t border-border">
            <div className="grid items-center gap-4 px-4 py-2.5 border-b border-border bg-surface-75/80 text-table-header grid-cols-[24px_minmax(0,1fr)_80px] md:grid-cols-[24px_minmax(0,1fr)_100px_100px_80px] lg:grid-cols-[24px_minmax(0,1fr)_100px_100px_100px_80px]">
              <Checkbox
                checked={
                  selectedItems.size === visibleExecutions.length && visibleExecutions.length > 0
                }
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-left">Workflow</span>
              <span className="hidden md:block text-center">Status</span>
              <span className="hidden md:block text-center">Duration</span>
              <span className="hidden lg:block text-center">Start Time</span>
              <span className="text-right">Action</span>
            </div>

            {visibleExecutions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-md bg-surface-200 border border-border flex items-center justify-center mb-4">
                  <Play className="w-6 h-6 text-foreground-muted" />
                </div>
                <h3 className="text-base font-medium text-foreground mb-2">No execution records</h3>
                <p className="text-[13px] text-foreground-light mb-4 max-w-sm">
                  {searchQuery
                    ? 'Try other search conditions'
                    : 'Workflow runs will show execution records here'}
                </p>
                <Link href="/dashboard/workflows">
                  <Button size="sm" leftIcon={<Zap className="w-4 h-4" />}>
                    View Workflows
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {visibleExecutions.map((exec) => {
                  const config = statusConfig[exec.status]
                  const StatusIcon = config.icon
                  const isSelected = selectedItems.has(exec.id)

                  return (
                    <div
                      key={exec.id}
                      className={cn(
                        'grid items-center gap-4 px-4 py-4 transition-supabase grid-cols-[24px_minmax(0,1fr)_80px] md:grid-cols-[24px_minmax(0,1fr)_100px_100px_80px] lg:grid-cols-[24px_minmax(0,1fr)_100px_100px_100px_80px]',
                        isSelected ? 'bg-brand-200/20' : 'hover:bg-surface-75/60'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(exec.id)}
                      />

                      <div className="min-w-0 flex items-start gap-3">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-md border flex items-center justify-center shrink-0',
                            config.bgColor,
                            config.borderColor
                          )}
                        >
                          <StatusIcon
                            className={cn(
                              'w-4 h-4',
                              config.color,
                              exec.status === 'running' && 'animate-spin'
                            )}
                          />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/dashboard/workflows/${exec.workflowId}`} className="group">
                            <h3 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors truncate">
                              {exec.workflowName}
                            </h3>
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
                            <span>ID: {exec.id}</span>
                            <Badge variant="outline" size="xs">
                              {exec.trigger === 'manual'
                                ? 'Manual'
                                : exec.trigger === 'scheduled'
                                  ? 'Scheduled'
                                  : exec.trigger === 'webhook'
                                    ? 'Webhook'
                                    : 'API'}
                            </Badge>
                            {exec.tokensUsed > 0 && <span>{exec.tokensUsed} tokens</span>}
                          </div>
                          {exec.error && (
                            <p className="text-[11px] text-destructive mt-1 truncate">
                              {exec.error}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="hidden md:flex justify-center">
                        <Badge
                          variant={config.variant}
                          size="sm"
                          icon={<StatusIcon className="w-3 h-3" />}
                        >
                          {config.label}
                        </Badge>
                      </div>

                      <div className="hidden md:flex justify-center">
                        <span className="text-[13px] text-foreground-light tabular-nums">
                          {formatDuration(exec.durationMs)}
                        </span>
                      </div>

                      <div className="hidden lg:flex justify-center">
                        <span className="text-[13px] text-foreground-light">
                          {formatDate(exec.startedAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-foreground-muted"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-lg bg-surface-100 border-border shadow-2xl"
                          >
                            <DropdownMenuItem className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200">
                              <Eye className="w-4 h-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200">
                              <Copy className="w-4 h-4" />
                              Copy ID
                            </DropdownMenuItem>
                            {exec.status === 'failed' && (
                              <DropdownMenuItem className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200">
                                <RotateCcw className="w-4 h-4" />
                                Rerun
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              className="text-[13px] text-destructive-400 focus:text-destructive focus:bg-destructive-200"
                              onClick={() => deleteExecution(exec.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
