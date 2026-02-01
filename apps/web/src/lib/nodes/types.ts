/**
 * 节点执行器类型定义
 */

// 节点执行上下文
export interface NodeContext {
  nodeId: string;
  nodeType: string;
  nodeConfig: Record<string, unknown>;
  variables: Record<string, unknown>;
  inputs: Record<string, unknown>;
  abortSignal?: AbortSignal;
}

// 节点执行结果
export interface NodeResult {
  success: boolean;
  outputs: Record<string, unknown>;
  error?: NodeError;
  logs?: LogEntry[];
  usage?: UsageInfo;
  duration?: number;
}

// 节点错误
export interface NodeError {
  code: string;
  message: string;
  details?: unknown;
  retryable?: boolean;
}

// 日志条目
export interface LogEntry {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
  data?: unknown;
}

// 使用量信息 (主要用于 LLM 节点)
export interface UsageInfo {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
}

// LLM 配置
export interface LLMConfig {
  model: string;
  systemPrompt?: string;
  userPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  streaming?: boolean;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

// LLM 消息格式
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// LLM 响应
export interface LLMResponse {
  content: string;
  finishReason?: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  raw?: unknown;
}

// HTTP 配置
export interface HTTPConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
  bodyType?: "none" | "json" | "form" | "raw";
  timeout?: number;
  authType?: "none" | "basic" | "bearer" | "apiKey";
  authConfig?: {
    username?: string;
    password?: string;
    token?: string;
    apiKeyName?: string;
    apiKeyValue?: string;
    apiKeyIn?: "header" | "query";
  };
  followRedirects?: boolean;
  validateStatus?: boolean;
}

// HTTP 响应
export interface HTTPResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  duration: number;
}

// 条件配置
export interface ConditionConfig {
  conditions: ConditionGroup[];
  logic: "and" | "or";
}

export interface ConditionGroup {
  id: string;
  conditions: SingleCondition[];
  logic: "and" | "or";
}

export interface SingleCondition {
  id: string;
  left: string;
  operator: ConditionOperator;
  right: string;
}

export type ConditionOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "matches"
  | "empty"
  | "notEmpty";

// 循环配置
export interface LoopConfig {
  mode: "forEach" | "while" | "count";
  items?: string; // 变量路径
  condition?: string; // 条件表达式
  count?: number;
  maxIterations?: number;
}

// 变量配置
export interface VariableConfig {
  variableName: string;
  valueType: "string" | "number" | "boolean" | "object" | "array";
  value: unknown;
}

// 模板配置
export interface TemplateConfig {
  template: string;
}

// 代码配置
export interface CodeConfig {
  language: "javascript" | "typescript";
  code: string;
  timeout?: number;
}

// 节点执行器接口
export interface NodeExecutor<TConfig = unknown> {
  type: string;
  execute(context: NodeContext & { nodeConfig: TConfig }): Promise<NodeResult>;
  validate?(config: TConfig): { valid: boolean; errors: string[] };
}

// 流式响应回调
export type StreamCallback = (chunk: string, done: boolean) => void;
