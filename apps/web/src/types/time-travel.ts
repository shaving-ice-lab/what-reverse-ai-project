/**
 * 时间旅行调试 - 类型定义
 * 
 * 提供可视化的执行历史回溯功能，让用户能够查看工作流执行的每一步状态。
 */

import type { ExecutionStatus } from "./execution";

// ===== 节点执行状态 =====

/**
 * 节点执行状态枚举
 */
export type NodeStatus = 
  | "pending"    // 等待执行
  | "running"    // 执行中
  | "completed"  // 执行完成
  | "failed"     // 执行失败
  | "skipped"    // 已跳过
  | "paused";    // 已暂停

// ===== 节点快照 =====

/**
 * 节点错误信息
 */
export interface NodeError {
  /** 错误码 */
  code?: string;
  /** 错误消息 */
  message: string;
  /** 错误堆栈 */
  stack?: string;
  /** 额外详情 */
  details?: Record<string, unknown>;
}

/**
 * 节点元数据
 * 记录节点执行的额外信息，如 LLM 调用的 token 使用量等
 */
export interface NodeMetadata {
  /** LLM 节点: Token 使用量 */
  tokensUsed?: number;
  /** LLM 节点: 使用的模型 */
  model?: string;
  /** LLM 节点: 提示 Token */
  promptTokens?: number;
  /** LLM 节点: 完成 Token */
  completionTokens?: number;
  /** HTTP 节点: 响应状态码 */
  httpStatusCode?: number;
  /** HTTP 节点: 请求 URL */
  httpUrl?: string;
  /** HTTP 节点: 请求方法 */
  httpMethod?: string;
  /** 条件节点: 选择的分支 */
  conditionBranch?: "true" | "false";
  /** 循环节点: 迭代次数 */
  loopIterations?: number;
  /** 循环节点: 当前迭代索引 */
  currentIteration?: number;
  /** 重试次数 */
  retryCount?: number;
  /** 自定义元数据 */
  [key: string]: unknown;
}

/**
 * 节点快照
 * 
 * 记录单个节点在执行过程中某一时刻的完整状态快照，
 * 用于时间旅行调试功能的回溯和重放。
 */
export interface NodeSnapshot {
  /** 节点 ID */
  nodeId: string;
  /** 节点名称（显示名称） */
  nodeName: string;
  /** 节点类型 (如 "llm", "http", "condition" 等) */
  nodeType: string;
  /** 节点执行状态 */
  status: NodeStatus;
  
  // ===== 时间信息 =====
  
  /** 开始执行时间 (ISO 8601 格式) */
  startedAt: string;
  /** 完成时间 (ISO 8601 格式) */
  completedAt?: string;
  /** 执行耗时 (毫秒) */
  durationMs: number;
  
  // ===== 数据快照 =====
  
  /** 节点输入数据 */
  inputs: Record<string, unknown>;
  /** 节点输出数据 */
  outputs: Record<string, unknown>;
  /** 解析后的配置（变量替换后） */
  resolvedConfig?: Record<string, unknown>;
  
  // ===== 错误信息 =====
  
  /** 错误信息（如果执行失败） */
  error?: NodeError;
  
  // ===== 元数据 =====
  
  /** 执行元数据 */
  metadata?: NodeMetadata;
  
  // ===== 调试信息 =====
  
  /** 日志记录 */
  logs?: NodeLogEntry[];
  /** 是否是断点 */
  isBreakpoint?: boolean;
}

/**
 * 节点日志条目
 */
export interface NodeLogEntry {
  /** 日志级别 */
  level: "debug" | "info" | "warn" | "error";
  /** 日志消息 */
  message: string;
  /** 时间戳 (ISO 8601 格式) */
  timestamp: string;
  /** 附加数据 */
  data?: Record<string, unknown>;
}

// ===== 执行快照 =====

/**
 * 快照元数据
 */
export interface SnapshotMetadata {
  /** 快照创建时间 */
  createdAt: string;
  /** 快照版本 */
  version: string;
  /** 是否压缩存储 */
  compressed?: boolean;
  /** 压缩前大小 (bytes) */
  originalSize?: number;
  /** 压缩后大小 (bytes) */
  compressedSize?: number;
  /** 快照来源 (web | desktop) */
  source: "web" | "desktop";
}

/**
 * 执行摘要信息
 */
export interface ExecutionSummary {
  /** 总节点数 */
  totalNodes: number;
  /** 已完成节点数 */
  completedNodes: number;
  /** 失败节点数 */
  failedNodes: number;
  /** 跳过节点数 */
  skippedNodes: number;
  /** 总 Token 使用量 */
  totalTokensUsed?: number;
  /** 预估成本 (美元) */
  estimatedCost?: number;
}

/**
 * 执行快照
 * 
 * 捕获整个工作流执行的完整状态快照，包含所有节点的执行详情，
 * 用于时间旅行调试功能的回溯和重放。
 */
export interface ExecutionSnapshot {
  /** 执行 ID */
  executionId: string;
  /** 工作流 ID */
  workflowId: string;
  /** 工作流名称 */
  workflowName?: string;
  /** 工作流版本 */
  workflowVersion?: number;
  /** 执行状态 */
  status: ExecutionStatus;
  
  // ===== 时间信息 =====
  
  /** 开始时间 (ISO 8601 格式) */
  startedAt: string;
  /** 完成时间 (ISO 8601 格式) */
  completedAt?: string;
  /** 总执行耗时 (毫秒) */
  durationMs?: number;
  
  // ===== 节点快照 =====
  
  /** 所有节点的快照，按节点 ID 索引 */
  nodeSnapshots: Record<string, NodeSnapshot>;
  /** 节点执行顺序 */
  executionOrder: string[];
  /** 当前执行到的节点 ID */
  currentNodeId?: string;
  
  // ===== 全局变量 =====
  
  /** 执行输入 */
  inputs: Record<string, unknown>;
  /** 执行输出 */
  outputs: Record<string, unknown>;
  /** 全局变量 */
  variables: Record<string, unknown>;
  
  // ===== 错误信息 =====
  
  /** 执行错误（如果失败） */
  error?: {
    code?: string;
    message: string;
    nodeId?: string;
    stack?: string;
  };
  
  // ===== 摘要和元数据 =====
  
  /** 执行摘要 */
  summary: ExecutionSummary;
  /** 快照元数据 */
  metadata: SnapshotMetadata;
}

// ===== 时间线相关类型 =====

/**
 * 时间线步骤
 * 用于在时间线 UI 中显示执行步骤
 */
export interface TimelineStep {
  /** 步骤索引 */
  index: number;
  /** 节点 ID */
  nodeId: string;
  /** 节点名称 */
  nodeName: string;
  /** 节点类型 */
  nodeType: string;
  /** 节点图标 */
  nodeIcon?: string;
  /** 步骤状态 */
  status: NodeStatus;
  /** 开始时间 */
  startedAt: string;
  /** 完成时间 */
  completedAt?: string;
  /** 耗时 (毫秒) */
  durationMs: number;
  /** 简要描述 */
  description?: string;
  /** 是否是当前选中步骤 */
  isSelected?: boolean;
  /** 是否有错误 */
  hasError?: boolean;
}

/**
 * 时间线视图数据
 */
export interface TimelineView {
  /** 执行 ID */
  executionId: string;
  /** 执行状态 */
  status: ExecutionStatus;
  /** 开始时间 */
  startedAt: string;
  /** 完成时间 */
  completedAt?: string;
  /** 总耗时 */
  durationMs?: number;
  /** 时间线步骤列表 */
  steps: TimelineStep[];
  /** 当前选中的步骤索引 */
  selectedStepIndex?: number;
}

// ===== 调试操作相关类型 =====

/**
 * 重跑节点请求
 */
export interface RerunNodeRequest {
  /** 执行 ID */
  executionId: string;
  /** 要重跑的节点 ID */
  nodeId: string;
  /** 新的输入（可选，不提供则使用原输入） */
  newInputs?: Record<string, unknown>;
  /** 是否继续执行后续节点 */
  continueExecution?: boolean;
}

/**
 * 重跑节点结果
 */
export interface RerunNodeResult {
  /** 新的执行 ID */
  newExecutionId: string;
  /** 节点快照 */
  nodeSnapshot: NodeSnapshot;
  /** 是否成功 */
  success: boolean;
  /** 错误消息 */
  error?: string;
}

/**
 * 断点信息
 */
export interface Breakpoint {
  /** 断点 ID */
  id: string;
  /** 节点 ID */
  nodeId: string;
  /** 是否启用 */
  enabled: boolean;
  /** 条件表达式（可选） */
  condition?: string;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 调试会话状态
 */
export interface DebugSession {
  /** 会话 ID */
  sessionId: string;
  /** 关联的执行 ID */
  executionId: string;
  /** 是否暂停 */
  isPaused: boolean;
  /** 暂停在的节点 ID */
  pausedAtNodeId?: string;
  /** 断点列表 */
  breakpoints: Breakpoint[];
  /** 会话开始时间 */
  startedAt: string;
}

// ===== 快照存储相关类型 =====

/**
 * 快照存储选项
 */
export interface SnapshotStorageOptions {
  /** 是否压缩 */
  compress?: boolean;
  /** 压缩级别 (1-9) */
  compressionLevel?: number;
  /** 最大保留数量 */
  maxSnapshots?: number;
  /** 最大保留天数 */
  maxAgeDays?: number;
  /** 排除敏感数据 */
  excludeSensitiveData?: boolean;
  /** 敏感字段列表 */
  sensitiveFields?: string[];
}

/**
 * 快照查询参数
 */
export interface SnapshotQueryParams {
  /** 工作流 ID */
  workflowId?: string;
  /** 执行状态 */
  status?: ExecutionStatus;
  /** 开始日期 */
  startDate?: string;
  /** 结束日期 */
  endDate?: string;
  /** 分页 - 页码 */
  page?: number;
  /** 分页 - 每页数量 */
  pageSize?: number;
  /** 排序字段 */
  sortBy?: "startedAt" | "durationMs" | "status";
  /** 排序方向 */
  sortOrder?: "asc" | "desc";
}

/**
 * 快照列表项（不含完整节点数据）
 */
export interface SnapshotListItem {
  /** 执行 ID */
  executionId: string;
  /** 工作流 ID */
  workflowId: string;
  /** 工作流名称 */
  workflowName?: string;
  /** 执行状态 */
  status: ExecutionStatus;
  /** 开始时间 */
  startedAt: string;
  /** 完成时间 */
  completedAt?: string;
  /** 耗时 */
  durationMs?: number;
  /** 摘要 */
  summary: ExecutionSummary;
}

// ===== 工具函数类型 =====

/**
 * 从执行结果创建快照的选项
 */
export interface CreateSnapshotOptions {
  /** 包含日志 */
  includeLogs?: boolean;
  /** 包含调试信息 */
  includeDebugInfo?: boolean;
  /** 存储选项 */
  storage?: SnapshotStorageOptions;
}

// ===== 导出聚合类型 =====

export type {
  NodeSnapshot as TimeTravelNodeSnapshot,
  ExecutionSnapshot as TimeTravelExecutionSnapshot,
};
