"use client";

/**
 * 工作流执行 Hook
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { WorkflowExecutor, executeWorkflow } from "./executor";
import type {
  ExecutionInput,
  ExecutionResult,
  ExecutionStatus,
  WorkflowExecutionState,
  ExecutionEvent,
  ExecutionConfig,
  NodeExecutionState,
} from "./types";
import type { LogEntry } from "@/lib/nodes/types";

interface UseExecutionOptions extends Partial<ExecutionConfig> {
  autoCleanup?: boolean;
}

interface UseExecutionReturn {
  // 状态
  isExecuting: boolean;
  status: ExecutionStatus;
  state: WorkflowExecutionState | null;
  result: ExecutionResult | null;
  error: string | null;
  logs: LogEntry[];
  nodeStates: Record<string, NodeExecutionState>;
  
  // 操作
  execute: (input: ExecutionInput) => Promise<ExecutionResult>;
  cancel: () => void;
  reset: () => void;
  
  // 订阅
  onEvent: (listener: (event: ExecutionEvent) => void) => () => void;
}

/**
 * 使用工作流执行
 */
export function useExecution(
  options: UseExecutionOptions = {}
): UseExecutionReturn {
  const { autoCleanup = true, ...config } = options;
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<ExecutionStatus>("pending");
  const [state, setState] = useState<WorkflowExecutionState | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [nodeStates, setNodeStates] = useState<Record<string, NodeExecutionState>>({});
  
  const executorRef = useRef<WorkflowExecutor | null>(null);
  const listenersRef = useRef<Set<(event: ExecutionEvent) => void>>(new Set());
  
  // 清理函数
  useEffect(() => {
    return () => {
      if (autoCleanup && executorRef.current) {
        executorRef.current.cancel();
      }
    };
  }, [autoCleanup]);
  
  // 执行工作流
  const execute = useCallback(async (input: ExecutionInput): Promise<ExecutionResult> => {
    // 重置状态
    setIsExecuting(true);
    setStatus("running");
    setError(null);
    setLogs([]);
    setResult(null);
    
    // 合并配置
    const mergedInput: ExecutionInput = {
      ...input,
      config: {
        ...config,
        ...input.config,
        onStateChange: (newState) => {
          setState(newState);
          setStatus(newState.status);
          setNodeStates(newState.nodeStates);
          input.config?.onStateChange?.(newState);
        },
        onLog: (log) => {
          setLogs((prev) => [...prev, log]);
          input.config?.onLog?.(log);
        },
        onNodeStart: (nodeId) => {
          input.config?.onNodeStart?.(nodeId);
        },
        onNodeComplete: (nodeId, result) => {
          input.config?.onNodeComplete?.(nodeId, result);
        },
        onNodeError: (nodeId, error) => {
          input.config?.onNodeError?.(nodeId, error);
        },
      },
    };
    
    // 创建执行器
    const executor = new WorkflowExecutor(mergedInput);
    executorRef.current = executor;
    
    // 添加事件监听
    executor.addEventListener((event) => {
      for (const listener of listenersRef.current) {
        listener(event);
      }
    });
    
    // 执行
    try {
      const executionResult = await executor.execute();
      setResult(executionResult);
      setStatus(executionResult.status);
      
      if (!executionResult.success && executionResult.error) {
        setError(executionResult.error.message);
      }
      
      return executionResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setStatus("failed");
      
      throw err;
    } finally {
      setIsExecuting(false);
      executorRef.current = null;
    }
  }, [config]);
  
  // 取消执行
  const cancel = useCallback(() => {
    if (executorRef.current) {
      executorRef.current.cancel();
      setStatus("cancelled");
      setIsExecuting(false);
    }
  }, []);
  
  // 重置状态
  const reset = useCallback(() => {
    cancel();
    setIsExecuting(false);
    setStatus("pending");
    setState(null);
    setResult(null);
    setError(null);
    setLogs([]);
    setNodeStates({});
  }, [cancel]);
  
  // 事件订阅
  const onEvent = useCallback((listener: (event: ExecutionEvent) => void): (() => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);
  
  return {
    isExecuting,
    status,
    state,
    result,
    error,
    logs,
    nodeStates,
    execute,
    cancel,
    reset,
    onEvent,
  };
}

/**
 * 简单执行工作流
 */
export { executeWorkflow };
