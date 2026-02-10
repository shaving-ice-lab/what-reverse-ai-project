'use client'

/**
 * System Status Page
 * Display service running status and health checks
 */

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageContainer, PageHeader } from '@/components/dashboard/page-layout'
import {
  planApi,
  type MetricsDictionary,
  type TrackingEventPlan,
  type IncidentDrillPlanSet,
  type IncidentOwnerTable,
  type PostmortemTemplate,
  type ErrorBudgetPolicyTable,
  type SyntheticMonitoringPlan,
  type OnCallSLOTable,
  type StabilityPlan,
} from '@/lib/api/plan'
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Server,
  Database,
  Globe,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  ExternalLink,
  Bell,
  Calendar,
  TrendingUp,
  Zap,
  Bot,
  MessageSquare,
  Cloud,
  Shield,
  Gauge,
  Radar,
  PhoneCall,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'

// Service Status Config
const statusConfig = {
  operational: {
    label: 'Operational',
    color: 'text-brand-500',
    bg: 'bg-brand-500',
    bgLight: 'bg-brand-200/70',
    badgeVariant: 'success',
    badgeClassName: 'border-brand-500/30',
  },
  degraded: {
    label: 'Degraded',
    color: 'text-warning',
    bg: 'bg-warning',
    bgLight: 'bg-warning-200/70',
    badgeVariant: 'warning',
    badgeClassName: 'border-warning/40',
  },
  partial: {
    label: 'Partial',
    color: 'text-warning',
    bg: 'bg-warning',
    bgLight: 'bg-warning-200/70',
    badgeVariant: 'warning',
    badgeClassName: 'border-warning/40',
  },
  major: {
    label: 'Major Outage',
    color: 'text-destructive',
    bg: 'bg-destructive',
    bgLight: 'bg-destructive-200/70',
    badgeVariant: 'destructive',
    badgeClassName: 'border-destructive/40',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-foreground-light',
    bg: 'bg-surface-200',
    bgLight: 'bg-surface-200',
    badgeVariant: 'secondary',
    badgeClassName: 'border-border',
  },
}

// Service List
const services = [
  {
    id: 'api',
    name: 'API Service',
    description: 'Core API Interface Service',
    icon: Server,
    status: 'operational',
    uptime: 99.98,
    responseTime: 45,
    lastChecked: '1 min ago',
  },
  {
    id: 'ai-engine',
    name: 'AI Engine',
    description: 'AI Model Inference Service',
    icon: Cpu,
    status: 'operational',
    uptime: 99.95,
    responseTime: 120,
    lastChecked: '1 min ago',
  },
  {
    id: 'workflow',
    name: 'Workflow Engine',
    description: 'Workflow Execution and Scheduling',
    icon: Zap,
    status: 'operational',
    uptime: 99.99,
    responseTime: 35,
    lastChecked: '1 min ago',
  },
  {
    id: 'database',
    name: 'Database',
    description: 'Primary Database Cluster',
    icon: Database,
    status: 'operational',
    uptime: 99.99,
    responseTime: 12,
    lastChecked: '1 min ago',
  },
  {
    id: 'storage',
    name: 'File Storage',
    description: 'Object Storage Service',
    icon: HardDrive,
    status: 'degraded',
    uptime: 99.85,
    responseTime: 180,
    lastChecked: '1 min ago',
    issue: 'Upload speed has degraded',
  },
  {
    id: 'cdn',
    name: 'CDN',
    description: 'Content Distribution Network',
    icon: Globe,
    status: 'operational',
    uptime: 99.97,
    responseTime: 25,
    lastChecked: '1 min ago',
  },
  {
    id: 'websocket',
    name: 'WebSocket',
    description: 'Real-time Communication Service',
    icon: Wifi,
    status: 'operational',
    uptime: 99.92,
    responseTime: 15,
    lastChecked: '1 min ago',
  },
  {
    id: 'auth',
    name: 'Authentication Service',
    description: 'User Authentication and Authorization',
    icon: Shield,
    status: 'operational',
    uptime: 99.99,
    responseTime: 28,
    lastChecked: '1 min ago',
  },
]

// Recent Incidents
const recentIncidents = [
  {
    id: '1',
    title: 'File Storage Service Degraded',
    status: 'investigating',
    severity: 'minor',
    startTime: '2026-01-31T09:30:00Z',
    updates: [
      { time: '10:15', message: 'Issue identified, fix in progress' },
      { time: '09:45', message: 'Investigating' },
      { time: '09:30', message: 'Detected file upload speed degradation' },
    ],
  },
  {
    id: '2',
    title: 'Planned Maintenance: Database Upgrade',
    status: 'scheduled',
    severity: 'maintenance',
    startTime: '2026-02-01T02:00:00Z',
    endTime: '2026-02-01T04:00:00Z',
    updates: [
      { time: 'Preview', message: 'Database version upgrade planned, estimated impact 2 hours' },
    ],
  },
]

// Historical Availability Data (Last 90 days)
const uptimeHistory = Array.from({ length: 90 }, (_, i) => ({
  date: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000),
  status: Math.random() > 0.05 ? 'operational' : Math.random() > 0.5 ? 'degraded' : 'partial',
}))

export default function StatusPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [incidentPlans, setIncidentPlans] = useState<IncidentDrillPlanSet | null>(null)
  const [incidentOwners, setIncidentOwners] = useState<IncidentOwnerTable | null>(null)
  const [postmortemTemplate, setPostmortemTemplate] = useState<PostmortemTemplate | null>(null)
  const [errorBudgetPolicy, setErrorBudgetPolicy] = useState<ErrorBudgetPolicyTable | null>(null)
  const [syntheticPlan, setSyntheticPlan] = useState<SyntheticMonitoringPlan | null>(null)
  const [oncallSLO, setOncallSLO] = useState<OnCallSLOTable | null>(null)
  const [stabilityPlan, setStabilityPlan] = useState<StabilityPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [planError, setPlanError] = useState<string | null>(null)
  const [metricsDictionary, setMetricsDictionary] = useState<MetricsDictionary | null>(null)
  const [frontendTrackingPlan, setFrontendTrackingPlan] = useState<TrackingEventPlan | null>(null)
  const [backendTrackingPlan, setBackendTrackingPlan] = useState<TrackingEventPlan | null>(null)
  const [observabilityLoading, setObservabilityLoading] = useState(true)
  const [observabilityError, setObservabilityError] = useState<string | null>(null)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      setLastUpdated(new Date())
    }, 1000)
  }

  // Auto Refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let isActive = true
    const loadPlanData = async () => {
      try {
        setPlanLoading(true)
        setPlanError(null)
        const [drills, owners, template, errorBudget, synthetic, oncall, stability] =
          await Promise.all([
            planApi.getIncidentDrillPlans(),
            planApi.getIncidentOwnerTable(),
            planApi.getPostmortemTemplate(),
            planApi.getErrorBudgetPolicy(),
            planApi.getSyntheticMonitoringPlan(),
            planApi.getOnCallSLOTable(),
            planApi.getStabilityPlan(),
          ])
        if (!isActive) return
        setIncidentPlans(drills)
        setIncidentOwners(owners)
        setPostmortemTemplate(template)
        setErrorBudgetPolicy(errorBudget)
        setSyntheticPlan(synthetic)
        setOncallSLO(oncall)
        setStabilityPlan(stability)
      } catch (error) {
        if (!isActive) return
        console.error('Failed to load plan data:', error)
        setPlanError('Failed to load planning data. Please try again later.')
      } finally {
        if (isActive) setPlanLoading(false)
      }
    }

    loadPlanData()
    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    let isActive = true
    const loadObservabilityPlans = async () => {
      try {
        setObservabilityLoading(true)
        setObservabilityError(null)
        const [dictionary, frontend, backend] = await Promise.all([
          planApi.getMetricsDictionary(),
          planApi.getFrontendTrackingPlan(),
          planApi.getBackendTrackingPlan(),
        ])
        if (!isActive) return
        setMetricsDictionary(dictionary)
        setFrontendTrackingPlan(frontend)
        setBackendTrackingPlan(backend)
      } catch (error) {
        if (!isActive) return
        console.error('Failed to load observability plan data:', error)
        setObservabilityError(
          'Failed to load monitoring metrics and tracking plans. Please try again later.'
        )
      } finally {
        if (isActive) setObservabilityLoading(false)
      }
    }

    loadObservabilityPlans()
    return () => {
      isActive = false
    }
  }, [])

  // Calculate Overall Status
  const overallStatus = services.every((s) => s.status === 'operational')
    ? 'operational'
    : services.some((s) => s.status === 'major')
      ? 'major'
      : services.some((s) => s.status === 'partial')
        ? 'partial'
        : 'degraded'

  const overallConfig = statusConfig[overallStatus]
  const avgUptime = (services.reduce((sum, s) => sum + s.uptime, 0) / services.length).toFixed(2)

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="System Status"
          description="Real-time monitoring of all service running status and health checks"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                leftIcon={<RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />}
              >
                Refresh
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Bell className="w-4 h-4" />}>
                Subscribe to Notifications
              </Button>
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Updated at {lastUpdated.toLocaleTimeString('zh-CN')}
            </span>
            <Badge
              variant={overallConfig.badgeVariant}
              size="xs"
              className={cn('text-xs', overallConfig.badgeClassName)}
            >
              {overallConfig.label}
            </Badge>
            <span className="inline-flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              Monitoring {services.length} Services
            </span>
          </div>
        </PageHeader>

        <div className="page-divider" />

        {/* Status Overview */}
        <section className="page-grid lg:grid-cols-[2fr_1fr]">
          <div className="page-panel">
            <div className="page-panel-header flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="page-panel-title">Overall Status</p>
                <p className="page-panel-description">
                  {overallStatus === 'operational'
                    ? 'All systems operating normally'
                    : 'System experiencing issues'}
                </p>
              </div>
              <Badge
                variant={overallConfig.badgeVariant}
                size="sm"
                className={cn('text-xs', overallConfig.badgeClassName)}
              >
                {overallConfig.label}
              </Badge>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'h-12 w-12 rounded-md flex items-center justify-center',
                      overallConfig.bgLight
                    )}
                  >
                    {overallStatus === 'operational' ? (
                      <CheckCircle2 className={cn('w-6 h-6', overallConfig.color)} />
                    ) : overallStatus === 'degraded' ? (
                      <AlertTriangle className={cn('w-6 h-6', overallConfig.color)} />
                    ) : (
                      <XCircle className={cn('w-6 h-6', overallConfig.color)} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">System Health</p>
                    <p className="text-[13px] text-foreground-light">
                      Monitoring {services.length} core services
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 text-right">
                  <div>
                    <p className="text-xs text-foreground-muted">30-Day Avg. Uptime</p>
                    <p className="text-2xl font-semibold text-foreground">{avgUptime}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-muted">Active Incidents</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {recentIncidents.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={Number(avgUptime)} className="h-2 bg-surface-200" />
                <div className="flex items-center justify-between text-xs text-foreground-muted">
                  <span>Recent 30 days</span>
                  <span className="text-foreground">{avgUptime}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="page-panel">
            <div className="page-panel-header">
              <p className="page-panel-title">Monitoring Summary</p>
              <p className="page-panel-description">Latest refresh and subscription overview</p>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Last Refreshed</span>
                <span className="font-mono text-foreground">
                  {lastUpdated.toLocaleTimeString('zh-CN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Monitored Services</span>
                <span className="text-foreground">{services.length} </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Notification Subscription</span>
                <Badge
                  variant="secondary"
                  size="sm"
                  className="bg-surface-200 text-foreground-light"
                >
                  Not Subscribed
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Status View</span>
                <span className="text-foreground">all</span>
              </div>
            </div>
          </div>
        </section>

        {/* 90-Day Availability History */}
        <section className="page-panel">
          <div className="page-panel-header flex items-center justify-between gap-3">
            <div>
              <p className="page-panel-title">Availability History</p>
              <p className="page-panel-description">Past 90 days status overview</p>
            </div>
            <span className="text-[13px] text-foreground-light">Overall Uptime 99.95%</span>
          </div>
          <div className="p-5">
            <div className="flex gap-0.5">
              {uptimeHistory.map((day, index) => {
                const config = statusConfig[day.status as keyof typeof statusConfig]
                return (
                  <div
                    key={index}
                    className={cn('flex-1 h-6 rounded-sm', config.bg)}
                    title={`${day.date.toLocaleDateString('zh-CN')}: ${config.label}`}
                  />
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-foreground-muted">
              <span>90 days ago</span>
              <div className="flex items-center gap-4">
                {Object.entries(statusConfig)
                  .slice(0, 3)
                  .map(([key, config]) => (
                    <span key={key} className="flex items-center gap-1">
                      <span className={cn('w-3 h-3 rounded-sm', config.bg)} />
                      {config.label}
                    </span>
                  ))}
              </div>
              <span>Today</span>
            </div>
          </div>
        </section>

        {/* Service List */}
        <section className="page-panel">
          <div className="page-panel-header flex items-center justify-between gap-3">
            <div>
              <p className="page-panel-title">Service Status</p>
              <p className="page-panel-description">Key service operational status</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-foreground-light hover:text-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
          <div className="divide-y divide-border">
            {services.map((service) => {
              const config = statusConfig[service.status as keyof typeof statusConfig]
              const Icon = service.icon

              return (
                <div key={service.id} className="px-5 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn('p-2.5 rounded-md', config.bgLight)}>
                        <Icon className={cn('w-4 h-4', config.color)} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-foreground">{service.name}</h4>
                          <Badge
                            variant={config.badgeVariant}
                            size="sm"
                            className={cn('text-xs', config.badgeClassName)}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-[13px] text-foreground-light">
                          {service.issue || service.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6 text-xs text-foreground-muted">
                      <div>
                        <p>Available</p>
                        <p className="text-sm font-medium text-foreground">{service.uptime}%</p>
                      </div>
                      <div>
                        <p>Response Time</p>
                        <p className="text-sm font-medium text-foreground">
                          {service.responseTime}ms
                        </p>
                      </div>
                      <div>
                        <p>Last Checked</p>
                        <p className="text-sm font-medium text-foreground">{service.lastChecked}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Recent Incidents */}
        <section className="page-panel">
          <div className="page-panel-header flex items-center justify-between gap-3">
            <div>
              <p className="page-panel-title">Recent Incidents</p>
              <p className="page-panel-description">Recent maintenance and alert records</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground-light hover:text-foreground"
            >
              View History <ExternalLink className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="p-5">
            {recentIncidents.length === 0 ? (
              <div className="p-8 rounded-md bg-surface-100 border border-border text-center">
                <CheckCircle2 className="w-10 h-10 text-brand-500 mx-auto mb-4" />
                <p className="text-foreground text-sm font-medium">No Active Incidents</p>
                <p className="text-[13px] text-foreground-light">All systems operating normally</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentIncidents.map((incident) => {
                  const statusVariant =
                    incident.status === 'scheduled'
                      ? 'secondary'
                      : incident.status === 'investigating'
                        ? 'warning'
                        : 'success'
                  return (
                    <div
                      key={incident.id}
                      className="p-5 rounded-md border border-border bg-surface-100"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {incident.severity === 'maintenance' ? (
                              <Clock className="w-4 h-4 text-foreground-light" />
                            ) : (
                              <AlertTriangle
                                className={cn(
                                  'w-4 h-4',
                                  incident.severity === 'minor'
                                    ? 'text-warning'
                                    : 'text-destructive'
                                )}
                              />
                            )}
                            <h4 className="text-sm font-medium text-foreground">
                              {incident.title}
                            </h4>
                          </div>
                          <p className="text-[13px] text-foreground-light">
                            {incident.status === 'scheduled'
                              ? `Scheduled: ${new Date(incident.startTime).toLocaleString('zh-CN')}`
                              : `Started at ${new Date(incident.startTime).toLocaleString('zh-CN')}`}
                          </p>
                        </div>
                        <Badge
                          variant={statusVariant}
                          size="sm"
                          className={cn(
                            statusVariant === 'secondary' && 'bg-surface-200 text-foreground-light',
                            statusVariant === 'warning' && 'border-warning/40',
                            statusVariant === 'success' && 'border-brand-500/30'
                          )}
                        >
                          {incident.status === 'scheduled'
                            ? 'Scheduled'
                            : incident.status === 'investigating'
                              ? 'Investigating'
                              : 'Resolved'}
                        </Badge>
                      </div>

                      <div className="space-y-2 pl-7">
                        {incident.updates.map((update, index) => (
                          <div key={index} className="flex items-start gap-3 text-[13px]">
                            <span className="text-foreground-muted font-mono shrink-0 w-12">
                              {update.time}
                            </span>
                            <span className="text-foreground">{update.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Incident Drills and Contingency */}
        <section className="page-panel">
          <div className="page-panel-header flex items-center justify-between gap-3">
            <div>
              <p className="page-panel-title">Incident Drills & Contingency</p>
              <p className="page-panel-description">
                Drill checklist, responsibilities, and templates
              </p>
            </div>
            <Badge variant="outline" size="sm" className="border-border text-foreground-light">
              Playbook
            </Badge>
          </div>
          <div className="p-5 space-y-4">
            {planLoading ? (
              <div className="rounded-lg border border-border bg-surface-100 px-4 py-3 text-xs text-foreground-light">
                Loading drill and contingency data...
              </div>
            ) : planError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive-200/40 px-4 py-3 text-xs text-destructive">
                {planError}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Calendar className="w-4 h-4 text-foreground-light" />
                      {incidentPlans?.title || 'Key Incident Drill Plan'}
                    </div>
                    <Badge
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground-light"
                    >
                      {incidentPlans?.drills?.length ?? 0}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-foreground-light">
                    {incidentPlans?.summary || 'No drill plans configured.'}
                  </p>
                  <div className="space-y-3">
                    {(incidentPlans?.drills || []).map((drill) => (
                      <div
                        key={drill.key}
                        className="rounded-md border border-border bg-background-200 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[13px] text-foreground font-medium">
                            {drill.title}
                          </div>
                          <Badge variant="secondary" size="sm" className="text-[10px]">
                            {drill.severity}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-foreground-light">
                          Frequency: {drill.frequency}
                        </div>
                        <div className="text-[11px] text-foreground-light">
                          Scenario: {drill.scenarios.map((scenario) => scenario.title).join(' / ')}
                        </div>
                        <div className="text-[11px] text-foreground-light">
                          Owner: {drill.owners.join(' / ')}
                        </div>
                        <ul className="list-disc pl-4 text-[11px] text-foreground-light">
                          {drill.objectives.slice(0, 2).map((objective) => (
                            <li key={objective}>{objective}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {(incidentPlans?.drills || []).length === 0 && (
                      <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
                        No drill items.
                      </div>
                    )}
                  </div>
                  {(incidentPlans?.notes || []).length > 0 && (
                    <div className="rounded-md border border-border bg-background-200 p-3 text-[11px] text-foreground-light">
                      {incidentPlans?.notes?.[0]}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Shield className="w-4 h-4 text-foreground-light" />
                    {incidentOwners?.title || 'Incident Response and Rollback Responsibilities'}
                  </div>
                  <p className="text-[12px] text-foreground-light">
                    {incidentOwners?.summary || 'No responsibility owners configured.'}
                  </p>
                  <div className="space-y-3">
                    {(incidentOwners?.roles || []).map((role) => (
                      <div
                        key={role.role}
                        className="rounded-md border border-border bg-background-200 p-3 space-y-2"
                      >
                        <div className="text-[13px] text-foreground font-medium">{role.role}</div>
                        <div className="text-[11px] text-foreground-light">
                          Primary: {role.primary} · Backup: {role.backup}
                        </div>
                        <ul className="list-disc pl-4 text-[11px] text-foreground-light">
                          {role.responsibilities.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {(incidentOwners?.roles || []).length === 0 && (
                      <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
                        No roles configured.
                      </div>
                    )}
                  </div>
                  {(incidentOwners?.escalation || []).length > 0 && (
                    <div className="rounded-md border border-border bg-background-200 p-3 space-y-1">
                      <div className="text-[11px] text-foreground-light">Escalation Path</div>
                      {(incidentOwners?.escalation || []).map((item) => (
                        <div key={item.level} className="text-[11px] text-foreground">
                          {item.level} · {item.condition} · {item.action}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <MessageSquare className="w-4 h-4 text-foreground-light" />
                    {postmortemTemplate?.title || 'Template'}
                  </div>
                  <p className="text-[12px] text-foreground-light">
                    {postmortemTemplate?.summary || 'No template configured.'}
                  </p>
                  <div className="space-y-3">
                    {(postmortemTemplate?.sections || []).map((section) => (
                      <div
                        key={section.key}
                        className="rounded-md border border-border bg-background-200 p-3 space-y-2"
                      >
                        <div className="text-[13px] text-foreground font-medium">
                          {section.title}
                        </div>
                        <ul className="list-disc pl-4 text-[11px] text-foreground-light">
                          {section.questions.slice(0, 2).map((question) => (
                            <li key={question}>{question}</li>
                          ))}
                        </ul>
                        {section.questions.length > 2 && (
                          <div className="text-[10px] text-foreground-light">
                            {section.questions.length - 2} more questions not shown
                          </div>
                        )}
                      </div>
                    ))}
                    {(postmortemTemplate?.sections || []).length === 0 && (
                      <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
                        No template items.
                      </div>
                    )}
                  </div>
                  {(postmortemTemplate?.checklist || []).length > 0 && (
                    <div className="rounded-md border border-border bg-background-200 p-3 space-y-2">
                      <div className="text-[11px] text-foreground-light">Checklist</div>
                      <ul className="list-disc pl-4 text-[11px] text-foreground-light">
                        {postmortemTemplate?.checklist?.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Monitoring Metrics and Tracking Plans */}
        <section className="page-panel">
          <div className="page-panel-header flex items-center justify-between gap-3">
            <div>
              <p className="page-panel-title">Monitoring Metrics & Tracking Plans</p>
              <p className="page-panel-description">
                Prometheus metrics and frontend/backend tracking event definitions
              </p>
            </div>
            <Badge variant="outline" size="sm" className="border-border text-foreground-light">
              Observability
            </Badge>
          </div>
          <div className="p-5 space-y-4">
            {observabilityLoading ? (
              <div className="rounded-lg border border-border bg-surface-100 px-4 py-3 text-xs text-foreground-light">
                Loading monitoring metrics and tracking plans...
              </div>
            ) : observabilityError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive-200/40 px-4 py-3 text-xs text-destructive">
                {observabilityError}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr_1fr] gap-4">
                <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <TrendingUp className="w-4 h-4 text-foreground-light" />
                      {metricsDictionary?.title || 'Metrics Dictionary'}
                    </div>
                    <Badge
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground-light"
                    >
                      {metricsDictionary?.metrics?.length ?? 0}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-foreground-light">
                    {metricsDictionary?.summary || 'No metrics dictionary description.'}
                  </p>
                  <div className="rounded-md border border-border bg-background-200/40 max-h-[360px] overflow-y-auto divide-y divide-border">
                    {(metricsDictionary?.metrics || []).map((metric) => (
                      <div key={metric.name} className="px-3 py-2 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[12px] font-mono text-foreground">{metric.name}</div>
                          <Badge
                            variant="outline"
                            size="sm"
                            className="text-[10px] border-border text-foreground-light"
                          >
                            {metric.type}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-foreground-light">
                          {metric.description}
                        </div>
                        <div className="text-[10px] text-foreground-light">
                          Tags: {metric.labels?.length ? metric.labels.join(', ') : '-'}
                          {metric.unit ? ` · ${metric.unit}` : ''}
                        </div>
                        {metric.buckets && metric.buckets.length > 0 && (
                          <div className="text-[10px] text-foreground-light">
                            Buckets: {metric.buckets.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                    {(metricsDictionary?.metrics || []).length === 0 && (
                      <div className="px-3 py-3 text-[11px] text-foreground-light">
                        No metrics items.
                      </div>
                    )}
                  </div>
                  {(metricsDictionary?.notes || []).length > 0 && (
                    <div className="rounded-md border border-border bg-background-200 p-3 text-[11px] text-foreground-light">
                      {metricsDictionary?.notes?.[0]}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Zap className="w-4 h-4 text-foreground-light" />
                      {frontendTrackingPlan?.title || 'Frontend Tracking Events'}
                    </div>
                    <Badge
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground-light"
                    >
                      {frontendTrackingPlan?.events?.length ?? 0}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-foreground-light">
                    {frontendTrackingPlan?.summary || 'No frontend tracking description.'}
                  </p>
                  <div className="rounded-md border border-border bg-background-200/40 max-h-[360px] overflow-y-auto divide-y divide-border">
                    {(frontendTrackingPlan?.events || []).map((event) => (
                      <div key={event.key} className="px-3 py-2 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[12px] text-foreground font-medium">
                            {event.event}
                          </div>
                          <Badge variant="secondary" size="sm" className="text-[10px]">
                            {event.category}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-foreground-light">{event.description}</div>
                        <div className="text-[10px] text-foreground-light">
                          Trigger: {event.trigger}
                        </div>
                        <div className="text-[10px] text-foreground-light">
                          Properties: {event.properties.join(', ')}
                        </div>
                      </div>
                    ))}
                    {(frontendTrackingPlan?.events || []).length === 0 && (
                      <div className="px-3 py-3 text-[11px] text-foreground-light">
                        No frontend tracking events.
                      </div>
                    )}
                  </div>
                  {(frontendTrackingPlan?.notes || []).length > 0 && (
                    <div className="rounded-md border border-border bg-background-200 p-3 text-[11px] text-foreground-light">
                      {frontendTrackingPlan?.notes?.[0]}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Server className="w-4 h-4 text-foreground-light" />
                      {backendTrackingPlan?.title || 'Backend Tracking Events'}
                    </div>
                    <Badge
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground-light"
                    >
                      {backendTrackingPlan?.events?.length ?? 0}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-foreground-light">
                    {backendTrackingPlan?.summary || 'No backend tracking description.'}
                  </p>
                  <div className="rounded-md border border-border bg-background-200/40 max-h-[360px] overflow-y-auto divide-y divide-border">
                    {(backendTrackingPlan?.events || []).map((event) => (
                      <div key={event.key} className="px-3 py-2 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[12px] text-foreground font-medium">
                            {event.event}
                          </div>
                          <Badge variant="secondary" size="sm" className="text-[10px]">
                            {event.category}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-foreground-light">{event.description}</div>
                        <div className="text-[10px] text-foreground-light">
                          Trigger: {event.trigger}
                        </div>
                        <div className="text-[10px] text-foreground-light">
                          Properties: {event.properties.join(', ')}
                        </div>
                      </div>
                    ))}
                    {(backendTrackingPlan?.events || []).length === 0 && (
                      <div className="px-3 py-3 text-[11px] text-foreground-light">
                        No backend tracking events.
                      </div>
                    )}
                  </div>
                  {(backendTrackingPlan?.notes || []).length > 0 && (
                    <div className="rounded-md border border-border bg-background-200 p-3 text-[11px] text-foreground-light">
                      {backendTrackingPlan?.notes?.[0]}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Availability and Error Budget (SRE) */}
        <section className="page-panel">
          <div className="page-panel-header flex items-center justify-between gap-3">
            <div>
              <p className="page-panel-title">Availability & Error Budget (SRE)</p>
              <p className="page-panel-description">
                Error budget, synthetic monitoring, on-call SLO, and stability
              </p>
            </div>
            <Badge variant="outline" size="sm" className="border-border text-foreground-light">
              SRE
            </Badge>
          </div>
          <div className="p-5 space-y-4">
            {planLoading ? (
              <div className="rounded-lg border border-border bg-surface-100 px-4 py-3 text-xs text-foreground-light">
                Loading SRE planning data...
              </div>
            ) : planError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive-200/40 px-4 py-3 text-xs text-destructive">
                {planError}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Gauge className="w-4 h-4 text-foreground-light" />
                      {errorBudgetPolicy?.title || 'Error Budget Rule'}
                    </div>
                    <Badge
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground-light"
                    >
                      {errorBudgetPolicy?.rules?.length ?? 0}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-foreground-light">
                    {errorBudgetPolicy?.summary || 'No error budget rules configured.'}
                  </p>
                  <div className="space-y-2">
                    {(errorBudgetPolicy?.rules || []).slice(0, 3).map((rule) => (
                      <div
                        key={rule.key}
                        className="rounded-md border border-border bg-background-200 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12px] text-foreground font-medium">
                            {rule.title}
                          </span>
                          <Badge variant="secondary" size="sm" className="text-[10px]">
                            {rule.slo}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-foreground-light">
                          Budget {rule.budget} · Window {rule.window}
                        </div>
                      </div>
                    ))}
                    {(errorBudgetPolicy?.rules || []).length === 0 && (
                      <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
                        No rule items.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Radar className="w-4 h-4 text-foreground-light" />
                      {syntheticPlan?.title || 'Synthetic Monitoring Plan'}
                    </div>
                    <Badge
                      variant="outline"
                      size="sm"
                      className="border-border text-foreground-light"
                    >
                      {syntheticPlan?.probes?.length ?? 0}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-foreground-light">
                    {syntheticPlan?.summary || 'No synthetic monitoring configured.'}
                  </p>
                  <div className="space-y-2">
                    {(syntheticPlan?.probes || []).slice(0, 3).map((probe) => (
                      <div
                        key={probe.key}
                        className="rounded-md border border-border bg-background-200 p-3 space-y-1"
                      >
                        <div className="text-[12px] text-foreground font-medium">{probe.name}</div>
                        <div className="text-[11px] text-foreground-light">
                          {probe.method} {probe.target}
                        </div>
                        <div className="text-[11px] text-foreground-light">
                          Frequency: {probe.frequency} · Regions: {probe.locations.join(' / ')}
                        </div>
                      </div>
                    ))}
                    {(syntheticPlan?.probes || []).length === 0 && (
                      <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
                        No items.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <PhoneCall className="w-4 h-4 text-foreground-light" />
                    {oncallSLO?.title || 'On-Call & Response SLO'}
                  </div>
                  <p className="text-[12px] text-foreground-light">
                    {oncallSLO?.summary || 'No on-call SLO configured.'}
                  </p>
                  <div className="space-y-2">
                    {(oncallSLO?.targets || []).map((target) => (
                      <div
                        key={target.severity}
                        className="rounded-md border border-border bg-background-200 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12px] text-foreground font-medium">
                            {target.severity}
                          </span>
                          <span className="text-[10px] text-foreground-light">
                            {target.coverage}
                          </span>
                        </div>
                        <div className="text-[11px] text-foreground-light mt-1">
                          Confirm {target.ack_target} · {target.mitigate_target}
                        </div>
                      </div>
                    ))}
                    {(oncallSLO?.targets || []).length === 0 && (
                      <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
                        No response targets.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <ShieldCheck className="w-4 h-4 text-foreground-light" />
                    {stabilityPlan?.title || 'Stability Plan'}
                  </div>
                  <p className="text-[12px] text-foreground-light">
                    {stabilityPlan?.summary || 'No stability plan configured.'}
                  </p>
                  <div className="space-y-2">
                    {(stabilityPlan?.tracks || []).slice(0, 3).map((track) => (
                      <div
                        key={track.key}
                        className="rounded-md border border-border bg-background-200 p-3 space-y-1"
                      >
                        <div className="text-[12px] text-foreground font-medium">{track.title}</div>
                        <div className="text-[11px] text-foreground-light">
                          Cadence: {track.cadence}
                        </div>
                        <div className="text-[11px] text-foreground-light">
                          Owner: {track.owners.join(' / ')}
                        </div>
                      </div>
                    ))}
                    {(stabilityPlan?.tracks || []).length === 0 && (
                      <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
                        No items.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Subscription Tip */}
        <section className="page-panel border border-brand-400/30 bg-brand-200/40">
          <div className="page-panel-header">
            <p className="page-panel-title">Subscribe to Status Updates</p>
            <p className="page-panel-description">
              Receive real-time notifications about system status changes and maintenance plans
            </p>
          </div>
          <div className="px-6 pb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-[13px] text-foreground-light">
              Supports Email, Webhook, and other notification channels
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground-light hover:text-foreground"
              >
                Email Subscription
              </Button>
              <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-background">
                Webhook Subscription
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
