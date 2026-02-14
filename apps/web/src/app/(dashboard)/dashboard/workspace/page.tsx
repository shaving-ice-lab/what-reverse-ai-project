'use client'

/**
 * Workspace Page — Primary workspace view
 * Layout: Toolbar + Main Tabs (Preview/Database/Pages/Versions) + Collapsible Chat Sidebar
 * Users interact with tabs as the primary content; AI Chat is a secondary right sidebar.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Bot,
  Plus,
  MessageSquare,
  Trash2,
  Loader2,
  Clock,
  Sparkles,
  Database,
  Eye,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Lock,
  ExternalLink,
  Table2,
  RefreshCw,
  Rows3,
  ChevronDown,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  LayoutDashboard,
  GitCompare,
  History,
  RotateCcw,
  PanelRightClose,
  PanelRight,
  MessageCircle,
  FileCode2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AgentChatPanel, type AgentCompletionInfo } from '@/components/agent/agent-chat-panel'
import { AppRenderer } from '@/components/app-renderer/app-renderer'
import { RuntimeDataProvider } from '@/components/app-renderer/runtime-data-provider'
import { AppAuthProvider, useAppAuth } from '@/components/app-renderer/app-auth-provider'
import {
  PageManagerPanel,
  type PagesConfig,
} from '@/components/workspace-editor/page-manager-panel'
import { VersionDiffViewer } from '@/components/workspace-editor/version-diff-viewer'
import { WorkspaceFilesPanel } from '@/components/workspace-editor/workspace-files-panel'
import type { AppSchema } from '@/components/app-renderer/types'
import type { AgentEvent } from '@/lib/api/agent-chat'
import { agentChatApi, type AgentSessionSummary } from '@/lib/api/agent-chat'
import {
  appApi,
  type App,
  type AppAccessPolicy,
  type AppVersion,
  type AppVersionDiff,
} from '@/lib/api/workspace'
import { workspaceDatabaseApi, type DatabaseTable } from '@/lib/api/workspace-database'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useWorkspace } from '@/hooks/useWorkspace'

type WorkspaceTab = 'preview' | 'files' | 'database' | 'pages' | 'versions'

export default function WorkspacePage() {
  const { workspaceId, workspace } = useWorkspace()
  const searchParams = useSearchParams()

  // ========== Tab State ==========
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('preview')

  // ========== Chat Sidebar State ==========
  const [chatOpen, setChatOpen] = useState(true)
  const [sessions, setSessions] = useState<AgentSessionSummary[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showSessionList, setShowSessionList] = useState(false)

  // ========== Data State ==========
  const [dbTables, setDbTables] = useState<DatabaseTable[]>([])
  const [dbTablesLoading, setDbTablesLoading] = useState(false)
  const [appSchema, setAppSchema] = useState<AppSchema | null>(null)
  const [schemaRevision, setSchemaRevision] = useState(0)
  const [dbRevision, setDbRevision] = useState(0)

  // ========== App State ==========
  const [app, setApp] = useState<App | null>(null)
  const [appLoading, setAppLoading] = useState(false)
  const [hasPageChanges, setHasPageChanges] = useState(false)

  // ========== Publish State ==========
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishWarning, setPublishWarning] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [accessPolicy, setAccessPolicy] = useState<AppAccessPolicy | null>(null)
  const [accessPolicyLoading, setAccessPolicyLoading] = useState(false)

  // ========== Preview State ==========
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // ========== Pages State ==========
  const [pagesConfig, setPagesConfig] = useState<PagesConfig>({
    pages: [],
    navigation: { type: 'sidebar' },
    default_page: '',
  })
  const [pagesConfigDirty, setPagesConfigDirty] = useState(false)
  const [pagesConfigSaving, setPagesConfigSaving] = useState(false)

  // ========== Database Preview State ==========
  const [expandedTable, setExpandedTable] = useState<string | null>(null)
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([])
  const [previewColumns, setPreviewColumns] = useState<string[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  // ========== Versions State ==========
  const [versionList, setVersionList] = useState<AppVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [compareFrom, setCompareFrom] = useState('')
  const [compareTo, setCompareTo] = useState('')
  const [versionDiff, setVersionDiff] = useState<AppVersionDiff | null>(null)
  const [compareError, setCompareError] = useState<string | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [rollbackingId, setRollbackingId] = useState<string | null>(null)

  const hasChanges = hasPageChanges

  // ========== URL Query Params ==========
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null)
  useEffect(() => {
    const sessionFromUrl = searchParams.get('session')
    if (sessionFromUrl) {
      setActiveSessionId(sessionFromUrl)
      setChatOpen(true)
    }
    const promptFromUrl = searchParams.get('prompt')
    if (promptFromUrl) {
      setInitialPrompt(promptFromUrl)
      setChatOpen(true)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('prompt')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [searchParams])

  // ========== Data Loading ==========

  const loadSessions = useCallback(async () => {
    if (!workspaceId) return
    setSessionsLoading(true)
    try {
      const data = await agentChatApi.listSessions(workspaceId)
      setSessions(Array.isArray(data) ? data : [])
    } catch {
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const loadDbTables = useCallback(async () => {
    if (!workspaceId) return
    setDbTablesLoading(true)
    try {
      const tables = await workspaceDatabaseApi.listTables(workspaceId)
      setDbTables(tables)
    } catch {
      setDbTables([])
    } finally {
      setDbTablesLoading(false)
    }
  }, [workspaceId])

  const loadAppData = useCallback(async () => {
    if (!workspaceId) return
    setAppLoading(true)
    try {
      const appData = await appApi.get(workspaceId)
      setApp(appData)
      const rawSchema = appData?.current_version?.ui_schema as Record<string, unknown> | null
      if (
        rawSchema &&
        rawSchema.app_schema_version === '2.0.0' &&
        Array.isArray(rawSchema.pages) &&
        (rawSchema.pages as unknown[]).length > 0
      ) {
        setAppSchema(rawSchema as unknown as AppSchema)
      } else {
        setAppSchema(null)
      }
    } catch {
      setApp(null)
      setAppSchema(null)
    } finally {
      setAppLoading(false)
    }
  }, [workspaceId])

  const loadAccessPolicy = useCallback(async () => {
    if (!workspaceId) return
    try {
      setAccessPolicyLoading(true)
      const policy = await appApi.getAccessPolicy(workspaceId)
      setAccessPolicy(policy)
    } catch {
      setAccessPolicy(null)
    } finally {
      setAccessPolicyLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadDbTables()
    loadAppData()
    loadAccessPolicy()
  }, [loadDbTables, loadAppData, loadAccessPolicy])

  useEffect(() => {
    if (dbRevision > 0) loadDbTables()
  }, [dbRevision, loadDbTables])

  useEffect(() => {
    if (schemaRevision > 0) loadAppData()
  }, [schemaRevision, loadAppData])

  // Sync pagesConfig from app (use version ID as stable dependency instead of object ref)
  const configVersionId = app?.current_version?.id
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configVersionId])

  // ========== Database Table Toggle ==========
  const handleToggleTable = useCallback(
    async (tableName: string) => {
      if (expandedTable === tableName) {
        setExpandedTable(null)
        setPreviewRows([])
        setPreviewColumns([])
        return
      }
      if (!workspaceId) return
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
        setPreviewColumns(cols.slice(0, 8))
      } catch {
        setPreviewRows([])
        setPreviewColumns([])
      } finally {
        setPreviewLoading(false)
      }
    },
    [workspaceId, expandedTable]
  )

  // ========== Versions Loading ==========
  const compareFromRef = useRef(compareFrom)
  compareFromRef.current = compareFrom
  const compareToRef = useRef(compareTo)
  compareToRef.current = compareTo

  const loadVersions = useCallback(async () => {
    if (!workspaceId) return
    try {
      setVersionsLoading(true)
      const response = await appApi.getVersions(workspaceId, { page: 1, page_size: 20 })
      const items = response.items || []
      setVersionList(items)
      if (items.length >= 2 && !compareFromRef.current && !compareToRef.current) {
        setCompareFrom(items[0].id)
        setCompareTo(items[1].id)
      }
    } catch {
      // ignore
    } finally {
      setVersionsLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    if (activeTab === 'versions') loadVersions()
  }, [activeTab, loadVersions])

  // ========== Pages Save ==========
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
        setApp({
          ...app,
          current_version_id: updatedVersion.id,
          current_version: updatedVersion,
        })
      }
      setPagesConfigDirty(false)
      setHasPageChanges(false)
      loadVersions()
    } catch (error) {
      console.error('Failed to save pages config:', error)
    } finally {
      setPagesConfigSaving(false)
    }
  }

  // ========== Rollback ==========
  const handleRollback = async (versionId: string) => {
    if (!workspaceId || rollbackingId) return
    const confirmed =
      typeof window !== 'undefined' &&
      window.confirm('Rollback to this version? Current changes will be overwritten.')
    if (!confirmed) return
    try {
      setRollbackingId(versionId)
      await appApi.rollback(workspaceId, versionId)
      setSchemaRevision((r) => r + 1)
      loadVersions()
    } catch {
      // ignore
    } finally {
      setRollbackingId(null)
    }
  }

  // ========== Compare Versions ==========
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
      if (!workspaceId) return
      const diff = await appApi.compareVersions(workspaceId, compareFrom, compareTo)
      setVersionDiff(diff)
    } catch {
      setCompareError('Comparison failed.')
    } finally {
      setCompareLoading(false)
    }
  }

  // ========== Session Handlers ==========
  const handleNewSession = () => {
    setActiveSessionId(null)
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!workspaceId) return
    try {
      await agentChatApi.deleteSession(workspaceId, sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
      }
    } catch {
      // ignore
    }
  }

  // ========== Agent Event Handling ==========
  const handleAgentEvent = useCallback(
    (event: AgentEvent) => {
      if (event.type === 'tool_result') {
        if (event.affected_resource === 'database') {
          setDbRevision((r) => r + 1)
          setActiveTab('database')
        } else if (event.affected_resource === 'ui_schema') {
          setSchemaRevision((r) => r + 1)
          setActiveTab('preview')
        }
      }
      if (event.type === 'done') {
        setDbRevision((r) => r + 1)
        setSchemaRevision((r) => r + 1)
      }
    },
    []
  )

  // ========== Publish ==========
  const accessModeKey = (accessPolicy?.access_mode || 'private') as string
  const isPublicAccess = accessModeKey === 'public_auth' || accessModeKey === 'public_anonymous'
  const accessModeLabels: Record<string, string> = {
    private: 'Private Access',
    public_auth: 'Public (Sign-in Required)',
    public_anonymous: 'Public (Anonymous)',
  }

  const publishChecklist = [
    {
      key: 'saved',
      title: 'No Unsaved Changes',
      passed: !hasChanges,
      required: true,
      detail: hasChanges ? 'You have unsaved changes in blocks or pages.' : '',
    },
    {
      key: 'ui_schema',
      title: 'UI Schema Configured',
      passed: Boolean(app?.current_version?.ui_schema),
      required: false,
      detail: app?.current_version?.ui_schema
        ? ''
        : 'No UI schema yet. Use AI Agent to generate one.',
    },
    {
      key: 'access_policy',
      title: 'Access Policy Confirmed',
      passed: Boolean(accessPolicy?.access_mode),
      required: false,
      detail: accessPolicyLoading
        ? 'Loading...'
        : `Current: ${accessModeLabels[accessModeKey] || 'Private Access'}`,
    },
  ]
  const publishReady = publishChecklist.filter((i) => i.required).every((i) => i.passed)

  const handlePublish = async () => {
    setPublishWarning(null)
    setPublishDialogOpen(true)
  }

  const handleConfirmPublish = async () => {
    if (!publishReady || !workspaceId) {
      setPublishWarning('Please complete all required checks before publishing.')
      return
    }
    try {
      setIsPublishing(true)
      setPublishWarning(null)
      await appApi.publish(workspaceId)
      await loadAppData()
      setPublishDialogOpen(false)
    } catch {
      setPublishWarning('Failed to publish. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  // ========== Tab Definitions ==========
  const tabs: { id: WorkspaceTab; label: string; icon: React.ElementType }[] = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'files', label: 'Files', icon: FileCode2 },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'pages', label: 'Pages', icon: LayoutDashboard },
    { id: 'versions', label: 'Versions', icon: History },
  ]

  // No workspace selected
  if (!workspaceId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mx-auto">
            <Bot className="w-6 h-6 text-brand-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">No Workspace Selected</h2>
            <p className="text-sm text-foreground-muted mt-1">
              Select a workspace from the top navigation to get started.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* ===== Unified Toolbar ===== */}
      <header className="h-10 shrink-0 border-b border-border flex items-center px-3 gap-1">
        {/* Tabs (left) */}
        <nav className="flex items-center gap-0.5 mr-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[12px] font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-surface-200 text-foreground'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-100/60'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Preview viewport controls (only when preview tab) */}
        {activeTab === 'preview' && (
          <div className="flex items-center gap-0.5 border-l border-border pl-2 mr-1">
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
                  'w-6 h-6 rounded flex items-center justify-center transition-colors',
                  previewViewport === vp.id
                    ? 'bg-surface-200 text-foreground'
                    : 'text-foreground-muted hover:text-foreground'
                )}
                title={vp.id}
              >
                <vp.icon className="w-3 h-3" />
              </button>
            ))}
            <button
              className="w-6 h-6 rounded flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
              onClick={() => setSchemaRevision((r) => r + 1)}
              title="Refresh preview"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex-1" />

        {/* Right: status + actions */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-foreground-muted hidden sm:inline">
            {app?.current_version?.version || 'v0.0.0'}
          </span>
          {hasChanges && (
            <Badge variant="secondary" className="text-[10px] bg-warning-200 text-warning">
              Unsaved
            </Badge>
          )}

          <div className="h-4 w-px bg-border" />

          {workspace?.slug && (
            <Link
              href={`/runtime/${workspace.slug}`}
              className="flex items-center gap-1 text-[10px] text-brand-500 hover:text-brand-400 transition-colors"
              target="_blank"
            >
              <ExternalLink className="w-3 h-3" />
              Open
            </Link>
          )}

          <Button variant="outline" size="sm" onClick={handlePublish} className="h-7 gap-1 text-[11px] px-2.5">
            <Rocket className="w-3 h-3" />
            Publish
          </Button>

          <div className="h-4 w-px bg-border" />

          <Button
            variant={chatOpen ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 gap-1 text-[11px] px-2"
            onClick={() => setChatOpen(!chatOpen)}
          >
            {chatOpen ? (
              <PanelRightClose className="w-3.5 h-3.5" />
            ) : (
              <PanelRight className="w-3.5 h-3.5" />
            )}
            Chat
          </Button>
        </div>
      </header>

      {/* ===== Publish Checklist Dialog ===== */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pre-Publish Checklist</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm all required items before publishing.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 text-sm">
            {publishChecklist.map((item) => (
              <div
                key={item.key}
                className={cn(
                  'flex items-start gap-2 rounded-md border px-3 py-2',
                  item.passed
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-amber-500/30 bg-amber-500/5'
                )}
              >
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-foreground">{item.title}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px]',
                        item.required
                          ? 'bg-surface-200 text-foreground-muted'
                          : 'bg-surface-100 text-foreground-light'
                      )}
                    >
                      {item.required ? 'Required' : 'Recommended'}
                    </Badge>
                  </div>
                  {item.detail && !item.passed && (
                    <p className="text-[11px] text-foreground-muted mt-1">{item.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md border border-border bg-surface-100/80 p-3">
            <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
              {isPublicAccess ? (
                <Globe className="w-4 h-4 text-foreground-muted" />
              ) : (
                <Lock className="w-4 h-4 text-foreground-muted" />
              )}
              {accessModeLabels[accessModeKey] || 'Private Access'}
            </div>
          </div>

          {publishWarning && (
            <div className="mt-3 text-[12px] text-amber-500">{publishWarning}</div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPublish}
              disabled={!publishReady || isPublishing}
              className={cn(!publishReady && 'opacity-60')}
            >
              {isPublishing ? 'Publishing...' : 'Confirm Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* ===== Primary: Tabs Content ===== */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* ===== Preview Tab ===== */}
            {activeTab === 'preview' && (
              <div
                className={cn(
                  'flex-1 overflow-hidden flex justify-center',
                  previewViewport !== 'desktop' && 'bg-surface-200/20 p-4'
                )}
              >
                <div
                  className={cn(
                    'overflow-hidden transition-all h-full',
                    previewViewport !== 'desktop' && 'bg-background border border-border rounded-lg'
                  )}
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
                    {appLoading ? (
                      <div className="h-full flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
                      </div>
                    ) : appSchema && workspace?.slug ? (
                      <AppAuthProvider workspaceSlug={workspace.slug}>
                        <PreviewAppWithAuth
                          workspaceSlug={workspace.slug}
                          appSchema={appSchema}
                        />
                      </AppAuthProvider>
                    ) : appSchema ? (
                      <AppRenderer
                        schema={appSchema}
                        workspaceId={workspaceId}
                        className="h-full"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center p-8">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 rounded-xl bg-surface-200/50 flex items-center justify-center mx-auto">
                            <Eye className="w-5 h-5 text-foreground-muted" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">No App UI Yet</p>
                            <p className="text-xs text-foreground-muted mt-1 max-w-[240px] mx-auto">
                              Use the AI Chat to describe what you want to build. Once a UI schema
                              is generated, your app will appear here in real-time.
                            </p>
                          </div>
                          {!chatOpen && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => setChatOpen(true)}
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                              Open AI Chat
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* ===== Files Tab ===== */}
            {activeTab === 'files' && workspaceId && (
              <WorkspaceFilesPanel
                workspaceId={workspaceId}
                appSchema={appSchema}
              />
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
                          Ask the AI Agent to create database tables. They will appear here as they
                          are created.
                        </p>
                      </div>
                      {!chatOpen && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setChatOpen(true)}
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                          Open AI Chat
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {/* Stats bar */}
                    <div className="px-4 py-2.5 bg-surface-75/30 flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-foreground-light">
                        <Table2 className="w-3 h-3 text-foreground-muted" />
                        <span className="font-medium">{dbTables.length}</span>
                        <span className="text-foreground-muted">tables</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-foreground-light">
                        <Rows3 className="w-3 h-3 text-foreground-muted" />
                        <span className="font-medium">
                          {dbTables
                            .reduce((sum, t) => sum + t.row_count_est, 0)
                            .toLocaleString()}
                        </span>
                        <span className="text-foreground-muted">rows</span>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => setDbRevision((r) => r + 1)}
                          title="Refresh tables"
                        >
                          <RefreshCw
                            className={cn('w-3 h-3', dbTablesLoading && 'animate-spin')}
                          />
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
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-200/30 transition-colors group text-left"
                          >
                            <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <Table2 className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {table.name}
                              </div>
                              <div className="text-[11px] text-foreground-muted">
                                {table.column_count} columns ·{' '}
                                {table.row_count_est.toLocaleString()} rows
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-foreground-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="border-t border-border bg-surface-75/40">
                              {previewLoading ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
                                </div>
                              ) : previewRows.length === 0 ? (
                                <div className="px-4 py-3 text-[11px] text-foreground-muted text-center">
                                  No rows yet
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-[11px]">
                                    <thead>
                                      <tr className="border-b border-border">
                                        {previewColumns.map((col) => (
                                          <th
                                            key={col}
                                            className="px-3 py-1.5 text-left font-medium text-foreground-muted whitespace-nowrap"
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
                                              className="px-3 py-1.5 text-foreground-light whitespace-nowrap max-w-[150px] truncate"
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
                              <div className="px-4 py-1.5 border-t border-border flex items-center justify-end">
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
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-200/30">
                    <span className="text-[11px] text-foreground-muted">
                      Unsaved page changes
                    </span>
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
                    setHasPageChanges(true)
                  }}
                />
              </div>
            )}

            {/* ===== Versions Tab ===== */}
            {activeTab === 'versions' && (
              <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="px-4 py-2.5 border-b border-border bg-surface-75/30 flex items-center justify-between">
                  <div className="text-[12px] text-foreground-light font-medium">
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
                  <div className="divide-y divide-border max-w-3xl">
                    {versionList.map((version) => {
                      const isCurrent = version.id === app?.current_version_id
                      const isRollingBack = rollbackingId === version.id
                      return (
                        <div
                          key={version.id}
                          className={cn(
                            'px-4 py-3 transition-colors',
                            isCurrent ? 'bg-brand-500/5' : 'hover:bg-surface-200/30'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium text-foreground">
                                  {version.version}
                                </span>
                                {isCurrent && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-brand-500/10 text-brand-500">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-foreground-muted">
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
                                className="h-7 text-[11px] text-foreground-muted hover:text-foreground shrink-0"
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
                  <div className="border-t border-border p-4 space-y-3 max-w-3xl">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                      <GitCompare className="w-3.5 h-3.5 text-foreground-muted" />
                      Compare Versions
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={compareFrom} onValueChange={setCompareFrom}>
                        <SelectTrigger className="h-8 text-[11px]">
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
                        <SelectTrigger className="h-8 text-[11px]">
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

        {/* ===== Right Sidebar: AI Chat ===== */}
        {chatOpen && (
          <div className="w-[340px] shrink-0 border-l border-border flex flex-col bg-background-studio">
            {/* Session Selector */}
            <div className="px-3 py-2 border-b border-border flex items-center gap-2">
              <button
                onClick={() => setShowSessionList(!showSessionList)}
                className="flex items-center gap-1.5 text-[11px] font-medium text-foreground-muted hover:text-foreground transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                <span className="truncate max-w-[140px]">
                  {activeSessionId
                    ? sessions.find((s) => s.id === activeSessionId)?.title || 'Session'
                    : 'New Conversation'}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform',
                    showSessionList && 'rotate-180'
                  )}
                />
              </button>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNewSession}
                className="h-6 w-6 p-0"
                title="New conversation"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {/* Session List (dropdown) */}
            {showSessionList && (
              <div className="border-b border-border max-h-[240px] overflow-y-auto bg-surface-75/50">
                <button
                  onClick={() => {
                    handleNewSession()
                    setShowSessionList(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors text-[11px]',
                    !activeSessionId
                      ? 'bg-brand-500/5 text-foreground'
                      : 'hover:bg-surface-200/50 text-foreground-light'
                  )}
                >
                  <Sparkles className="w-3 h-3 text-brand-500 shrink-0" />
                  <span className="truncate">New Conversation</span>
                </button>
                {sessionsLoading ? (
                  <div className="px-3 py-3 flex items-center justify-center">
                    <Loader2 className="w-3 h-3 animate-spin text-foreground-muted" />
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        'group w-full flex items-center gap-2 px-3 py-2 transition-colors cursor-pointer text-[11px]',
                        activeSessionId === session.id
                          ? 'bg-surface-200/60 text-foreground'
                          : 'hover:bg-surface-200/30 text-foreground-light'
                      )}
                      onClick={() => {
                        setActiveSessionId(session.id)
                        setShowSessionList(false)
                      }}
                    >
                      <MessageSquare className="w-3 h-3 text-foreground-muted shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">
                          {session.title || 'Session'}
                        </div>
                        <div className="text-[10px] text-foreground-muted flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatRelativeTime(session.created_at)}
                          <span className="text-foreground-muted/60">·</span>
                          {session.message_count} msgs
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSession(session.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-foreground-muted hover:text-destructive transition-all p-0.5"
                        title="Delete session"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Chat Panel */}
            <AgentChatPanel
              key={activeSessionId || 'new'}
              workspaceId={workspaceId}
              initialSessionId={activeSessionId}
              initialPrompt={!activeSessionId ? initialPrompt : null}
              className="flex-1"
              previewUrl={workspace?.slug ? `/runtime/${workspace.slug}` : undefined}
              suggestions={[
                {
                  label: 'Full App',
                  prompt:
                    'Build a complete CRUD application with a dashboard showing stats, data tables for managing records, and forms to add new entries.',
                },
                {
                  label: 'Database + Data',
                  prompt:
                    'Create database tables with proper relationships and insert sample data so I can see my app working immediately.',
                },
                {
                  label: 'Dashboard UI',
                  prompt:
                    'Design a multi-page UI with stats cards, charts, data tables, and forms. Make it look professional and modern.',
                },
                {
                  label: 'Add Feature',
                  prompt:
                    'Add a new table to my existing database and generate a management page with search, pagination, and inline editing.',
                },
              ]}
              onEvent={handleAgentEvent}
              onComplete={async (info: AgentCompletionInfo) => {
                loadSessions()
                if (info.hasUISchema && workspaceId && workspace?.app_status !== 'published') {
                  try {
                    await appApi.publish(workspaceId)
                  } catch {
                    // already published or publish failed — non-critical
                  }
                }
                setSchemaRevision((r) => r + 1)
                setDbRevision((r) => r + 1)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ===== Preview sub-component using RuntimeDataProvider =====
function PreviewAppWithAuth({
  workspaceSlug,
  appSchema,
}: {
  workspaceSlug: string
  appSchema: AppSchema
}) {
  const { token } = useAppAuth()
  return (
    <RuntimeDataProvider workspaceSlug={workspaceSlug} appAuthToken={token}>
      <AppRenderer
        schema={appSchema}
        workspaceId={workspaceSlug}
        className="h-full"
        skipDataProvider
      />
    </RuntimeDataProvider>
  )
}
