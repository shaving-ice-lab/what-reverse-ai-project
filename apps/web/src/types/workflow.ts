/**
 * WorkflowRelatedTypeDefinition
 */

import type { Node, Edge } from '@xyflow/react'

// ===== BasicType =====

export type DataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any'

export type NodeCategory =
  | 'ai'
  | 'integration'
  | 'logic'
  | 'data'
  | 'text'
  | 'code'
  | 'flow'
  | 'io'
  | 'custom'

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type WorkflowStatus = 'draft' | 'published' | 'archived'

export type TriggerType = 'manual' | 'schedule' | 'webhook' | 'event'

// ===== PortDefinition =====

export interface PortDefinition {
  id: string
  name: string
  type: DataType
  required?: boolean
  multiple?: boolean
  defaultValue?: unknown
  description?: string
}

// ===== NodeConfig =====

export interface BaseNodeConfig {
  label: string
  description?: string
  icon?: string
}

export interface LLMNodeConfig extends BaseNodeConfig {
  model: string
  systemPrompt: string
  userPrompt: string
  temperature: number
  maxTokens: number
  max_tokens?: number
  outputSchema?: Record<string, unknown>
  output_schema?: Record<string, unknown>
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  streaming: boolean
  timeout: number
  retryCount: number
}

export interface HTTPNodeConfig extends BaseNodeConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  headers: Record<string, string>
  queryParams: Record<string, string>
  body?: unknown
  bodyType: 'json' | 'form' | 'raw'
  timeout: number
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'apiKey'
    username?: string
    password?: string
    token?: string
    key?: string
    value?: string
    position?: 'header' | 'query'
  }
}

export interface ConditionNodeConfig extends BaseNodeConfig {
  conditions: ConditionGroup[]
  logic: 'and' | 'or'
}

export interface ConditionGroup {
  id: string
  conditions: Condition[]
  logic: 'and' | 'or'
}

export interface Condition {
  id: string
  left: string
  operator: ConditionOperator
  right: string
}

export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'matches'
  | 'empty'
  | 'notEmpty'

export interface LoopNodeConfig extends BaseNodeConfig {
  mode: 'forEach' | 'while' | 'count'
  items?: string
  condition?: string
  count?: number
  maxIterations: number
}

export interface CodeNodeConfig extends BaseNodeConfig {
  language: 'javascript'
  code: string
  timeout: number
}

export interface TemplateNodeConfig extends BaseNodeConfig {
  template: string
}

export interface VariableNodeConfig extends BaseNodeConfig {
  variableName: string
  value: unknown
  valueType: DataType
}

export interface DatabaseNodeConfig extends BaseNodeConfig {
  operation?: 'select' | 'insert' | 'update' | 'delete' | 'migrate'
  table?: string
  where?: string
  values?: unknown
  limit?: number
  sql?: string
}

// ===== NodeData =====

export interface WorkflowNodeData {
  label: string
  icon?: string
  description?: string
  config: Record<string, unknown>
  inputs: PortDefinition[]
  outputs: PortDefinition[]
}

export interface WorkflowNode extends Node<WorkflowNodeData> {
  type: string
}

// ===== ProtocolNodeStructure =====

export interface WorkflowNodeProtocol {
  id: string
  type: string
  position: { x: number; y: number }
  data?: WorkflowNodeData
  inputs?: PortDefinition[]
  outputs?: PortDefinition[]
}

export interface WorkflowEdge extends Edge {
  data?: {
    label?: string
  }
}

// ===== WorkflowDefinition =====

export interface WorkflowDefinition {
  version: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  settings: WorkflowSettings
}

export interface WorkflowSettings {
  timeout: number
  retryPolicy: {
    maxRetries: number
    backoffMs: number
  }
  errorHandling: 'stop' | 'continue' | 'fallback'
}

// ===== WorkflowEntity =====

export interface Workflow {
  id: string
  userId: string
  name: string
  description: string
  icon: string
  definition: WorkflowDefinition
  variables: Record<string, unknown>
  status: WorkflowStatus
  isPublic: boolean
  triggerType: TriggerType
  triggerConfig: Record<string, unknown>
  runCount: number
  starCount: number
  forkCount: number
  version: number
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  folderId: string | null
}

// ===== ExecuteRelated =====

export interface Execution {
  id: string
  workflowId: string
  userId: string
  status: ExecutionStatus
  triggerType: TriggerType
  triggerData: Record<string, unknown>
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  context: Record<string, unknown>
  startedAt: string | null
  completedAt: string | null
  durationMs: number | null
  errorMessage: string | null
  errorNodeId: string | null
  tokenUsage: {
    prompt: number
    completion: number
    total: number
  }
  createdAt: string
}

export interface NodeLog {
  id: string
  executionId: string
  nodeId: string
  nodeType: string
  status: ExecutionStatus
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  startedAt: string | null
  completedAt: string | null
  durationMs: number | null
  errorMessage: string | null
  logs: LogEntry[]
  createdAt: string
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: string
  data?: Record<string, unknown>
}
