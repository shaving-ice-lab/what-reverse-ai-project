'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send,
  Square,
  Loader2,
  Bot,
  User,
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
  LayoutGrid,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { chatStream, agentChatApi } from '@/lib/api/agent-chat'
import type { AgentEvent, AgentStatus } from '@/lib/api/agent-chat'
import { cn } from '@/lib/utils'

interface ChatEntry {
  id: string
  type: 'user' | 'assistant' | 'thought' | 'tool_call' | 'tool_result' | 'confirmation' | 'error' | 'done'
  content: string
  toolName?: string
  toolArgs?: Record<string, unknown>
  toolResult?: { success: boolean; output: string; error?: string }
  actionId?: string
  step?: number
  timestamp: Date
}

interface QuickSuggestion {
  label: string
  prompt: string
}

const defaultSuggestions: QuickSuggestion[] = [
  { label: '🚗 Fleet Management', prompt: 'Build me a fleet management system with vehicles, drivers, and trip tracking. Include a dashboard with stats, and CRUD pages for each entity.' },
  { label: '📋 Task Tracker', prompt: 'Create a project task tracker with projects, tasks, and team members. Include a dashboard with task stats and charts.' },
  { label: '🛒 Order Management', prompt: 'Build an order management system with customers, products, and orders. Include a dashboard with sales stats and recent orders.' },
  { label: '📊 Survey App', prompt: 'Create a survey/feedback collection app with surveys, questions, and responses. Include analytics charts for responses.' },
]

export interface AgentCompletionInfo {
  affectedResources: Set<string>
  hasUISchema: boolean
  hasDatabase: boolean
  hasWorkflow: boolean
  toolCallCount: number
}

interface AgentChatPanelProps {
  workspaceId: string
  className?: string
  onEvent?: (event: AgentEvent) => void
  onComplete?: (info: AgentCompletionInfo) => void
  suggestions?: QuickSuggestion[]
  previewUrl?: string
  builderUrl?: string
}

let entryIdCounter = 0
function nextEntryId() {
  return `entry_${++entryIdCounter}_${Date.now()}`
}

export function AgentChatPanel({ workspaceId, className, onEvent, onComplete, suggestions, previewUrl, builderUrl }: AgentChatPanelProps) {
  const quickSuggestions = suggestions || defaultSuggestions
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const controllerRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null)
  const [completionInfo, setCompletionInfo] = useState<AgentCompletionInfo | null>(null)
  const affectedRef = useRef<Set<string>>(new Set())
  const toolCallCountRef = useRef(0)

  useEffect(() => {
    agentChatApi.getStatus(workspaceId).then(setAgentStatus).catch(() => {})
  }, [workspaceId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  const addEntry = useCallback((entry: Omit<ChatEntry, 'id' | 'timestamp'>) => {
    setEntries((prev) => [...prev, { ...entry, id: nextEntryId(), timestamp: new Date() }])
  }, [])

  const handleSend = useCallback(() => {
    if (!input.trim() || running) return
    const message = input.trim()
    setInput('')
    setRunning(true)

    addEntry({ type: 'user', content: message })

    const sid = sessionId || `session_${Date.now()}`
    if (!sessionId) setSessionId(sid)

    const controller = chatStream(
      workspaceId,
      message,
      sid,
      (event: AgentEvent) => {
        onEvent?.(event)

        if (event.session_id && !sessionId) {
          setSessionId(event.session_id)
        }

        // Track affected resources
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
            // Track specific resource types from tool names
            if (event.tool_result?.success) {
              if (event.tool_name === 'generate_ui_schema' || event.tool_name === 'modify_ui_schema') {
                affectedRef.current.add('ui_schema')
              }
              if (event.tool_name === 'create_table' || event.tool_name === 'alter_table' || event.tool_name === 'insert_data') {
                affectedRef.current.add('database')
              }
              if (event.tool_name === 'create_workflow' || event.tool_name === 'modify_workflow') {
                affectedRef.current.add('workflow')
              }
            }
            addEntry({
              type: 'tool_result',
              content: event.tool_result?.output || '',
              toolName: event.tool_name,
              toolResult: event.tool_result ? {
                success: event.tool_result.success,
                output: event.tool_result.output,
                error: event.tool_result.error,
              } : undefined,
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
            const info: AgentCompletionInfo = {
              affectedResources: new Set(affectedRef.current),
              hasUISchema: affectedRef.current.has('ui_schema'),
              hasDatabase: affectedRef.current.has('database'),
              hasWorkflow: affectedRef.current.has('workflow'),
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
      (error) => {
        addEntry({ type: 'error', content: error })
        setRunning(false)
      },
      () => {
        setRunning(false)
      }
    )

    controllerRef.current = controller
  }, [input, running, workspaceId, sessionId, addEntry])

  const handleStop = () => {
    controllerRef.current?.abort()
    if (sessionId) {
      agentChatApi.cancelSession(workspaceId, sessionId).catch(() => {})
    }
    setRunning(false)
  }

  const handleConfirm = async (actionId: string, approved: boolean) => {
    if (!sessionId) return
    try {
      await agentChatApi.confirmAction(workspaceId, sessionId, actionId, approved)
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

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Bot className="w-4 h-4 text-brand-500" />
        <span className="text-sm font-medium text-foreground">AI Agent</span>
        {agentStatus && (
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
              agentStatus.provider === 'openai'
                ? 'bg-green-500/10 text-green-600'
                : agentStatus.provider === 'ollama'
                  ? 'bg-blue-500/10 text-blue-600'
                  : 'bg-amber-500/10 text-amber-600'
            )}
          >
            {agentStatus.provider === 'openai'
              ? `OpenAI · ${agentStatus.model}`
              : agentStatus.provider === 'ollama'
                ? `Ollama · ${agentStatus.model}`
                : 'Heuristic'}
          </span>
        )}
        {running && (
          <span className="text-[10px] text-foreground-muted flex items-center gap-1 ml-auto">
            <Loader2 className="w-3 h-3 animate-spin" />
            Thinking...
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-foreground-muted text-sm px-4">
            <Bot className="w-8 h-8 mb-3 opacity-30" />
            <p className="font-medium text-foreground">What do you want to build?</p>
            <p className="text-xs mt-1 text-center max-w-md">
              Describe your app and the AI Agent will create database tables, generate UI pages, and build a complete working application.
            </p>
            {quickSuggestions.length > 0 && (
              <div className="mt-4 grid gap-2 w-full max-w-md">
                {quickSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s.prompt); }}
                    className="text-left px-3 py-2.5 rounded-lg border border-border/60 bg-surface-100/50 hover:bg-surface-200/60 hover:border-border transition-colors group"
                  >
                    <span className="text-xs font-medium text-foreground">{s.label}</span>
                    <p className="text-[11px] text-foreground-muted mt-0.5 line-clamp-1 group-hover:text-foreground-light transition-colors">{s.prompt}</p>
                  </button>
                ))}
              </div>
            )}
            {agentStatus?.provider === 'heuristic' && (
              <p className="text-[10px] mt-3 text-amber-500">
                Tip: Set OPENAI_API_KEY or OLLAMA_HOST for full AI capabilities
              </p>
            )}
          </div>
        )}

        {entries.map((entry) => (
          <ChatEntryView
            key={entry.id}
            entry={entry}
            onConfirm={handleConfirm}
          />
        ))}

        {running && (
          <div className="flex items-center gap-2 text-xs text-foreground-muted pl-8">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Agent is working...
          </div>
        )}

        {/* App Ready Banner — shown after agent completes with UI schema */}
        {completionInfo && completionInfo.hasUISchema && !running && (previewUrl || builderUrl) && (
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
                  {completionInfo.hasWorkflow && ' · Workflows configured'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview App
                </a>
              )}
              {builderUrl && (
                <a
                  href={builderUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-foreground text-xs font-medium hover:bg-surface-200/50 transition-colors"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Open Builder
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the Agent..."
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
