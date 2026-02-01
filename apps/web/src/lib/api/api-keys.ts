/**
 * API 密钥服务
 */

import type {
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ListApiKeysResponse,
  UpdateApiKeyRequest,
  TestApiKeyResponse,
} from "@/types/api-key";
import { request } from "./shared";

/**
 * API 密钥服务
 */
export const apiKeysApi = {
  /**
   * 获取密钥列表
   */
  async list(): Promise<ListApiKeysResponse> {
    return request<ListApiKeysResponse>("/api-keys");
  },

  /**
   * 获取单个密钥
   */
  async get(id: string): Promise<{ apiKey: ApiKey }> {
    return request<{ apiKey: ApiKey }>(`/api-keys/${id}`);
  },

  /**
   * 创建密钥
   */
  async create(data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    return request<CreateApiKeyResponse>("/api-keys", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 更新密钥
   */
  async update(id: string, data: UpdateApiKeyRequest): Promise<{ apiKey: ApiKey }> {
    return request<{ apiKey: ApiKey }>(`/api-keys/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除密钥
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api-keys/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * 测试密钥
   */
  async test(id: string): Promise<TestApiKeyResponse> {
    return request<TestApiKeyResponse>(`/api-keys/${id}/test`, {
      method: "POST",
    });
  },

  /**
   * 刷新密钥统计
   */
  async refreshStats(id: string): Promise<{ apiKey: ApiKey }> {
    return request<{ apiKey: ApiKey }>(`/api-keys/${id}/refresh-stats`, {
      method: "POST",
    });
  },
};
