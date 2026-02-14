'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Table2,
  Plus,
  Rows3,
  HardDrive,
  Database,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { workspaceDatabaseApi } from '@/lib/api/workspace-database'
import type { DatabaseTable, DatabaseStats, QueryHistoryItem } from '@/lib/api/workspace-database'
import { cn, formatBytes } from '@/lib/utils'
import Link from 'next/link'
import { useWorkspace } from '@/hooks/useWorkspace'

export default function DatabaseOverviewPage() {
  const { workspaceId } = useWorkspace()
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
      <div className="flex items-center justify-center h-64 text-foreground-muted text-sm">
        Please select a workspace first.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-[12px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats row — Supabase style metric cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={Table2} label="Tables" value={String(stats?.table_count ?? 0)} />
        <StatCard icon={Rows3} label="Total Rows" value={(stats?.total_rows ?? 0).toLocaleString()} />
        <StatCard icon={HardDrive} label="Size" value={formatBytes((stats?.file_size_kb ?? 0) * 1024)} />
        <StatCard icon={Database} label="Indexes" value={String(stats?.index_count ?? 0)} />
      </div>

      {/* Tables */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-medium text-foreground">Tables</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadData} disabled={loading} className="h-7 text-[11px] px-2 text-foreground-lighter hover:text-foreground">
              <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
            </Button>
            <Link href="/dashboard/database/tables">
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 border-border text-foreground-light">
                View all
              </Button>
            </Link>
          </div>
        </div>

        {tables.length === 0 ? (
          <div className="rounded-md border border-border bg-surface-75 py-16 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-200 flex items-center justify-center">
              <Table2 className="w-5 h-5 text-foreground-lighter" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-foreground">No tables yet</p>
              <p className="text-[11px] text-foreground-lighter mt-0.5">Create your first table to get started.</p>
            </div>
            <Link href="/dashboard/database/tables?action=create">
              <Button size="sm" className="h-8 text-[12px] mt-1 gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New Table
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden bg-surface-75">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 text-[11px] font-medium text-foreground-lighter uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-medium text-foreground-lighter uppercase tracking-wider">
                    Rows
                  </th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-medium text-foreground-lighter uppercase tracking-wider">
                    Columns
                  </th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table) => (
                  <tr
                    key={table.name}
                    className="border-b border-border/50 last:border-b-0 hover:bg-surface-100 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/dashboard/database/tables?table=${table.name}`}
                        className="text-[13px] text-brand-500 hover:text-brand-600 font-medium transition-colors"
                      >
                        {table.name}
                      </Link>
                    </td>
                    <td className="text-right px-4 py-2.5 text-[12px] text-foreground-light tabular-nums">
                      {table.row_count_est.toLocaleString()}
                    </td>
                    <td className="text-right px-4 py-2.5 text-[12px] text-foreground-light tabular-nums">
                      {table.column_count}
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
            <h2 className="text-[13px] font-medium text-foreground">Recent Queries</h2>
            <Link href="/dashboard/database/sql" className="text-[11px] text-brand-500 hover:text-brand-400 transition-colors">
              Open SQL Editor →
            </Link>
          </div>

          <div className="rounded-md border border-border bg-surface-75 divide-y divide-border/50 overflow-hidden">
            {history.map((item, idx) => (
              <div key={idx} className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <code className="text-[11px] text-foreground-light font-mono truncate block">
                    {item.sql}
                  </code>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0',
                    item.status === 'success'
                      ? 'bg-brand-500/15 text-brand-500'
                      : 'bg-destructive/15 text-destructive'
                  )}
                >
                  {item.status}
                </span>
                <span className="text-[10px] text-foreground-lighter tabular-nums flex items-center gap-0.5 shrink-0">
                  <Clock className="w-2.5 h-2.5" />
                  {item.duration_ms}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-75 px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-foreground-lighter" />
        <span className="text-[11px] text-foreground-lighter font-medium">{label}</span>
      </div>
      <div className="text-[18px] font-semibold text-foreground tabular-nums">{value}</div>
    </div>
  )
}
