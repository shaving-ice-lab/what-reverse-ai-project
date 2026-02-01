/**
 * 通知系统 API 服务
 */

import type {
  ListNotificationsParams,
  ListNotificationsResponse,
  GetNotificationResponse,
  GetUnreadCountResponse,
  NotificationActionResponse,
  MarkMultipleAsReadRequest,
  NotificationType,
} from "@/types/notification";
import { request } from "./shared";

/**
 * 通知系统 API
 */
export const notificationApi = {
  /**
   * 获取通知列表
   */
  async list(params?: ListNotificationsParams): Promise<ListNotificationsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      if (params.type) searchParams.set("type", params.type);
      if (params.isRead !== undefined) searchParams.set("is_read", String(params.isRead));
      if (params.page) searchParams.set("page", String(params.page));
      if (params.pageSize) searchParams.set("page_size", String(params.pageSize));
    }
    
    const query = searchParams.toString();
    return request<ListNotificationsResponse>(`/notifications${query ? `?${query}` : ""}`);
  },

  /**
   * 获取通知详情
   */
  async get(notificationId: string): Promise<GetNotificationResponse> {
    return request<GetNotificationResponse>(`/notifications/${notificationId}`);
  },

  /**
   * 标记单个通知为已读
   */
  async markAsRead(notificationId: string): Promise<NotificationActionResponse> {
    return request<NotificationActionResponse>(`/notifications/${notificationId}/read`, {
      method: "POST",
    });
  },

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(type?: NotificationType): Promise<NotificationActionResponse> {
    const searchParams = new URLSearchParams();
    if (type) searchParams.set("type", type);
    const query = searchParams.toString();
    
    return request<NotificationActionResponse>(`/notifications/read-all${query ? `?${query}` : ""}`, {
      method: "POST",
    });
  },

  /**
   * 批量标记通知为已读
   */
  async markMultipleAsRead(ids: string[]): Promise<NotificationActionResponse> {
    return request<NotificationActionResponse>("/notifications/read-multiple", {
      method: "POST",
      body: JSON.stringify({ ids } as MarkMultipleAsReadRequest),
    });
  },

  /**
   * 删除通知
   */
  async delete(notificationId: string): Promise<NotificationActionResponse> {
    return request<NotificationActionResponse>(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  },

  /**
   * 清空通知
   */
  async clearAll(type?: NotificationType): Promise<NotificationActionResponse> {
    const searchParams = new URLSearchParams();
    if (type) searchParams.set("type", type);
    const query = searchParams.toString();
    
    return request<NotificationActionResponse>(`/notifications/clear${query ? `?${query}` : ""}`, {
      method: "DELETE",
    });
  },

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(): Promise<GetUnreadCountResponse> {
    return request<GetUnreadCountResponse>("/notifications/unread-count");
  },
};
