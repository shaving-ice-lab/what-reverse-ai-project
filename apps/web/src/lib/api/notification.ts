/**
 * NotificationsSystem API Service
 */

import type {
 ApiResponse,
 ListNotificationsParams,
 ListNotificationsResponse,
 GetNotificationResponse,
 GetUnreadCountResponse,
 NotificationActionResponse,
 MarkMultipleAsReadRequest,
 NotificationType,
 NotificationItem,
 UnreadCount,
} from "@/types/notification";
import { request } from "./shared";

/**
 * NotificationsSystem API
 */
export const notificationApi = {
 /**
 * FetchNotificationsList
 */
 async list(params?: ListNotificationsParams): Promise<ListNotificationsResponse> {
 const searchParams = new URLSearchParams();
 const page = params?.page ?? 1;
 const pageSize = params?.pageSize ?? 20;
 
 if (params) {
 if (params.type) searchParams.set("type", params.type);
 if (params.isRead !== undefined) searchParams.set("is_read", String(params.isRead));
 if (params.page) searchParams.set("page", String(params.page));
 if (params.pageSize) searchParams.set("page_size", String(params.pageSize));
 }
 
 const query = searchParams.toString();
 const response = await request<ApiResponse<NotificationItem[]>>(
 `/notifications${query ? `?${query}` : ""}`
 );
 const meta = response.meta || {};
 return {
 items: response.data || [],
 meta: {
 total: meta.total ?? 0,
 page: meta.page ?? page,
 pageSize: meta.page_size ?? pageSize,
 },
 };
 },

 /**
 * FetchNotificationsDetails
 */
 async get(notificationId: string): Promise<GetNotificationResponse> {
 const response = await request<ApiResponse<NotificationItem>>(
 `/notifications/${notificationId}`
 );
 return { data: response.data };
 },

 /**
 * MarkNotificationsasalreadyread
 */
 async markAsRead(notificationId: string): Promise<NotificationActionResponse> {
 const response = await request<ApiResponse<{ message?: string }>>(
 `/notifications/${notificationId}/read`,
 {
 method: "POST",
 }
 );
 return { message: response.data?.message };
 },

 /**
 * MarkAllNotificationsasalreadyread
 */
 async markAllAsRead(type?: NotificationType): Promise<NotificationActionResponse> {
 const searchParams = new URLSearchParams();
 if (type) searchParams.set("type", type);
 const query = searchParams.toString();
 
 const response = await request<ApiResponse<{ message?: string }>>(
 `/notifications/read-all${query ? `?${query}` : ""}`,
 {
 method: "POST",
 }
 );
 return { message: response.data?.message };
 },

 /**
 * BatchMarkNotificationsasalreadyread
 */
 async markMultipleAsRead(ids: string[]): Promise<NotificationActionResponse> {
 const response = await request<ApiResponse<{ message?: string }>>(
 "/notifications/read-multiple",
 {
 method: "POST",
 body: JSON.stringify({ ids } as MarkMultipleAsReadRequest),
 }
 );
 return { message: response.data?.message };
 },

 /**
 * DeleteNotifications
 */
 async delete(notificationId: string): Promise<NotificationActionResponse> {
 const response = await request<ApiResponse<{ message?: string }>>(
 `/notifications/${notificationId}`,
 {
 method: "DELETE",
 }
 );
 return { message: response.data?.message };
 },

 /**
 * ClearNotifications
 */
 async clearAll(type?: NotificationType): Promise<NotificationActionResponse> {
 const searchParams = new URLSearchParams();
 if (type) searchParams.set("type", type);
 const query = searchParams.toString();
 
 const response = await request<ApiResponse<{ message?: string }>>(
 `/notifications/clear${query ? `?${query}` : ""}`,
 {
 method: "DELETE",
 }
 );
 return { message: response.data?.message };
 },

 /**
 * Fetchnot yetreadNotificationsCount
 */
 async getUnreadCount(): Promise<GetUnreadCountResponse> {
 const response = await request<ApiResponse<UnreadCount>>("/notifications/unread-count");
 return { data: response.data };
 },
};
