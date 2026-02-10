/**
 * ExecuteRecord API Service
 */

import type {
  ListExecutionsParams,
  ListExecutionsResponse,
  GetExecutionResponse,
  CancelExecutionResponse,
  RetryExecutionResponse,
} from '@/types/execution'
import { request } from './shared'

/**
 * ExecuteRecord API
 */
export const executionApi = {
  /**
   * FetchExecuteRecordList
   */
  async list(params?: ListExecutionsParams): Promise<ListExecutionsResponse> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value))
        }
      })
    }

    const query = searchParams.toString()
    return request<ListExecutionsResponse>(`/executions${query ? `?${query}` : ''}`)
  },

  /**
   * FetchExecuteDetails
   */
  async get(executionId: string): Promise<GetExecutionResponse> {
    return request<GetExecutionResponse>(`/executions/${executionId}`)
  },

  /**
   * CancelExecute
   */
  async cancel(executionId: string): Promise<CancelExecutionResponse> {
    return request<CancelExecutionResponse>(`/executions/${executionId}/cancel`, {
      method: 'POST',
    })
  },

  /**
   * RetryExecute
   */
  async retry(executionId: string): Promise<RetryExecutionResponse> {
    return request<RetryExecutionResponse>(`/executions/${executionId}/retry`, {
      method: 'POST',
    })
  },

  /**
   * FetchWorkflow'sExecuteRecord
   */
  async listByWorkflow(
    workflowId: string,
    params?: Omit<ListExecutionsParams, 'workflowId'>
  ): Promise<ListExecutionsResponse> {
    return this.list({ ...params, workflowId })
  },
}
