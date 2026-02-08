/**
 * NotificationsSystemTypeDefinition
 */

// NotificationsType
export type NotificationType =
 | "follow" // FollowNotifications
 | "comment" // CommentNotifications
 | "reply" // ReplyNotifications
 | "like" // LikeNotifications
 | "mention" // @andNotifications
 | "system" // SystemNotifications
 | "income"; // EarningsNotifications

// NotificationsAssociateUser
export interface NotificationUser {
 id: string;
 username: string;
 displayName?: string;
 avatarUrl?: string;
}

// NotificationsDetails
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

// Unread count statistics
export interface UnreadCount {
 total: number;
 byType: Record<NotificationType, number>;
}

// =====================
// use API Response
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
// RequestParameterType
// =====================

// NotificationsListRequestParameter
export interface ListNotificationsParams {
 type?: NotificationType;
 isRead?: boolean;
 page?: number;
 pageSize?: number;
}

// BatchMarkalreadyreadRequest
export interface MarkMultipleAsReadRequest {
 ids: string[];
}

// =====================
// ResponseType
// =====================

// NotificationsListResponse
export interface ListNotificationsResponse {
 items: NotificationItem[];
 meta: {
 total: number;
 page: number;
 pageSize: number;
 };
}

// NotificationsDetailsResponse
export interface GetNotificationResponse {
 data: NotificationItem;
}

// Unread count response
export interface GetUnreadCountResponse {
 data: UnreadCount;
}

// useActionResponse
export interface NotificationActionResponse {
 message?: string;
}
