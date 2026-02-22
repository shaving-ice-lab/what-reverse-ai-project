import { request, type ApiResponse } from './shared'
import { getAccessToken } from './client'

/** Unwrap the { code, data } envelope returned by the backend */
function unwrap<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as ApiResponse<T>).data as T
  }
  return res as T
}

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

export type AffectedResource = 'database' | 'ui_schema' | 'persona' | ''

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
  persona_id?: string
  status: string
  message_count: number
  title?: string
  created_at: string
  updated_at: string
}

export interface PersonaSuggestion {
  label: string
  prompt: string
}

export interface PersonaMeta {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: string
  suggestions: PersonaSuggestion[]
  builtin: boolean
  enabled: boolean
}

export interface AgentStatus {
  provider: 'openai' | 'ollama' | 'heuristic'
  model: string
  active_sessions: number
}

export interface PlanGroup {
  id: string
  label: string
  icon?: string
}

export interface PlanStep {
  id: string
  description: string
  tool?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  note?: string
  group_id?: string
}

export interface AgentPlan {
  title: string
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed'
  summary?: string
  groups?: PlanGroup[]
  steps: PlanStep[]
}

// ========== SSE Chat Stream ==========

export interface ChatStreamOptions {
  workspaceId: string
  message: string
  sessionId?: string
  personaId?: string
  onEvent?: (event: AgentEvent) => void
  onError?: (error: string) => void
  onDone?: () => void
}

export function chatStream(opts: ChatStreamOptions): AbortController {
  const { workspaceId, message, sessionId, personaId, onEvent, onError, onDone } = opts
  const controller = new AbortController()

  ;(async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
      const token = getAccessToken()

      const res = await fetch(`${baseUrl}/workspaces/${workspaceId}/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, session_id: sessionId, persona_id: personaId }),
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
      let receivedDoneOrError = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            try {
              const event: AgentEvent = JSON.parse(dataStr)
              onEvent?.(event)
              if (event.type === 'done' || event.type === 'error') {
                receivedDoneOrError = true
              }
            } catch {
              // ignore malformed JSON
            }
          }
        }
      }

      // Only call onDone if the stream ended without a done/error event
      // (e.g. server closed connection unexpectedly)
      if (!receivedDoneOrError) {
        onDone?.()
      }
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
  async confirmAction(workspaceId: string, sessionId: string, actionId: string, approved: boolean) {
    const res = await request(`/workspaces/${workspaceId}/agent/confirm`, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, action_id: actionId, approved }),
    })
    return unwrap<{ message: string }>(res)
  },

  async cancelSession(workspaceId: string, sessionId: string) {
    const res = await request(`/workspaces/${workspaceId}/agent/cancel`, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    })
    return unwrap<{ message: string }>(res)
  },

  async listSessions(workspaceId: string): Promise<AgentSessionSummary[]> {
    const res = await request(`/workspaces/${workspaceId}/agent/sessions`)
    const data = unwrap<AgentSessionSummary[]>(res)
    return Array.isArray(data) ? data : []
  },

  async getSession(workspaceId: string, sessionId: string): Promise<AgentSession> {
    const res = await request(`/workspaces/${workspaceId}/agent/sessions/${sessionId}`)
    return unwrap<AgentSession>(res)
  },

  async deleteSession(workspaceId: string, sessionId: string) {
    const res = await request(`/workspaces/${workspaceId}/agent/sessions/${sessionId}`, {
      method: 'DELETE',
    })
    return unwrap<{ message: string }>(res)
  },

  async confirmPlan(
    workspaceId: string,
    sessionId: string
  ): Promise<{ message: string; phase: string; plan: AgentPlan }> {
    const res = await request(
      `/workspaces/${workspaceId}/agent/sessions/${sessionId}/confirm-plan`,
      {
        method: 'POST',
      }
    )
    return unwrap<{ message: string; phase: string; plan: AgentPlan }>(res)
  },

  async getStatus(workspaceId: string): Promise<AgentStatus> {
    const res = await request(`/workspaces/${workspaceId}/agent/status`)
    return unwrap<AgentStatus>(res)
  },

  // Persona API
  async listPersonas(workspaceId: string): Promise<PersonaMeta[]> {
    const res = await request(`/workspaces/${workspaceId}/agent/personas`)
    const data = unwrap<PersonaMeta[]>(res)
    return Array.isArray(data) ? data : []
  },

  async getPersona(workspaceId: string, personaId: string): Promise<PersonaMeta> {
    const res = await request(`/workspaces/${workspaceId}/agent/personas/${personaId}`)
    return unwrap<PersonaMeta>(res)
  },

  async createPersona(
    workspaceId: string,
    data: {
      name: string
      description?: string
      icon?: string
      color?: string
      system_prompt: string
      suggestions?: PersonaSuggestion[]
    }
  ) {
    const res = await request(`/workspaces/${workspaceId}/agent/personas`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return unwrap<PersonaMeta>(res)
  },

  async updatePersona(
    workspaceId: string,
    personaId: string,
    data: {
      name?: string
      description?: string
      icon?: string
      color?: string
      system_prompt?: string
      suggestions?: PersonaSuggestion[]
    }
  ) {
    const res = await request(`/workspaces/${workspaceId}/agent/personas/${personaId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return unwrap<PersonaMeta>(res)
  },

  async deletePersona(workspaceId: string, personaId: string) {
    const res = await request(`/workspaces/${workspaceId}/agent/personas/${personaId}`, {
      method: 'DELETE',
    })
    return unwrap<{ message: string }>(res)
  },
}
