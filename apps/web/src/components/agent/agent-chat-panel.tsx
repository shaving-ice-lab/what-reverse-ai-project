'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send,
  Square,
  Loader2,
  Bot,
  Wrench,
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Rocket,
  Eye,
  Plus,
  MessageSquare,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { chatStream, agentChatApi } from '@/lib/api/agent-chat'
import type {
  AgentEvent,
  AgentStatus,
  AgentSessionSummary,
  PersonaMeta,
} from '@/lib/api/agent-chat'
import { cn, formatRelativeTime } from '@/lib/utils'
import { PersonaTabBar, PersonaWelcome } from './persona-selector'

interface ChatEntry {
  id: string
  type:
    | 'user'
    | 'assistant'
    | 'thought'
    | 'tool_call'
    | 'tool_result'
    | 'confirmation'
    | 'error'
    | 'done'
  content: string
  toolName?: string
  toolArgs?: Record<string, unknown>
  toolResult?: { success: boolean; output: string; error?: string }
  actionId?: string
  step?: number
  timestamp: Date
}

export interface AgentCompletionInfo {
  affectedResources: Set<string>
  hasUISchema: boolean
  hasDatabase: boolean
  toolCallCount: number
}

interface AgentChatPanelProps {
  workspaceId: string
  className?: string
  initialPrompt?: string | null
  previewUrl?: string
  onEvent?: (event: AgentEvent) => void
  onComplete?: (info: AgentCompletionInfo) => void
}

let entryIdCounter = 0
function nextEntryId() {
  return `entry_${++entryIdCounter}_${Date.now()}`
}

export function AgentChatPanel({
  workspaceId,
  className,
  initialPrompt,
  previewUrl,
  onEvent,
  onComplete,
}: AgentChatPanelProps) {
  // ========== Persona State ==========
  const [personas, setPersonas] = useState<PersonaMeta[]>([])
  const [personasLoading, setPersonasLoading] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<PersonaMeta | null>(null)

  // ========== Session State ==========
  const [sessions, setSessions] = useState<AgentSessionSummary[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showSessionList, setShowSessionList] = useState(false)

  // ========== Chat State ==========
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null)
  const [completionInfo, setCompletionInfo] = useState<AgentCompletionInfo | null>(null)

  const controllerRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const affectedRef = useRef<Set<string>>(new Set())
  const toolCallCountRef = useRef(0)

  // ========== Load Personas ==========
  useEffect(() => {
    if (!workspaceId) return
    setPersonasLoading(true)
    agentChatApi
      .listPersonas(workspaceId)
      .then((list) => {
        setPersonas(list)
        // Auto-select first persona
        if (list.length > 0 && !selectedPersona) {
          setSelectedPersona(list[0])
        }
      })
      .catch(() => setPersonas([]))
      .finally(() => setPersonasLoading(false))
  }, [workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ========== Load Sessions ==========
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

  // ========== Load Agent Status ==========
  useEffect(() => {
    agentChatApi
      .getStatus(workspaceId)
      .then(setAgentStatus)
      .catch(() => {})
  }, [workspaceId])

  // ========== Auto-scroll ==========
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  // ========== Derived: sessions filtered by active persona ==========
  const filteredSessions = selectedPersona
    ? sessions.filter((s) => s.persona_id === selectedPersona.id)
    : sessions

  // ========== Persona Tab Switch ==========
  const handlePersonaSwitch = useCallback(
    (persona: PersonaMeta) => {
      if (persona.id === selectedPersona?.id) return
      // Abort any running stream
      controllerRef.current?.abort()
      setSelectedPersona(persona)
      setActiveSessionId(null)
      setEntries([])
      setInput('')
      setRunning(false)
      setCompletionInfo(null)
      affectedRef.current = new Set()
      toolCallCountRef.current = 0
      setShowSessionList(false)
    },
    [selectedPersona]
  )

  // ========== Session Management ==========
  const handleNewSession = useCallback(() => {
    controllerRef.current?.abort()
    setActiveSessionId(null)
    setEntries([])
    setInput('')
    setRunning(false)
    setCompletionInfo(null)
    affectedRef.current = new Set()
    toolCallCountRef.current = 0
    setShowSessionList(false)
  }, [])

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      if (sessionId === activeSessionId) {
        setShowSessionList(false)
        return
      }
      controllerRef.current?.abort()
      setActiveSessionId(sessionId)
      setEntries([])
      setRunning(false)
      setCompletionInfo(null)
      affectedRef.current = new Set()
      toolCallCountRef.current = 0
      setShowSessionList(false)

      // Restore persona from session
      const session = sessions.find((s) => s.id === sessionId)
      if (session?.persona_id) {
        const persona = personas.find((p) => p.id === session.persona_id)
        if (persona) setSelectedPersona(persona)
      }

      // Load session history
      if (workspaceId) {
        agentChatApi
          .getSession(workspaceId, sessionId)
          .then((sess) => {
            const historyEntries: ChatEntry[] = []
            const messages = sess.messages || []
            const toolCalls = sess.tool_calls || []
            let toolIdx = 0
            for (const msg of messages) {
              if (msg.role === 'user') {
                historyEntries.push({
                  id: nextEntryId(),
                  type: 'user',
                  content: msg.content,
                  timestamp: new Date(msg.timestamp),
                })
              } else if (msg.role === 'assistant' && msg.content) {
                while (
                  toolIdx < toolCalls.length &&
                  new Date(toolCalls[toolIdx].timestamp) <= new Date(msg.timestamp)
                ) {
                  const tc = toolCalls[toolIdx]
                  historyEntries.push({
                    id: nextEntryId(),
                    type: 'tool_call',
                    content: `Called ${tc.tool_name}`,
                    toolName: tc.tool_name,
                    toolArgs: tc.args,
                    timestamp: new Date(tc.timestamp),
                  })
                  historyEntries.push({
                    id: nextEntryId(),
                    type: 'tool_result',
                    content: tc.result?.output || '',
                    toolName: tc.tool_name,
                    toolResult: tc.result,
                    timestamp: new Date(tc.timestamp),
                  })
                  toolIdx++
                }
                historyEntries.push({
                  id: nextEntryId(),
                  type: 'assistant',
                  content: msg.content,
                  timestamp: new Date(msg.timestamp),
                })
              }
            }
            while (toolIdx < toolCalls.length) {
              const tc = toolCalls[toolIdx]
              historyEntries.push({
                id: nextEntryId(),
                type: 'tool_call',
                content: `Called ${tc.tool_name}`,
                toolName: tc.tool_name,
                toolArgs: tc.args,
                timestamp: new Date(tc.timestamp),
              })
              historyEntries.push({
                id: nextEntryId(),
                type: 'tool_result',
                content: tc.result?.output || '',
                toolName: tc.tool_name,
                toolResult: tc.result,
                timestamp: new Date(tc.timestamp),
              })
              toolIdx++
            }
            setEntries(historyEntries)
          })
          .catch(() => {})
      }
    },
    [activeSessionId, sessions, personas, workspaceId]
  )

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      if (!workspaceId) return
      try {
        await agentChatApi.deleteSession(workspaceId, sessionId)
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
        if (activeSessionId === sessionId) {
          handleNewSession()
        }
      } catch {}
    },
    [workspaceId, activeSessionId, handleNewSession]
  )

  // ========== Chat Logic ==========
  const addEntry = useCallback((entry: Omit<ChatEntry, 'id' | 'timestamp'>) => {
    setEntries((prev) => [...prev, { ...entry, id: nextEntryId(), timestamp: new Date() }])
  }, [])

  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim() || running) return
      setInput('')
      setRunning(true)

      addEntry({ type: 'user', content: message })

      const sid = activeSessionId || `session_${Date.now()}`
      if (!activeSessionId) setActiveSessionId(sid)

      const personaIdToSend = selectedPersona?.id || undefined

      const controller = chatStream({
        workspaceId,
        message,
        sessionId: sid,
        personaId: personaIdToSend,
        onEvent: (event: AgentEvent) => {
          onEvent?.(event)

          if (event.session_id && !activeSessionId) {
            setActiveSessionId(event.session_id)
          }

          if (event.affected_resource) {
            affectedRef.current.add(event.affected_resource)
          }

          switch (event.type) {
            case 'thought':
              addEntry({ type: 'thought', content: event.content || '', step: event.step })
              break
            case 'tool_call':
              toolCallCountRef.current++
              addEntry({
                type: 'tool_call',
                content: `Calling tool: ${event.tool_name}`,
                toolName: event.tool_name,
                toolArgs: event.tool_args,
                step: event.step,
              })
              break
            case 'tool_result':
              // Refresh persona tab bar when a new persona is created
              if (event.tool_result?.success && event.tool_name === 'create_persona') {
                agentChatApi.listPersonas(workspaceId).then(setPersonas).catch(() => {})
              }
              addEntry({
                type: 'tool_result',
                content: event.tool_result?.output || '',
                toolName: event.tool_name,
                toolResult: event.tool_result
                  ? {
                      success: event.tool_result.success,
                      output: event.tool_result.output,
                      error: event.tool_result.error,
                    }
                  : undefined,
                step: event.step,
              })
              break
            case 'confirmation_required':
              addEntry({
                type: 'confirmation',
                content: event.content || `Confirm action: ${event.tool_name}`,
                toolName: event.tool_name,
                toolArgs: event.tool_args,
                actionId: event.action_id,
                step: event.step,
              })
              setRunning(false)
              break
            case 'message':
              addEntry({ type: 'assistant', content: event.content || '' })
              break
            case 'error':
              addEntry({ type: 'error', content: event.error || 'Unknown error' })
              setRunning(false)
              break
            case 'done': {
              setRunning(false)
              loadSessions() // Refresh session list
              const info: AgentCompletionInfo = {
                affectedResources: new Set(affectedRef.current),
                hasUISchema: affectedRef.current.has('ui_schema'),
                hasDatabase: affectedRef.current.has('database'),
                toolCallCount: toolCallCountRef.current,
              }
              if (info.toolCallCount > 0) {
                setCompletionInfo(info)
                onComplete?.(info)
              }
              break
            }
          }
        },
        onError: (error: string) => {
          addEntry({ type: 'error', content: error })
          setRunning(false)
        },
        onDone: () => {
          setRunning(false)
        },
      })

      controllerRef.current = controller
    },
    [running, workspaceId, activeSessionId, selectedPersona, addEntry, onEvent, onComplete, loadSessions]
  )

  const handleSend = useCallback(() => {
    if (!input.trim() || running) return
    sendMessage(input.trim())
  }, [input, running, sendMessage])

  // Auto-send initialPrompt
  const initialPromptSentRef = useRef(false)
  useEffect(() => {
    if (initialPrompt && !initialPromptSentRef.current && !running && entries.length === 0) {
      initialPromptSentRef.current = true
      sendMessage(initialPrompt)
    }
  }, [initialPrompt, running, entries.length, sendMessage])

  const handleStop = () => {
    controllerRef.current?.abort()
    if (activeSessionId) {
      agentChatApi.cancelSession(workspaceId, activeSessionId).catch(() => {})
    }
    setRunning(false)
  }

  const handleConfirm = async (actionId: string, approved: boolean) => {
    if (!activeSessionId) return
    try {
      await agentChatApi.confirmAction(workspaceId, activeSessionId, actionId, approved)
      addEntry({
        type: 'assistant',
        content: approved ? 'Action approved. Executing...' : 'Action rejected.',
      })
    } catch {
      addEntry({ type: 'error', content: 'Failed to process confirmation' })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ========== Render ==========
  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* ── Persona Tab Bar ── */}
      <PersonaTabBar
        personas={personas}
        activeId={selectedPersona?.id || ''}
        onSelect={handlePersonaSwitch}
        loading={personasLoading}
        className="border-b border-border bg-surface-75/50"
      />

      {/* ── Session Bar ── */}
      <div className="px-3 py-1.5 border-b border-border flex items-center gap-2 bg-background">
        <button
          onClick={() => setShowSessionList(!showSessionList)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-foreground-muted hover:text-foreground transition-colors min-w-0 flex-1"
        >
          <MessageSquare className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {activeSessionId
              ? sessions.find((s) => s.id === activeSessionId)?.title || 'Session'
              : 'New Conversation'}
          </span>
          <ChevronDown
            className={cn('w-3 h-3 shrink-0 transition-transform', showSessionList && 'rotate-180')}
          />
        </button>
        {running && (
          <Loader2 className="w-3 h-3 animate-spin text-foreground-muted shrink-0" />
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleNewSession}
          className="h-6 w-6 p-0 shrink-0"
          title="New conversation"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* ── Session List Dropdown ── */}
      {showSessionList && (
        <div className="border-b border-border max-h-[200px] overflow-y-auto bg-surface-75/50">
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
          ) : filteredSessions.length === 0 ? (
            <div className="px-3 py-3 text-center text-[10px] text-foreground-muted">
              No previous sessions
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'group w-full flex items-center gap-2 px-3 py-2 transition-colors cursor-pointer text-[11px]',
                  activeSessionId === session.id
                    ? 'bg-surface-200/60 text-foreground'
                    : 'hover:bg-surface-200/30 text-foreground-light'
                )}
                onClick={() => handleSelectSession(session.id)}
              >
                <MessageSquare className="w-3 h-3 text-foreground-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{session.title || 'Session'}</div>
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

      {/* ── Chat Area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {entries.length === 0 && (
          <PersonaWelcome
            persona={selectedPersona}
            onSuggestionClick={(prompt) => setInput(prompt)}
            className="h-full"
          />
        )}

        {entries.map((entry) => (
          <ChatEntryView key={entry.id} entry={entry} onConfirm={handleConfirm} />
        ))}

        {running && (
          <div className="flex items-center gap-2 text-xs text-foreground-muted pl-8">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Agent is working...
          </div>
        )}

        {completionInfo && completionInfo.hasUISchema && !running && previewUrl && (
          <div className="mx-2 mt-2 bg-brand-500/5 border border-brand-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Your app is ready!</p>
                <p className="text-[11px] text-foreground-muted">
                  {completionInfo.hasDatabase && 'Database created · '}
                  UI generated
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview App
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div className="px-3 py-2.5 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedPersona
                ? `Ask ${selectedPersona.name}...`
                : 'Ask the Agent...'
            }
            disabled={running}
            className="flex-1 h-9 text-sm"
          />
          {running ? (
            <Button size="sm" variant="destructive" onClick={handleStop} className="h-9 px-3">
              <Square className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSend} disabled={!input.trim()} className="h-9 px-3">
              <Send className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ChatEntryView({
  entry,
  onConfirm,
}: {
  entry: ChatEntry
  onConfirm: (actionId: string, approved: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)

  switch (entry.type) {
    case 'user':
      return (
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-brand-500 text-white rounded-lg px-3 py-2 text-sm">
            {entry.content}
          </div>
        </div>
      )

    case 'assistant':
      return (
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="w-3.5 h-3.5 text-brand-500" />
          </div>
          <div className="max-w-[85%] text-sm text-foreground whitespace-pre-wrap">
            {entry.content}
          </div>
        </div>
      )

    case 'thought':
      return (
        <div className="ml-8">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[11px] text-foreground-muted hover:text-foreground transition-colors"
          >
            <Brain className="w-3 h-3" />
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Step {entry.step}: Thinking...
          </button>
          {expanded && (
            <div className="mt-1 bg-surface-200/30 rounded px-3 py-2 text-xs text-foreground-light">
              {entry.content}
            </div>
          )}
        </div>
      )

    case 'tool_call':
      return (
        <div className="ml-8">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[11px] text-blue-500 hover:text-blue-400 transition-colors"
          >
            <Wrench className="w-3 h-3" />
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {entry.toolName}
          </button>
          {expanded && entry.toolArgs && (
            <pre className="mt-1 bg-surface-200/30 rounded px-3 py-2 text-[10px] font-mono text-foreground-light overflow-auto max-h-[150px]">
              {JSON.stringify(entry.toolArgs, null, 2)}
            </pre>
          )}
        </div>
      )

    case 'tool_result':
      return (
        <div className="ml-8">
          <div className="flex items-center gap-1.5 text-[11px]">
            {entry.toolResult?.success ? (
              <CheckCircle2 className="w-3 h-3 text-brand-500" />
            ) : (
              <XCircle className="w-3 h-3 text-destructive" />
            )}
            <span className={entry.toolResult?.success ? 'text-brand-500' : 'text-destructive'}>
              {entry.toolResult?.success ? 'Success' : 'Failed'}
            </span>
            <span className="text-foreground-muted">— {entry.toolName}</span>
          </div>
          <div className="mt-1 text-xs text-foreground-light">
            {entry.toolResult?.output || entry.toolResult?.error || entry.content}
          </div>
        </div>
      )

    case 'confirmation':
      return (
        <div className="ml-8 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Confirmation Required
          </div>
          <p className="text-xs text-foreground-light mb-2">{entry.content}</p>
          {entry.toolArgs && (
            <pre className="bg-surface-200/30 rounded px-2 py-1.5 text-[10px] font-mono text-foreground-muted mb-3 overflow-auto max-h-[100px]">
              {JSON.stringify(entry.toolArgs, null, 2)}
            </pre>
          )}
          {entry.actionId && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => onConfirm(entry.actionId!, true)}
              >
                <Check className="w-3 h-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-destructive"
                onClick={() => onConfirm(entry.actionId!, false)}
              >
                <X className="w-3 h-3 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      )

    case 'error':
      return (
        <div className="ml-8 flex items-start gap-1.5 text-xs text-destructive">
          <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {entry.content}
        </div>
      )

    default:
      return null
  }
}
