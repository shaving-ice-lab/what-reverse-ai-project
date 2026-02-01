/**
 * Agent API 服务
 */

import type {
  Agent,
  AgentDetail,
  AgentListParams,
  PublishAgentRequest,
  UpdateAgentRequest,
  Review,
  CreateReviewRequest,
  Category,
} from "@/types/agent";
import { request } from "./shared";

// 响应类型
export interface AgentListResponse {
  success: boolean;
  data: Agent[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface AgentResponse {
  success: boolean;
  data: Agent;
}

export interface AgentDetailResponse {
  success: boolean;
  data: AgentDetail;
}

export interface ReviewListResponse {
  success: boolean;
  data: Review[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface CategoryListResponse {
  success: boolean;
  data: Category[];
}

/**
 * Agent API
 */
export const agentApi = {
  /**
   * 获取 Agent 列表
   */
  async list(params?: AgentListParams): Promise<AgentListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    
    const query = searchParams.toString();
    return request<AgentListResponse>(`/agents${query ? `?${query}` : ""}`);
  },

  /**
   * 获取精选 Agent 列表
   */
  async getFeatured(): Promise<AgentListResponse> {
    return request<AgentListResponse>("/agents/featured");
  },

  /**
   * 获取 Agent 详情（通过 slug）
   */
  async getBySlug(slug: string): Promise<AgentDetailResponse> {
    return request<AgentDetailResponse>(`/agents/${slug}`);
  },

  /**
   * 获取 Agent 详情（通过 ID）
   */
  async getById(id: string): Promise<AgentDetailResponse> {
    return request<AgentDetailResponse>(`/agents/id/${id}`);
  },

  /**
   * 获取分类列表
   */
  async getCategories(): Promise<CategoryListResponse> {
    return request<CategoryListResponse>("/agents/categories");
  },

  /**
   * 发布 Agent
   */
  async publish(data: PublishAgentRequest): Promise<AgentResponse> {
    return request<AgentResponse>("/agents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 更新 Agent
   */
  async update(id: string, data: UpdateAgentRequest): Promise<AgentResponse> {
    return request<AgentResponse>(`/agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除 Agent
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/agents/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * 使用 Agent（创建工作流副本）
   */
  async use(id: string): Promise<{ success: boolean; data: { workflowId: string } }> {
    return request<{ success: boolean; data: { workflowId: string } }>(`/agents/${id}/use`, {
      method: "POST",
    });
  },

  /**
   * Fork Agent（创建可编辑副本）
   */
  async fork(id: string): Promise<{ success: boolean; data: { agentId: string; workflowId: string } }> {
    return request<{ success: boolean; data: { agentId: string; workflowId: string } }>(`/agents/${id}/fork`, {
      method: "POST",
    });
  },

  /**
   * 收藏/取消收藏 Agent
   */
  async star(id: string): Promise<{ success: boolean; data: { isStarred: boolean } }> {
    return request<{ success: boolean; data: { isStarred: boolean } }>(`/agents/${id}/star`, {
      method: "POST",
    });
  },

  /**
   * 获取 Agent 评价列表
   */
  async getReviews(id: string, params?: { page?: number; pageSize?: number }): Promise<ReviewListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    
    const query = searchParams.toString();
    return request<ReviewListResponse>(`/agents/${id}/reviews${query ? `?${query}` : ""}`);
  },

  /**
   * 创建评价
   */
  async createReview(id: string, data: CreateReviewRequest): Promise<{ success: boolean; data: Review }> {
    return request<{ success: boolean; data: Review }>(`/agents/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 更新评价
   */
  async updateReview(
    agentId: string,
    reviewId: string,
    data: Partial<CreateReviewRequest>
  ): Promise<{ success: boolean; data: Review }> {
    return request<{ success: boolean; data: Review }>(`/agents/${agentId}/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除评价
   */
  async deleteReview(agentId: string, reviewId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/agents/${agentId}/reviews/${reviewId}`, {
      method: "DELETE",
    });
  },

  /**
   * 标记评价为有帮助
   */
  async markReviewHelpful(agentId: string, reviewId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/agents/${agentId}/reviews/${reviewId}/helpful`, {
      method: "POST",
    });
  },

  /**
   * 获取 Agent 分析数据
   */
  async getAnalytics(id: string): Promise<{
    success: boolean;
    data: {
      useCount: number;
      starCount: number;
      reviewCount: number;
      avgRating: number;
      revenue: number;
      useTrend: { date: string; count: number }[];
      revenueTrend: { date: string; amount: number }[];
    };
  }> {
    return request(`/agents/${id}/analytics`);
  },
};
