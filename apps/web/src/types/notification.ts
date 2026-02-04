/**
 * 通知系统类型定义
 */

// 通知类型
export type NotificationType =
  | "follow"   // 关注通知
  | "comment"  // 评论通知
  | "reply"    // 回复通知
  | "like"     // 点赞通知
  | "mention"  // @提及通知
  | "system"   // 系统通知
  | "income";  // 收入通知

// 通知关联用户
export interface NotificationUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

// 通知详情
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  content?: string;
  actor?: NotificationUser;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// 未读数统计
export interface UnreadCount {
  total: number;
  byType: Record<NotificationType, number>;
}

// =====================
// 通用 API 响应
// =====================

export interface ApiMeta {
  total?: number;
  page?: number;
  page_size?: number;
}

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  meta?: ApiMeta;
}

// =====================
// 请求参数类型
// =====================

// 通知列表请求参数
export interface ListNotificationsParams {
  type?: NotificationType;
  isRead?: boolean;
  page?: number;
  pageSize?: number;
}

// 批量标记已读请求
export interface MarkMultipleAsReadRequest {
  ids: string[];
}

// =====================
// 响应类型
// =====================

// 通知列表响应
export interface ListNotificationsResponse {
  items: NotificationItem[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// 通知详情响应
export interface GetNotificationResponse {
  data: NotificationItem;
}

// 未读数响应
export interface GetUnreadCountResponse {
  data: UnreadCount;
}

// 通用操作响应
export interface NotificationActionResponse {
  message?: string;
}
