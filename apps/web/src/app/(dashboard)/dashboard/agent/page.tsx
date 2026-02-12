'use client'

/**
 * AI Agent — Unified Workspace Page
 * 3-Column Layout: Sessions | Chat | Workspace Panel (Preview/Database/Pages/Versions)
 * Users chat with Agent to build apps; edit, preview, and publish in one place.
 */

import React, { useState, useEffect, useCallback } from 'react'
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
  Save,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Lock,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  AgentWorkspacePanel,
  type WorkspacePanelTab,
} from '@/components/agent/agent-workspace-panel'
import type { AgentEvent } from '@/lib/api/agent-chat'
import { agentChatApi, type AgentSessionSummary } from '@/lib/api/agent-chat'
import { appApi, type App, type AppAccessPolicy } from '@/lib/api/workspace'
import { workspaceDatabaseApi, type DatabaseTable } from '@/lib/api/workspace-database'
import type { AppSchema } from '@/components/app-renderer/types'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/hooks/useWorkspace'

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return ''
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

export default function AgentPage() {
  const { workspaceId, workspace } = useWorkspace()
  const searchParams = useSearchParams()

  // Session state
  const [sessions, setSessions] = useState<AgentSessionSummary[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showSidebar] = useState(true)

  // Workspace panel state — start closed if no schema/tables yet (cleaner for new users)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTab, setPanelTab] = useState<WorkspacePanelTab>('preview')
  const [dbTables, setDbTables] = useState<DatabaseTable[]>([])
  const [dbTablesLoading, setDbTablesLoading] = useState(false)
  const [appSchema, setAppSchema] = useState<AppSchema | null>(null)
  const [schemaRevision, setSchemaRevision] = useState(0)
  const [dbRevision, setDbRevision] = useState(0)

  // App state
  const [app, setApp] = useState<App | null>(null)
  const [appLoading, setAppLoading] = useState(false)
  const [hasPageChanges, setHasPageChanges] = useState(false)

  // Publish state
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishWarning, setPublishWarning] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [accessPolicy, setAccessPolicy] = useState<AppAccessPolicy | null>(null)
  const [accessPolicyLoading, setAccessPolicyLoading] = useState(false)

  const hasChanges = hasPageChanges

  // Read URL query params (e.g. ?session=xxx or ?prompt=xxx)
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null)
  useEffect(() => {
    const sessionFromUrl = searchParams.get('session')
    if (sessionFromUrl) {
      setActiveSessionId(sessionFromUrl)
    }
    const promptFromUrl = searchParams.get('prompt')
    if (promptFromUrl) {
      setInitialPrompt(promptFromUrl)
      // Clear the prompt from URL to prevent re-trigger on navigation
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

  // Initial load
  useEffect(() => {
    loadDbTables()
    loadAppData()
    loadAccessPolicy()
  }, [loadDbTables, loadAppData, loadAccessPolicy])

  // Auto-open panel once we know there's existing data
  useEffect(() => {
    if (appSchema || dbTables.length > 0) {
      setPanelOpen(true)
    }
  }, [appSchema, dbTables.length])

  // Re-load when revisions change (triggered by agent events)
  useEffect(() => {
    if (dbRevision > 0) loadDbTables()
  }, [dbRevision, loadDbTables])

  useEffect(() => {
    if (schemaRevision > 0) loadAppData()
  }, [schemaRevision, loadAppData])

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
          if (!panelOpen) setPanelOpen(true)
          setPanelTab('database')
        } else if (event.affected_resource === 'ui_schema') {
          setSchemaRevision((r) => r + 1)
          if (!panelOpen) setPanelOpen(true)
          setPanelTab('preview')
        }
      }
      if (event.type === 'done') {
        setDbRevision((r) => r + 1)
        setSchemaRevision((r) => r + 1)
      }
    },
    [panelOpen]
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
              Select a workspace from the top navigation to start using the AI Agent.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* ===== Top Toolbar ===== */}
      <header className="h-11 shrink-0 border-b border-border bg-surface-75 flex items-center px-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-surface-200 border border-border flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-foreground-light" />
          </div>
          <span className="text-[13px] font-medium text-foreground truncate max-w-[160px]">
            {app?.name || workspace?.name || 'Workspace'}
          </span>
          <Badge variant="secondary" className="text-[10px] bg-surface-200 text-foreground-muted">
            {workspace?.app_status === 'published' ? 'Published' : 'Draft'}
          </Badge>
          {hasChanges && (
            <Badge variant="secondary" className="text-[10px] bg-warning-200 text-warning">
              Unsaved
            </Badge>
          )}
        </div>

        <div className="text-[11px] text-foreground-muted">
          {app?.current_version?.version || 'v0.0.0'}
        </div>

        <div className="flex-1" />

        {/* Panel toggle */}
        {!panelOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setPanelOpen(true)}
          >
            <Eye className="w-3.5 h-3.5" />
            Panel
          </Button>
        )}

        <div className="h-4 w-px bg-border" />

        {workspace?.slug && (
          <Link
            href={`/runtime/${workspace.slug}`}
            className="flex items-center gap-1 text-[11px] text-brand-500 hover:text-brand-400 transition-colors"
            target="_blank"
          >
            <ExternalLink className="w-3 h-3" />
            Open App
          </Link>
        )}

        <Button variant="outline" size="sm" onClick={handlePublish} className="h-8 gap-1.5">
          <Rocket className="w-3.5 h-3.5" />
          Publish
        </Button>
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

      {/* ===== Main Content: Sessions | Chat | Workspace Panel ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Session Sidebar */}
        {showSidebar && (
          <div className="w-56 shrink-0 border-r border-border flex flex-col bg-background-studio">
            <div className="px-3 py-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                Sessions
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNewSession}
                className="h-7 w-7 p-0"
                title="New conversation"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <button
                onClick={handleNewSession}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                  !activeSessionId
                    ? 'bg-brand-500/5 border-l-2 border-brand-500'
                    : 'hover:bg-surface-200/50 border-l-2 border-transparent'
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">
                    New Conversation
                  </div>
                  <div className="text-[10px] text-foreground-muted">Start building something</div>
                </div>
              </button>

              {sessionsLoading ? (
                <div className="px-3 py-4 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      'group w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors cursor-pointer',
                      activeSessionId === session.id
                        ? 'bg-surface-200/60 border-l-2 border-brand-500'
                        : 'hover:bg-surface-200/30 border-l-2 border-transparent'
                    )}
                    onClick={() => setActiveSessionId(session.id)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-surface-200/50 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-3.5 h-3.5 text-foreground-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {session.title || 'Session'}
                      </div>
                      <div className="text-[10px] text-foreground-muted flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimeAgo(session.created_at)}
                        <span className="text-foreground-muted/60">·</span>
                        {session.message_count} msgs
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSession(session.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-foreground-muted hover:text-destructive transition-all p-1"
                      title="Delete session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="px-3 py-3 border-t border-border space-y-1">
              <Link
                href="/dashboard/skills"
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-foreground-muted hover:text-foreground hover:bg-surface-200/50 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Skills</span>
              </Link>
              <Link
                href="/dashboard/database"
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-foreground-muted hover:text-foreground hover:bg-surface-200/50 transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Database</span>
              </Link>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AgentChatPanel
            key={activeSessionId || 'new'}
            workspaceId={workspaceId}
            initialSessionId={activeSessionId}
            initialPrompt={!activeSessionId ? initialPrompt : null}
            className="flex-1"
            previewUrl={workspace?.slug ? `/runtime/${workspace.slug}` : undefined}
            suggestions={[
              {
                label: '🏗️ Full App',
                prompt:
                  'Build a complete CRUD application with a dashboard showing stats, data tables for managing records, and forms to add new entries.',
              },
              {
                label: '🗄️ Database + Data',
                prompt:
                  'Create database tables with proper relationships and insert sample data so I can see my app working immediately.',
              },
              {
                label: '📊 Dashboard UI',
                prompt:
                  'Design a multi-page UI with stats cards, charts, data tables, and forms. Make it look professional and modern.',
              },
              {
                label: '➕ Add Feature',
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

        {/* Workspace Panel (Preview / Database / Blocks / Pages / Schema) */}
        <AgentWorkspacePanel
          workspaceId={workspaceId}
          workspaceSlug={workspace?.slug}
          app={app}
          appSchema={appSchema}
          dbTables={dbTables}
          dbTablesLoading={dbTablesLoading}
          isOpen={panelOpen}
          activeTab={panelTab}
          onTabChange={setPanelTab}
          onClose={() => setPanelOpen(false)}
          onRefreshDb={() => setDbRevision((r) => r + 1)}
          onRefreshSchema={() => setSchemaRevision((r) => r + 1)}
          onSchemaEdited={setAppSchema}
          onPagesDirtyChange={setHasPageChanges}
          onAppUpdated={setApp}
        />
      </div>
    </div>
  )
}
