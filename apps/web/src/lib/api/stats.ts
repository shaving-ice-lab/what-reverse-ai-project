/**
 * 统计 API 服务
 */

import type {
  OverviewStats,
  DailyStats,
  WorkflowStats,
  OverviewStatsResponse,
  ExecutionTrendsResponse,
  WorkflowStatsResponse,
} from "@/types/stats";
import { request } from "./shared";

/**
 * 统计 API
 */
export const statsApi = {
  /**
   * 获取统计总览
   * @returns 统计总览数据
   */
  async getOverview(): Promise<OverviewStatsResponse> {
    return request<OverviewStatsResponse>("/stats/overview");
  },

  /**
   * 获取执行趋势
   * @param days 天数 (默认7天，最大90天)
   * @returns 每日统计数组
   */
  async getExecutionTrends(days: number = 7): Promise<ExecutionTrendsResponse> {
    const params = new URLSearchParams();
    if (days > 0) {
      params.set("days", String(Math.min(days, 90)));
    }
    const query = params.toString();
    return request<ExecutionTrendsResponse>(`/stats/executions${query ? `?${query}` : ""}`);
  },

  /**
   * 获取工作流统计
   * @param workflowId 工作流 ID
   * @returns 工作流统计数据
   */
  async getWorkflowStats(workflowId: string): Promise<WorkflowStatsResponse> {
    return request<WorkflowStatsResponse>(`/stats/workflows/${workflowId}`);
  },

  /**
   * 获取工作流分析（按状态和节点类型分布）
   * @returns 工作流分析数据
   */
  async getWorkflowAnalytics(): Promise<WorkflowAnalyticsResponse> {
    return request<WorkflowAnalyticsResponse>("/stats/workflow-analytics");
  },
};

/**
 * 分布项
 */
export interface DistributionItem {
  label: string;
  value: number;
  color: string;
  icon?: string;
}

/**
 * 工作流分析响应
 */
export interface WorkflowAnalyticsResponse {
  success: boolean;
  data: {
    status_distribution: DistributionItem[];
    node_type_distribution: DistributionItem[];
  };
}

/**
 * 辅助函数：将后端的 snake_case 转换为前端友好的格式
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
  };
}

export function formatDailyStats(stats: DailyStats[]) {
  return stats.map((s) => ({
    date: s.date,
    executions: s.executions,
    successfulRuns: s.successful_runs,
    failedRuns: s.failed_runs,
    avgDurationMs: s.avg_duration_ms,
    tokensUsed: s.tokens_used,
  }));
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
  };
}
