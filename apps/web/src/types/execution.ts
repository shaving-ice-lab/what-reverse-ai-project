/**
 * ExecuteRecordTypeDefinition
 */

// ExecuteStatus
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

// NodeExecuteStatus
export type NodeExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

// TriggerType
export type TriggerType = 'manual' | 'schedule' | 'webhook' | 'api'

// ExecuteRecord
export interface ExecutionRecord {
  id: string
  workflowId: string
  workflowName?: string
  workflowIcon?: string
  userId: string
  status: ExecutionStatus
  triggerType: TriggerType
  triggerData?: Record<string, unknown>
  inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
  context?: Record<string, unknown>
  startedAt?: string
  completedAt?: string
  durationMs?: number
  errorMessage?: string
  errorNodeId?: string
  tokenUsage?: TokenUsage
  createdAt: string
}

// Token Usage
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCost?: number
}

// NodeExecuteLogs
export interface NodeLog {
  id: string
  executionId: string
  nodeId: string
  nodeType: string
  nodeName?: string
  status: NodeExecutionStatus
  inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
  startedAt?: string
  completedAt?: string
  durationMs?: number
  errorMessage?: string
  logs?: LogEntry[]
  createdAt: string
}

// Logsitem
export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: string
  data?: Record<string, unknown>
}

// ExecuteDetails(ContainsNodeLogs)
export interface ExecutionDetail extends ExecutionRecord {
  nodeLogs: NodeLog[]
}

// ExecuteListRequestParameter
export interface ListExecutionsParams {
  workflowId?: string
  status?: ExecutionStatus
  triggerType?: TriggerType
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
}

// ExecuteListResponse
export interface ListExecutionsResponse {
  success: boolean
  data: ExecutionRecord[]
  meta: {
    total: number
    page: number
    pageSize: number
  }
}

// ExecuteDetailsResponse
export interface GetExecutionResponse {
  success: boolean
  data: ExecutionDetail
}

// CancelExecuteResponse
export interface CancelExecutionResponse {
  success: boolean
  message: string
}

// RetryExecuteResponse
export interface RetryExecutionResponse {
  success: boolean
  data: {
    executionId: string
  }
}

// WebSocket MessageType
export type WSMessageType =
  | 'execution.started'
  | 'execution.completed'
  | 'execution.failed'
  | 'execution.cancelled'
  | 'execution.progress'
  | 'execution.node.started'
  | 'execution.node.completed'
  | 'execution.node.failed'
  | 'execution.log'

// WebSocket Message
export interface WSMessage {
  type: WSMessageType
  payload: WSPayload
}

// WebSocket MessagePayload
export interface WSPayload {
  executionId?: string
  workflowId?: string
  nodeId?: string
  nodeType?: string
  status?: ExecutionStatus | NodeExecutionStatus
  progress?: number
  totalNodes?: number
  completedNodes?: number
  inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
  error?: string
  durationMs?: number
  timestamp?: string
  level?: 'info' | 'warn' | 'error' | 'debug'
  message?: string
}
