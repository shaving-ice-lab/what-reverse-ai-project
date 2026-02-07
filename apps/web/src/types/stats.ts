/**
 * StatisticsRelatedTypeDefinition
 */

/**
 * OverviewStatistics
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
 * eachdayStatistics
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
 * ErrorStatistics
 */
export interface ErrorStats {
 error_message: string;
 count: number;
 last_occurred: string;
}

/**
 * WorkflowStatistics
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
 * StatisticsOverviewResponse
 */
export interface OverviewStatsResponse {
 success: boolean;
 data: OverviewStats;
}

/**
 * ExecuteTrendResponse
 */
export interface ExecutionTrendsResponse {
 success: boolean;
 data: DailyStats[];
}

/**
 * WorkflowStatisticsResponse
 */
export interface WorkflowStatsResponse {
 success: boolean;
 data: WorkflowStats;
}
