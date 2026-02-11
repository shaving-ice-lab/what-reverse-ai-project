'use client'

/**
 * Dashboard Home - Redesigned
 * Welcome + Quick Actions + Recent Apps + DB Overview + Agent Sessions
 */

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bot,
  Database,
  LayoutGrid,
  Zap,
  ChevronRight,
  MessageSquare,
  Table2,
  HardDrive,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  dashboardApi,
  type DashboardData,
  type WorkflowSummary,
  formatQuickStats,
} from '@/lib/api/dashboard'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await dashboardApi.getDashboardData()
        if (response.success) {
          setDashboardData(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return 'Good evening'
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const stats = dashboardData?.quick_stats
  const formattedStats = stats ? formatQuickStats(stats) : null

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {getGreeting()}, {user?.displayName || user?.username || 'User'}
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Build and manage your applications with AI
          </p>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickActionCard
            href="/dashboard/agent"
            icon={Bot}
            title="AI Agent"
            description="Chat with AI to build apps"
            color="brand"
          />
          <QuickActionCard
            href="/dashboard/database"
            icon={Database}
            title="Database"
            description="Manage tables and data"
            color="emerald"
          />
          <QuickActionCard
            href="/dashboard/apps"
            icon={LayoutGrid}
            title="My Apps"
            description="View your applications"
            color="blue"
          />
          <QuickActionCard
            href="/dashboard/workflows"
            icon={Zap}
            title="Agent Flow"
            description="Automate with workflows"
            color="amber"
          />
        </div>

        {/* Two-column: Recent Apps + DB Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Apps / Workflows */}
          <div className="border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Recent Workflows</span>
              <Link href="/dashboard/workflows" className="text-[11px] text-foreground-muted hover:text-foreground flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {isLoading ? (
                <LoadingSkeleton count={3} />
              ) : dashboardData?.recent_workflows && dashboardData.recent_workflows.length > 0 ? (
                dashboardData.recent_workflows.slice(0, 3).map((wf) => (
                  <RecentAppRow key={wf.id} workflow={wf} />
                ))
              ) : (
                <div className="px-4 py-8 text-center text-xs text-foreground-muted">
                  No workflows yet.{' '}
                  <Link href="/dashboard/workflows/new" className="text-brand-500 hover:underline">
                    Create one
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Database Overview */}
          <div className="border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Database Overview</span>
              <Link href="/dashboard/database" className="text-[11px] text-foreground-muted hover:text-foreground flex items-center gap-0.5">
                Manage <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {isLoading ? (
                <LoadingSkeleton count={3} />
              ) : (
                <>
                  <DBStatRow icon={Table2} label="Tables" value={String(formattedStats?.totalWorkflows ?? 0)} />
                  <DBStatRow icon={HardDrive} label="Total Size" value="—" />
                  <DBStatRow icon={Database} label="Quota" value="—" />
                  <Link
                    href="/dashboard/database"
                    className="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 transition-colors pt-1"
                  >
                    Open Database Manager
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recent Agent Sessions */}
        <div className="border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-medium text-foreground">Recent Agent Sessions</span>
            </div>
            <Link href="/dashboard/agent" className="text-[11px] text-foreground-muted hover:text-foreground flex items-center gap-0.5">
              Open Agent <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            <AgentSessionRow title="Start a new conversation" description="Chat with AI Agent to create apps, manage databases, and build workflows" isPlaceholder />
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}

// ===== Sub-components =====

interface QuickActionCardProps {
  href: string
  icon: React.ElementType
  title: string
  description: string
  color: 'brand' | 'emerald' | 'blue' | 'amber'
}

const colorStyles = {
  brand: 'bg-brand-500/5 text-brand-500 border-brand-500/20 hover:border-brand-500/40',
  emerald: 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20 hover:border-emerald-500/40',
  blue: 'bg-blue-500/5 text-blue-600 border-blue-500/20 hover:border-blue-500/40',
  amber: 'bg-amber-500/5 text-amber-600 border-amber-500/20 hover:border-amber-500/40',
}

const iconBgStyles = {
  brand: 'bg-brand-500/10',
  emerald: 'bg-emerald-500/10',
  blue: 'bg-blue-500/10',
  amber: 'bg-amber-500/10',
}

function QuickActionCard({ href, icon: Icon, title, description, color }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'block rounded-lg border p-4 transition-all group',
        colorStyles[color]
      )}
    >
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', iconBgStyles[color])}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="text-[11px] text-foreground-muted mt-0.5">{description}</div>
    </Link>
  )
}

function RecentAppRow({ workflow }: { workflow: WorkflowSummary }) {
  const statusBadge: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-600',
    draft: 'bg-surface-200 text-foreground-muted',
    published: 'bg-brand-500/10 text-brand-500',
    archived: 'bg-amber-500/10 text-amber-600',
  }

  return (
    <Link
      href={`/dashboard/workflows/${workflow.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-200/30 transition-colors"
    >
      <div className="w-8 h-8 rounded bg-surface-200/50 flex items-center justify-center shrink-0">
        <Zap className="w-3.5 h-3.5 text-foreground-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{workflow.name}</div>
        <div className="text-[11px] text-foreground-muted">
          {workflow.run_count} runs
          {workflow.success_rate > 0 && ` · ${workflow.success_rate.toFixed(0)}%`}
        </div>
      </div>
      <span className={cn('text-[10px] px-1.5 py-0.5 rounded', statusBadge[workflow.status] || statusBadge.draft)}>
        {workflow.status}
      </span>
    </Link>
  )
}

function DBStatRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-foreground-muted" />
        <span className="text-sm text-foreground-light">{label}</span>
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

function AgentSessionRow({ title, description, isPlaceholder }: { title: string; description: string; isPlaceholder?: boolean }) {
  return (
    <Link
      href="/dashboard/agent"
      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-200/30 transition-colors"
    >
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        isPlaceholder ? 'bg-brand-500/10' : 'bg-surface-200/50'
      )}>
        <MessageSquare className={cn('w-3.5 h-3.5', isPlaceholder ? 'text-brand-500' : 'text-foreground-muted')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-[11px] text-foreground-muted truncate">{description}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-foreground-muted shrink-0" />
    </Link>
  )
}

function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-4 py-3">
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-surface-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 bg-surface-200 rounded" />
              <div className="h-2.5 w-32 bg-surface-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
