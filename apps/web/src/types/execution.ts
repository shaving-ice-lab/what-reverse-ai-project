/**
 * 执行记录类型定义
 */

// 执行状态
export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

// 节点执行状态
export type NodeExecutionStatus = "pending" | "running" | "completed" | "failed" | "skipped";

// 触发类型
export type TriggerType = "manual" | "schedule" | "webhook" | "api";

// 执行记录
export interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName?: string;
  workflowIcon?: string;
  userId: string;
  status: ExecutionStatus;
  triggerType: TriggerType;
  triggerData?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  context?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  errorNodeId?: string;
  tokenUsage?: TokenUsage;
  createdAt: string;
}

// Token 使用量
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number;
}

// 节点执行日志
export interface NodeLog {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  nodeName?: string;
  status: NodeExecutionStatus;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  logs?: LogEntry[];
  createdAt: string;
}

// 日志条目
export interface LogEntry {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

// 执行详情（包含节点日志）
export interface ExecutionDetail extends ExecutionRecord {
  nodeLogs: NodeLog[];
}

// 执行列表请求参数
export interface ListExecutionsParams {
  workflowId?: string;
  status?: ExecutionStatus;
  triggerType?: TriggerType;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

// 执行列表响应
export interface ListExecutionsResponse {
  success: boolean;
  data: ExecutionRecord[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// 执行详情响应
export interface GetExecutionResponse {
  success: boolean;
  data: ExecutionDetail;
}

// 取消执行响应
export interface CancelExecutionResponse {
  success: boolean;
  message: string;
}

// 重试执行响应
export interface RetryExecutionResponse {
  success: boolean;
  data: {
    executionId: string;
  };
}

// WebSocket 消息类型
export type WSMessageType =
  | "execution.started"
  | "execution.completed"
  | "execution.failed"
  | "execution.cancelled"
  | "execution.progress"
  | "execution.node.started"
  | "execution.node.completed"
  | "execution.node.failed"
  | "execution.log";

// WebSocket 消息
export interface WSMessage {
  type: WSMessageType;
  payload: WSPayload;
}

// WebSocket 消息载荷
export interface WSPayload {
  executionId?: string;
  workflowId?: string;
  nodeId?: string;
  nodeType?: string;
  status?: ExecutionStatus | NodeExecutionStatus;
  progress?: number;
  totalNodes?: number;
  completedNodes?: number;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
  timestamp?: string;
  level?: "info" | "warn" | "error" | "debug";
  message?: string;
}
