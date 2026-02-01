/**
 * 活动历史 API 服务
 */

import type { UserActivity } from "@/types/activity";
import { request } from "./shared";

/**
 * 活动列表响应
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
 * 活动 API
 */
export const activityApi = {
  /**
   * 获取用户活动历史
   * @param params 查询参数
   * @returns 活动列表
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
 * 格式化活动显示文本
 */
export function formatActivityAction(action: string): string {
  const actionMap: Record<string, string> = {
    login: "登录成功",
    logout: "退出登录",
    create_workflow: "创建工作流",
    update_workflow: "更新工作流",
    delete_workflow: "删除工作流",
    run_workflow: "运行工作流",
    update_profile: "更新个人资料",
    change_password: "修改密码",
    create_agent: "发布 Agent",
    update_agent: "更新 Agent",
    create_api_key: "创建 API 密钥",
    delete_api_key: "删除 API 密钥",
  };
  return actionMap[action] || action;
}
