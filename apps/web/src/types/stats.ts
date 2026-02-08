/**
 * Statistics Related Type Definitions
 */

/**
 * Overview Statistics
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
 * Daily Statistics
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
 * Error Statistics
 */
export interface ErrorStats {
 error_message: string;
 count: number;
 last_occurred: string;
}

/**
 * Workflow Statistics
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
 * Statistics Overview Response
 */
export interface OverviewStatsResponse {
 success: boolean;
 data: OverviewStats;
}

/**
 * Execution Trend Response
 */
export interface ExecutionTrendsResponse {
 success: boolean;
 data: DailyStats[];
}

/**
 * Workflow Statistics Response
 */
export interface WorkflowStatsResponse {
 success: boolean;
 data: WorkflowStats;
}
