/**
 * ReviewSystem API Service
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
 * ReviewSystem API
 */
export const reviewApi = {
 // =====================
 // Review Queue Management
 // =====================

 /**
 * Fetch review queue list
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
 * Fetch review details
 */
 async get(reviewId: string): Promise<GetReviewDetailResponse> {
 return request<GetReviewDetailResponse>(`/reviews/${reviewId}`);
 },

 /**
 * Fetch review statistics
 */
 async getStats(): Promise<GetReviewStatsResponse> {
 return request<GetReviewStatsResponse>("/reviews/stats");
 },

 /**
 * Submit review
 */
 async submit(data: SubmitReviewRequest): Promise<SubmitReviewResponse> {
 return request<SubmitReviewResponse>("/reviews", {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * Execute review action (Approve/Reject/Request Changes)
 */
 async review(reviewId: string, data: ReviewActionRequest): Promise<ReviewActionResponse> {
 return request<ReviewActionResponse>(`/reviews/${reviewId}/review`, {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * Assign reviewer
 */
 async assign(reviewId: string, data: AssignReviewerRequest): Promise<ReviewActionResponse> {
 return request<ReviewActionResponse>(`/reviews/${reviewId}/assign`, {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * Cancel review
 */
 async cancel(reviewId: string, reason?: string): Promise<ReviewActionResponse> {
 return request<ReviewActionResponse>(`/reviews/${reviewId}/cancel`, {
 method: "POST",
 body: JSON.stringify({ reason }),
 });
 },

 /**
 * Resubmit review (after edits)
 */
 async resubmit(reviewId: string, note?: string): Promise<ReviewActionResponse> {
 return request<ReviewActionResponse>(`/reviews/${reviewId}/resubmit`, {
 method: "POST",
 body: JSON.stringify({ note }),
 });
 },

 // =====================
 // Review Comments
 // =====================

 /**
 * Fetch review comment list
 */
 async getComments(reviewId: string): Promise<{ success: boolean; data: import("@/types/review").ReviewComment[] }> {
 return request(`/reviews/${reviewId}/comments`);
 },

 /**
 * Create comment
 */
 async createComment(reviewId: string, data: CreateCommentRequest): Promise<CommentResponse> {
 return request<CommentResponse>(`/reviews/${reviewId}/comments`, {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * Delete comment
 */
 async deleteComment(reviewId: string, commentId: string): Promise<{ success: boolean; message: string }> {
 return request(`/reviews/${reviewId}/comments/${commentId}`, {
 method: "DELETE",
 });
 },

 /**
 * Resolve comment
 */
 async resolveComment(reviewId: string, commentId: string): Promise<CommentResponse> {
 return request<CommentResponse>(`/reviews/${reviewId}/comments/${commentId}/resolve`, {
 method: "POST",
 });
 },

 // =====================
 // Review Checklists
 // =====================

 /**
 * Fetch review checklist template
 */
 async getChecklist(itemType: ReviewItemType): Promise<GetChecklistResponse> {
 return request<GetChecklistResponse>(`/reviews/checklists/${itemType}`);
 },

 // =====================
 // Reviewer Management
 // =====================

 /**
 * Fetch reviewer list
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
 * Fetch my review tasks
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
 * Fetch my submitted reviews
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
 // Batch Actions
 // =====================

 /**
 * Batch review
 */
 async batchReview(reviewIds: string[], data: ReviewActionRequest): Promise<{ success: boolean; data: { succeeded: string[]; failed: string[] }; message: string }> {
 return request(`/reviews/batch-review`, {
 method: "POST",
 body: JSON.stringify({ reviewIds, ...data }),
 });
 },

 /**
 * Batch assign
 */
 async batchAssign(reviewIds: string[], reviewerId: string): Promise<{ success: boolean; data: { succeeded: string[]; failed: string[] }; message: string }> {
 return request(`/reviews/batch-assign`, {
 method: "POST",
 body: JSON.stringify({ reviewIds, reviewerId }),
 });
 },
};
