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
 // ReviewQueueManage
 // =====================

 /**
 * FetchReviewQueueList
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
 * FetchReviewDetails
 */
 async get(reviewId: string): Promise<GetReviewDetailResponse> {
 return request<GetReviewDetailResponse>(`/reviews/${reviewId}`);
 },

 /**
 * FetchReviewStatistics
 */
 async getStats(): Promise<GetReviewStatsResponse> {
 return request<GetReviewStatsResponse>("/reviews/stats");
 },

 /**
 * SubmitReview
 */
 async submit(data: SubmitReviewRequest): Promise<SubmitReviewResponse> {
 return request<SubmitReviewResponse>("/reviews", {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * ExecuteReviewAction(Via/Deny/needEdit)
 */
 async review(reviewId: string, data: ReviewActionRequest): Promise<ReviewActionResponse> {
 return request<ReviewActionResponse>(`/reviews/${reviewId}/review`, {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * AllocateReview
 */
 async assign(reviewId: string, data: AssignReviewerRequest): Promise<ReviewActionResponse> {
 return request<ReviewActionResponse>(`/reviews/${reviewId}/assign`, {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * CancelReview
 */
 async cancel(reviewId: string, reason?: string): Promise<ReviewActionResponse> {
 return request<ReviewActionResponse>(`/reviews/${reviewId}/cancel`, {
 method: "POST",
 body: JSON.stringify({ reason }),
 });
 },

 /**
 * re-newSubmitReview(Editafter)
 */
 async resubmit(reviewId: string, note?: string): Promise<ReviewActionResponse> {
 return request<ReviewActionResponse>(`/reviews/${reviewId}/resubmit`, {
 method: "POST",
 body: JSON.stringify({ note }),
 });
 },

 // =====================
 // ReviewComment
 // =====================

 /**
 * FetchReviewCommentList
 */
 async getComments(reviewId: string): Promise<{ success: boolean; data: import("@/types/review").ReviewComment[] }> {
 return request(`/reviews/${reviewId}/comments`);
 },

 /**
 * CreateComment
 */
 async createComment(reviewId: string, data: CreateCommentRequest): Promise<CommentResponse> {
 return request<CommentResponse>(`/reviews/${reviewId}/comments`, {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * DeleteComment
 */
 async deleteComment(reviewId: string, commentId: string): Promise<{ success: boolean; message: string }> {
 return request(`/reviews/${reviewId}/comments/${commentId}`, {
 method: "DELETE",
 });
 },

 /**
 * ResolveComment
 */
 async resolveComment(reviewId: string, commentId: string): Promise<CommentResponse> {
 return request<CommentResponse>(`/reviews/${reviewId}/comments/${commentId}/resolve`, {
 method: "POST",
 });
 },

 // =====================
 // ReviewCheck
 // =====================

 /**
 * FetchReviewCheckTemplate
 */
 async getChecklist(itemType: ReviewItemType): Promise<GetChecklistResponse> {
 return request<GetChecklistResponse>(`/reviews/checklists/${itemType}`);
 },

 // =====================
 // ReviewManage
 // =====================

 /**
 * FetchReviewList
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
 * FetchI'sReviewTask
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
 * FetchISubmit'sReview
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
 // BatchAction
 // =====================

 /**
 * BatchReview
 */
 async batchReview(reviewIds: string[], data: ReviewActionRequest): Promise<{ success: boolean; data: { succeeded: string[]; failed: string[] }; message: string }> {
 return request(`/reviews/batch-review`, {
 method: "POST",
 body: JSON.stringify({ reviewIds, ...data }),
 });
 },

 /**
 * BatchAllocate
 */
 async batchAssign(reviewIds: string[], reviewerId: string): Promise<{ success: boolean; data: { succeeded: string[]; failed: string[] }; message: string }> {
 return request(`/reviews/batch-assign`, {
 method: "POST",
 body: JSON.stringify({ reviewIds, reviewerId }),
 });
 },
};
