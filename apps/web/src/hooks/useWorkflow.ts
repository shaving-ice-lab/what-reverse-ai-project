/**
 * WorkflowRelated Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { API_CACHE_CONFIG, createOptimisticUpdate, queryKeys } from '@/lib/cache'
import type { Workflow, WorkflowDefinition, ListParams, PagedResult } from '@/types'

// ===== Query Keys =====

export const workflowKeys = {
  all: queryKeys.workflows.all,
  lists: queryKeys.workflows.lists,
  list: (params: ListParams) => queryKeys.workflows.list(params as Record<string, unknown>),
  details: queryKeys.workflows.details,
  detail: queryKeys.workflows.detail,
}

// ===== Hooks =====

/**
 * FetchWorkflowList
 */
export function useWorkflows(params: ListParams = {}) {
  return useQuery({
    queryKey: workflowKeys.list(params),
    queryFn: () =>
      api.get<PagedResult<Workflow>>('/workflows', {
        params: {
          page: params.page || 1,
          page_size: params.pageSize || 20,
          search: params.search,
          sort: params.sort,
          order: params.order,
        },
      }),
    staleTime: API_CACHE_CONFIG.workflow.list.staleTime,
    gcTime: API_CACHE_CONFIG.workflow.list.gcTime,
  })
}

/**
 * FetchWorkflowDetails
 */
export function useWorkflow(id: string) {
  return useQuery({
    queryKey: workflowKeys.detail(id),
    queryFn: () => api.get<Workflow>(`/workflows/${id}`),
    enabled: !!id,
    staleTime: API_CACHE_CONFIG.workflow.detail.staleTime,
    gcTime: API_CACHE_CONFIG.workflow.detail.gcTime,
  })
}

/**
 * CreateWorkflow
 */
export function useCreateWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; description?: string; definition?: WorkflowDefinition }) =>
      api.post<Workflow>('/workflows', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() })
    },
  })
}

/**
 * UpdateWorkflow
 */
export function useUpdateWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<{
        name: string
        description: string
        definition: WorkflowDefinition
        variables: Record<string, unknown>
        triggerType: string
        triggerConfig: Record<string, unknown>
      }>
    }) => api.put<Workflow>(`/workflows/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: workflowKeys.detail(id) })

      const previous = queryClient.getQueryData<Workflow>(workflowKeys.detail(id))
      if (!previous) return undefined

      return createOptimisticUpdate<Workflow>({
        queryClient,
        queryKey: workflowKeys.detail(id),
        updater: (old) => ({ ...old, ...data }),
      })
    },
    onError: (error, variables, context) => {
      context?.onError(error as Error)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(workflowKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() })
    },
  })
}

/**
 * DeleteWorkflow
 */
export function useDeleteWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/workflows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() })
    },
  })
}

/**
 * CopyWorkflow
 */
export function useDuplicateWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.post<Workflow>(`/workflows/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() })
    },
  })
}
