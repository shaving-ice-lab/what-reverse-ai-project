/**
 * 系统 API 服务
 */

import type { SystemHealth, Announcement } from "@/types/system";
import { request } from "./shared";

/**
 * 系统健康状态响应
 */
export interface SystemHealthResponse {
  success: boolean;
  data: SystemHealth[];
}

/**
 * 公告列表响应
 */
export interface AnnouncementListResponse {
  success: boolean;
  data: Announcement[];
  meta?: {
    total: number;
    page: number;
    page_size: number;
  };
}

/**
 * 系统 API
 */
export const systemApi = {
  /**
   * 获取系统健康状态
   * @returns 系统健康状态数组
   */
  async getHealth(): Promise<SystemHealthResponse> {
    return request<SystemHealthResponse>("/system/health");
  },

  /**
   * 获取公告列表
   * @param params 查询参数
   * @returns 公告列表
   */
  async getAnnouncements(params?: {
    type?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AnnouncementListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("page_size", String(params.pageSize));
    
    const query = searchParams.toString();
    return request<AnnouncementListResponse>(`/announcements${query ? `?${query}` : ""}`);
  },

  /**
   * 标记公告为已读
   * @param id 公告 ID
   */
  async markAnnouncementAsRead(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/announcements/${id}/read`, {
      method: "POST",
    });
  },
};
