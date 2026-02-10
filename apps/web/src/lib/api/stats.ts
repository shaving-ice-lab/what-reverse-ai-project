/**
 * Statistics API Service
 */

import type {
  OverviewStats,
  DailyStats,
  WorkflowStats,
  OverviewStatsResponse,
  ExecutionTrendsResponse,
  WorkflowStatsResponse,
} from '@/types/stats'
import { request } from './shared'

/**
 * Statistics API
 */
export const statsApi = {
  /**
   * Fetch statistics overview
   * @returns Statistics overview data
   */
  async getOverview(): Promise<OverviewStatsResponse> {
    return request<OverviewStatsResponse>('/stats/overview')
  },

  /**
   * Fetch execution trends
   * @param days Number of days (Default 7 days, Maximum 90 days)
   * @returns Daily statistics data array
   */
  async getExecutionTrends(days: number = 7): Promise<ExecutionTrendsResponse> {
    const params = new URLSearchParams()
    if (days > 0) {
      params.set('days', String(Math.min(days, 90)))
    }
    const query = params.toString()
    return request<ExecutionTrendsResponse>(`/stats/executions${query ? `?${query}` : ''}`)
  },

  /**
   * Fetch workflow statistics
   * @param workflowId Workflow ID
   * @returns Workflow statistics data
   */
  async getWorkflowStats(workflowId: string): Promise<WorkflowStatsResponse> {
    return request<WorkflowStatsResponse>(`/stats/workflows/${workflowId}`)
  },

  /**
   * Fetch workflow analytics (by status and node type distribution)
   * @returns Workflow analytics data
   */
  async getWorkflowAnalytics(): Promise<WorkflowAnalyticsResponse> {
    return request<WorkflowAnalyticsResponse>('/stats/workflow-analytics')
  },
}

/**
 * Distribution
 */
export interface DistributionItem {
  label: string
  value: number
  color: string
  icon?: string
}

/**
 * WorkflowAnalyticsResponse
 */
export interface WorkflowAnalyticsResponse {
  success: boolean
  data: {
    status_distribution: DistributionItem[]
    node_type_distribution: DistributionItem[]
  }
}

/**
 * Helper function: Convert backend snake_case to frontend-friendly format
 */
export function formatOverviewStats(stats: OverviewStats) {
  return {
    totalWorkflows: stats.total_workflows,
    activeWorkflows: stats.active_workflows,
    totalExecutions: stats.total_executions,
    successfulRuns: stats.successful_runs,
    failedRuns: stats.failed_runs,
    successRate: stats.success_rate,
    totalTokensUsed: stats.total_tokens_used,
    avgResponseTimeMs: stats.avg_response_time_ms,
    runsToday: stats.runs_today,
    runsThisWeek: stats.runs_this_week,
    runsThisMonth: stats.runs_this_month,
  }
}

export function formatDailyStats(stats: DailyStats[]) {
  return stats.map((s) => ({
    date: s.date,
    executions: s.executions,
    successfulRuns: s.successful_runs,
    failedRuns: s.failed_runs,
    avgDurationMs: s.avg_duration_ms,
    tokensUsed: s.tokens_used,
  }))
}

export function formatWorkflowStats(stats: WorkflowStats) {
  return {
    workflowId: stats.workflow_id,
    workflowName: stats.workflow_name,
    totalRuns: stats.total_runs,
    successfulRuns: stats.successful_runs,
    failedRuns: stats.failed_runs,
    successRate: stats.success_rate,
    avgDurationMs: stats.avg_duration_ms,
    lastRunAt: stats.last_run_at,
    recentTrends: formatDailyStats(stats.recent_trends),
    topErrors: stats.top_errors.map((e) => ({
      errorMessage: e.error_message,
      count: e.count,
      lastOccurred: e.last_occurred,
    })),
  }
}
