/**
 * 执行记录 API 服务
 */

import type {
  ListExecutionsParams,
  ListExecutionsResponse,
  GetExecutionResponse,
  CancelExecutionResponse,
  RetryExecutionResponse,
} from "@/types/execution";
import { request } from "./shared";

/**
 * 执行记录 API
 */
export const executionApi = {
  /**
   * 获取执行记录列表
   */
  async list(params?: ListExecutionsParams): Promise<ListExecutionsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    
    const query = searchParams.toString();
    return request<ListExecutionsResponse>(`/executions${query ? `?${query}` : ""}`);
  },

  /**
   * 获取执行详情
   */
  async get(executionId: string): Promise<GetExecutionResponse> {
    return request<GetExecutionResponse>(`/executions/${executionId}`);
  },

  /**
   * 取消执行
   */
  async cancel(executionId: string): Promise<CancelExecutionResponse> {
    return request<CancelExecutionResponse>(`/executions/${executionId}/cancel`, {
      method: "POST",
    });
  },

  /**
   * 重试执行
   */
  async retry(executionId: string): Promise<RetryExecutionResponse> {
    return request<RetryExecutionResponse>(`/executions/${executionId}/retry`, {
      method: "POST",
    });
  },

  /**
   * 获取工作流的执行记录
   */
  async listByWorkflow(
    workflowId: string,
    params?: Omit<ListExecutionsParams, "workflowId">
  ): Promise<ListExecutionsResponse> {
    return this.list({ ...params, workflowId });
  },
};
