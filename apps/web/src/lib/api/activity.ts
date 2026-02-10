/**
 * Activity History API Service
 */

import type { UserActivity } from '@/types/activity'
import { request } from './shared'

/**
 * Activity List Response
 */
export interface ActivityListResponse {
  success: boolean
  data: UserActivity[]
  meta?: {
    total: number
    page: number
    page_size: number
  }
}

/**
 * Activity API
 */
export const activityApi = {
  /**
   * Fetch User Activity History
   * @param params Query Parameter
   * @returns Activity List
   */
  async list(params?: { page?: number; pageSize?: number }): Promise<ActivityListResponse> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.pageSize) searchParams.set('page_size', String(params.pageSize))

    const query = searchParams.toString()
    return request<ActivityListResponse>(`/users/me/activities${query ? `?${query}` : ''}`)
  },
}

/**
 * Format Activity Display Text
 */
export function formatActivityAction(action: string): string {
  const actionMap: Record<string, string> = {
    login: 'Signed In Successfully',
    logout: 'Sign Out',
    create_workflow: 'Create Workflow',
    update_workflow: 'Update Workflow',
    delete_workflow: 'Delete Workflow',
    run_workflow: 'Run Workflow',
    update_profile: 'Update Profile',
    change_password: 'Change Password',
    create_agent: 'Publish Agent',
    update_agent: 'Update Agent',
    create_api_key: 'Create API Key',
    delete_api_key: 'Delete API Key',
  }
  return actionMap[action] || action
}
