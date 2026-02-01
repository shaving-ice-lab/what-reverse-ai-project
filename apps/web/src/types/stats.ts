/**
 * 统计相关类型定义
 */

/**
 * 总览统计
 */
export interface OverviewStats {
  total_workflows: number;
  active_workflows: number;
  total_executions: number;
  successful_runs: number;
  failed_runs: number;
  success_rate: number;
  total_tokens_used: number;
  avg_response_time_ms: number;
  runs_today: number;
  runs_this_week: number;
  runs_this_month: number;
}

/**
 * 每日统计
 */
export interface DailyStats {
  date: string;
  executions: number;
  successful_runs: number;
  failed_runs: number;
  avg_duration_ms: number;
  tokens_used: number;
}

/**
 * 错误统计
 */
export interface ErrorStats {
  error_message: string;
  count: number;
  last_occurred: string;
}

/**
 * 工作流统计
 */
export interface WorkflowStats {
  workflow_id: string;
  workflow_name: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  success_rate: number;
  avg_duration_ms: number;
  last_run_at: string | null;
  recent_trends: DailyStats[];
  top_errors: ErrorStats[];
}

/**
 * 统计总览响应
 */
export interface OverviewStatsResponse {
  success: boolean;
  data: OverviewStats;
}

/**
 * 执行趋势响应
 */
export interface ExecutionTrendsResponse {
  success: boolean;
  data: DailyStats[];
}

/**
 * 工作流统计响应
 */
export interface WorkflowStatsResponse {
  success: boolean;
  data: WorkflowStats;
}
