'use client'

/**
 * Action Logs / Audit Log Page
 * Records all user action history
 */

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  EmptyState,
  PageContainer,
  PageHeader,
  StatsCard,
} from '@/components/dashboard/page-layout'
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Edit3,
  Eye,
  ExternalLink,
  FileText,
  Info,
  Key,
  LogIn,
  LogOut,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Shield,
  Trash2,
  User,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DrawerDialog } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Action Type Config
const actionTypes = {
  create: { label: 'Create', icon: Plus, color: 'text-brand-500', bg: 'bg-brand-200/70' },
  update: { label: 'Update', icon: Edit3, color: 'text-brand-500', bg: 'bg-brand-200/70' },
  delete: {
    label: 'Delete',
    icon: Trash2,
    color: 'text-destructive-400',
    bg: 'bg-destructive-200/70',
  },
  execute: { label: 'Execute', icon: Play, color: 'text-brand-500', bg: 'bg-brand-200/70' },
  view: { label: 'View', icon: Eye, color: 'text-foreground-light', bg: 'bg-surface-200/70' },
  share: { label: 'Share', icon: Share2, color: 'text-foreground-light', bg: 'bg-surface-200/70' },
  login: { label: 'Sign In', icon: LogIn, color: 'text-brand-500', bg: 'bg-brand-200/70' },
  logout: {
    label: 'Sign Out',
    icon: LogOut,
    color: 'text-foreground-light',
    bg: 'bg-surface-200/70',
  },
  settings: {
    label: 'Settings',
    icon: Settings,
    color: 'text-foreground-light',
    bg: 'bg-surface-200/70',
  },
  security: { label: 'Security', icon: Shield, color: 'text-warning', bg: 'bg-warning-200/70' },
}

// Resource Type Config
const resourceTypes = {
  workflow: { label: 'Workflow', icon: Zap },
  agent: { label: 'Agent', icon: Bot },
  conversation: { label: 'Conversation', icon: FileText },
  apiKey: { label: 'API Key', icon: Key },
  account: { label: 'Account', icon: User },
  settings: { label: 'Settings', icon: Settings },
}

// Status Config
const statusConfig = {
  success: { label: 'Success', icon: CheckCircle, color: 'text-brand-500', variant: 'success' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-destructive', variant: 'error' },
  warning: { label: 'Warning', icon: AlertTriangle, color: 'text-warning', variant: 'warning' },
  info: { label: 'Info', icon: Info, color: 'text-foreground-light', variant: 'secondary' },
}

// Mock Logs Data
const mockLogs = [
  {
    id: '1',
    action: 'execute',
    resource: 'workflow',
    resourceName: 'Customer Feedback Auto-Processing',
    resourceId: 'wf-123',
    status: 'success',
    message: 'Workflow executed successfully, processed 15 feedback items',
    actor: {
      id: 'user-001',
      name: 'Chen Yi',
      email: 'chenyi@reverse.ai',
      role: 'Admin',
    },
    ip: '192.168.1.100',
    userAgent: 'Chrome/120.0 Windows',
    timestamp: '2026-01-31T10:30:00Z',
    duration: 2500,
    metadata: {
      request_id: 'req_94c3',
      region: 'ap-sg',
      trigger: 'manual',
    },
  },
  {
    id: '2',
    action: 'create',
    resource: 'agent',
    resourceName: 'WritingAssistant v2',
    resourceId: 'ag-456',
    status: 'success',
    message: 'New agent created successfully',
    actor: {
      id: 'user-002',
      name: 'Song Yu',
      email: 'songyu@reverse.ai',
      role: 'Member',
    },
    ip: '192.168.1.100',
    userAgent: 'Chrome/120.0 Windows',
    timestamp: '2026-01-31T10:15:00Z',
    metadata: {
      template: 'assistant-v2',
      visibility: 'workspace',
      source: 'dashboard',
    },
  },
  {
    id: '3',
    action: 'security',
    resource: 'apiKey',
    resourceName: 'Production Environment Key',
    resourceId: 'key-789',
    status: 'warning',
    message: 'API key is about to expire, please update it promptly',
    actor: {
      id: 'system',
      name: 'Security Audit',
      email: 'security@reverse.ai',
      role: 'System',
    },
    ip: '192.168.1.100',
    userAgent: 'Chrome/120.0 Windows',
    timestamp: '2026-01-31T09:45:00Z',
    metadata: {
      expires_at: '2026-02-03T00:00:00Z',
      policy: 'rotate-7d',
    },
  },
  {
    id: '4',
    action: 'delete',
    resource: 'conversation',
    resourceName: 'Test Conversation Record',
    resourceId: 'conv-012',
    status: 'success',
    message: 'Conversation deleted successfully',
    actor: {
      id: 'user-001',
      name: 'Chen Yi',
      email: 'chenyi@reverse.ai',
      role: 'Admin',
    },
    ip: '192.168.1.100',
    userAgent: 'Chrome/120.0 Windows',
    timestamp: '2026-01-31T09:30:00Z',
    metadata: {
      retention: '30d',
      soft_delete: true,
    },
  },
  {
    id: '5',
    action: 'login',
    resource: 'account',
    resourceName: 'Account Sign In',
    status: 'success',
    message: 'User signed in successfully',
    actor: {
      id: 'user-003',
      name: 'can',
      email: 'like@reverse.ai',
      role: 'Member',
    },
    ip: '192.168.1.100',
    userAgent: 'Chrome/120.0 Windows',
    timestamp: '2026-01-31T09:00:00Z',
    metadata: {
      method: 'password',
      mfa: true,
      session_id: 'sess_7f2a',
    },
  },
  {
    id: '6',
    action: 'execute',
    resource: 'workflow',
    resourceName: 'Data Sync Task',
    resourceId: 'wf-345',
    status: 'failed',
    message: 'Workflow execution failed: Connection timeout',
    actor: {
      id: 'user-004',
      name: 'weeks',
      email: 'zhouning@reverse.ai',
      role: 'Member',
    },
    ip: '192.168.1.100',
    userAgent: 'Chrome/120.0 Windows',
    timestamp: '2026-01-30T18:20:00Z',
    duration: 30000,
    error: 'Connection timeout after 30s',
    metadata: {
      error_code: 'EXEC_TIMEOUT',
      retry: 2,
      node: 'http.request',
    },
  },
  {
    id: '7',
    action: 'update',
    resource: 'settings',
    resourceName: 'Notification Settings',
    status: 'success',
    message: 'Updated notification preferences',
    actor: {
      id: 'user-005',
      name: 'Sun Jie',
      email: 'sunjie@reverse.ai',
      role: 'Member',
    },
    ip: '192.168.1.100',
    userAgent: 'Chrome/120.0 Windows',
    timestamp: '2026-01-30T16:45:00Z',
    metadata: {
      channel: 'email',
      previous: 'all',
      current: 'mentions',
    },
  },
  {
    id: '8',
    action: 'share',
    resource: 'workflow',
    resourceName: 'Email Auto Categorization',
    resourceId: 'wf-678',
    status: 'success',
    message: 'Workflow shared with team members',
    actor: {
      id: 'user-002',
      name: 'Song Yu',
      email: 'songyu@reverse.ai',
      role: 'Member',
    },
    ip: '192.168.1.100',
    userAgent: 'Chrome/120.0 Windows',
    timestamp: '2026-01-30T14:30:00Z',
    metadata: {
      shared_with: 'Growth Team',
      permission: 'edit',
    },
  },
]

// Time Range Options
const timeRanges = [
  { id: '1h', label: 'Recent 1 h' },
  { id: '24h', label: 'Recent 24 h' },
  { id: '7d', label: 'Recent 7 days' },
  { id: '30d', label: 'Recent 30 days' },
  { id: 'custom', label: 'Custom Range' },
]

const resultsTabs = [
  { id: 'results', label: 'Result' },
  { id: 'explain', label: 'Explain' },
  { id: 'chart', label: 'Chart' },
] as const

const timeRangeLimits: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

function formatTimestamp(timestamp: string | Date) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(durationMs?: number) {
  if (durationMs === undefined) return '—'
  if (durationMs < 1000) return `${durationMs} ms`
  return `${(durationMs / 1000).toFixed(1)}s`
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function computeStats(logs: typeof mockLogs) {
  const total = logs.length
  const success = logs.filter((log) => log.status === 'success').length
  const failed = logs.filter((log) => log.status === 'failed').length
  const warning = logs.filter((log) => log.status === 'warning').length
  const durations = logs.filter((log) => log.duration !== undefined).map((log) => log.duration ?? 0)
  const durationCount = durations.length
  const avgDuration = durationCount
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durationCount)
    : 0
  const successRate = total ? Math.round((success / total) * 100) : 0
  return { total, success, failed, warning, avgDuration, successRate, durationCount }
}

function formatCsvValue(value: unknown) {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

function buildCsv(headers: string[], rows: Array<Record<string, unknown>>) {
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => formatCsvValue(row[header])).join(',')),
  ]
  return lines.join('\n')
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [selectedResource, setSelectedResource] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedActor, setSelectedActor] = useState<string>('all')
  const [timeRange, setTimeRange] = useState('24h')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedLog, setSelectedLog] = useState<(typeof mockLogs)[number] | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date())
  const [collectionQuery, setCollectionQuery] = useState('')
  const [queryDraft, setQueryDraft] = useState(
    "select\n timestamp,\n action,\n resource,\n status,\n message\nfrom audit_logs\nwhere status != 'success'\norder by timestamp desc\nlimit 100"
  )
  const [resultsTab, setResultsTab] = useState<(typeof resultsTabs)[number]['id']>('results')

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      setLastRefreshed(new Date())
    }, 1000)
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedAction('all')
    setSelectedResource('all')
    setSelectedStatus('all')
    setSelectedActor('all')
    setTimeRange('24h')
  }

  const handleExport = (format: 'csv' | 'json') => {
    if (filteredLogs.length === 0) return
    const exportRows = filteredLogs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      action: log.action,
      resource: log.resource,
      resource_name: log.resourceName ?? '',
      resource_id: log.resourceId ?? '',
      status: log.status,
      message: log.message,
      actor_name: log.actor?.name ?? '',
      actor_email: log.actor?.email ?? '',
      actor_role: log.actor?.role ?? '',
      ip: log.ip ?? '',
      user_agent: log.userAgent ?? '',
      duration_ms: log.duration ?? '',
      error: log.error ?? '',
      metadata: log.metadata ? JSON.stringify(log.metadata) : '',
    }))
    const exportedAt = new Date().toISOString()
    const fileStamp = exportedAt.replace(/[:]/g, '-').slice(0, 19)
    const baseName = `audit-logs-${fileStamp}`

    if (format === 'json') {
      const payload = {
        exported_at: exportedAt,
        filters: {
          search: searchQuery.trim(),
          action: selectedAction,
          resource: selectedResource,
          status: selectedStatus,
          actor: selectedActor,
          time_range: timeRange,
        },
        total: filteredLogs.length,
        items: exportRows,
      }
      downloadFile(
        JSON.stringify(payload, null, 2),
        `${baseName}.json`,
        'application/json;charset=utf-8'
      )
      return
    }

    const headers = [
      'id',
      'timestamp',
      'action',
      'resource',
      'resource_name',
      'resource_id',
      'status',
      'message',
      'actor_name',
      'actor_email',
      'actor_role',
      'ip',
      'user_agent',
      'duration_ms',
      'error',
      'metadata',
    ]
    const csv = buildCsv(headers, exportRows)
    downloadFile(csv, `${baseName}.csv`, 'text/csv;charset=utf-8')
  }

  // Filter Logs
  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const timeLimit = timeRangeLimits[timeRange]
    const now = Date.now()

    return mockLogs.filter((log) => {
      const matchesSearch =
        query.length === 0 ||
        log.resourceName?.toLowerCase().includes(query) ||
        log.message.toLowerCase().includes(query) ||
        log.resourceId?.toLowerCase().includes(query) ||
        log.actor?.name?.toLowerCase().includes(query) ||
        log.actor?.email?.toLowerCase().includes(query)
      const matchesAction = selectedAction === 'all' || log.action === selectedAction
      const matchesResource = selectedResource === 'all' || log.resource === selectedResource
      const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus
      const matchesActor = selectedActor === 'all' || log.actor?.id === selectedActor
      const matchesTime = !timeLimit || now - new Date(log.timestamp).getTime() <= timeLimit
      return (
        matchesSearch &&
        matchesAction &&
        matchesResource &&
        matchesStatus &&
        matchesActor &&
        matchesTime
      )
    })
  }, [searchQuery, selectedAction, selectedResource, selectedStatus, selectedActor, timeRange])

  // Statistics Data
  const stats = useMemo(() => computeStats(mockLogs), [])
  const filteredStats = useMemo(() => computeStats(filteredLogs), [filteredLogs])

  const selectedTimeRangeLabel =
    timeRanges.find((range) => range.id === timeRange)?.label ?? 'Custom Range'

  const actorOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string; role?: string }>()
    mockLogs.forEach((log) => {
      if (!log.actor?.id) return
      if (!map.has(log.actor.id)) {
        map.set(log.actor.id, {
          id: log.actor.id,
          name: log.actor.name,
          email: log.actor.email,
          role: log.actor.role,
        })
      }
    })
    return Array.from(map.values())
  }, [])

  const activeFilters = useMemo(() => {
    const items: { id: string; label: string }[] = []
    if (searchQuery.trim()) {
      const trimmed = searchQuery.trim()
      items.push({
        id: 'search',
        label: `Search: ${trimmed.length > 16 ? `${trimmed.slice(0, 16)}...` : trimmed}`,
      })
    }
    if (selectedAction !== 'all') {
      items.push({
        id: 'action',
        label: `Action: ${actionTypes[selectedAction as keyof typeof actionTypes]?.label ?? selectedAction}`,
      })
    }
    if (selectedResource !== 'all') {
      items.push({
        id: 'resource',
        label: `Resource: ${resourceTypes[selectedResource as keyof typeof resourceTypes]?.label ?? selectedResource}`,
      })
    }
    if (selectedStatus !== 'all') {
      items.push({
        id: 'status',
        label: `Status: ${statusConfig[selectedStatus as keyof typeof statusConfig]?.label ?? selectedStatus}`,
      })
    }
    if (selectedActor !== 'all') {
      const actor = actorOptions.find((item) => item.id === selectedActor)
      items.push({
        id: 'actor',
        label: `Actor: ${actor?.name ?? selectedActor}`,
      })
    }
    if (timeRange !== '24h') {
      items.push({
        id: 'time',
        label: `Time: ${selectedTimeRangeLabel}`,
      })
    }
    return items
  }, [
    searchQuery,
    selectedAction,
    selectedResource,
    selectedStatus,
    selectedActor,
    timeRange,
    selectedTimeRangeLabel,
    actorOptions,
  ])

  const hasActiveFilters = activeFilters.length > 0
  const failureRate = filteredStats.total
    ? Math.round((filteredStats.failed / filteredStats.total) * 100)
    : 0

  const nonResultsState =
    resultsTab === 'explain'
      ? {
          title: 'No Execution Plan',
          description: 'Run a query to generate the explain info.',
          icon: <Info className="w-5 h-5" />,
        }
      : {
          title: 'No Chart',
          description: 'Save a query to view trends.',
          icon: <BarChart3 className="w-5 h-5" />,
        }

  const resourceCounts = useMemo(() => {
    return mockLogs.reduce<Record<string, number>>((acc, log) => {
      acc[log.resource] = (acc[log.resource] ?? 0) + 1
      return acc
    }, {})
  }, [])

  const actionCounts = useMemo(() => {
    return mockLogs.reduce<Record<string, number>>((acc, log) => {
      acc[log.action] = (acc[log.action] ?? 0) + 1
      return acc
    }, {})
  }, [])

  const collectionEntries = useMemo(() => {
    const query = collectionQuery.trim().toLowerCase()
    const entries = Object.entries(resourceTypes)
    if (!query) return entries
    return entries.filter(([key, config]) => {
      return key.toLowerCase().includes(query) || config.label.toLowerCase().includes(query)
    })
  }, [collectionQuery])

  const quickFilters = [
    {
      id: 'failed',
      label: 'Failed Events',
      description: 'Failed and exceptional actions',
      status: 'failed',
      tone: 'bg-destructive',
    },
    {
      id: 'security',
      label: 'Security Related',
      description: 'Key and permission changes',
      action: 'security',
      tone: 'bg-warning',
    },
    {
      id: 'login',
      label: 'Sign In Activity',
      description: 'Sign in and sign out records',
      action: 'login',
      tone: 'bg-brand-500',
    },
  ]

  const applyQuickFilter = (filter: (typeof quickFilters)[number]) => {
    setSelectedAction(filter.action ?? 'all')
    setSelectedStatus(filter.status ?? 'all')
    setSelectedResource('all')
    setSelectedActor('all')
    setSearchQuery('')
    setTimeRange('24h')
    setResultsTab('results')
  }

  const selectedLogContext = selectedLog
    ? {
        action: actionTypes[selectedLog.action as keyof typeof actionTypes],
        resource: resourceTypes[selectedLog.resource as keyof typeof resourceTypes],
        status: statusConfig[selectedLog.status as keyof typeof statusConfig] ?? statusConfig.info,
      }
    : null
  const SelectedActionIcon = selectedLogContext?.action?.icon ?? Info
  const SelectedResourceIcon = selectedLogContext?.resource?.icon ?? FileText
  const SelectedStatusIcon = selectedLogContext?.status?.icon ?? Info
  const selectedMetadataEntries = selectedLog ? Object.entries(selectedLog.metadata ?? {}) : []
  const canExport = filteredLogs.length > 0

  return (
    <PageContainer>
      <div className="space-y-6">
        <p className="page-caption">Observability</p>
        <PageHeader
          title="Action Logs"
          description="View and track all your action records"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                leftIcon={<RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />}
              >
                {isRefreshing ? 'Refresh' : 'Refresh'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    leftIcon={<Download className="w-4 h-4" />}
                    disabled={!canExport}
                  >
                    Export Logs
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-surface-100 border-border">
                  <DropdownMenuItem disabled={!canExport} onClick={() => handleExport('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={!canExport} onClick={() => handleExport('json')}>
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
            <Badge variant="outline" size="sm">
              Retain 30 days
            </Badge>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {isRefreshing ? 'Refreshing...' : `Last refreshed ${formatTimestamp(lastRefreshed)}`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {selectedTimeRangeLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Display {filteredLogs.length} / {stats.total}
            </span>
          </div>
        </PageHeader>

        {/* Statistics Cards */}
        <div className="page-grid grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon={<FileText className="w-4 h-4" />}
            title="Total Actions"
            value={filteredStats.total}
            subtitle={hasActiveFilters ? `Total ${stats.total}` : 'Current range'}
          />
          <StatsCard
            icon={<CheckCircle className="w-4 h-4" />}
            title="Success Rate"
            value={`${filteredStats.successRate}%`}
            subtitle={`Success ${filteredStats.success} times`}
          />
          <StatsCard
            icon={<XCircle className="w-4 h-4" />}
            title="Failed"
            value={filteredStats.failed}
            subtitle={`compare ${failureRate}%`}
          />
          <StatsCard
            icon={<Clock className="w-4 h-4" />}
            title="Average Duration"
            value={formatDuration(filteredStats.avgDuration)}
            subtitle={
              filteredStats.durationCount
                ? `Based on ${filteredStats.durationCount} executions`
                : 'No duration data'
            }
          />
        </div>

        <div className="page-panel">
          <div className="page-panel-header">
            <p className="page-panel-title">Event Types</p>
            <p className="page-panel-description">Quick view by action and resource type</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(actionTypes).map(([key, config]) => (
                <Badge key={key} variant="secondary" size="xs">
                  {config.label}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(resourceTypes).map(([key, config]) => (
                <Badge key={key} variant="outline" size="xs">
                  {config.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="page-grid xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="page-panel p-4 space-y-3">
              <Badge variant="outline" size="xs">
                Coming soon
              </Badge>
              <div>
                <p className="text-sm font-medium text-foreground">New Logs Engine</p>
                <p className="text-[13px] text-foreground-light">
                  Supports real-time search and more advanced filters.
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full justify-center">
                Request Early Access
              </Button>
            </div>

            <div className="page-panel overflow-hidden">
              <div className="page-panel-header">
                <p className="page-panel-title">Collection</p>
                <p className="page-panel-description">Browse by resource type</p>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    variant="search"
                    inputSize="sm"
                    placeholder="Search collections..."
                    value={collectionQuery}
                    onChange={(e) => setCollectionQuery(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                    className="w-full"
                  />
                  <Button variant="outline" size="icon-sm" aria-label="Add collection">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedResource('all')}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors',
                      selectedResource === 'all'
                        ? 'bg-surface-200 text-foreground'
                        : 'text-foreground-light hover:bg-surface-100 hover:text-foreground'
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="flex-1 text-left">All Resources</span>
                    <span className="text-[11px] text-foreground-muted tabular-nums">
                      {stats.total}
                    </span>
                  </button>
                  {collectionEntries.map(([key, config]) => {
                    const Icon = config.icon
                    const count = resourceCounts[key] ?? 0
                    const isActive = selectedResource === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedResource(key)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors',
                          isActive
                            ? 'bg-surface-200 text-foreground'
                            : 'text-foreground-light hover:bg-surface-100 hover:text-foreground'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{config.label}</span>
                        <span className="text-[11px] text-foreground-muted tabular-nums">
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="page-panel overflow-hidden">
              <div className="page-panel-header flex items-center justify-between">
                <div>
                  <p className="page-panel-title">Query</p>
                  <p className="page-panel-description">Save frequently used search conditions</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Create query">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-3 space-y-2">
                {quickFilters.map((filter) => {
                  const isActive =
                    (filter.status ? selectedStatus === filter.status : true) &&
                    (filter.action ? selectedAction === filter.action : true) &&
                    selectedResource === 'all' &&
                    searchQuery.trim() === ''
                  const count =
                    filter.status === 'failed'
                      ? stats.failed
                      : filter.action
                        ? (actionCounts[filter.action] ?? 0)
                        : 0
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => applyQuickFilter(filter)}
                      className={cn(
                        'flex w-full items-start justify-between gap-3 rounded-md border border-transparent px-3 py-2 text-left transition-colors',
                        isActive
                          ? 'bg-surface-200 text-foreground border-border'
                          : 'text-foreground-light hover:bg-surface-100 hover:text-foreground'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className={cn('mt-2 h-2 w-2 rounded-full', filter.tone)} />
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{filter.label}</p>
                          <p className="text-[11px] text-foreground-muted">{filter.description}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-foreground-muted tabular-nums">
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="page-panel">
              <div className="page-panel-header flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="page-panel-title">Logs Query</p>
                  <p className="page-panel-description">
                    Use structured conditions to quickly find events
                  </p>
                </div>
                <Badge variant="secondary" size="sm">
                  SQL
                </Badge>
              </div>
              <div className="px-6 pb-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                      Add Source
                    </Button>
                    <Button variant="outline" size="sm">
                      Template
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 h-8">
                          <Calendar className="w-4 h-4" />
                          {selectedTimeRangeLabel}
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-surface-100 border-border">
                        {timeRanges.map((range) => (
                          <DropdownMenuItem key={range.id} onClick={() => setTimeRange(range.id)}>
                            {range.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<ExternalLink className="w-4 h-4" />}
                    >
                      Field Reference
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Save Query
                    </Button>
                    <Button size="sm" leftIcon={<Play className="w-4 h-4" />}>
                      Run
                    </Button>
                  </div>
                </div>
                <textarea
                  value={queryDraft}
                  onChange={(e) => setQueryDraft(e.target.value)}
                  className="min-h-[140px] w-full rounded-md border border-border bg-surface-200/80 px-3 py-2 text-[12px] font-mono text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-brand-500/40 focus:border-brand-500/40"
                  placeholder="Enter log query conditions..."
                />
                <div className="flex items-center justify-between text-xs text-foreground-muted">
                  <span>Supports SQL and expression queries. Results sync to the list below.</span>
                  <span>Result {filteredLogs.length} </span>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="page-panel">
              <div className="page-panel-header flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="page-panel-title">Filter</p>
                  <p className="page-panel-description">
                    Filter logs by action, resource, and status
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Badge variant="secondary" size="sm">
                      Enabled {activeFilters.length} Filter
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    disabled={!hasActiveFilters}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>

              <div className="px-6 pb-6 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[220px] max-w-md">
                    <Input
                      variant="search"
                      inputSize="sm"
                      placeholder="Search action logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftIcon={<Search className="w-4 h-4" />}
                      className="w-full"
                    />
                  </div>

                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger className="h-8 w-[150px] bg-surface-100 border-border text-[12px] text-foreground-light">
                      <SelectValue placeholder="Action Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-100 border-border">
                      <SelectItem value="all">All Actions</SelectItem>
                      {Object.entries(actionTypes).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-8 w-[120px] bg-surface-100 border-border text-[12px] text-foreground-light">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-100 border-border">
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedResource} onValueChange={setSelectedResource}>
                    <SelectTrigger className="h-8 w-[150px] bg-surface-100 border-border text-[12px] text-foreground-light">
                      <SelectValue placeholder="Resource Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-100 border-border">
                      <SelectItem value="all">All Resources</SelectItem>
                      {Object.entries(resourceTypes).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedActor} onValueChange={setSelectedActor}>
                    <SelectTrigger className="h-8 w-[160px] bg-surface-100 border-border text-[12px] text-foreground-light">
                      <SelectValue placeholder="Actor" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-100 border-border">
                      <SelectItem value="all">All Actors</SelectItem>
                      {actorOptions.map((actor) => (
                        <SelectItem key={actor.id} value={actor.id}>
                          {actor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="h-8 w-[150px] bg-surface-100 border-border text-[12px] text-foreground-light">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-100 border-border">
                      {timeRanges.map((range) => (
                        <SelectItem key={range.id} value={range.id}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                    <span>Current filters:</span>
                    {activeFilters.map((filter) => (
                      <Badge key={filter.id} variant="outline" size="sm">
                        {filter.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Logs List */}
            <div className="page-panel">
              <div className="page-panel-header flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="page-panel-title">Logs List</p>
                  <p className="page-panel-description"> {filteredLogs.length} Record</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <Badge variant="success" size="sm">
                    Success {filteredStats.success}
                  </Badge>
                  <Badge variant="warning" size="sm">
                    Warning {filteredStats.warning}
                  </Badge>
                  <Badge variant="error" size="sm">
                    Failed {filteredStats.failed}
                  </Badge>
                </div>
              </div>
              <div className="border-t border-border">
                {filteredLogs.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="w-5 h-5" />}
                    title="No Matching Logs"
                    description="Try adjusting the filter criteria or expanding the time range."
                    action={{
                      label: 'Reset Filters',
                      onClick: resetFilters,
                    }}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[160px]">Time</TableHead>
                        <TableHead className="w-[180px]">Actor</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead className="w-[170px]">Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => {
                        const actionConfig = actionTypes[log.action as keyof typeof actionTypes]
                        const resourceConfig =
                          resourceTypes[log.resource as keyof typeof resourceTypes]
                        const status =
                          statusConfig[log.status as keyof typeof statusConfig] ?? statusConfig.info
                        const ActionIcon = actionConfig?.icon || Info
                        const ResourceIcon = resourceConfig?.icon || FileText
                        const StatusIcon = status?.icon || Info
                        const actorInitial = log.actor?.name?.slice(0, 1) ?? 'U'
                        const actorName = log.actor?.name ?? 'Unknown user'
                        const actorMeta = log.actor?.email ?? log.actor?.id ?? '—'

                        return (
                          <TableRow key={log.id} className="group">
                            <TableCell className="w-[160px] text-xs text-foreground-light">
                              <div className="flex flex-col">
                                <span className="text-[13px] text-foreground">
                                  {formatTimestamp(log.timestamp)}
                                </span>
                                <span className="text-[11px] text-foreground-muted">
                                  {new Date(log.timestamp).toLocaleString('zh-CN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="w-[180px]">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-200 text-[12px] font-semibold text-foreground">
                                  {actorInitial}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">
                                      {actorName}
                                    </span>
                                    {log.actor?.role && (
                                      <Badge variant="outline" size="xs">
                                        {log.actor.role}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-foreground-muted truncate">
                                    {actorMeta}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[260px]">
                              <div className="flex items-start gap-3">
                                <div
                                  className={cn(
                                    'mt-0.5 flex h-9 w-9 items-center justify-center rounded-md border border-border/60',
                                    actionConfig?.bg ?? 'bg-surface-200/70'
                                  )}
                                >
                                  <ActionIcon
                                    className={cn(
                                      'h-4 w-4',
                                      actionConfig?.color ?? 'text-foreground-light'
                                    )}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground">
                                    {actionConfig?.label ?? log.action}
                                  </p>
                                  <p className="text-[12px] text-foreground-light truncate">
                                    {log.message}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[220px]">
                              <div className="space-y-1">
                                <Badge
                                  variant="secondary"
                                  size="xs"
                                  icon={<ResourceIcon className="w-3 h-3" />}
                                >
                                  {resourceConfig?.label ?? log.resource}
                                </Badge>
                                <p className="text-[13px] text-foreground">
                                  {log.resourceName ?? '—'}
                                </p>
                                {log.resourceId && (
                                  <p className="text-[11px] text-foreground-muted font-mono">
                                    {log.resourceId}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="w-[170px]">
                              <div className="flex flex-col items-start gap-2">
                                <Badge
                                  variant={status?.variant ?? 'secondary'}
                                  size="sm"
                                  icon={<StatusIcon className="w-3 h-3" />}
                                >
                                  {status?.label ?? 'Unknown'}
                                </Badge>
                                {log.duration !== undefined && (
                                  <span className="text-[11px] text-foreground-muted">
                                    Duration {formatDuration(log.duration)}
                                  </span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setSelectedLog(log)}
                                >
                                  Details
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
              {filteredLogs.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-75/60">
                  <p className="text-xs text-foreground-muted">
                    Showing {filteredLogs.length} records
                    {hasActiveFilters && `, Total ${stats.total} `}
                  </p>
                  <Button variant="outline" size="sm">
                    Load More Logs
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <DrawerDialog
        open={!!selectedLog}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null)
        }}
        title="Log Details"
        description={
          selectedLog
            ? `${selectedLogContext?.action?.label ?? selectedLog.action} · ${
                selectedLogContext?.resource?.label ?? selectedLog.resource
              }`
            : undefined
        }
        side="right"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-md border border-border/60',
                      selectedLogContext?.action?.bg ?? 'bg-surface-200/70'
                    )}
                  >
                    <SelectedActionIcon
                      className={cn(
                        'h-4 w-4',
                        selectedLogContext?.action?.color ?? 'text-foreground-light'
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-foreground-muted">Action</p>
                    <p className="text-base font-semibold text-foreground">
                      {selectedLogContext?.action?.label ?? selectedLog.action}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-foreground-light">{selectedLog.message}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(selectedLog.timestamp).toLocaleString('zh-CN')}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {selectedLog.actor?.name ?? 'Unknown user'}
                  </span>
                  {selectedLog.duration !== undefined && (
                    <span className="inline-flex items-center gap-1">
                      <Play className="w-3.5 h-3.5" />
                      {formatDuration(selectedLog.duration)}
                    </span>
                  )}
                </div>
              </div>
              <Badge
                variant={selectedLogContext?.status?.variant ?? 'secondary'}
                size="sm"
                icon={<SelectedStatusIcon className="w-3 h-3" />}
              >
                {selectedLogContext?.status?.label ?? 'Unknown'}
              </Badge>
            </div>

            <div className="page-grid md:grid-cols-2">
              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-[11px] text-foreground-muted">Actor</p>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-200 text-[12px] font-semibold text-foreground">
                    {selectedLog.actor?.name?.slice(0, 1) ?? 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {selectedLog.actor?.name ?? 'Unknown user'}
                    </p>
                    <p className="text-[11px] text-foreground-muted">
                      {selectedLog.actor?.email ?? selectedLog.actor?.id ?? '—'}
                    </p>
                  </div>
                </div>
                {selectedLog.actor?.role && (
                  <Badge variant="outline" size="xs">
                    {selectedLog.actor.role}
                  </Badge>
                )}
              </div>

              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-[11px] text-foreground-muted">Resource</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    size="xs"
                    icon={<SelectedResourceIcon className="w-3 h-3" />}
                  >
                    {selectedLogContext?.resource?.label ?? selectedLog.resource}
                  </Badge>
                  <span className="text-sm text-foreground">{selectedLog.resourceName ?? '—'}</span>
                </div>
                {selectedLog.resourceId && (
                  <p className="text-[11px] text-foreground-muted font-mono">
                    {selectedLog.resourceId}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-[11px] text-foreground-muted">Access Environment</p>
                <div className="flex items-center gap-2 text-xs text-foreground-light">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>{selectedLog.userAgent}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground-light">
                  <User className="w-3.5 h-3.5" />
                  <span>{selectedLog.ip}</span>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-[11px] text-foreground-muted">Execution Info</p>
                <p className="text-xs text-foreground-light">
                  Duration {formatDuration(selectedLog.duration)}
                </p>
                {selectedLog.error && (
                  <p className="text-[11px] text-foreground-light font-mono bg-surface-200/70 border border-border rounded-md px-2 py-1">
                    {selectedLog.error}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-[11px] text-foreground-muted mb-2">Data</p>
              {selectedMetadataEntries.length ? (
                <div className="space-y-2">
                  {selectedMetadataEntries.map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3">
                      <span className="text-[11px] uppercase tracking-wide text-foreground-muted">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[12px] text-foreground">
                        {formatMetadataValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-foreground-muted">No data</p>
              )}
            </div>
          </div>
        )}
      </DrawerDialog>
    </PageContainer>
  )
}
