/**
 * 自定义节点 API 服务
 */

import type {
  CustomNode,
  CustomNodeDetail,
  CustomNodeListParams,
  CustomNodeListResponse,
  CustomNodeDetailResponse,
  CustomNodeReview,
} from "@/types/custom-node";
import { request } from "./shared";

/**
 * 自定义节点 API
 */
export const customNodeApi = {
  /**
   * 获取节点列表
   */
  async list(params?: CustomNodeListParams): Promise<CustomNodeListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    
    const query = searchParams.toString();
    return request<CustomNodeListResponse>(`/nodes${query ? `?${query}` : ""}`);
  },

  /**
   * 获取热门节点
   */
  async getPopular(): Promise<CustomNodeListResponse> {
    return request<CustomNodeListResponse>("/nodes/popular");
  },

  /**
   * 获取最新节点
   */
  async getNewest(): Promise<CustomNodeListResponse> {
    return request<CustomNodeListResponse>("/nodes/newest");
  },

  /**
   * 获取节点详情
   */
  async getBySlug(slug: string): Promise<CustomNodeDetailResponse> {
    return request<CustomNodeDetailResponse>(`/nodes/${slug}`);
  },

  /**
   * 获取节点详情（通过 ID）
   */
  async getById(id: string): Promise<CustomNodeDetailResponse> {
    return request<CustomNodeDetailResponse>(`/nodes/id/${id}`);
  },

  /**
   * 安装节点
   */
  async install(id: string): Promise<{ success: boolean; data: { version: string } }> {
    return request(`/nodes/${id}/install`, {
      method: "POST",
    });
  },

  /**
   * 卸载节点
   */
  async uninstall(id: string): Promise<{ success: boolean }> {
    return request(`/nodes/${id}/uninstall`, {
      method: "POST",
    });
  },

  /**
   * 更新节点
   */
  async update(id: string): Promise<{ success: boolean; data: { version: string } }> {
    return request(`/nodes/${id}/update`, {
      method: "POST",
    });
  },

  /**
   * 收藏/取消收藏节点
   */
  async star(id: string): Promise<{ success: boolean; data: { isStarred: boolean } }> {
    return request(`/nodes/${id}/star`, {
      method: "POST",
    });
  },

  /**
   * 获取节点评价列表
   */
  async getReviews(id: string, params?: { page?: number; pageSize?: number }): Promise<{
    success: boolean;
    data: CustomNodeReview[];
    meta: { total: number; page: number; pageSize: number };
  }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    
    const query = searchParams.toString();
    return request(`/nodes/${id}/reviews${query ? `?${query}` : ""}`);
  },

  /**
   * 获取已安装的节点
   */
  async getInstalled(): Promise<CustomNodeListResponse> {
    return request<CustomNodeListResponse>("/nodes/installed");
  },

  /**
   * 获取分类列表
   */
  async getCategories(): Promise<{
    success: boolean;
    data: { categories: Array<{
      id: string;
      name: string;
      icon: string;
      count: number;
    }> };
  }> {
    return request("/nodes/categories");
  },

  /**
   * 获取精选节点
   */
  async getFeatured(limit: number = 6): Promise<{
    success: boolean;
    data: { nodes: CustomNode[] };
  }> {
    return request(`/nodes/featured?limit=${limit}`);
  },

  /**
   * 创建节点
   */
  async create(data: {
    name: string;
    slug?: string;
    displayName: string;
    description: string;
    longDescription?: string;
    category: string;
    tags?: string[];
    repositoryUrl?: string;
    documentationUrl?: string;
    homepageUrl?: string;
    inputs?: Array<{
      name: string;
      type: string;
      description?: string;
      required?: boolean;
    }>;
    outputs?: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
    version: string;
    changelog?: string;
  }): Promise<{ success: boolean; data: CustomNodeDetail }> {
    return request("/nodes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 更新节点
   */
  async updateNode(id: string, data: Partial<{
    displayName: string;
    description: string;
    longDescription: string;
    category: string;
    tags: string[];
    repositoryUrl: string;
    documentationUrl: string;
    homepageUrl: string;
  }>): Promise<{ success: boolean; data: CustomNodeDetail }> {
    return request(`/nodes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除节点
   */
  async deleteNode(id: string): Promise<{ success: boolean }> {
    return request(`/nodes/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * 保存草稿
   */
  async saveDraft(id: string, data: any): Promise<{ success: boolean; data: CustomNodeDetail }> {
    return request(`/nodes/${id}/draft`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * 提交审核
   */
  async submit(id: string): Promise<{ success: boolean; data: CustomNodeDetail }> {
    return request(`/nodes/${id}/submit`, {
      method: "POST",
    });
  },

  /**
   * 创建新版本
   */
  async createVersion(nodeId: string, data: {
    version: string;
    changelog: string;
    packageUrl?: string;
    inputs?: Array<{
      name: string;
      type: string;
      description?: string;
      required?: boolean;
    }>;
    outputs?: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
  }): Promise<{ success: boolean; data: { version: string } }> {
    return request(`/nodes/${nodeId}/versions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 提交评价
   */
  async createReview(nodeId: string, data: {
    rating: number;
    title?: string;
    content: string;
  }): Promise<{ success: boolean; data: CustomNodeReview }> {
    return request(`/nodes/${nodeId}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 获取用户已安装的节点
   */
  async getMyInstalled(): Promise<CustomNodeListResponse> {
    return request("/nodes/my/installed");
  },

  /**
   * 获取用户创建的节点
   */
  async getMyNodes(): Promise<CustomNodeListResponse> {
    return request("/nodes/my/created");
  },

  /**
   * 获取用户收藏的节点
   */
  async getMyStarred(): Promise<CustomNodeListResponse> {
    return request("/nodes/my/starred");
  },
};

// 节点分类接口
export interface NodeCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}
