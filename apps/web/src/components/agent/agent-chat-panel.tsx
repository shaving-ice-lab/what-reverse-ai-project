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
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { chatStream, agentChatApi } from '@/lib/api/agent-chat'
import type {
  AgentEvent,
  AgentStatus,
  AgentSessionSummary,
  PersonaMeta,
  AgentPlan,
  PlanGroup,
  PlanStep,
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
    | 'plan'
    | 'plan_update'
  content: string
  toolName?: string
  toolArgs?: Record<string, unknown>
  toolResult?: { success: boolean; output: string; error?: string; data?: unknown }
  actionId?: string
  step?: number
  planData?: {
    title: string
    status?: string
    summary?: string
    groups?: PlanGroup[]
    steps: PlanStep[]
  }
  planUpdate?: { step_id: string; status: string; note?: string }
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

  // ========== Plan State ==========
  const [activePlan, setActivePlan] = useState<AgentPlan | null>(null)
  const [planConfirming, setPlanConfirming] = useState(false)

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
      setActivePlan(null)
      setPlanConfirming(false)
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
    setActivePlan(null)
    setPlanConfirming(false)
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
      setActivePlan(null)
      setPlanConfirming(false)
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
    (message: string, options?: { silent?: boolean }) => {
      if (!message.trim() || running) return
      setInput('')
      setRunning(true)

      if (!options?.silent) {
        addEntry({ type: 'user', content: message })
      }

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
            case 'tool_result': {
              // Refresh persona tab bar when a new persona is created
              if (event.tool_result?.success && event.tool_name === 'create_persona') {
                agentChatApi
                  .listPersonas(workspaceId)
                  .then(setPersonas)
                  .catch(() => {})
              }
              // Handle plan tool results — render as plan/plan_update entries
              const resultData = event.tool_result?.data as Record<string, unknown> | undefined
              if (event.tool_result?.success && resultData?.type === 'plan') {
                // Set sticky plan state
                const planData = {
                  title: resultData.title as string,
                  status: (resultData.status as string) || 'draft',
                  summary: resultData.summary as string | undefined,
                  groups: resultData.groups as PlanGroup[] | undefined,
                  steps: resultData.steps as PlanStep[],
                }
                setActivePlan(planData as AgentPlan)
                addEntry({
                  type: 'plan',
                  content: event.tool_result.output,
                  planData,
                  step: event.step,
                })
                break
              }
              if (event.tool_result?.success && resultData?.type === 'plan_update') {
                // Update existing plan entry in-place if full plan data is available
                const updatedPlan = resultData?.plan as ChatEntry['planData'] | undefined
                if (updatedPlan) {
                  // Update sticky plan state
                  setActivePlan(updatedPlan as AgentPlan)
                  setEntries((prev) => {
                    const planIdx = prev.findLastIndex((e) => e.type === 'plan')
                    if (planIdx >= 0) {
                      const updated = [...prev]
                      updated[planIdx] = {
                        ...updated[planIdx],
                        planData: updatedPlan,
                      }
                      return updated
                    }
                    return prev
                  })
                }
                addEntry({
                  type: 'plan_update',
                  content: event.tool_result.output,
                  planUpdate: resultData as unknown as ChatEntry['planUpdate'],
                  step: event.step,
                })
                break
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
                      data: event.tool_result.data,
                    }
                  : undefined,
                step: event.step,
              })
              break
            }
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
    [
      running,
      workspaceId,
      activeSessionId,
      selectedPersona,
      addEntry,
      onEvent,
      onComplete,
      loadSessions,
    ]
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

  // ========== Plan Confirmation ==========
  const handleConfirmPlan = useCallback(async () => {
    if (!activeSessionId || !activePlan || planConfirming) return
    setPlanConfirming(true)
    try {
      const res = await agentChatApi.confirmPlan(workspaceId, activeSessionId)
      setActivePlan(res.plan)
      addEntry({ type: 'assistant', content: 'Plan confirmed! Starting execution...' })
      // Ensure running is false before triggering execution (previous SSE may still be closing)
      setRunning(false)
      // Small delay to let React state settle, then trigger execution silently (no user bubble)
      setTimeout(() => {
        sendMessage('Execute the confirmed development plan now.', { silent: true })
      }, 150)
    } catch {
      addEntry({ type: 'error', content: 'Failed to confirm plan' })
      setPlanConfirming(false)
    }
  }, [activeSessionId, activePlan, planConfirming, workspaceId, addEntry, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ========== Render ==========
  return (
    <div className={cn('flex flex-col h-full bg-background-studio', className)}>
      {/* ── Persona Tab Bar ── */}
      <PersonaTabBar
        personas={personas}
        activeId={selectedPersona?.id || ''}
        onSelect={handlePersonaSwitch}
        loading={personasLoading}
        className="border-b border-border bg-surface-75/50"
      />

      {/* ── Session Bar ── */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-2 bg-background">
        <button
          onClick={() => setShowSessionList(!showSessionList)}
          className="flex items-center gap-2 min-w-0 flex-1 group"
        >
          <div
            className={cn(
              'w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors',
              activeSessionId ? 'bg-brand-500/10' : 'bg-surface-200'
            )}
          >
            <MessageSquare className="w-3 h-3 text-brand-500" />
          </div>
          <span className="truncate flex-1 text-left text-[12px] font-medium text-foreground-muted group-hover:text-foreground transition-colors">
            {activeSessionId
              ? sessions.find((s) => s.id === activeSessionId)?.title || 'Session'
              : 'New Conversation'}
          </span>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-foreground-muted shrink-0 transition-transform',
              showSessionList && 'rotate-180'
            )}
          />
        </button>
        {running && (
          <div className="flex items-center gap-0.5 shrink-0 px-1">
            <span
              className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"
              style={{ animationDelay: '-0.3s' }}
            />
            <span
              className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"
              style={{ animationDelay: '-0.15s' }}
            />
            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" />
          </div>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleNewSession}
          className="h-7 w-7 p-0 shrink-0 rounded-md hover:bg-surface-200"
          title="New conversation"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* ── Session List Dropdown ── */}
      {showSessionList && (
        <div className="border-b border-border max-h-[220px] overflow-y-auto bg-background shadow-sm">
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={() => {
                handleNewSession()
                setShowSessionList(false)
              }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-[11px]',
                !activeSessionId
                  ? 'bg-brand-500/8 text-brand-500 font-medium'
                  : 'hover:bg-surface-200/60 text-foreground-muted hover:text-foreground'
              )}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1">New Conversation</span>
              {!activeSessionId && (
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
              )}
            </button>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-5">
                <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="py-5 text-center text-[11px] text-foreground-muted">
                No previous conversations
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'group relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-[11px]',
                    activeSessionId === session.id
                      ? 'bg-surface-200/80 text-foreground font-medium'
                      : 'hover:bg-surface-200/40 text-foreground-muted hover:text-foreground'
                  )}
                  onClick={() => handleSelectSession(session.id)}
                >
                  {activeSessionId === session.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-brand-500" />
                  )}
                  <MessageSquare className="w-3 h-3 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{session.title || 'Session'}</div>
                    <div className="flex items-center gap-1 text-[10px] text-foreground-muted/70 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatRelativeTime(session.created_at)}
                      <span>·</span>
                      {session.message_count} msgs
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSession(session.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-foreground-muted hover:text-destructive transition-all"
                    title="Delete session"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Sticky Plan TodoList ── */}
      {activePlan && (
        <StickyPlanTodoList
          plan={activePlan}
          onConfirm={handleConfirmPlan}
          confirming={planConfirming}
          running={running}
        />
      )}

      {/* ── Chat Area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-2 scroll-smooth">
        {entries.length === 0 && !activePlan && (
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
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-brand-500" />
            </div>
            <div className="flex items-center gap-1 bg-surface-75 border border-border/60 rounded-2xl rounded-tl-sm px-3.5 py-3 shadow-sm">
              <span
                className="w-1.5 h-1.5 bg-foreground-muted/50 rounded-full animate-bounce"
                style={{ animationDelay: '-0.3s' }}
              />
              <span
                className="w-1.5 h-1.5 bg-foreground-muted/50 rounded-full animate-bounce"
                style={{ animationDelay: '-0.15s' }}
              />
              <span className="w-1.5 h-1.5 bg-foreground-muted/50 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        {completionInfo && completionInfo.hasUISchema && !running && previewUrl && (
          <div className="mt-3 bg-brand-500/5 border border-brand-500/20 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                <Rocket className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Your app is ready!</p>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  {completionInfo.hasDatabase ? 'Database + UI generated' : 'UI generated'}
                </p>
              </div>
            </div>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview App
            </a>
          </div>
        )}
      </div>

      {/* ── Input Area ── */}
      <div className="px-3 py-3 border-t border-border bg-background shrink-0">
        <div
          className={cn(
            'flex items-end gap-2 px-3 py-2 rounded-xl border transition-colors',
            running
              ? 'border-border/40 bg-surface-75/50'
              : 'border-border bg-background hover:border-brand-500/30 focus-within:border-brand-500/50'
          )}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedPersona ? `Ask ${selectedPersona.name}...` : 'Ask the Agent...'}
            disabled={running}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-foreground-muted min-h-[22px] max-h-[100px] overflow-y-auto leading-[22px] py-0 disabled:opacity-50"
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 100) + 'px'
            }}
          />
          {running ? (
            <button
              onClick={handleStop}
              className="w-7 h-7 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center shrink-0 transition-colors mb-0.5"
            >
              <Square className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors mb-0.5',
                input.trim()
                  ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm'
                  : 'bg-surface-200 text-foreground-muted cursor-not-allowed'
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[10px] text-foreground-muted/50">↵ Send · Shift+↵ New line</span>
          {agentStatus && !running && (
            <span className="text-[10px] text-foreground-muted/50 font-mono">
              {agentStatus.model}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ========== Sticky Plan TodoList Component ==========
function StickyPlanTodoList({
  plan,
  onConfirm,
  confirming,
  running,
}: {
  plan: AgentPlan
  onConfirm: () => void
  confirming: boolean
  running: boolean
}) {
  const [collapsed, setCollapsed] = useState(false)
  const completed = plan.steps.filter((s) => s.status === 'completed').length
  const total = plan.steps.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const isDraft = plan.status === 'draft'
  const isInProgress = plan.status === 'in_progress' || plan.status === 'confirmed'
  const isCompleted = plan.status === 'completed'

  // Group steps by group_id
  const groups = plan.groups || []
  const groupedSteps = new Map<string, PlanStep[]>()
  const ungrouped: PlanStep[] = []
  for (const step of plan.steps) {
    if (step.group_id && groups.some((g) => g.id === step.group_id)) {
      const arr = groupedSteps.get(step.group_id) || []
      arr.push(step)
      groupedSteps.set(step.group_id, arr)
    } else {
      ungrouped.push(step)
    }
  }

  const stepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
      case 'in_progress':
        return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
      default:
        return (
          <div className="w-3.5 h-3.5 rounded-full border-2 border-foreground-muted/30 shrink-0" />
        )
    }
  }

  const renderSteps = (steps: PlanStep[]) =>
    steps.map((step) => (
      <div
        key={step.id}
        className={cn(
          'flex items-start gap-2 py-1 text-[11px]',
          step.status === 'completed' && 'text-foreground-muted',
          step.status === 'in_progress' && 'text-foreground font-medium',
          step.status === 'failed' && 'text-destructive',
          step.status === 'pending' && 'text-foreground-light'
        )}
      >
        {stepIcon(step.status)}
        <span className={step.status === 'completed' ? 'line-through' : ''}>
          {step.description}
        </span>
        {step.tool && (
          <span className="text-[10px] text-foreground-muted/60 ml-auto shrink-0">{step.tool}</span>
        )}
      </div>
    ))

  return (
    <div className="border-b border-border bg-surface-75/50">
      <div className="px-3 py-2.5">
        {/* Header — clickable to toggle collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 w-full text-left"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
          )}
          <ClipboardList className="w-4 h-4 text-brand-500 shrink-0" />
          <span className="text-xs font-semibold text-foreground truncate">{plan.title}</span>
          {isDraft && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium shrink-0">
              Draft
            </span>
          )}
          {isCompleted && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 font-medium shrink-0">
              Done
            </span>
          )}
          {(isInProgress || collapsed) && (
            <span className="text-[10px] text-foreground-muted shrink-0 ml-auto">
              {completed}/{total}
            </span>
          )}
        </button>

        {/* Collapsed: only show progress bar */}
        {collapsed && !isDraft && total > 0 && (
          <div className="mt-1.5">
            <div className="h-1 rounded-full bg-surface-200/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Expanded content */}
        {!collapsed && (
          <>
            {/* Summary */}
            {plan.summary && (
              <p className="text-[10px] text-foreground-muted mb-2 mt-1.5 leading-relaxed">
                {plan.summary}
              </p>
            )}

            {/* Progress bar (only when executing) */}
            {!isDraft && total > 0 && (
              <div className="mb-2 mt-1.5">
                <div className="h-1.5 rounded-full bg-surface-200/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-[10px] text-foreground-muted mt-0.5 text-right">
                  {progress}%
                </div>
              </div>
            )}

            {/* Steps grouped by phase */}
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {groups.length > 0
                ? groups.map((group) => {
                    const gSteps = groupedSteps.get(group.id) || []
                    if (gSteps.length === 0) return null
                    return (
                      <div key={group.id}>
                        <div className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-1 mb-0.5">
                          {group.icon && <span>{group.icon}</span>}
                          {group.label}
                        </div>
                        {renderSteps(gSteps)}
                      </div>
                    )
                  })
                : renderSteps(plan.steps)}
              {ungrouped.length > 0 && groups.length > 0 && renderSteps(ungrouped)}
            </div>

            {/* Confirm button for draft plans */}
            {isDraft && (
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                <Button
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={onConfirm}
                  disabled={confirming || running}
                >
                  {confirming ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-3 h-3 mr-1" />
                      Start Execution
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ========== Markdown renderer — inline formatting ==========
function inlineFormat(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1 rounded bg-surface-300/60 font-mono text-[11px] text-foreground-light border border-border/40"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return (
        <del key={i} className="line-through text-foreground-muted">
          {part.slice(2, -2)}
        </del>
      )
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-500 hover:underline"
        >
          {linkMatch[1]}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// ========== Markdown renderer — block-level parser ==========
function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // ── Fenced code block ──
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push(
        <div
          key={key++}
          className="my-2 rounded-md overflow-hidden border border-border text-[11px]"
        >
          {lang && (
            <div className="px-3 py-1 bg-surface-300/50 border-b border-border font-mono text-[10px] text-foreground-muted">
              {lang}
            </div>
          )}
          <pre className="px-3 py-2.5 font-mono text-foreground-light bg-surface-200/50 overflow-auto leading-relaxed whitespace-pre-wrap break-all">
            {codeLines.join('\n')}
          </pre>
        </div>
      )
      i++ // skip closing ```
      continue
    }

    // ── Headings ──
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const cls =
        level === 1
          ? 'text-base font-semibold text-foreground mt-3 mb-1'
          : level === 2
            ? 'text-sm font-semibold text-foreground mt-2.5 mb-0.5'
            : 'text-[13px] font-semibold text-foreground-light mt-2 mb-0.5'
      blocks.push(
        <div key={key++} className={cls}>
          {inlineFormat(headingMatch[2])}
        </div>
      )
      i++
      continue
    }

    // ── Horizontal rule ──
    if (line.match(/^[-*_]{3,}$/) && !line.match(/^[-*+]\s/)) {
      blocks.push(<hr key={key++} className="my-3 border-border" />)
      i++
      continue
    }

    // ── Blockquote ──
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      blocks.push(
        <div
          key={key++}
          className="my-1.5 pl-3 border-l-2 border-brand-500/40 text-foreground-muted italic text-sm leading-relaxed"
        >
          {quoteLines.map((ql, qi) => (
            <div key={qi}>{inlineFormat(ql)}</div>
          ))}
        </div>
      )
      continue
    }

    // ── Unordered list ──
    if (line.match(/^[-*+]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*+]\s+/)) {
        items.push(lines[i].replace(/^[-*+]\s+/, ''))
        i++
      }
      blocks.push(
        <ul key={key++} className="my-1.5 space-y-0.5 pl-2">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-sm text-foreground leading-relaxed"
            >
              <span className="w-1 h-1 rounded-full bg-foreground-muted mt-[0.45rem] shrink-0" />
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // ── Ordered list ──
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push(
        <ol key={key++} className="my-1.5 space-y-0.5 pl-2">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-sm text-foreground leading-relaxed"
            >
              <span className="text-[11px] text-foreground-muted font-mono shrink-0 mt-0.5 w-4 text-right">
                {idx + 1}.
              </span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // ── Empty line ──
    if (!line.trim()) {
      i++
      continue
    }

    // ── Paragraph (collect consecutive non-special lines) ──
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('> ') &&
      !lines[i].match(/^[-*+]\s+/) &&
      !lines[i].match(/^\d+\.\s+/) &&
      !lines[i].match(/^[-*_]{3,}$/)
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      blocks.push(
        <p key={key++} className="text-sm text-foreground leading-relaxed">
          {paraLines.map((pl, pi) => (
            <span key={pi}>
              {pi > 0 && <br />}
              {inlineFormat(pl)}
            </span>
          ))}
        </p>
      )
    }
  }

  return <div className="space-y-1">{blocks}</div>
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
        <div className="flex justify-end mb-3">
          <div className="max-w-[76%] bg-surface-200 border border-border rounded-md px-3 py-2 text-sm text-foreground leading-relaxed">
            {entry.content}
          </div>
        </div>
      )

    case 'assistant':
      return (
        <div className="flex gap-3 mb-4">
          <div className="w-6 h-6 rounded-sm bg-brand-500 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="text-sm text-foreground leading-relaxed">
              <SimpleMarkdown text={entry.content} />
            </div>
          </div>
        </div>
      )

    case 'thought':
      return (
        <div className="ml-9 mb-1.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[11px] text-foreground-muted hover:text-foreground transition-colors"
          >
            <Brain className="w-3 h-3 shrink-0" />
            <span>Step {entry.step} — thinking</span>
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          {expanded && (
            <div className="mt-1.5 pl-4 border-l border-border text-[11px] text-foreground-muted leading-relaxed">
              {entry.content}
            </div>
          )}
        </div>
      )

    case 'tool_call':
      return (
        <div className="ml-9 mb-1.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[11px] text-foreground-muted hover:text-foreground transition-colors font-mono"
          >
            <Wrench className="w-3 h-3 shrink-0 text-foreground-muted" />
            <span className="text-foreground-light">{entry.toolName}</span>
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          {expanded && entry.toolArgs && (
            <div className="mt-1.5 border border-border rounded-md overflow-hidden">
              <pre className="px-3 py-2 text-[10px] font-mono text-foreground-muted bg-surface-200/50 overflow-auto max-h-[120px] leading-relaxed">
                {JSON.stringify(entry.toolArgs, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )

    case 'tool_result': {
      // Special rendering for batch results
      const isBatch = entry.toolName === 'batch'
      const batchData = isBatch
        ? (entry.toolResult?.data as
            | {
                total?: number
                successful?: number
                failed?: number
                results?: Array<{ tool: string; success: boolean; output?: string; error?: string }>
              }
            | undefined)
        : undefined
      if (isBatch && batchData?.results) {
        return (
          <div className="ml-9 mb-1.5">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-[11px] text-foreground-muted hover:text-foreground transition-colors"
            >
              {entry.toolResult?.success ? (
                <CheckCircle2 className="w-3 h-3 shrink-0 text-brand-500" />
              ) : (
                <AlertTriangle className="w-3 h-3 shrink-0 text-amber-500" />
              )}
              <span>
                Batch: {batchData.successful}/{batchData.total} succeeded
              </span>
              {expanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {expanded && (
              <div className="mt-1.5 border border-border rounded-md overflow-hidden">
                {batchData.results.map((r, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono',
                      i > 0 && 'border-t border-border/50'
                    )}
                  >
                    {r.success ? (
                      <CheckCircle2 className="w-2.5 h-2.5 text-brand-500 shrink-0" />
                    ) : (
                      <XCircle className="w-2.5 h-2.5 text-destructive shrink-0" />
                    )}
                    <span className="text-foreground-muted shrink-0">{r.tool}</span>
                    <span className="text-foreground-muted/60 truncate">
                      {r.success ? r.output?.slice(0, 80) || 'OK' : r.error}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }
      const output = entry.toolResult?.output || entry.toolResult?.error || entry.content
      const success = entry.toolResult?.success ?? true
      return (
        <div className="ml-9 mb-1.5 flex items-start gap-2">
          {success ? (
            <CheckCircle2 className="w-3 h-3 text-brand-500 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
          )}
          <span className="text-[11px] text-foreground-muted leading-relaxed">{output}</span>
        </div>
      )
    }

    case 'confirmation':
      return (
        <div className="ml-9 mb-3 border border-border rounded-md overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface-200/40">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] font-medium text-foreground">Confirmation Required</span>
          </div>
          <div className="px-3 py-2.5">
            <p className="text-xs text-foreground-muted mb-2.5 leading-relaxed">{entry.content}</p>
            {entry.toolArgs && (
              <pre className="mb-3 text-[10px] font-mono text-foreground-muted bg-surface-200/50 border border-border/50 rounded px-3 py-2 overflow-auto max-h-[80px] leading-relaxed">
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
                  variant="outline"
                  className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => onConfirm(entry.actionId!, false)}
                >
                  <X className="w-3 h-3 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      )

    case 'plan':
      return (
        <div className="ml-9 mb-1.5 flex items-center gap-1.5 text-[11px] text-foreground-muted">
          <ClipboardList className="w-3 h-3 text-brand-500 shrink-0" />
          <span>
            Plan created:{' '}
            <span className="text-foreground font-medium">
              {entry.planData?.title || 'Execution Plan'}
            </span>{' '}
            ({entry.planData?.steps?.length || 0} steps)
            {entry.planData?.status === 'draft' && (
              <span className="ml-1.5 text-[10px] text-amber-500">· awaiting confirmation</span>
            )}
          </span>
        </div>
      )

    case 'plan_update':
      return (
        <div className="ml-9 mb-1 flex items-center gap-1.5 text-[11px] text-foreground-muted font-mono">
          {entry.planUpdate?.status === 'completed' && (
            <CheckCircle2 className="w-3 h-3 text-brand-500 shrink-0" />
          )}
          {entry.planUpdate?.status === 'in_progress' && (
            <Loader2 className="w-3 h-3 text-foreground-muted animate-spin shrink-0" />
          )}
          {entry.planUpdate?.status === 'failed' && (
            <XCircle className="w-3 h-3 text-destructive shrink-0" />
          )}
          <span className="text-[10px]">{entry.planUpdate?.step_id}</span>
          <span
            className={cn(
              'text-[10px]',
              entry.planUpdate?.status === 'completed' && 'text-brand-500',
              entry.planUpdate?.status === 'in_progress' && 'text-foreground-muted',
              entry.planUpdate?.status === 'failed' && 'text-destructive'
            )}
          >
            · {entry.planUpdate?.status}
          </span>
          {entry.planUpdate?.note && (
            <span className="text-foreground-muted/60 text-[10px] font-sans">
              — {entry.planUpdate.note}
            </span>
          )}
        </div>
      )

    case 'error':
      return (
        <div className="ml-9 mb-1.5 flex items-start gap-1.5 text-xs text-destructive">
          <XCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{entry.content}</span>
        </div>
      )

    default:
      return null
  }
}
