import { request } from './shared'

// ========== Types ==========

export type AgentEventType =
  | 'thought'
  | 'tool_call'
  | 'tool_result'
  | 'confirmation_required'
  | 'message'
  | 'done'
  | 'error'

export interface AgentToolResult {
  success: boolean
  output: string
  data?: unknown
  error?: string
}

export type AffectedResource = 'workflow' | 'database' | 'ui_schema' | ''

export interface AgentEvent {
  type: AgentEventType
  step?: number
  content?: string
  tool_name?: string
  tool_args?: Record<string, unknown>
  tool_result?: AgentToolResult
  action_id?: string
  error?: string
  session_id?: string
  affected_resource?: AffectedResource
}

export interface AgentSession {
  id: string
  workspace_id: string
  user_id: string
  status: 'running' | 'paused' | 'completed' | 'failed'
  messages: AgentMessage[]
  tool_calls: AgentToolCall[]
  pending_action?: {
    action_id: string
    tool_name: string
    tool_args: Record<string, unknown>
    step: number
  }
  created_at: string
  updated_at: string
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface AgentToolCall {
  step: number
  tool_name: string
  args: Record<string, unknown>
  result: AgentToolResult
  timestamp: string
}

export interface AgentSessionSummary {
  id: string
  workspace_id: string
  user_id: string
  status: string
  message_count: number
  created_at: string
  updated_at: string
}

export interface AgentStatus {
  provider: 'openai' | 'ollama' | 'heuristic'
  model: string
  active_sessions: number
}

// ========== SSE Chat Stream ==========

export function chatStream(
  workspaceId: string,
  message: string,
  sessionId?: string,
  onEvent?: (event: AgentEvent) => void,
  onError?: (error: string) => void,
  onDone?: () => void
): AbortController {
  const controller = new AbortController()

  ;(async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

      const res = await fetch(`${baseUrl}/workspaces/${workspaceId}/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, session_id: sessionId }),
        signal: controller.signal,
      })

      if (!res.ok) {
        onError?.(`HTTP ${res.status}: ${res.statusText}`)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        onError?.('No response body')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEventType = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            try {
              const event: AgentEvent = JSON.parse(dataStr)
              onEvent?.(event)
              if (event.type === 'done') {
                onDone?.()
              } else if (event.type === 'error') {
                onError?.(event.error || 'Unknown error')
              }
            } catch {
              // ignore malformed JSON
            }
          }
        }
      }

      onDone?.()
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        onError?.(err?.message || 'Stream failed')
      }
    }
  })()

  return controller
}

// ========== REST API ==========

export const agentChatApi = {
  async confirmAction(
    workspaceId: string,
    sessionId: string,
    actionId: string,
    approved: boolean
  ) {
    return request<{ message: string }>(`/workspaces/${workspaceId}/agent/confirm`, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, action_id: actionId, approved }),
    })
  },

  async cancelSession(workspaceId: string, sessionId: string) {
    return request<{ message: string }>(`/workspaces/${workspaceId}/agent/cancel`, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    })
  },

  async listSessions(workspaceId: string): Promise<AgentSessionSummary[]> {
    const res = await request<AgentSessionSummary[]>(`/workspaces/${workspaceId}/agent/sessions`)
    return res || []
  },

  async getSession(workspaceId: string, sessionId: string): Promise<AgentSession> {
    return request<AgentSession>(`/workspaces/${workspaceId}/agent/sessions/${sessionId}`)
  },

  async deleteSession(workspaceId: string, sessionId: string) {
    return request<{ message: string }>(
      `/workspaces/${workspaceId}/agent/sessions/${sessionId}`,
      { method: 'DELETE' }
    )
  },

  async getStatus(workspaceId: string): Promise<AgentStatus> {
    return request<AgentStatus>(`/workspaces/${workspaceId}/agent/status`)
  },
}
