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

interface AgentChatPanelProps {
  workspaceId: string
  className?: string
}

let entryIdCounter = 0
function nextEntryId() {
  return `entry_${++entryIdCounter}_${Date.now()}`
}

export function AgentChatPanel({ workspaceId, className }: AgentChatPanelProps) {
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const controllerRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null)

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
        if (event.session_id && !sessionId) {
          setSessionId(event.session_id)
        }

        switch (event.type) {
          case 'thought':
            addEntry({ type: 'thought', content: event.content || '', step: event.step })
            break
          case 'tool_call':
            addEntry({
              type: 'tool_call',
              content: `Calling tool: ${event.tool_name}`,
              toolName: event.tool_name,
              toolArgs: event.tool_args,
              step: event.step,
            })
            break
          case 'tool_result':
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
          case 'done':
            setRunning(false)
            break
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
          <div className="flex flex-col items-center justify-center h-full text-foreground-muted text-sm">
            <Bot className="w-8 h-8 mb-3 opacity-30" />
            <p>Ask the Agent to help build your application.</p>
            <p className="text-xs mt-1">e.g. &quot;Build a fleet management system&quot; or &quot;Create a customer feedback app&quot;</p>
            {agentStatus?.provider === 'heuristic' && (
              <p className="text-[10px] mt-2 text-amber-500">
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
