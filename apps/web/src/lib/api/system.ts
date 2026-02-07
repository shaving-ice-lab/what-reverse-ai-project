/**
 * System API Service
 */

import type { SystemHealth, Announcement } from "@/types/system";
import { request } from "./shared";

/**
 * SystemHealthStatusResponse
 */
export interface SystemHealthResponse {
 success: boolean;
 data: SystemHealth[];
}

/**
 * AnnouncementListResponse
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
 * System API
 */
export const systemApi = {
 /**
 * FetchSystemHealthStatus
 * @returns SystemHealthStatuscountgroup
 */
 async getHealth(): Promise<SystemHealthResponse> {
 return request<SystemHealthResponse>("/system/health");
 },

 /**
 * FetchAnnouncementList
 * @param params QueryParameter
 * @returns AnnouncementList
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
 * MarkAnnouncementasalreadyread
 * @param id Announcement ID
 */
 async markAnnouncementAsRead(id: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/announcements/${id}/read`, {
 method: "POST",
 });
 },
};
