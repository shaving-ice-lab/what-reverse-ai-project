/**
 * allConstantDefinition
 */

import { getApiBaseUrl, getWsBaseUrl } from '@/lib/env'

// ===== API Config =====
export const API_BASE_URL = getApiBaseUrl()
export const WS_BASE_URL = getWsBaseUrl()

// ===== NodeType =====
export const NODE_TYPES = {
  // AI Node
  LLM_CHAT: 'llm_chat',
  LLM_COMPLETION: 'llm_completion',
  EMBEDDING: 'embedding',

  // IntegrationNode
  HTTP_REQUEST: 'http_request',
  WEBHOOK: 'webhook',

  // LogicNode
  CONDITION: 'condition',
  LOOP: 'loop',
  PARALLEL: 'parallel',
  DELAY: 'delay',
  TRY_CATCH: 'try_catch',

  // DataNode
  VARIABLE: 'variable',
  TRANSFORM: 'transform',
  MERGE: 'merge',
  FILTER: 'filter',

  // TextNode
  TEMPLATE: 'template',
  REGEX: 'regex',
  SPLIT: 'split',

  // CodeNode
  CODE_JS: 'code_js',
  EXPRESSION: 'expression',

  // FlowNode
  START: 'start',
  END: 'end',
  INPUT: 'input',
  OUTPUT: 'output',
} as const

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES]

// ===== NodeCategory =====
export const NODE_CATEGORIES = [
  { id: 'ai', name: 'AI', icon: '🤖', color: '#8B5CF6' },
  { id: 'integration', name: 'Integration', icon: '🔌', color: '#3B82F6' },
  { id: 'logic', name: 'Logic', icon: '⚡', color: '#F59E0B' },
  { id: 'data', name: 'Data', icon: '📊', color: '#10B981' },
  { id: 'text', name: 'Text', icon: '📝', color: '#EC4899' },
  { id: 'code', name: 'Code', icon: '💻', color: '#6366F1' },
  { id: 'flow', name: 'Flow', icon: '🔄', color: '#64748B' },
] as const

// ===== ExecuteStatus =====
export const EXECUTION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export type ExecutionStatus = (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS]

// ===== WorkflowStatus =====
export const WORKFLOW_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

export type WorkflowStatus = (typeof WORKFLOW_STATUS)[keyof typeof WORKFLOW_STATUS]

// ===== TriggerType =====
export const TRIGGER_TYPES = {
  MANUAL: 'manual',
  SCHEDULE: 'schedule',
  WEBHOOK: 'webhook',
  EVENT: 'event',
} as const

export type TriggerType = (typeof TRIGGER_TYPES)[keyof typeof TRIGGER_TYPES]

// ===== DataType =====
export const DATA_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  OBJECT: 'object',
  ARRAY: 'array',
  ANY: 'any',
} as const

export type DataType = (typeof DATA_TYPES)[keyof typeof DATA_TYPES]

// ===== LLM Model =====
export const LLM_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic' },
  { id: 'ollama/llama3', name: 'Llama 3 (Local)', provider: 'ollama' },
  { id: 'ollama/qwen2', name: 'Qwen 2 (Local)', provider: 'ollama' },
] as const

// ===== Shortcutkey =====
export const SHORTCUTS = {
  UNDO: { key: 'mod+z', label: 'Undo' },
  REDO: { key: 'mod+shift+z', label: 'Redo' },
  COPY: { key: 'mod+c', label: 'Copy' },
  PASTE: { key: 'mod+v', label: 'Paste' },
  DUPLICATE: { key: 'mod+d', label: 'Duplicate Selection' },
  DELETE: { key: 'delete', label: 'Delete' },
  SELECT_ALL: { key: 'mod+a', label: 'Select All' },
  SAVE: { key: 'mod+s', label: 'Save' },
  ZOOM_IN: { key: 'mod+=', label: 'Zoom In' },
  ZOOM_OUT: { key: 'mod+-', label: 'Zoom Out' },
  ZOOM_RESET: { key: 'mod+0', label: 'Reset Zoom' },
  FIT_VIEW: { key: 'mod+1', label: 'Fit Canvas' },
} as const
