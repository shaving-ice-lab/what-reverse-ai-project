'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Eye,
  Database,
  Table2,
  RefreshCw,
  PanelRightClose,
  ExternalLink,
  Rows3,
  ChevronDown,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  LayoutDashboard,
  GitCompare,
  Loader2,
  History,
  RotateCcw,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { AppRenderer } from '@/components/app-renderer/app-renderer'
import type { AppSchema } from '@/components/app-renderer/types'
import {
  PageManagerPanel,
  type PagesConfig,
} from '@/components/workspace-editor/page-manager-panel'
import { VersionDiffViewer } from '@/components/workspace-editor/version-diff-viewer'
import { appApi, type App, type AppVersion, type AppVersionDiff } from '@/lib/api/workspace'
import { workspaceDatabaseApi, type DatabaseTable } from '@/lib/api/workspace-database'
import { cn } from '@/lib/utils'

export type WorkspacePanelTab = 'preview' | 'database' | 'pages' | 'versions'

export interface AgentWorkspacePanelProps {
  workspaceId: string
  workspaceSlug?: string
  app: App | null
  appSchema: AppSchema | null
  dbTables: DatabaseTable[]
  dbTablesLoading: boolean
  isOpen: boolean
  activeTab: WorkspacePanelTab
  onTabChange: (tab: WorkspacePanelTab) => void
  onClose: () => void
  onRefreshDb: () => void
  onRefreshSchema: () => void
  onSchemaEdited: (schema: AppSchema) => void
  onPagesDirtyChange: (dirty: boolean) => void
  onAppUpdated: (app: App) => void
}

export function AgentWorkspacePanel({
  workspaceId,
  workspaceSlug,
  app,
  appSchema,
  dbTables,
  dbTablesLoading,
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  onRefreshDb,
  onRefreshSchema,
  onSchemaEdited,
  onPagesDirtyChange,
  onAppUpdated,
}: AgentWorkspacePanelProps) {
  // Viewport
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // Pages Manager
  const [pagesConfig, setPagesConfig] = useState<PagesConfig>({
    pages: [],
    navigation: { type: 'sidebar' },
    default_page: '',
  })
  const [pagesConfigDirty, setPagesConfigDirty] = useState(false)
  const [pagesConfigSaving, setPagesConfigSaving] = useState(false)

  // Database preview
  const [expandedTable, setExpandedTable] = useState<string | null>(null)
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([])
  const [previewColumns, setPreviewColumns] = useState<string[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  const handleToggleTable = useCallback(
    async (tableName: string) => {
      if (expandedTable === tableName) {
        setExpandedTable(null)
        setPreviewRows([])
        setPreviewColumns([])
        return
      }
      setExpandedTable(tableName)
      setPreviewLoading(true)
      try {
        const result = await workspaceDatabaseApi.queryRows(workspaceId, tableName, {
          page: 1,
          page_size: 5,
        })
        setPreviewRows(result.rows || [])
        const cols =
          result.rows?.length > 0
            ? Object.keys(result.rows[0]).filter((k) => k !== 'deleted_at')
            : []
        setPreviewColumns(cols.slice(0, 6))
      } catch {
        setPreviewRows([])
        setPreviewColumns([])
      } finally {
        setPreviewLoading(false)
      }
    },
    [workspaceId, expandedTable]
  )

  // Versions
  const [versionList, setVersionList] = useState<AppVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [compareFrom, setCompareFrom] = useState('')
  const [compareTo, setCompareTo] = useState('')
  const [versionDiff, setVersionDiff] = useState<AppVersionDiff | null>(null)
  const [compareError, setCompareError] = useState<string | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [rollbackingId, setRollbackingId] = useState<string | null>(null)

  // Sync pagesConfig from app
  useEffect(() => {
    const configJson = app?.current_version?.config_json as Record<string, unknown> | null
    if (configJson && Array.isArray(configJson.pages)) {
      setPagesConfig({
        pages: configJson.pages as PagesConfig['pages'],
        navigation: (configJson.navigation as PagesConfig['navigation']) || { type: 'sidebar' },
        default_page:
          (configJson.default_page as string) || (configJson.pages as any[])[0]?.id || '',
      })
    }
    setPagesConfigDirty(false)
  }, [app?.current_version?.config_json])

  // Load versions
  const loadVersions = useCallback(async () => {
    if (!workspaceId) return
    try {
      setVersionsLoading(true)
      const response = await appApi.getVersions(workspaceId, { page: 1, page_size: 20 })
      const items = response.items || []
      setVersionList(items)
      if (items.length >= 2 && !compareFrom && !compareTo) {
        setCompareFrom(items[0].id)
        setCompareTo(items[1].id)
      }
    } catch {
      // ignore
    } finally {
      setVersionsLoading(false)
    }
  }, [workspaceId, compareFrom, compareTo])

  useEffect(() => {
    if (activeTab === 'versions') loadVersions()
  }, [activeTab, loadVersions])

  // Save pages config
  const handleSavePagesConfig = async () => {
    if (!workspaceId || !pagesConfigDirty || pagesConfigSaving) return
    setPagesConfigSaving(true)
    try {
      const configPayload: Record<string, unknown> = {
        ...((app?.current_version?.config_json as Record<string, unknown>) || {}),
        pages: pagesConfig.pages,
        navigation: pagesConfig.navigation,
        default_page: pagesConfig.default_page,
      }
      const updatedVersion = await appApi.updateConfigJSON(workspaceId, {
        config_json: configPayload,
      })
      if (app) {
        onAppUpdated({
          ...app,
          current_version_id: updatedVersion.id,
          current_version: updatedVersion,
        })
      }
      setPagesConfigDirty(false)
      onPagesDirtyChange(false)
      loadVersions()
    } catch (error) {
      console.error('Failed to save pages config:', error)
    } finally {
      setPagesConfigSaving(false)
    }
  }

  // Rollback
  const handleRollback = async (versionId: string) => {
    if (!workspaceId || rollbackingId) return
    const confirmed =
      typeof window !== 'undefined' &&
      window.confirm('Rollback to this version? Current changes will be overwritten.')
    if (!confirmed) return
    try {
      setRollbackingId(versionId)
      await appApi.rollback(workspaceId, versionId)
      onRefreshSchema()
      loadVersions()
    } catch {
      // ignore
    } finally {
      setRollbackingId(null)
    }
  }

  // Compare versions
  const handleCompareVersions = async () => {
    if (!compareFrom || !compareTo) {
      setCompareError('Please select versions to compare.')
      return
    }
    if (compareFrom === compareTo) {
      setCompareError('Please select different versions.')
      return
    }
    try {
      setCompareLoading(true)
      setCompareError(null)
      const diff = await appApi.compareVersions(workspaceId, compareFrom, compareTo)
      setVersionDiff(diff)
    } catch {
      setCompareError('Comparison failed.')
    } finally {
      setCompareLoading(false)
    }
  }

  if (!isOpen) return null

  const tabs: { id: WorkspacePanelTab; label: string; icon: React.ElementType }[] = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'pages', label: 'Pages', icon: LayoutDashboard },
    { id: 'versions', label: 'Versions', icon: History },
  ]

  return (
    <div className="w-[480px] shrink-0 border-l border-border flex flex-col bg-background-studio">
      {/* Panel Header — Tabs */}
      <div className="h-10 shrink-0 border-b border-border px-1 flex items-center gap-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex-1 h-7 rounded-md flex items-center justify-center gap-1 text-[10px] font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-surface-100 text-foreground'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
        <div className="w-px h-4 bg-border mx-0.5" />
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 shrink-0"
          onClick={onClose}
          title="Close panel"
        >
          <PanelRightClose className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* ===== Preview Tab ===== */}
        {activeTab === 'preview' && (
          <>
            <div className="px-2 py-1.5 border-b border-border flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {(
                  [
                    { id: 'desktop' as const, icon: Monitor },
                    { id: 'tablet' as const, icon: Tablet },
                    { id: 'mobile' as const, icon: Smartphone },
                  ] as const
                ).map((vp) => (
                  <button
                    key={vp.id}
                    onClick={() => setPreviewViewport(vp.id)}
                    className={cn(
                      'w-7 h-7 rounded flex items-center justify-center transition-colors',
                      previewViewport === vp.id
                        ? 'bg-surface-100 text-foreground'
                        : 'text-foreground-muted hover:text-foreground'
                    )}
                    title={vp.id}
                  >
                    <vp.icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={onRefreshSchema}
                  title="Refresh preview"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
                {workspaceSlug && (
                  <Link
                    href={`/runtime/${workspaceSlug}`}
                    className="flex items-center gap-1 text-[10px] text-brand-500 hover:text-brand-400"
                    title="Open full app"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    Full App
                  </Link>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-surface-200/20 p-2">
              <div
                className="bg-background border border-border rounded-lg overflow-hidden h-full transition-all"
                style={{
                  width:
                    previewViewport === 'desktop'
                      ? '100%'
                      : previewViewport === 'tablet'
                        ? '768px'
                        : '375px',
                  maxWidth: '100%',
                }}
              >
                {appSchema ? (
                  <AppRenderer schema={appSchema} workspaceId={workspaceId} className="h-full" />
                ) : (
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-200/50 flex items-center justify-center mx-auto">
                        <Eye className="w-5 h-5 text-foreground-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">No App UI Yet</p>
                        <p className="text-xs text-foreground-muted mt-1 max-w-[240px] mx-auto">
                          Tell the AI Agent what to build. Once a UI schema is generated, your app
                          will appear here in real-time.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ===== Database Tab ===== */}
        {activeTab === 'database' && (
          <div className="flex-1 overflow-auto">
            {dbTablesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
              </div>
            ) : dbTables.length === 0 ? (
              <div className="flex items-center justify-center p-8 h-full">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-200/50 flex items-center justify-center mx-auto">
                    <Database className="w-5 h-5 text-foreground-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No Tables Yet</p>
                    <p className="text-xs text-foreground-muted mt-1 max-w-[240px] mx-auto">
                      Ask the AI Agent to create database tables. They will appear here as they are
                      created.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* Stats bar */}
                <div className="px-3 py-2.5 bg-surface-75/30 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-foreground-light">
                    <Table2 className="w-3 h-3 text-foreground-muted" />
                    <span className="font-medium">{dbTables.length}</span>
                    <span className="text-foreground-muted">tables</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-foreground-light">
                    <Rows3 className="w-3 h-3 text-foreground-muted" />
                    <span className="font-medium">
                      {dbTables.reduce((sum, t) => sum + t.row_count_est, 0).toLocaleString()}
                    </span>
                    <span className="text-foreground-muted">rows</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={onRefreshDb}
                      title="Refresh tables"
                    >
                      <RefreshCw className={cn('w-3 h-3', dbTablesLoading && 'animate-spin')} />
                    </Button>
                    <Link
                      href="/dashboard/database/tables"
                      className="text-[10px] text-brand-500 hover:text-brand-400 flex items-center gap-0.5"
                    >
                      Full Editor
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>

                {/* Table list with inline preview */}
                {dbTables.map((table) => {
                  const isExpanded = expandedTable === table.name
                  return (
                    <div key={table.name}>
                      <button
                        onClick={() => handleToggleTable(table.name)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-200/30 transition-colors group text-left"
                      >
                        <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Table2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">
                            {table.name}
                          </div>
                          <div className="text-[10px] text-foreground-muted">
                            {table.column_count} columns · {table.row_count_est.toLocaleString()}{' '}
                            rows
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-foreground-muted shrink-0" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-foreground-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="border-t border-border bg-surface-75/40">
                          {previewLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
                            </div>
                          ) : previewRows.length === 0 ? (
                            <div className="px-3 py-3 text-[11px] text-foreground-muted text-center">
                              No rows yet
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-[10px]">
                                <thead>
                                  <tr className="border-b border-border">
                                    {previewColumns.map((col) => (
                                      <th
                                        key={col}
                                        className="px-2 py-1.5 text-left font-medium text-foreground-muted whitespace-nowrap"
                                      >
                                        {col}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {previewRows.map((row, rowIdx) => (
                                    <tr
                                      key={rowIdx}
                                      className="border-b border-border/50 hover:bg-surface-100/30"
                                    >
                                      {previewColumns.map((col) => (
                                        <td
                                          key={col}
                                          className="px-2 py-1 text-foreground-light whitespace-nowrap max-w-[120px] truncate"
                                        >
                                          {row[col] === null ? (
                                            <span className="text-foreground-muted italic">
                                              null
                                            </span>
                                          ) : typeof row[col] === 'boolean' ? (
                                            String(row[col])
                                          ) : typeof row[col] === 'object' ? (
                                            JSON.stringify(row[col]).slice(0, 30)
                                          ) : (
                                            String(row[col]).slice(0, 50)
                                          )}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          <div className="px-3 py-1.5 border-t border-border flex items-center justify-end">
                            <Link
                              href={`/dashboard/database/tables?table=${table.name}`}
                              className="text-[10px] text-brand-500 hover:text-brand-400 flex items-center gap-0.5"
                            >
                              Open in Full Editor
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== Pages Tab ===== */}
        {activeTab === 'pages' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {pagesConfigDirty && (
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-200/30">
                <span className="text-[11px] text-foreground-muted">Unsaved page changes</span>
                <Button
                  size="sm"
                  onClick={handleSavePagesConfig}
                  disabled={pagesConfigSaving}
                  className="h-6 text-xs"
                >
                  {pagesConfigSaving ? 'Saving...' : 'Save Pages'}
                </Button>
              </div>
            )}
            <PageManagerPanel
              config={pagesConfig}
              onChange={(newConfig) => {
                setPagesConfig(newConfig)
                setPagesConfigDirty(true)
                onPagesDirtyChange(true)
              }}
            />
          </div>
        )}

        {/* ===== Versions Tab ===== */}
        {activeTab === 'versions' && (
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-border bg-surface-75/30 flex items-center justify-between">
              <div className="text-[11px] text-foreground-light font-medium">
                {versionList.length} version{versionList.length !== 1 ? 's' : ''}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={loadVersions}
                disabled={versionsLoading}
                title="Refresh versions"
              >
                <RefreshCw className={cn('w-3 h-3', versionsLoading && 'animate-spin')} />
              </Button>
            </div>

            {versionsLoading && versionList.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
              </div>
            ) : versionList.length === 0 ? (
              <div className="flex items-center justify-center p-8 h-64">
                <div className="text-center space-y-3">
                  <History className="w-6 h-6 text-foreground-muted mx-auto" />
                  <p className="text-sm font-medium text-foreground">No Versions Yet</p>
                  <p className="text-xs text-foreground-muted max-w-[200px] mx-auto">
                    Versions are created when you publish or save changes.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {versionList.map((version, idx) => {
                  const isCurrent = version.id === app?.current_version_id
                  const isRollingBack = rollbackingId === version.id
                  return (
                    <div
                      key={version.id}
                      className={cn(
                        'px-3 py-3 transition-colors',
                        isCurrent ? 'bg-brand-500/5' : 'hover:bg-surface-200/30'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium text-foreground">
                              {version.version}
                            </span>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-brand-500/10 text-brand-500">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-foreground-muted">
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {version.created_at
                                ? new Date(version.created_at).toLocaleString()
                                : '-'}
                            </span>
                          </div>
                        </div>
                        {!isCurrent && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] text-foreground-muted hover:text-foreground shrink-0"
                            onClick={() => handleRollback(version.id)}
                            disabled={isRollingBack}
                          >
                            {isRollingBack ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Rollback
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Version Comparison */}
            {versionList.length >= 2 && (
              <div className="border-t border-border p-3 space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-medium text-foreground">
                  <GitCompare className="w-3.5 h-3.5 text-foreground-muted" />
                  Compare Versions
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={compareFrom} onValueChange={setCompareFrom}>
                    <SelectTrigger className="h-7 text-[11px]">
                      <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent>
                      {versionList.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={compareTo} onValueChange={setCompareTo}>
                    <SelectTrigger className="h-7 text-[11px]">
                      <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent>
                      {versionList.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleCompareVersions}
                    disabled={compareLoading}
                  >
                    {compareLoading ? 'Comparing...' : 'Compare'}
                  </Button>
                  {compareError && (
                    <span className="text-[10px] text-destructive">{compareError}</span>
                  )}
                </div>
                {versionDiff && (
                  <div className="mt-2">
                    <VersionDiffViewer diff={versionDiff} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
