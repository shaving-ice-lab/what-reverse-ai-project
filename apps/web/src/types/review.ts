/**
 * 审核系统类型定义
 */

// 审核状态
export type ReviewStatus = 
  | "pending"     // 待审核
  | "in_review"   // 审核中
  | "approved"    // 已通过
  | "rejected"    // 已拒绝
  | "revision"    // 需修改
  | "cancelled";  // 已取消

// 审核项目类型
export type ReviewItemType = 
  | "agent"       // Agent 审核
  | "workflow"    // 工作流审核
  | "template"    // 模板审核
  | "user"        // 用户审核
  | "content";    // 内容审核

// 审核优先级
export type ReviewPriority = 
  | "low"         // 低优先级
  | "normal"      // 普通优先级
  | "high"        // 高优先级
  | "urgent";     // 紧急

// 审核员
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
  avgReviewTime: number; // 平均审核时间(秒)
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

// 审核队列项
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

// 审核记录
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

// 审核评论
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

// 审核检查项
export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  category: string;
  checked?: boolean;
}

// 审核检查项模板
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

// 审核统计
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
// 请求参数类型
// =====================

// 审核队列列表请求参数
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

// 提交审核请求
export interface SubmitReviewRequest {
  itemType: ReviewItemType;
  itemId: string;
  title: string;
  description?: string;
  submissionNote?: string;
  priority?: ReviewPriority;
}

// 审核操作请求
export interface ReviewActionRequest {
  action: "approve" | "reject" | "request_revision";
  comment?: string;
  details?: Record<string, unknown>;
  checklist?: ChecklistItem[];
}

// 分配审核员请求
export interface AssignReviewerRequest {
  reviewerId: string;
}

// 创建评论请求
export interface CreateCommentRequest {
  content: string;
  commentType?: string;
  targetPath?: string;
  parentId?: string;
}

// =====================
// 响应类型
// =====================

// 审核队列列表响应
export interface ListReviewQueueResponse {
  success: boolean;
  data: ReviewQueueItem[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// 审核详情响应
export interface GetReviewDetailResponse {
  success: boolean;
  data: ReviewQueueItem & {
    records: ReviewRecord[];
    comments: ReviewComment[];
  };
}

// 审核统计响应
export interface GetReviewStatsResponse {
  success: boolean;
  data: ReviewStats;
}

// 提交审核响应
export interface SubmitReviewResponse {
  success: boolean;
  data: ReviewQueueItem;
  message: string;
}

// 审核操作响应
export interface ReviewActionResponse {
  success: boolean;
  data: ReviewQueueItem;
  message: string;
}

// 审核检查项列表响应
export interface GetChecklistResponse {
  success: boolean;
  data: ReviewChecklist;
}

// 评论操作响应
export interface CommentResponse {
  success: boolean;
  data: ReviewComment;
  message: string;
}

// 审核员列表响应
export interface ListReviewersResponse {
  success: boolean;
  data: Reviewer[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}
