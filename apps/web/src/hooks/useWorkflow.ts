/**
 * 工作流相关 Hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Workflow, WorkflowDefinition, ListParams, PagedResult } from "@/types";

// ===== Query Keys =====

export const workflowKeys = {
  all: ["workflows"] as const,
  lists: () => [...workflowKeys.all, "list"] as const,
  list: (params: ListParams) => [...workflowKeys.lists(), params] as const,
  details: () => [...workflowKeys.all, "detail"] as const,
  detail: (id: string) => [...workflowKeys.details(), id] as const,
};

// ===== Hooks =====

/**
 * 获取工作流列表
 */
export function useWorkflows(params: ListParams = {}) {
  return useQuery({
    queryKey: workflowKeys.list(params),
    queryFn: () =>
      api.get<PagedResult<Workflow>>("/workflows", {
        params: {
          page: params.page || 1,
          page_size: params.pageSize || 20,
          search: params.search,
          sort: params.sort,
          order: params.order,
        },
      }),
  });
}

/**
 * 获取工作流详情
 */
export function useWorkflow(id: string) {
  return useQuery({
    queryKey: workflowKeys.detail(id),
    queryFn: () => api.get<Workflow>(`/workflows/${id}`),
    enabled: !!id,
  });
}

/**
 * 创建工作流
 */
export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      definition?: WorkflowDefinition;
    }) => api.post<Workflow>("/workflows", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

/**
 * 更新工作流
 */
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        description: string;
        definition: WorkflowDefinition;
        variables: Record<string, unknown>;
        triggerType: string;
        triggerConfig: Record<string, unknown>;
      }>;
    }) => api.put<Workflow>(`/workflows/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

/**
 * 删除工作流
 */
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/workflows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

/**
 * 复制工作流
 */
export function useDuplicateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<Workflow>(`/workflows/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}
