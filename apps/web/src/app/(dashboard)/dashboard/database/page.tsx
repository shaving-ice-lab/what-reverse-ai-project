'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Database,
  Table2,
  Terminal,
  Plus,
  Network,
  HardDrive,
  Rows3,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, StatsCard } from '@/components/dashboard/page-layout'
import { workspaceDatabaseApi } from '@/lib/api/workspace-database'
import type { DatabaseTable, DatabaseStats, QueryHistoryItem } from '@/lib/api/workspace-database'
import { cn } from '@/lib/utils'
import Link from 'next/link'

function useActiveWorkspaceId(): string | null {
  const [id, setId] = useState<string | null>(null)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('activeWorkspaceId')
      if (stored) setId(stored)
    } catch {}
  }, [])
  return id
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export default function DatabaseOverviewPage() {
  const workspaceId = useActiveWorkspaceId()
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [history, setHistory] = useState<QueryHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [tablesData, statsData, historyData] = await Promise.all([
        workspaceDatabaseApi.listTables(workspaceId).catch(() => []),
        workspaceDatabaseApi.getStats(workspaceId).catch(() => null),
        workspaceDatabaseApi.getQueryHistory(workspaceId).catch(() => []),
      ])
      setTables(tablesData)
      setStats(statsData)
      setHistory(historyData.slice(0, 5))
    } catch (err: any) {
      setError(err?.message || 'Failed to load database info')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground-light text-sm">
        Please select a workspace first.
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Database"
        description="Manage your workspace database tables, run queries, and view schema."
        icon={<Database className="w-4 h-4" />}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={<Table2 className="w-4 h-4" />}
              title="Tables"
              value={stats?.table_count ?? 0}
            />
            <StatsCard
              icon={<Rows3 className="w-4 h-4" />}
              title="Total Rows"
              value={stats?.total_rows?.toLocaleString() ?? '0'}
            />
            <StatsCard
              icon={<HardDrive className="w-4 h-4" />}
              title="Database Size"
              value={formatBytes(stats?.total_size_bytes ?? 0)}
            />
            <StatsCard
              icon={<Database className="w-4 h-4" />}
              title="Connections"
              value={stats?.connection_count ?? 0}
            />
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-[12px] font-medium text-foreground-light uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <QuickActionCard
                href="/dashboard/database/tables"
                icon={<Table2 className="w-5 h-5" />}
                label="Table Editor"
                description="Browse and edit table data"
              />
              <QuickActionCard
                href="/dashboard/database/sql"
                icon={<Terminal className="w-5 h-5" />}
                label="SQL Editor"
                description="Run SQL queries"
              />
              <QuickActionCard
                href="/dashboard/database/tables?action=create"
                icon={<Plus className="w-5 h-5" />}
                label="Create Table"
                description="Define a new table"
              />
              <QuickActionCard
                href="/dashboard/database/schema-graph"
                icon={<Network className="w-5 h-5" />}
                label="Schema Graph"
                description="View ER diagram"
              />
            </div>
          </div>

          {/* Tables List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-medium text-foreground-light uppercase tracking-wider">
                Tables ({tables.length})
              </h3>
              <Link href="/dashboard/database/tables">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all
                </Button>
              </Link>
            </div>

            {tables.length === 0 ? (
              <div className="bg-surface-100 border border-border rounded-lg p-8 text-center">
                <Table2 className="w-8 h-8 text-foreground-muted mx-auto mb-3" />
                <p className="text-sm text-foreground-light mb-1">No tables yet</p>
                <p className="text-xs text-foreground-muted mb-4">
                  Create your first table to get started.
                </p>
                <Link href="/dashboard/database/tables?action=create">
                  <Button size="sm">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create Table
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-surface-100 border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-75/60">
                      <th className="text-left px-4 py-2.5 text-[12px] font-medium text-foreground-light">
                        Name
                      </th>
                      <th className="text-right px-4 py-2.5 text-[12px] font-medium text-foreground-light">
                        Rows
                      </th>
                      <th className="text-right px-4 py-2.5 text-[12px] font-medium text-foreground-light">
                        Size
                      </th>
                      <th className="text-right px-4 py-2.5 text-[12px] font-medium text-foreground-light">
                        Columns
                      </th>
                      <th className="text-right px-4 py-2.5 text-[12px] font-medium text-foreground-light">
                        Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((table) => (
                      <tr
                        key={table.name}
                        className="border-b border-border last:border-b-0 hover:bg-surface-200/50 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/dashboard/database/tables?table=${table.name}`}
                            className="text-foreground hover:text-brand-500 font-medium transition-colors"
                          >
                            {table.name}
                          </Link>
                        </td>
                        <td className="text-right px-4 py-2.5 text-foreground-light tabular-nums">
                          {table.row_count_est.toLocaleString()}
                        </td>
                        <td className="text-right px-4 py-2.5 text-foreground-light tabular-nums">
                          {formatBytes(table.data_size)}
                        </td>
                        <td className="text-right px-4 py-2.5 text-foreground-light tabular-nums">
                          {table.column_count}
                        </td>
                        <td className="text-right px-4 py-2.5 text-foreground-muted text-xs">
                          {formatTimeAgo(table.update_time ?? '')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Queries */}
          {history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[12px] font-medium text-foreground-light uppercase tracking-wider">
                  Recent Queries
                </h3>
                <Link href="/dashboard/database/sql">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Open SQL Editor
                  </Button>
                </Link>
              </div>

              <div className="bg-surface-100 border border-border rounded-lg divide-y divide-border">
                {history.map((item, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <code className="text-xs text-foreground font-mono truncate block">
                        {item.sql}
                      </code>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={cn(
                          'text-[11px] font-medium px-1.5 py-0.5 rounded',
                          item.status === 'success'
                            ? 'bg-brand-500/10 text-brand-500'
                            : 'bg-destructive/10 text-destructive'
                        )}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-foreground-muted tabular-nums flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.duration_ms}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function QuickActionCard({
  href,
  icon,
  label,
  description,
}: {
  href: string
  icon: React.ReactNode
  label: string
  description: string
}) {
  return (
    <Link href={href}>
      <div className="bg-surface-100 border border-border rounded-lg p-4 hover:bg-surface-200/50 hover:border-foreground-muted/20 transition-all cursor-pointer group">
        <div className="text-foreground-light group-hover:text-brand-500 transition-colors mb-2">
          {icon}
        </div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-foreground-muted mt-0.5">{description}</div>
      </div>
    </Link>
  )
}
