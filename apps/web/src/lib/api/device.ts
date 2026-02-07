/**
 * DeviceManage API Service
 */

import type { LoginDevice } from "@/types/device";
import { request } from "./shared";

/**
 * DeviceListResponse
 */
export interface DeviceListResponse {
 success: boolean;
 data: LoginDevice[];
}

/**
 * Device API
 */
export const deviceApi = {
 /**
 * FetchSign InDeviceList
 * @returns DeviceList
 */
 async list(): Promise<DeviceListResponse> {
 return request<DeviceListResponse>("/users/me/devices");
 },

 /**
 * Sign OutSpecifyDevice
 * @param id Device/will ID
 */
 async logout(id: string): Promise<{ success: boolean; data: { message: string } }> {
 return request<{ success: boolean; data: { message: string } }>(`/users/me/devices/${id}`, {
 method: "DELETE",
 });
 },

 /**
 * Sign OutAllotherheDevice
 */
 async logoutOthers(): Promise<{ success: boolean; data: { message: string } }> {
 return request<{ success: boolean; data: { message: string } }>("/users/me/devices/others", {
 method: "DELETE",
 });
 },
};
