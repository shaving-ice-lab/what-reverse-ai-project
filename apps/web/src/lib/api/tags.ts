/**
 * 标签 API 服务
 */

import type { Tag, TagWithCount } from "@/types/tag";
import { request } from "./shared";

/**
 * 标签列表响应
 */
export interface TagListResponse {
  success: boolean;
  data: TagWithCount[];
}

/**
 * 单个标签响应
 */
export interface TagResponse {
  success: boolean;
  data: Tag;
}

/**
 * 标签 API
 */
export const tagApi = {
  /**
   * 获取用户标签列表
   * @returns 标签列表（带使用数量）
   */
  async list(): Promise<TagListResponse> {
    return request<TagListResponse>("/tags");
  },

  /**
   * 创建标签
   * @param name 标签名称
   * @param color 标签颜色
   * @returns 创建的标签
   */
  async create(name: string, color?: string): Promise<TagResponse> {
    return request<TagResponse>("/tags", {
      method: "POST",
      body: JSON.stringify({ name, color }),
    });
  },

  /**
   * 更新标签
   * @param id 标签 ID
   * @param name 标签名称
   * @param color 标签颜色
   * @returns 更新后的标签
   */
  async update(id: string, name: string, color?: string): Promise<TagResponse> {
    return request<TagResponse>(`/tags/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, color }),
    });
  },

  /**
   * 删除标签
   * @param id 标签 ID
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/tags/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * 添加标签到工作流
   * @param workflowId 工作流 ID
   * @param tagId 标签 ID
   */
  async addToWorkflow(workflowId: string, tagId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/workflows/${workflowId}/tags/${tagId}`, {
      method: "POST",
    });
  },

  /**
   * 从工作流移除标签
   * @param workflowId 工作流 ID
   * @param tagId 标签 ID
   */
  async removeFromWorkflow(workflowId: string, tagId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/workflows/${workflowId}/tags/${tagId}`, {
      method: "DELETE",
    });
  },
};
