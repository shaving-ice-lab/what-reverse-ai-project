'use client'

/**
 * AI Agent — Standalone Conversation Page
 * Users can chat with the Agent to build apps, create databases, and design workflows
 * without needing to create an App first.
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
  ChevronRight,
  Sparkles,
  LayoutGrid,
  Database,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AgentChatPanel, type AgentCompletionInfo } from '@/components/agent/agent-chat-panel'
import { agentChatApi, type AgentSessionSummary } from '@/lib/api/agent-chat'
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
  const [sessions, setSessions] = useState<AgentSessionSummary[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)

  // Restore session from URL query param (e.g. ?session=xxx)
  useEffect(() => {
    const sessionFromUrl = searchParams.get('session')
    if (sessionFromUrl) {
      setActiveSessionId(sessionFromUrl)
    }
  }, [searchParams])

  const loadSessions = useCallback(async () => {
    if (!workspaceId) return
    setSessionsLoading(true)
    try {
      const data = await agentChatApi.listSessions(workspaceId)
      setSessions(data)
    } catch {
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

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
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Session Sidebar */}
      {showSidebar && (
        <div className="w-64 shrink-0 border-r border-border flex flex-col bg-background-studio">
          {/* Sidebar Header */}
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

          {/* Session List */}
          <div className="flex-1 overflow-y-auto">
            {/* New Session Entry */}
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
                <div className="text-[10px] text-foreground-muted">
                  Start building something
                </div>
              </div>
            </button>

            {/* Past Sessions */}
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

          {/* Sidebar Footer — Quick Links */}
          <div className="px-3 py-3 border-t border-border space-y-1">
            {workspace?.slug && (
              <SidebarLink href={`/runtime/${workspace.slug}/${workspace.slug}`} icon={LayoutGrid} label="Preview App" />
            )}
            <SidebarLink href="/dashboard/database" icon={Database} label="Database" />
            {workspaceId && (
              <SidebarLink href={`/dashboard/app/${workspaceId}/builder`} icon={Zap} label="Builder" />
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AgentChatPanel
          workspaceId={workspaceId}
          className="flex-1"
          previewUrl={workspace?.slug ? `/runtime/${workspace.slug}/${workspace.slug}` : undefined}
          builderUrl={workspaceId ? `/dashboard/app/${workspaceId}/builder` : undefined}
          suggestions={[
            { label: '🏗️ Full App', prompt: 'Build a complete CRUD application with a dashboard showing stats, data tables for managing records, and forms to add new entries.' },
            { label: '🗄️ Database + Data', prompt: 'Create database tables with proper relationships and insert sample data so I can see my app working immediately.' },
            { label: '📊 Dashboard UI', prompt: 'Design a multi-page UI with stats cards, charts, data tables, and forms. Make it look professional and modern.' },
            { label: '➕ Add Feature', prompt: 'Add a new table to my existing database and generate a management page with search, pagination, and inline editing.' },
          ]}
          onComplete={(info: AgentCompletionInfo) => {
            loadSessions()
          }}
        />
      </div>
    </div>
  )
}

function SidebarLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ElementType
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-foreground-muted hover:text-foreground hover:bg-surface-200/50 transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
    </Link>
  )
}
