/**
 * ReviewSystemTypeDefinition
 */

// ReviewStatus
export type ReviewStatus = 
 | "pending" // Pending Review
 | "in_review" // Review
 | "approved" // alreadyVia
 | "rejected" // alreadyDeny
 | "revision" // needEdit
 | "cancelled"; // Cancelled

// ReviewitemType
export type ReviewItemType = 
 | "agent" // Agent Review
 | "workflow" // WorkflowReview
 | "template" // TemplateReview
 | "user" // UserReview
 | "content"; // ContentReview

// ReviewPriority
export type ReviewPriority = 
 | "low" // Priority
 | "normal" // NormalPriority
 | "high" // Priority
 | "urgent"; // Urgent

// Review
export interface Reviewer {
 id: string;
 userId: string;
 role: string;
 displayName?: string;
 allowedTypes: ReviewItemType[];
 maxDailyReviews: number;
 currentWorkload: number;
 isActive: boolean;
 totalReviews: number;
 approvedCount: number;
 rejectedCount: number;
 avgReviewTime: number; // AverageReviewTime(s)
 createdAt: string;
 updatedAt: string;
 user?: {
 id: string;
 username: string;
 email: string;
 avatar?: string;
 };
}

// ReviewQueue
export interface ReviewQueueItem {
 id: string;
 itemType: ReviewItemType;
 itemId: string;
 submitterId: string;
 reviewerId?: string;
 assignedAt?: string;
 status: ReviewStatus;
 priority: ReviewPriority;
 title: string;
 description?: string;
 snapshot: Record<string, unknown>;
 submissionNote?: string;
 resultNote?: string;
 resultData?: Record<string, unknown>;
 revisionCount: number;
 revisionNote?: string;
 version: number;
 submittedAt: string;
 reviewedAt?: string;
 createdAt: string;
 updatedAt: string;
 submitter?: {
 id: string;
 username: string;
 email: string;
 avatar?: string;
 };
 reviewer?: Reviewer;
}

// ReviewRecord
export interface ReviewRecord {
 id: string;
 queueId: string;
 reviewerId: string;
 action: string; // assign, review, approve, reject, request_revision
 fromStatus?: ReviewStatus;
 toStatus: ReviewStatus;
 comment?: string;
 details?: Record<string, unknown>;
 durationMs?: number;
 createdAt: string;
 reviewer?: Reviewer;
}

// ReviewComment
export interface ReviewComment {
 id: string;
 queueId: string;
 userId: string;
 content: string;
 commentType: string; // comment, question, suggestion, issue
 targetPath?: string;
 parentId?: string;
 isResolved: boolean;
 resolvedAt?: string;
 resolvedBy?: string;
 createdAt: string;
 updatedAt: string;
 user?: {
 id: string;
 username: string;
 email: string;
 avatar?: string;
 };
 replies?: ReviewComment[];
}

// ReviewCheck
export interface ChecklistItem {
 id: string;
 label: string;
 required: boolean;
 category: string;
 checked?: boolean;
}

// ReviewCheckTemplate
export interface ReviewChecklist {
 id: string;
 name: string;
 description?: string;
 itemType: ReviewItemType;
 items: ChecklistItem[];
 isActive: boolean;
 isDefault: boolean;
 createdAt: string;
 updatedAt: string;
}

// ReviewStatistics
export interface ReviewStats {
 pending: number;
 inReview: number;
 approved: number;
 rejected: number;
 revision: number;
 total: number;
 avgReviewTimeHours: number;
}

// =====================
// RequestParameterType
// =====================

// ReviewQueueListRequestParameter
export interface ListReviewQueueParams {
 itemType?: ReviewItemType;
 status?: ReviewStatus;
 priority?: ReviewPriority;
 submitterId?: string;
 reviewerId?: string;
 page?: number;
 pageSize?: number;
 startDate?: string;
 endDate?: string;
}

// SubmitReviewRequest
export interface SubmitReviewRequest {
 itemType: ReviewItemType;
 itemId: string;
 title: string;
 description?: string;
 submissionNote?: string;
 priority?: ReviewPriority;
}

// ReviewActionRequest
export interface ReviewActionRequest {
 action: "approve" | "reject" | "request_revision";
 comment?: string;
 details?: Record<string, unknown>;
 checklist?: ChecklistItem[];
}

// AllocateReviewRequest
export interface AssignReviewerRequest {
 reviewerId: string;
}

// CreateCommentRequest
export interface CreateCommentRequest {
 content: string;
 commentType?: string;
 targetPath?: string;
 parentId?: string;
}

// =====================
// ResponseType
// =====================

// ReviewQueueListResponse
export interface ListReviewQueueResponse {
 success: boolean;
 data: ReviewQueueItem[];
 meta: {
 total: number;
 page: number;
 pageSize: number;
 };
}

// ReviewDetailsResponse
export interface GetReviewDetailResponse {
 success: boolean;
 data: ReviewQueueItem & {
 records: ReviewRecord[];
 comments: ReviewComment[];
 };
}

// ReviewStatisticsResponse
export interface GetReviewStatsResponse {
 success: boolean;
 data: ReviewStats;
}

// SubmitReviewResponse
export interface SubmitReviewResponse {
 success: boolean;
 data: ReviewQueueItem;
 message: string;
}

// ReviewActionResponse
export interface ReviewActionResponse {
 success: boolean;
 data: ReviewQueueItem;
 message: string;
}

// ReviewCheckListResponse
export interface GetChecklistResponse {
 success: boolean;
 data: ReviewChecklist;
}

// CommentActionResponse
export interface CommentResponse {
 success: boolean;
 data: ReviewComment;
 message: string;
}

// ReviewListResponse
export interface ListReviewersResponse {
 success: boolean;
 data: Reviewer[];
 meta: {
 total: number;
 page: number;
 pageSize: number;
 };
}
