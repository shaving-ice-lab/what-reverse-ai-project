/**
 * 通知系统 API 服务
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
 * 通知系统 API
 */
export const notificationApi = {
  /**
   * 获取通知列表
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
   * 获取通知详情
   */
  async get(notificationId: string): Promise<GetNotificationResponse> {
    const response = await request<ApiResponse<NotificationItem>>(
      `/notifications/${notificationId}`
    );
    return { data: response.data };
  },

  /**
   * 标记单个通知为已读
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
   * 标记所有通知为已读
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
   * 批量标记通知为已读
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
   * 删除通知
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
   * 清空通知
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
   * 获取未读通知数量
   */
  async getUnreadCount(): Promise<GetUnreadCountResponse> {
    const response = await request<ApiResponse<UnreadCount>>("/notifications/unread-count");
    return { data: response.data };
  },
};
