/**
 * 执行引擎类型定义
 */

import type { Edge } from "@xyflow/react";
import type { WorkflowNode } from "@/types/workflow";
import type { NodeResult, LogEntry } from "@/lib/nodes/types";

// 执行状态
export type ExecutionStatus =
  | "pending"    // 等待执行
  | "running"    // 执行中
  | "completed"  // 执行完成
  | "failed"     // 执行失败
  | "cancelled"  // 已取消
  | "paused";    // 已暂停

// 节点执行状态
export interface NodeExecutionState {
  nodeId: string;
  status: ExecutionStatus;
  startTime?: string;
  endTime?: string;
  duration?: number;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  logs?: LogEntry[];
  retryCount?: number;
}

// 工作流执行状态
export interface WorkflowExecutionState {
  executionId: string;
  workflowId: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  nodeStates: Record<string, NodeExecutionState>;
  variables: Record<string, unknown>;
  currentNodeIds: string[];
  completedNodeIds: string[];
  failedNodeIds: string[];
  logs: LogEntry[];
  error?: {
    code: string;
    message: string;
    nodeId?: string;
  };
}

// 执行配置
export interface ExecutionConfig {
  // 超时设置
  timeout?: number;
  nodeTimeout?: number;
  
  // 重试设置
  retryCount?: number;
  retryDelay?: number;
  
  // 并发设置
  maxConcurrency?: number;
  
  // 调试设置
  debug?: boolean;
  breakpoints?: string[];
  
  // 回调
  onNodeStart?: (nodeId: string) => void;
  onNodeComplete?: (nodeId: string, result: NodeResult) => void;
  onNodeError?: (nodeId: string, error: unknown) => void;
  onLog?: (log: LogEntry) => void;
  onStateChange?: (state: WorkflowExecutionState) => void;
}

// 工作流定义
export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: Edge[];
  variables?: Record<string, unknown>;
}

// 执行输入
export interface ExecutionInput {
  workflow: WorkflowDefinition;
  inputs?: Record<string, unknown>;
  config?: ExecutionConfig;
}

// 执行结果
export interface ExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  outputs: Record<string, unknown>;
  duration: number;
  nodeResults: Record<string, NodeResult>;
  logs: LogEntry[];
  error?: {
    code: string;
    message: string;
    nodeId?: string;
  };
}

// DAG 节点信息
export interface DAGNode {
  id: string;
  type: string;
  dependencies: string[];
  dependents: string[];
  level: number;
}

// DAG 分析结果
export interface DAGAnalysis {
  nodes: Record<string, DAGNode>;
  levels: string[][];
  executionOrder: string[];
  hasCircle: boolean;
  startNodes: string[];
  endNodes: string[];
}

// 执行事件
export type ExecutionEvent =
  | { type: "start"; executionId: string; timestamp: string }
  | { type: "node_start"; nodeId: string; timestamp: string }
  | { type: "node_complete"; nodeId: string; result: NodeResult; timestamp: string }
  | { type: "node_error"; nodeId: string; error: unknown; timestamp: string }
  | { type: "complete"; result: ExecutionResult; timestamp: string }
  | { type: "error"; error: unknown; timestamp: string }
  | { type: "cancel"; timestamp: string }
  | { type: "pause"; timestamp: string }
  | { type: "resume"; timestamp: string }
  | { type: "log"; log: LogEntry };

// 执行事件监听器
export type ExecutionEventListener = (event: ExecutionEvent) => void;
