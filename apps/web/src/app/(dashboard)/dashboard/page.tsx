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
  ChevronRight,
  MessageSquare,
  Table2,
  HardDrive,
  Sparkles,
  ArrowRight,
  Globe,
  ExternalLink,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { workspaceDatabaseApi, type DatabaseStats } from '@/lib/api/workspace-database'
import { agentChatApi, type AgentSessionSummary } from '@/lib/api/agent-chat'
import { useWorkspace } from '@/hooks/useWorkspace'

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return isoDate
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { workspaceId, workspace } = useWorkspace()
  const [isLoading, setIsLoading] = useState(true)
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null)
  const [agentSessions, setAgentSessions] = useState<AgentSessionSummary[]>([])

  useEffect(() => {
    if (!workspaceId) return
    const loadDbStats = async () => {
      try {
        setIsLoading(true)
        const stats = await workspaceDatabaseApi.getStats(workspaceId)
        setDbStats(stats)
      } catch {
        // DB stats unavailable
      } finally {
        setIsLoading(false)
      }
    }
    loadDbStats()
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId) return
    const loadSessions = async () => {
      try {
        const res = await agentChatApi.listSessions(workspaceId)
        setAgentSessions(Array.isArray(res) ? res : [])
      } catch {
        // Agent sessions unavailable
      }
    }
    loadSessions()
  }, [workspaceId])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return 'Good evening'
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {getGreeting()}, {user?.display_name || user?.username || 'User'}
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Build and manage your applications with AI
          </p>
        </div>

        {/* Onboarding CTA — shown when workspace has no data yet */}
        {!isLoading &&
          (dbStats?.table_count ?? 0) === 0 &&
          workspace?.app_status !== 'published' && (
            <Link
              href="/dashboard/agent"
              className="block rounded-xl border-2 border-dashed border-brand-500/30 bg-brand-500/3 hover:border-brand-500/50 hover:bg-brand-500/6 transition-all p-6 group"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6 text-brand-500" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Tell AI what you want to build
                  </h2>
                  <p className="text-sm text-foreground-muted mt-1 max-w-md mx-auto">
                    Describe your app in natural language — e.g. &quot;a fleet management system
                    with vehicles, drivers, and trips&quot; — and the AI Agent will create the
                    database, generate the UI, and publish your app.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 group-hover:gap-2.5 transition-all mt-1">
                  Start Building <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          )}

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
            href="/dashboard/skills"
            icon={Sparkles}
            title="Skills"
            description="Manage AI capabilities"
            color="blue"
          />
          <QuickActionCard
            href="/dashboard/workspaces"
            icon={Globe}
            title="My Apps"
            description="View all your applications"
            color="amber"
          />
        </div>

        {/* App Status Overview — shown when workspace has tables or is published */}
        {!isLoading &&
          workspace &&
          ((dbStats?.table_count ?? 0) > 0 || workspace.app_status === 'published') && (
            <div className="rounded-lg border border-border bg-surface-100/50">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-foreground-muted" />
                  <span className="text-sm font-medium text-foreground">App Status</span>
                </div>
                <AppStatusBadge status={workspace.app_status} />
              </div>
              <div className="px-4 py-3 space-y-3">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <AppInfoItem label="Slug" value={`/${workspace.slug}`} />
                  <AppInfoItem
                    label="Version"
                    value={workspace.current_version?.version || 'v0.0.0'}
                  />
                  <AppInfoItem label="Tables" value={String(dbStats?.table_count ?? 0)} />
                  <AppInfoItem
                    label="Last Updated"
                    value={workspace.updated_at ? formatRelativeTime(workspace.updated_at) : '—'}
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {workspace.app_status === 'published' && workspace.slug && (
                    <Link
                      href={`/runtime/${workspace.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open App
                    </Link>
                  )}
                  <Link
                    href="/dashboard/agent"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit in AI Agent
                  </Link>
                  {workspace.app_status === 'draft' && (
                    <Link
                      href="/dashboard/agent"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors ml-auto"
                    >
                      <Bot className="w-3 h-3" />
                      Continue with AI Agent
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Two-column: Agent Sessions + DB Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Agent Sessions */}
          <div className="border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-brand-500" />
                <span className="text-sm font-medium text-foreground">Recent Agent Sessions</span>
              </div>
              <Link
                href="/dashboard/agent"
                className="text-[11px] text-foreground-muted hover:text-foreground flex items-center gap-0.5"
              >
                Open Agent <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              <AgentSessionRow
                title="Start a new conversation"
                description="Chat with AI Agent to create apps and manage databases"
                isPlaceholder
              />
              {agentSessions.slice(0, 3).map((session) => (
                <AgentSessionRow
                  key={session.id}
                  title={session.title || `Session ${session.id.slice(0, 8)}`}
                  description={`${session.message_count} messages · ${session.status}`}
                  sessionId={session.id}
                />
              ))}
            </div>
          </div>

          {/* Database Overview */}
          <div className="border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-foreground">Database Overview</span>
              </div>
              <Link
                href="/dashboard/database"
                className="text-[11px] text-foreground-muted hover:text-foreground flex items-center gap-0.5"
              >
                Manage <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {isLoading ? (
                <LoadingSkeleton count={3} />
              ) : (
                <>
                  <DBStatRow
                    icon={Table2}
                    label="Tables"
                    value={String(dbStats?.table_count ?? 0)}
                  />
                  <DBStatRow
                    icon={HardDrive}
                    label="Total Size"
                    value={dbStats ? formatBytes(dbStats.total_size_bytes) : '—'}
                  />
                  <DBStatRow
                    icon={Database}
                    label="Total Rows"
                    value={dbStats ? dbStats.total_rows.toLocaleString() : '—'}
                  />
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
      className={cn('block rounded-lg border p-4 transition-all group', colorStyles[color])}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center mb-3',
          iconBgStyles[color]
        )}
      >
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="text-[11px] text-foreground-muted mt-0.5">{description}</div>
    </Link>
  )
}

function DBStatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
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

function AgentSessionRow({
  title,
  description,
  isPlaceholder,
  sessionId,
}: {
  title: string
  description: string
  isPlaceholder?: boolean
  sessionId?: string
}) {
  return (
    <Link
      href={sessionId ? `/dashboard/agent?session=${sessionId}` : '/dashboard/agent'}
      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-200/30 transition-colors"
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          isPlaceholder ? 'bg-brand-500/10' : 'bg-surface-200/50'
        )}
      >
        <MessageSquare
          className={cn('w-3.5 h-3.5', isPlaceholder ? 'text-brand-500' : 'text-foreground-muted')}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-[11px] text-foreground-muted truncate">{description}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-foreground-muted shrink-0" />
    </Link>
  )
}

const appStatusStyles: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-foreground-muted', bg: 'bg-surface-200' },
  published: { label: 'Published', color: 'text-brand-500', bg: 'bg-brand-500/10' },
  deprecated: { label: 'Deprecated', color: 'text-warning', bg: 'bg-warning/10' },
  archived: { label: 'Archived', color: 'text-foreground-muted', bg: 'bg-surface-200' },
}

function AppStatusBadge({ status }: { status: string }) {
  const style = appStatusStyles[status] || appStatusStyles.draft
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded', style.bg, style.color)}>
      {style.label}
    </span>
  )
}

function AppInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <div className="text-[10px] text-foreground-muted">{label}</div>
      <div className="text-xs font-medium text-foreground mt-0.5 truncate">{value}</div>
    </div>
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
