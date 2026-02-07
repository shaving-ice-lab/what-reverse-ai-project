/**
 * ActivityHistory API Service
 */

import type { UserActivity } from "@/types/activity";
import { request } from "./shared";

/**
 * ActivityListResponse
 */
export interface ActivityListResponse {
  success: boolean;
  data: UserActivity[];
  meta?: {
    total: number;
    page: number;
    page_size: number;
  };
}

/**
 * Activity API
 */
export const activityApi = {
  /**
 * FetchUserActivityHistory
 * @param params QueryParameter
 * @returns ActivityList
   */
  async list(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ActivityListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("page_size", String(params.pageSize));
    
    const query = searchParams.toString();
    return request<ActivityListResponse>(`/users/me/activities${query ? `?${query}` : ""}`);
  },
};

/**
 * FormatActivityDisplayText
 */
export function formatActivityAction(action: string): string {
  const actionMap: Record<string, string> = {
 login: "Sign InSuccess",
 logout: "Sign Out",
 create_workflow: "CreateWorkflow",
 update_workflow: "UpdateWorkflow",
 delete_workflow: "DeleteWorkflow",
 run_workflow: "RunWorkflow",
 update_profile: "UpdateProfile",
 change_password: "EditPassword",
 create_agent: "Publish Agent",
 update_agent: "Update Agent",
 create_api_key: "Create API Key",
 delete_api_key: "Delete API Key",
  };
  return actionMap[action] || action;
}
