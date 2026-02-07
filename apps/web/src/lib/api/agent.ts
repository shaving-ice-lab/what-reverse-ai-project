/**
 * Agent API Service
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

// ResponseType
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
 * Fetch Agent List
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
 * FetchFeatured Agent List
 */
 async getFeatured(): Promise<AgentListResponse> {
 return request<AgentListResponse>("/agents/featured");
 },

 /**
 * Fetch Agent Details(Via slug)
 */
 async getBySlug(slug: string): Promise<AgentDetailResponse> {
 return request<AgentDetailResponse>(`/agents/${slug}`);
 },

 /**
 * Fetch Agent Details(Via ID)
 */
 async getById(id: string): Promise<AgentDetailResponse> {
 return request<AgentDetailResponse>(`/agents/id/${id}`);
 },

 /**
 * FetchCategoryList
 */
 async getCategories(): Promise<CategoryListResponse> {
 return request<CategoryListResponse>("/agents/categories");
 },

 /**
 * Publish Agent
 */
 async publish(data: PublishAgentRequest): Promise<AgentResponse> {
 return request<AgentResponse>("/agents", {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * Update Agent
 */
 async update(id: string, data: UpdateAgentRequest): Promise<AgentResponse> {
 return request<AgentResponse>(`/agents/${id}`, {
 method: "PATCH",
 body: JSON.stringify(data),
 });
 },

 /**
 * Delete Agent
 */
 async delete(id: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/agents/${id}`, {
 method: "DELETE",
 });
 },

 /**
 * Usage Agent(CreateWorkflowcurrent)
 */
 async use(id: string): Promise<{ success: boolean; data: { workflowId: string } }> {
 return request<{ success: boolean; data: { workflowId: string } }>(`/agents/${id}/use`, {
 method: "POST",
 });
 },

 /**
 * Fork Agent(CreatecanEditcurrent)
 */
 async fork(id: string): Promise<{ success: boolean; data: { agentId: string; workflowId: string } }> {
 return request<{ success: boolean; data: { agentId: string; workflowId: string } }>(`/agents/${id}/fork`, {
 method: "POST",
 });
 },

 /**
 * Favorite/Unfavorite Agent
 */
 async star(id: string): Promise<{ success: boolean; data: { isStarred: boolean } }> {
 return request<{ success: boolean; data: { isStarred: boolean } }>(`/agents/${id}/star`, {
 method: "POST",
 });
 },

 /**
 * Fetch Agent ReviewsList
 */
 async getReviews(id: string, params?: { page?: number; pageSize?: number }): Promise<ReviewListResponse> {
 const searchParams = new URLSearchParams();
 
 if (params?.page) searchParams.set("page", String(params.page));
 if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
 
 const query = searchParams.toString();
 return request<ReviewListResponse>(`/agents/${id}/reviews${query ? `?${query}` : ""}`);
 },

 /**
 * CreateReviews
 */
 async createReview(id: string, data: CreateReviewRequest): Promise<{ success: boolean; data: Review }> {
 return request<{ success: boolean; data: Review }>(`/agents/${id}/reviews`, {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * UpdateReviews
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
 * DeleteReviews
 */
 async deleteReview(agentId: string, reviewId: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/agents/${agentId}/reviews/${reviewId}`, {
 method: "DELETE",
 });
 },

 /**
 * MarkReviewsashasHelp
 */
 async markReviewHelpful(agentId: string, reviewId: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/agents/${agentId}/reviews/${reviewId}/helpful`, {
 method: "POST",
 });
 },

 /**
 * Fetch Agent AnalyticsData
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
