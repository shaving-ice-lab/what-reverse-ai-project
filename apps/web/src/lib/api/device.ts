/**
 * 设备管理 API 服务
 */

import type { LoginDevice } from "@/types/device";
import { request } from "./shared";

/**
 * 设备列表响应
 */
export interface DeviceListResponse {
  success: boolean;
  data: LoginDevice[];
}

/**
 * 设备 API
 */
export const deviceApi = {
  /**
   * 获取登录设备列表
   * @returns 设备列表
   */
  async list(): Promise<DeviceListResponse> {
    return request<DeviceListResponse>("/users/me/devices");
  },

  /**
   * 登出指定设备
   * @param id 设备/会话 ID
   */
  async logout(id: string): Promise<{ success: boolean; data: { message: string } }> {
    return request<{ success: boolean; data: { message: string } }>(`/users/me/devices/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * 登出所有其他设备
   */
  async logoutOthers(): Promise<{ success: boolean; data: { message: string } }> {
    return request<{ success: boolean; data: { message: string } }>("/users/me/devices/others", {
      method: "DELETE",
    });
  },
};
