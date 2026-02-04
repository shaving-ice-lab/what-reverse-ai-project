/**
 * 全局常量定义
 */

import { getApiBaseUrl, getWsBaseUrl } from "@/lib/env";

// ===== API 配置 =====
export const API_BASE_URL = getApiBaseUrl();
export const WS_BASE_URL = getWsBaseUrl();

// ===== 节点类型 =====
export const NODE_TYPES = {
  // AI 节点
  LLM_CHAT: "llm_chat",
  LLM_COMPLETION: "llm_completion",
  EMBEDDING: "embedding",
  
  // 集成节点
  HTTP_REQUEST: "http_request",
  WEBHOOK: "webhook",
  
  // 逻辑节点
  CONDITION: "condition",
  LOOP: "loop",
  PARALLEL: "parallel",
  DELAY: "delay",
  TRY_CATCH: "try_catch",
  
  // 数据节点
  VARIABLE: "variable",
  TRANSFORM: "transform",
  MERGE: "merge",
  FILTER: "filter",
  
  // 文本节点
  TEMPLATE: "template",
  REGEX: "regex",
  SPLIT: "split",
  
  // 代码节点
  CODE_JS: "code_js",
  EXPRESSION: "expression",
  
  // 流程节点
  START: "start",
  END: "end",
  INPUT: "input",
  OUTPUT: "output",
} as const;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];

// ===== 节点分类 =====
export const NODE_CATEGORIES = [
  { id: "ai", name: "AI", icon: "🤖", color: "#8B5CF6" },
  { id: "integration", name: "集成", icon: "🔌", color: "#3B82F6" },
  { id: "logic", name: "逻辑", icon: "⚡", color: "#F59E0B" },
  { id: "data", name: "数据", icon: "📊", color: "#10B981" },
  { id: "text", name: "文本", icon: "📝", color: "#EC4899" },
  { id: "code", name: "代码", icon: "💻", color: "#6366F1" },
  { id: "flow", name: "流程", icon: "🔄", color: "#64748B" },
] as const;

// ===== 执行状态 =====
export const EXECUTION_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  PAUSED: "paused",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type ExecutionStatus = (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];

// ===== 工作流状态 =====
export const WORKFLOW_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUS)[keyof typeof WORKFLOW_STATUS];

// ===== 触发类型 =====
export const TRIGGER_TYPES = {
  MANUAL: "manual",
  SCHEDULE: "schedule",
  WEBHOOK: "webhook",
  EVENT: "event",
} as const;

export type TriggerType = (typeof TRIGGER_TYPES)[keyof typeof TRIGGER_TYPES];

// ===== 数据类型 =====
export const DATA_TYPES = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  OBJECT: "object",
  ARRAY: "array",
  ANY: "any",
} as const;

export type DataType = (typeof DATA_TYPES)[keyof typeof DATA_TYPES];

// ===== LLM 模型 =====
export const LLM_MODELS = [
  { id: "gpt-4", name: "GPT-4", provider: "openai" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "openai" },
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "anthropic" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet", provider: "anthropic" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku", provider: "anthropic" },
  { id: "ollama/llama3", name: "Llama 3 (本地)", provider: "ollama" },
  { id: "ollama/qwen2", name: "Qwen 2 (本地)", provider: "ollama" },
] as const;

// ===== 快捷键 =====
export const SHORTCUTS = {
  UNDO: { key: "mod+z", label: "撤销" },
  REDO: { key: "mod+shift+z", label: "重做" },
  COPY: { key: "mod+c", label: "复制" },
  PASTE: { key: "mod+v", label: "粘贴" },
  DUPLICATE: { key: "mod+d", label: "复制选中" },
  DELETE: { key: "delete", label: "删除" },
  SELECT_ALL: { key: "mod+a", label: "全选" },
  SAVE: { key: "mod+s", label: "保存" },
  ZOOM_IN: { key: "mod+=", label: "放大" },
  ZOOM_OUT: { key: "mod+-", label: "缩小" },
  ZOOM_RESET: { key: "mod+0", label: "重置缩放" },
  FIT_VIEW: { key: "mod+1", label: "适应画布" },
} as const;
