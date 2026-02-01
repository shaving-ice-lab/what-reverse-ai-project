/**
 * 执行相关 Hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { WS_BASE_URL } from "@/lib/constants";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Execution, NodeLog, ListParams, PagedResult, ExecutionEvent } from "@/types";

// ===== Query Keys =====

export const executionKeys = {
  all: ["executions"] as const,
  lists: () => [...executionKeys.all, "list"] as const,
  list: (params: ListParams & { workflowId?: string }) =>
    [...executionKeys.lists(), params] as const,
  details: () => [...executionKeys.all, "detail"] as const,
  detail: (id: string) => [...executionKeys.details(), id] as const,
  logs: (id: string) => [...executionKeys.detail(id), "logs"] as const,
};

// ===== Hooks =====

/**
 * 获取执行列表
 */
export function useExecutions(params: ListParams & { workflowId?: string } = {}) {
  return useQuery({
    queryKey: executionKeys.list(params),
    queryFn: () =>
      api.get<PagedResult<Execution>>("/executions", {
        params: {
          page: params.page || 1,
          page_size: params.pageSize || 20,
          workflow_id: params.workflowId,
          sort: params.sort,
          order: params.order,
        },
      }),
  });
}

/**
 * 获取执行详情
 */
export function useExecution(id: string) {
  return useQuery({
    queryKey: executionKeys.detail(id),
    queryFn: () =>
      api.get<{
        execution: Execution;
        nodeLogs: NodeLog[];
      }>(`/executions/${id}`),
    enabled: !!id,
  });
}

/**
 * 执行工作流
 */
export function useExecuteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workflowId,
      inputs,
    }: {
      workflowId: string;
      inputs?: Record<string, unknown>;
    }) =>
      api.post<Execution>(`/workflows/${workflowId}/execute`, {
        inputs,
        trigger_type: "manual",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: executionKeys.lists() });
      queryClient.setQueryData(executionKeys.detail(data.id), {
        execution: data,
        nodeLogs: [],
      });
    },
  });
}

/**
 * 取消执行
 */
export function useCancelExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post(`/executions/${id}/cancel`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: executionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: executionKeys.lists() });
    },
  });
}

/**
 * 重试执行
 */
export function useRetryExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<Execution>(`/executions/${id}/retry`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: executionKeys.lists() });
      queryClient.setQueryData(executionKeys.detail(data.id), {
        execution: data,
        nodeLogs: [],
      });
    },
  });
}

/**
 * 执行状态实时订阅
 */
export function useExecutionSubscription(
  executionId: string | null,
  onEvent: (event: ExecutionEvent) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (!executionId || !isAuthenticated) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE_URL}?token=${token}`);

    ws.onopen = () => {
      // 订阅执行状态
      ws.send(
        JSON.stringify({
          type: "subscribe",
          payload: { execution_id: executionId },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const eventData: ExecutionEvent = message.payload;

        // 调用回调
        onEvent(eventData);

        // 更新缓存
        if (
          message.type === "execution.completed" ||
          message.type === "execution.failed"
        ) {
          queryClient.invalidateQueries({
            queryKey: executionKeys.detail(executionId),
          });
          queryClient.invalidateQueries({ queryKey: executionKeys.lists() });
        }
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    wsRef.current = ws;
  }, [executionId, isAuthenticated, onEvent, queryClient]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { disconnect };
}
