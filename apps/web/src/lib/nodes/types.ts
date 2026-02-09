/**
 * NodeExecuteTypeDefinition
 */

// NodeExecuteContext
export interface NodeContext {
 nodeId: string;
 nodeType: string;
 nodeConfig: Record<string, unknown>;
 variables: Record<string, unknown>;
 inputs: Record<string, unknown>;
 abortSignal?: AbortSignal;
}

// NodeExecuteResult
export interface NodeResult {
 success: boolean;
 outputs: Record<string, unknown>;
 error?: NodeError;
 logs?: LogEntry[];
 usage?: UsageInfo;
 duration?: number;
}

// NodeError
export interface NodeError {
 code: string;
 message: string;
 details?: unknown;
 retryable?: boolean;
}

// Logsitem
export interface LogEntry {
 level: "debug" | "info" | "warn" | "error";
 message: string;
 timestamp: string;
 data?: unknown;
}

// Usage info (mainly used for LLM Node)
export interface UsageInfo {
 promptTokens?: number;
 completionTokens?: number;
 totalTokens?: number;
 cost?: number;
}

// LLM Config
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
 fallbackModels?: string[];
 fallbackProviders?: string[];
 fallbackText?: string;
 apiKeys?: Record<string, string>;
}

// LLM MessageFormat
export interface LLMMessage {
 role: "system" | "user" | "assistant";
 content: string;
}

// LLM Response
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

// HTTP Config
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

// HTTP Response
export interface HTTPResponse {
 status: number;
 statusText: string;
 headers: Record<string, string>;
 data: unknown;
 duration: number;
}

// ConditionConfig
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

// LoopConfig
export interface LoopConfig {
 mode: "forEach" | "while" | "count";
 items?: string; // VariablePath
 condition?: string; // ConditionExpression
 count?: number;
 maxIterations?: number;
}

// VariableConfig
export interface VariableConfig {
 variableName: string;
 valueType: "string" | "number" | "boolean" | "object" | "array";
 value: unknown;
}

// TemplateConfig
export interface TemplateConfig {
 template: string;
}

// CodeConfig
export interface CodeConfig {
 language: "javascript" | "typescript";
 code: string;
 timeout?: number;
}

// NodeExecuteInterface
export interface NodeExecutor<TConfig = unknown> {
 type: string;
 execute(context: NodeContext & { nodeConfig: TConfig }): Promise<NodeResult>;
 validate?(config: TConfig): { valid: boolean; errors: string[] };
}

// StreamingResponseCallback
export type StreamCallback = (chunk: string, done: boolean) => void;
