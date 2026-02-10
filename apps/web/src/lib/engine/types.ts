/**
 * ExecuteEngineTypeDefinition
 */

import type { Edge } from '@xyflow/react'
import type { WorkflowNode } from '@/types/workflow'
import type { NodeResult, LogEntry } from '@/lib/nodes/types'

// ExecuteStatus
export type ExecutionStatus =
  | 'pending' // etcpendingExecute
  | 'running' // Execute
  | 'completed' // ExecuteDone
  | 'failed' // ExecuteFailed
  | 'cancelled' // Cancelled
  | 'paused' // Paused

// NodeExecuteStatus
export interface NodeExecutionState {
  nodeId: string
  status: ExecutionStatus
  startTime?: string
  endTime?: string
  duration?: number
  inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
  error?: {
    code: string
    message: string
    details?: unknown
  }
  logs?: LogEntry[]
  retryCount?: number
}

// WorkflowExecuteStatus
export interface WorkflowExecutionState {
  executionId: string
  workflowId: string
  status: ExecutionStatus
  startTime: string
  endTime?: string
  duration?: number
  nodeStates: Record<string, NodeExecutionState>
  variables: Record<string, unknown>
  currentNodeIds: string[]
  completedNodeIds: string[]
  failedNodeIds: string[]
  logs: LogEntry[]
  error?: {
    code: string
    message: string
    nodeId?: string
  }
}

// ExecuteConfig
export interface ExecutionConfig {
  // TimeoutSettings
  timeout?: number
  nodeTimeout?: number

  // RetrySettings
  retryCount?: number
  retryDelay?: number

  // ConcurrencySettings
  maxConcurrency?: number

  // DebugSettings
  debug?: boolean
  breakpoints?: string[]

  // Callback
  onNodeStart?: (nodeId: string) => void
  onNodeComplete?: (nodeId: string, result: NodeResult) => void
  onNodeError?: (nodeId: string, error: unknown) => void
  onLog?: (log: LogEntry) => void
  onStateChange?: (state: WorkflowExecutionState) => void
}

// WorkflowDefinition
export interface WorkflowDefinition {
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: Edge[]
  variables?: Record<string, unknown>
}

// ExecuteInput
export interface ExecutionInput {
  workflow: WorkflowDefinition
  inputs?: Record<string, unknown>
  config?: ExecutionConfig
}

// ExecuteResult
export interface ExecutionResult {
  executionId: string
  status: ExecutionStatus
  outputs: Record<string, unknown>
  duration: number
  nodeResults: Record<string, NodeResult>
  logs: LogEntry[]
  error?: {
    code: string
    message: string
    nodeId?: string
  }
}

// DAG NodeInfo
export interface DAGNode {
  id: string
  type: string
  dependencies: string[]
  dependents: string[]
  level: number
}

// DAG AnalyticsResult
export interface DAGAnalysis {
  nodes: Record<string, DAGNode>
  levels: string[][]
  executionOrder: string[]
  hasCircle: boolean
  startNodes: string[]
  endNodes: string[]
}

// ExecuteEvent
export type ExecutionEvent =
  | { type: 'start'; executionId: string; timestamp: string }
  | { type: 'node_start'; nodeId: string; timestamp: string }
  | { type: 'node_complete'; nodeId: string; result: NodeResult; timestamp: string }
  | { type: 'node_error'; nodeId: string; error: unknown; timestamp: string }
  | { type: 'complete'; result: ExecutionResult; timestamp: string }
  | { type: 'error'; error: unknown; timestamp: string }
  | { type: 'cancel'; timestamp: string }
  | { type: 'pause'; timestamp: string }
  | { type: 'resume'; timestamp: string }
  | { type: 'log'; log: LogEntry }

// ExecuteEventListen
export type ExecutionEventListener = (event: ExecutionEvent) => void
