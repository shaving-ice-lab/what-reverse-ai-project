/**
 * Dashboard API Service — Core endpoints only
 */

import { request } from './shared'

export interface QuickStats {
  total_workspaces: number
  published_apps: number
  total_agent_sessions: number
  total_tables: number
  runs_today: number
  runs_this_week: number
  success_rate: number
  tokens_used_today: number
  tokens_used_month: number
  avg_response_time_ms: number
}

export interface ActivitySummary {
  id: string
  action: string
  description: string
  resource_id?: string
  metadata?: Record<string, unknown>
  created_at: string
  time_ago: string
}

export interface DashboardData {
  quick_stats: QuickStats
  recent_activities: ActivitySummary[]
  [key: string]: unknown
}

export interface DashboardResponse {
  success: boolean
  data: DashboardData
}

export interface QuickStatsResponse {
  success: boolean
  data: QuickStats
}

export interface ActivitiesResponse {
  success: boolean
  data: ActivitySummary[]
}

/**
 * Dashboard API — core endpoints only
 */
export const dashboardApi = {
  async getDashboardData(): Promise<DashboardResponse> {
    return request<DashboardResponse>('/dashboard')
  },

  async getQuickStats(): Promise<QuickStatsResponse> {
    return request<QuickStatsResponse>('/dashboard/stats')
  },

  async getRecentActivities(limit: number = 10): Promise<ActivitiesResponse> {
    const params = new URLSearchParams()
    if (limit > 0) {
      params.set('limit', String(Math.min(limit, 50)))
    }
    const query = params.toString()
    return request<ActivitiesResponse>(`/dashboard/activities${query ? `?${query}` : ''}`)
  },
}

/**
 * Format Activity Summary as Frontend-Friendly Format
 */
export function formatActivitySummary(activity: ActivitySummary) {
  return {
    id: activity.id,
    action: activity.action,
    description: activity.description,
    resourceId: activity.resource_id,
    metadata: activity.metadata,
    createdAt: activity.created_at,
    timeAgo: activity.time_ago,
  }
}

/**
 * Get Activity Icon
 */
export function getActivityIcon(action: string): string {
  const iconMap: Record<string, string> = {
    login: 'LogIn',
    logout: 'LogOut',
    update_profile: 'User',
    change_password: 'Lock',
    create_agent: 'Bot',
    update_agent: 'RefreshCw',
    create_api_key: 'Key',
    delete_api_key: 'KeyRound',
    create_table: 'Table2',
    publish_app: 'Rocket',
  }
  return iconMap[action] || 'Activity'
}
