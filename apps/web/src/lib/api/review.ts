/**
 * 审核系统 API 服务
 */

import type {
  ListReviewQueueParams,
  ListReviewQueueResponse,
  GetReviewDetailResponse,
  GetReviewStatsResponse,
  SubmitReviewRequest,
  SubmitReviewResponse,
  ReviewActionRequest,
  ReviewActionResponse,
  AssignReviewerRequest,
  CreateCommentRequest,
  CommentResponse,
  GetChecklistResponse,
  ListReviewersResponse,
  ReviewItemType,
} from "@/types/review";
import { request } from "./shared";

/**
 * 审核系统 API
 */
export const reviewApi = {
  // =====================
  // 审核队列管理
  // =====================

  /**
   * 获取审核队列列表
   */
  async list(params?: ListReviewQueueParams): Promise<ListReviewQueueResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    
    const query = searchParams.toString();
    return request<ListReviewQueueResponse>(`/reviews${query ? `?${query}` : ""}`);
  },

  /**
   * 获取审核详情
   */
  async get(reviewId: string): Promise<GetReviewDetailResponse> {
    return request<GetReviewDetailResponse>(`/reviews/${reviewId}`);
  },

  /**
   * 获取审核统计
   */
  async getStats(): Promise<GetReviewStatsResponse> {
    return request<GetReviewStatsResponse>("/reviews/stats");
  },

  /**
   * 提交审核
   */
  async submit(data: SubmitReviewRequest): Promise<SubmitReviewResponse> {
    return request<SubmitReviewResponse>("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 执行审核操作（通过/拒绝/要求修改）
   */
  async review(reviewId: string, data: ReviewActionRequest): Promise<ReviewActionResponse> {
    return request<ReviewActionResponse>(`/reviews/${reviewId}/review`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 分配审核员
   */
  async assign(reviewId: string, data: AssignReviewerRequest): Promise<ReviewActionResponse> {
    return request<ReviewActionResponse>(`/reviews/${reviewId}/assign`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 取消审核
   */
  async cancel(reviewId: string, reason?: string): Promise<ReviewActionResponse> {
    return request<ReviewActionResponse>(`/reviews/${reviewId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * 重新提交审核（修改后）
   */
  async resubmit(reviewId: string, note?: string): Promise<ReviewActionResponse> {
    return request<ReviewActionResponse>(`/reviews/${reviewId}/resubmit`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  },

  // =====================
  // 审核评论
  // =====================

  /**
   * 获取审核评论列表
   */
  async getComments(reviewId: string): Promise<{ success: boolean; data: import("@/types/review").ReviewComment[] }> {
    return request(`/reviews/${reviewId}/comments`);
  },

  /**
   * 创建评论
   */
  async createComment(reviewId: string, data: CreateCommentRequest): Promise<CommentResponse> {
    return request<CommentResponse>(`/reviews/${reviewId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除评论
   */
  async deleteComment(reviewId: string, commentId: string): Promise<{ success: boolean; message: string }> {
    return request(`/reviews/${reviewId}/comments/${commentId}`, {
      method: "DELETE",
    });
  },

  /**
   * 解决评论
   */
  async resolveComment(reviewId: string, commentId: string): Promise<CommentResponse> {
    return request<CommentResponse>(`/reviews/${reviewId}/comments/${commentId}/resolve`, {
      method: "POST",
    });
  },

  // =====================
  // 审核检查项
  // =====================

  /**
   * 获取审核检查项模板
   */
  async getChecklist(itemType: ReviewItemType): Promise<GetChecklistResponse> {
    return request<GetChecklistResponse>(`/reviews/checklists/${itemType}`);
  },

  // =====================
  // 审核员管理
  // =====================

  /**
   * 获取审核员列表
   */
  async getReviewers(params?: { isActive?: boolean; page?: number; pageSize?: number }): Promise<ListReviewersResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    
    const query = searchParams.toString();
    return request<ListReviewersResponse>(`/reviews/reviewers${query ? `?${query}` : ""}`);
  },

  /**
   * 获取我的审核任务
   */
  async getMyTasks(params?: { status?: string; page?: number; pageSize?: number }): Promise<ListReviewQueueResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    
    const query = searchParams.toString();
    return request<ListReviewQueueResponse>(`/reviews/my-tasks${query ? `?${query}` : ""}`);
  },

  /**
   * 获取我提交的审核
   */
  async getMySubmissions(params?: { status?: string; page?: number; pageSize?: number }): Promise<ListReviewQueueResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    
    const query = searchParams.toString();
    return request<ListReviewQueueResponse>(`/reviews/my-submissions${query ? `?${query}` : ""}`);
  },

  // =====================
  // 批量操作
  // =====================

  /**
   * 批量审核
   */
  async batchReview(reviewIds: string[], data: ReviewActionRequest): Promise<{ success: boolean; data: { succeeded: string[]; failed: string[] }; message: string }> {
    return request(`/reviews/batch-review`, {
      method: "POST",
      body: JSON.stringify({ reviewIds, ...data }),
    });
  },

  /**
   * 批量分配
   */
  async batchAssign(reviewIds: string[], reviewerId: string): Promise<{ success: boolean; data: { succeeded: string[]; failed: string[] }; message: string }> {
    return request(`/reviews/batch-assign`, {
      method: "POST",
      body: JSON.stringify({ reviewIds, reviewerId }),
    });
  },
};
