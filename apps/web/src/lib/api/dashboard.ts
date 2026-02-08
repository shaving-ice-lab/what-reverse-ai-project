/**
 * Dashboard API Service
 */

import { request } from "./shared";

/**
 * ShortcutStatisticsData
 */
export interface QuickStats {
 total_workflows: number;
 active_workflows: number;
 draft_workflows: number;
 total_executions: number;
 runs_today: number;
 runs_this_week: number;
 success_rate: number;
 workflows_growth: number;
 executions_growth: number;
 success_rate_change: number;
 tokens_used_today: number;
 tokens_used_month: number;
 avg_response_time_ms: number;
}

/**
 * WorkflowSummary
 */
export interface WorkflowSummary {
 id: string;
 name: string;
 description?: string;
 icon?: string;
 status: string;
 run_count: number;
 last_run_at?: string;
 updated_at: string;
 success_rate: number;
}

/**
 * ActivitySummary
 */
export interface ActivitySummary {
 id: string;
 action: string;
 description: string;
 resource_id?: string;
 metadata?: Record<string, unknown>;
 created_at: string;
 time_ago: string;
}

/**
 * ExecuteSummary
 */
export interface ExecutionSummary {
 id: string;
 workflow_id: string;
 workflow_name: string;
 status: string;
 duration_ms?: number;
 started_at?: string;
 completed_at?: string;
 error_message?: string;
 time_ago: string;
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
 * SystemStatus
 */
export interface SystemStatus {
 is_healthy: boolean;
 api_latency_ms: number;
 queued_tasks: number;
 active_sessions: number;
 last_checked_at: string;
}

/**
 * RecommendedContent
 */
export interface Recommendation {
 type: "template" | "workflow" | "feature";
 title: string;
 description: string;
 action_url: string;
 icon?: string;
 priority: number;
}

/**
 * User Level Information
 */
export interface UserLevel {
 level: number;
 level_name: string;
 current_xp: number;
 next_level_xp: number;
 progress: number;
 total_workflows: number;
 total_executions: number;
 achievements: Achievement[];
}

/**
 * Achievement
 */
export interface Achievement {
 id: string;
 name: string;
 description: string;
 icon: string;
 unlocked: boolean;
 unlocked_at?: string;
 progress?: number;
}

/**
 * Token Usage
 */
export interface TokenUsage {
 used_today: number;
 used_this_week: number;
 used_this_month: number;
 total_used: number;
 limit: number;
 remaining: number;
 usage_percent: number;
 daily_trend: DailyTokenUsage[];
}

/**
 * Daily Token Usage
 */
export interface DailyTokenUsage {
 date: string;
 tokens: number;
}

/**
 * TemplateSummary
 */
export interface TemplateSummary {
 id: string;
 name: string;
 description: string;
 icon: string;
 category: string;
 use_count: number;
 rating: number;
 tags: string[];
}

/**
 * LearnResource
 */
export interface LearningResource {
 id: string;
 title: string;
 description: string;
 type: "article" | "video" | "tutorial";
 url: string;
 icon: string;
 duration?: string;
 is_new: boolean;
}

/**
 * SystemAnnouncement
 */
export interface Announcement {
 id: string;
 type: "info" | "warning" | "success" | "update";
 title: string;
 content: string;
 action_url?: string;
 action_label?: string;
 icon?: string;
 created_at: string;
 expires_at?: string;
 is_read: boolean;
 priority: number;
}

/**
 * Daily Task Information
 */
export interface DailyTaskInfo {
 checked_in: boolean;
 check_in_streak: number;
 today_xp: number;
 tasks: DailyTask[];
 total_tasks: number;
 completed_tasks: number;
 next_reset_at: string;
}

/**
 * Daily Task
 */
export interface DailyTask {
 id: string;
 title: string;
 description: string;
 icon: string;
 xp_reward: number;
 progress: number;
 target: number;
 current: number;
 completed: boolean;
 type: string;
}

/**
 * Check-in Result
 */
export interface CheckInResult {
 success: boolean;
 xp_earned: number;
 streak: number;
 message: string;
 bonus_reward?: string;
}

/**
 * Favorite
 */
export interface FavoriteItem {
 id: string;
 type: "workflow" | "template" | "agent";
 name: string;
 description?: string;
 icon?: string;
 status?: string;
 created_at: string;
 favorited_at: string;
}

/**
 * Quick Run Item
 */
export interface QuickRunItem {
 id: string;
 workflow_id: string;
 workflow_name: string;
 icon?: string;
 last_run_at: string;
 run_count: number;
 avg_duration_ms: number;
 success_rate: number;
}

/**
 * Performance Insights
 */
export interface PerformanceInsights {
 overall_score: number;
 avg_execution_time: number;
 p95_execution_time: number;
 p99_execution_time: number;
 total_executions: number;
 success_rate: number;
 bottlenecks?: Bottleneck[];
 top_performers?: WorkflowPerformance[];
 need_optimization?: WorkflowPerformance[];
 suggestions: OptimizationSuggestion[];
}

export interface Bottleneck {
 workflow_id: string;
 workflow_name: string;
 node_name?: string;
 avg_duration_ms: number;
 impact: "high" | "medium" | "low";
 suggestion: string;
}

export interface WorkflowPerformance {
 workflow_id: string;
 workflow_name: string;
 avg_duration_ms: number;
 success_rate: number;
 execution_count: number;
 trend: "up" | "down" | "stable";
}

export interface OptimizationSuggestion {
 type: "performance" | "reliability" | "cost";
 title: string;
 description: string;
 impact: "high" | "medium" | "low";
 action_url?: string;
}

/**
 * ErrorMonitor
 */
export interface ErrorMonitor {
 total_errors: number;
 errors_today: number;
 errors_this_week: number;
 error_rate: number;
 error_trend: "up" | "down" | "stable";
 recent_errors: ErrorRecord[];
 errors_by_type: ErrorType[];
 affected_workflows: AffectedWorkflow[];
}

export interface ErrorRecord {
 id: string;
 workflow_id: string;
 workflow_name: string;
 error_type: string;
 error_message: string;
 occurred_at: string;
 time_ago: string;
 severity: "critical" | "warning" | "info";
}

export interface ErrorType {
 type: string;
 count: number;
 trend: "up" | "down" | "stable";
}

export interface AffectedWorkflow {
 workflow_id: string;
 workflow_name: string;
 error_count: number;
 last_error: string;
}

/**
 * API Usage Statistics
 */
export interface APIUsageStats {
 total_calls: number;
 calls_today: number;
 calls_this_week: number;
 calls_this_month: number;
 avg_latency_ms: number;
 success_rate: number;
 rate_limit: number;
 remaining_calls: number;
 usage_percent: number;
 daily_usage: DailyAPIUsage[];
 top_endpoints: EndpointStats[];
}

export interface DailyAPIUsage {
 date: string;
 calls: number;
 success_count: number;
 error_count: number;
}

export interface EndpointStats {
 endpoint: string;
 method: string;
 calls: number;
 avg_latency_ms: number;
 success_rate: number;
}

/**
 * QuickNote
 */
export interface QuickNote {
 id: string;
 content: string;
 color?: "yellow" | "blue" | "green" | "pink";
 pinned: boolean;
 created_at: string;
 updated_at: string;
}

/**
 * IntegrationStatus
 */
export interface IntegrationStatus {
 total_integrations: number;
 connected_count: number;
 disconnected_count: number;
 integrations: IntegrationInfo[];
}

export interface IntegrationInfo {
 id: string;
 name: string;
 type: "oauth" | "api_key" | "webhook";
 icon: string;
 status: "connected" | "disconnected" | "error" | "pending";
 last_sync_at?: string;
 error_msg?: string;
}

/**
 * PlanTask
 */
export interface ScheduledTask {
 id: string;
 workflow_id: string;
 workflow_name: string;
 cron_expr: string;
 next_run_at: string;
 last_run_at?: string;
 status: "active" | "paused" | "error";
 run_count: number;
 time_until: string;
}

/**
 * Notification Center
 */
export interface NotificationCenter {
 unread_count: number;
 total_count: number;
 notifications: NotificationItem[];
 has_more: boolean;
}

export interface NotificationItem {
 id: string;
 type: "info" | "success" | "warning" | "error" | "system";
 title: string;
 message: string;
 action_url?: string;
 icon?: string;
 is_read: boolean;
 created_at: string;
 time_ago: string;
}

/**
 * AI SmartSuggestion
 */
export interface AISuggestion {
 id: string;
 type: "optimization" | "feature" | "warning" | "tip";
 title: string;
 description: string;
 confidence: number;
 action_url?: string;
 action_label?: string;
 icon: string;
 priority: number;
 dismissed: boolean;
}

/**
 * Leaderboard
 */
export interface Leaderboard {
 current_rank: number;
 total_users: number;
 rank_change: number;
 top_users: LeaderboardUser[];
 user_stats?: LeaderboardUser;
}

export interface LeaderboardUser {
 rank: number;
 user_id: string;
 username: string;
 avatar?: string;
 execution_count: number;
 success_rate: number;
 score: number;
 badge?: "gold" | "silver" | "bronze";
}

/**
 * Goal
 */
export interface Goal {
 id: string;
 title: string;
 description?: string;
 goal_type: "executions" | "workflows" | "success_rate" | "streak";
 target_value: number;
 current_value: number;
 progress: number;
 status: "active" | "completed" | "expired";
 deadline?: string;
 created_at: string;
 completed_at?: string;
 icon: string;
 color: string;
}

/**
 * SystemHealthStatus
 */
export interface SystemHealth {
 overall_status: "healthy" | "degraded" | "down";
 uptime: string;
 last_incident?: string;
 services: ServiceHealth[];
 metrics?: SystemMetrics;
}

export interface ServiceHealth {
 name: string;
 status: "operational" | "degraded" | "down";
 latency_ms: number;
 uptime_percent: number;
 last_check: string;
 icon: string;
}

export interface SystemMetrics {
 cpu_usage: number;
 memory_usage: number;
 disk_usage: number;
 active_connections: number;
 requests_per_sec: number;
 avg_latency_ms: number;
}

/**
 * Running Queue
 */
export interface RunningQueue {
 total_running: number;
 total_pending: number;
 total_completed_today: number;
 running_tasks: QueueTask[];
 pending_tasks: QueueTask[];
 queue_health: "healthy" | "busy" | "overloaded";
}

export interface QueueTask {
 id: string;
 workflow_id: string;
 workflow_name: string;
 status: "running" | "pending" | "completed" | "failed";
 progress: number;
 started_at?: string;
 duration_ms?: number;
 priority: number;
 current_step?: string;
 total_steps: number;
}

/**
 * Dashboard Complete Data
 */
export interface DashboardData {
 quick_stats: QuickStats;
 execution_trends: DailyStats[];
 recent_workflows: WorkflowSummary[];
 recent_activities: ActivitySummary[];
 recent_executions: ExecutionSummary[];
 system_status: SystemStatus;
 recommendations: Recommendation[];
 user_level?: UserLevel;
 token_usage?: TokenUsage;
 featured_templates?: TemplateSummary[];
 learning_resources?: LearningResource[];
 announcements?: Announcement[];
 daily_tasks?: DailyTaskInfo;
 favorites?: FavoriteItem[];
 quick_runs?: QuickRunItem[];
 performance_insights?: PerformanceInsights;
 error_monitor?: ErrorMonitor;
 api_usage_stats?: APIUsageStats;
 quick_notes?: QuickNote[];
 integration_status?: IntegrationStatus;
 scheduled_tasks?: ScheduledTask[];
 notifications?: NotificationCenter;
 ai_suggestions?: AISuggestion[];
 leaderboard?: Leaderboard;
 goals?: Goal[];
 system_health?: SystemHealth;
 running_queue?: RunningQueue;
}

/**
 * Dashboard API Response
 */
export interface DashboardResponse {
 success: boolean;
 data: DashboardData;
}

export interface QuickStatsResponse {
 success: boolean;
 data: QuickStats;
}

export interface WorkflowsResponse {
 success: boolean;
 data: WorkflowSummary[];
}

export interface ActivitiesResponse {
 success: boolean;
 data: ActivitySummary[];
}

export interface ExecutionsResponse {
 success: boolean;
 data: ExecutionSummary[];
}

export interface UserLevelResponse {
 success: boolean;
 data: UserLevel;
}

export interface TokenUsageResponse {
 success: boolean;
 data: TokenUsage;
}

export interface TemplatesResponse {
 success: boolean;
 data: TemplateSummary[];
}

export interface LearningResourcesResponse {
 success: boolean;
 data: LearningResource[];
}

export interface AnnouncementsResponse {
 success: boolean;
 data: Announcement[];
}

export interface DailyTasksResponse {
 success: boolean;
 data: DailyTaskInfo;
}

export interface CheckInResponse {
 success: boolean;
 data: CheckInResult;
}

export interface FavoritesResponse {
 success: boolean;
 data: FavoriteItem[];
}

export interface QuickRunsResponse {
 success: boolean;
 data: QuickRunItem[];
}

export interface PerformanceInsightsResponse {
 success: boolean;
 data: PerformanceInsights;
}

export interface ErrorMonitorResponse {
 success: boolean;
 data: ErrorMonitor;
}

export interface APIUsageStatsResponse {
 success: boolean;
 data: APIUsageStats;
}

export interface QuickNotesResponse {
 success: boolean;
 data: QuickNote[];
}

export interface QuickNoteResponse {
 success: boolean;
 data: QuickNote;
}

export interface IntegrationStatusResponse {
 success: boolean;
 data: IntegrationStatus;
}

export interface ScheduledTasksResponse {
 success: boolean;
 data: ScheduledTask[];
}

export interface NotificationsResponse {
 success: boolean;
 data: NotificationCenter;
}

export interface AISuggestionsResponse {
 success: boolean;
 data: AISuggestion[];
}

export interface LeaderboardResponse {
 success: boolean;
 data: Leaderboard;
}

export interface GoalsResponse {
 success: boolean;
 data: Goal[];
}

export interface GoalResponse {
 success: boolean;
 data: Goal;
}

export interface SystemHealthResponse {
 success: boolean;
 data: SystemHealth;
}

export interface RunningQueueResponse {
 success: boolean;
 data: RunningQueue;
}

/**
 * Dashboard API
 */
export const dashboardApi = {
 /**
 * Fetch all Dashboard data
 * @returns Dashboard Data
 */
 async getDashboardData(): Promise<DashboardResponse> {
 return request<DashboardResponse>("/dashboard");
 },

 /**
  * Fetch Quick Statistics
  * @returns Quick Statistics Data
  */
 async getQuickStats(): Promise<QuickStatsResponse> {
 return request<QuickStatsResponse>("/dashboard/stats");
 },

 /**
  * Fetch Recent Workflows
  * @param limit Return count limit (Default: 5, Maximum: 20)
  * @returns Workflow List
  */
 async getRecentWorkflows(limit: number = 5): Promise<WorkflowsResponse> {
 const params = new URLSearchParams();
 if (limit > 0) {
 params.set("limit", String(Math.min(limit, 20)));
 }
 const query = params.toString();
 return request<WorkflowsResponse>(`/dashboard/workflows${query ? `?${query}` : ""}`);
 },

 /**
  * Fetch Recent Activities
  * @param limit Return count limit (Default: 10, Maximum: 50)
  * @returns Activity List
  */
 async getRecentActivities(limit: number = 10): Promise<ActivitiesResponse> {
 const params = new URLSearchParams();
 if (limit > 0) {
 params.set("limit", String(Math.min(limit, 50)));
 }
 const query = params.toString();
 return request<ActivitiesResponse>(`/dashboard/activities${query ? `?${query}` : ""}`);
 },

 /**
  * Fetch Recent Execution Records
  * @param limit Return count limit (Default: 5, Maximum: 20)
  * @returns Execution Record List
  */
 async getRecentExecutions(limit: number = 5): Promise<ExecutionsResponse> {
 const params = new URLSearchParams();
 if (limit > 0) {
 params.set("limit", String(Math.min(limit, 20)));
 }
 const query = params.toString();
 return request<ExecutionsResponse>(`/dashboard/executions${query ? `?${query}` : ""}`);
 },

 /**
  * Fetch User Level Information
  * @returns User Level and Achievements
  */
 async getUserLevel(): Promise<UserLevelResponse> {
 return request<UserLevelResponse>("/dashboard/level");
 },

 /**
 * Fetch Token Usage
 * @returns Token UsageStatistics
 */
 async getTokenUsage(): Promise<TokenUsageResponse> {
 return request<TokenUsageResponse>("/dashboard/tokens");
 },

 /**
  * Fetch Popular Templates
  * @param limit Return count limit (Default: 4, Maximum: 10)
  * @returns Template List
  */
 async getFeaturedTemplates(limit: number = 4): Promise<TemplatesResponse> {
 const params = new URLSearchParams();
 if (limit > 0) {
 params.set("limit", String(Math.min(limit, 10)));
 }
 const query = params.toString();
 return request<TemplatesResponse>(`/dashboard/templates${query ? `?${query}` : ""}`);
 },

 /**
  * Fetch Learning Resources
  * @returns Learning Resource List
  */
 async getLearningResources(): Promise<LearningResourcesResponse> {
 return request<LearningResourcesResponse>("/dashboard/learning");
 },

 /**
  * Fetch System Announcements
  * @param limit Return count limit (Default: 3, Maximum: 10)
  * @returns Announcement List
  */
 async getAnnouncements(limit: number = 3): Promise<AnnouncementsResponse> {
 const params = new URLSearchParams();
 if (limit > 0) {
 params.set("limit", String(Math.min(limit, 10)));
 }
 const query = params.toString();
 return request<AnnouncementsResponse>(`/dashboard/announcements${query ? `?${query}` : ""}`);
 },

 /**
  * Fetch Daily Tasks
  * @returns Daily Task Information
  */
 async getDailyTasks(): Promise<DailyTasksResponse> {
 return request<DailyTasksResponse>("/dashboard/daily-tasks");
 },

 /**
  * Daily Check-in
  * @returns Check-in Result
  */
 async checkIn(): Promise<CheckInResponse> {
 return request<CheckInResponse>("/dashboard/check-in", {
 method: "POST",
 });
 },

 /**
  * Fetch Favorites
  * @param limit Return count limit (Default: 5, Maximum: 20)
  * @returns Favorite List
  */
 async getFavorites(limit: number = 5): Promise<FavoritesResponse> {
 const params = new URLSearchParams();
 if (limit > 0) {
 params.set("limit", String(Math.min(limit, 20)));
 }
 const query = params.toString();
 return request<FavoritesResponse>(`/dashboard/favorites${query ? `?${query}` : ""}`);
 },

 /**
  * Fetch Quick Run History
  * @param limit Return count limit (Default: 4, Maximum: 10)
  * @returns Quick Run List
  */
 async getQuickRuns(limit: number = 4): Promise<QuickRunsResponse> {
 const params = new URLSearchParams();
 if (limit > 0) {
 params.set("limit", String(Math.min(limit, 10)));
 }
 const query = params.toString();
 return request<QuickRunsResponse>(`/dashboard/quick-runs${query ? `?${query}` : ""}`);
 },

 /**
  * Fetch Performance Insights
  * @returns Performance Insights Data
  */
 async getPerformanceInsights(): Promise<PerformanceInsightsResponse> {
 return request<PerformanceInsightsResponse>("/dashboard/performance");
 },

 /**
  * Fetch Error Monitor
  * @param limit Return count limit (Default: 5, Maximum: 20)
  * @returns Error Monitor Data
  */
 async getErrorMonitor(limit: number = 5): Promise<ErrorMonitorResponse> {
 const params = new URLSearchParams();
 if (limit > 0) {
 params.set("limit", String(Math.min(limit, 20)));
 }
 const query = params.toString();
 return request<ErrorMonitorResponse>(`/dashboard/errors${query ? `?${query}` : ""}`);
 },

 /**
 * Fetch API UsageStatistics
 * @returns API UsageStatisticsData
 */
 async getAPIUsageStats(): Promise<APIUsageStatsResponse> {
 return request<APIUsageStatsResponse>("/dashboard/api-usage");
 },

 /**
  * Fetch Quick Notes
  * @param limit Return count limit (Default: 5, Maximum: 20)
  * @returns Note List
  */
 async getQuickNotes(limit: number = 5): Promise<QuickNotesResponse> {
 const params = new URLSearchParams();
 if (limit > 0) {
 params.set("limit", String(Math.min(limit, 20)));
 }
 const query = params.toString();
 return request<QuickNotesResponse>(`/dashboard/notes${query ? `?${query}` : ""}`);
 },

 /**
  * Create Quick Note
  * @param content Note Content
  * @returns Created Note
  */
 async createQuickNote(content: string): Promise<QuickNoteResponse> {
 return request<QuickNoteResponse>("/dashboard/notes", {
 method: "POST",
 body: JSON.stringify({ content }),
 });
 },

 /**
  * Delete Quick Note
  * @param noteId Note ID
  */
 async deleteQuickNote(noteId: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/dashboard/notes/${noteId}`, {
 method: "DELETE",
 });
 },

 /**
  * Fetch Integration Status
  * @returns Integration Status Data
  */
 async getIntegrationStatus(): Promise<IntegrationStatusResponse> {
 return request<IntegrationStatusResponse>("/dashboard/integrations");
 },

 /**
  * Fetch Scheduled Tasks
  * @param limit Return count limit (Default: 5, Maximum: 20)
  * @returns Scheduled Task List
  */
 async getScheduledTasks(limit: number = 5): Promise<ScheduledTasksResponse> {
 const params = new URLSearchParams();
 if (limit > 0) {
 params.set("limit", String(Math.min(limit, 20)));
 }
 const query = params.toString();
 return request<ScheduledTasksResponse>(`/dashboard/scheduled-tasks${query ? `?${query}` : ""}`);
 },

 /**
  * Fetch Notifications
  * @param limit Return count limit (Default: 5, Maximum: 20)
  * @returns Notifications List
  */
 async getNotifications(limit: number = 5): Promise<NotificationsResponse> {
 const params = new URLSearchParams();
 if (limit > 0) {
 params.set("limit", String(Math.min(limit, 20)));
 }
 const query = params.toString();
 return request<NotificationsResponse>(`/dashboard/notifications${query ? `?${query}` : ""}`);
 },

 /**
  * Mark Notification as Read
  * @param notificationId Notification ID
  */
 async markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/dashboard/notifications/${notificationId}/read`, {
 method: "POST",
 });
 },

 /**
 * Fetch AI SmartSuggestion
 * @returns AI SuggestionList
 */
 async getAISuggestions(): Promise<AISuggestionsResponse> {
 return request<AISuggestionsResponse>("/dashboard/ai-suggestions");
 },

 /**
  * Fetch Leaderboard
  * @returns Leaderboard Data
  */
 async getLeaderboard(): Promise<LeaderboardResponse> {
 return request<LeaderboardResponse>("/dashboard/leaderboard");
 },

 /**
  * Fetch Goal Tracking
  * @returns Goal List
  */
 async getGoals(): Promise<GoalsResponse> {
 return request<GoalsResponse>("/dashboard/goals");
 },

 /**
  * Create Goal
  * @param title Goal Title
  * @param targetValue Target Value
  * @param goalType Goal Type
  * @returns Created Goal
  */
 async createGoal(title: string, targetValue: number, goalType: string): Promise<GoalResponse> {
 return request<GoalResponse>("/dashboard/goals", {
 method: "POST",
 body: JSON.stringify({ title, target_value: targetValue, goal_type: goalType }),
 });
 },

 /**
  * Fetch System Health Status
  * @returns System Health Status
  */
 async getSystemHealth(): Promise<SystemHealthResponse> {
 return request<SystemHealthResponse>("/dashboard/system-health");
 },

 /**
  * Fetch Running Queue
  * @returns Running Queue Data
  */
 async getRunningQueue(): Promise<RunningQueueResponse> {
 return request<RunningQueueResponse>("/dashboard/running-queue");
 },
};

/**
 * Format Quick Statistics as Frontend-Friendly Format
 */
export function formatQuickStats(stats: QuickStats) {
 return {
 totalWorkflows: stats.total_workflows,
 activeWorkflows: stats.active_workflows,
 draftWorkflows: stats.draft_workflows,
 totalExecutions: stats.total_executions,
 runsToday: stats.runs_today,
 runsThisWeek: stats.runs_this_week,
 successRate: stats.success_rate,
 workflowsGrowth: stats.workflows_growth,
 executionsGrowth: stats.executions_growth,
 successRateChange: stats.success_rate_change,
 tokensUsedToday: stats.tokens_used_today,
 tokensUsedMonth: stats.tokens_used_month,
 avgResponseTimeMs: stats.avg_response_time_ms,
 };
}

/**
 * Format Workflow Summary as Frontend-Friendly Format
 */
export function formatWorkflowSummary(workflow: WorkflowSummary) {
 return {
 id: workflow.id,
 name: workflow.name,
 description: workflow.description,
 icon: workflow.icon,
 status: workflow.status,
 runCount: workflow.run_count,
 lastRunAt: workflow.last_run_at,
 updatedAt: workflow.updated_at,
 successRate: workflow.success_rate,
 };
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
 };
}

/**
 * Format Execution Summary as Frontend-Friendly Format
 */
export function formatExecutionSummary(execution: ExecutionSummary) {
 return {
 id: execution.id,
 workflowId: execution.workflow_id,
 workflowName: execution.workflow_name,
 status: execution.status,
 durationMs: execution.duration_ms,
 startedAt: execution.started_at,
 completedAt: execution.completed_at,
 errorMessage: execution.error_message,
 timeAgo: execution.time_ago,
 };
}

/**
 * Get Activity Icon
 */
export function getActivityIcon(action: string): string {
 const iconMap: Record<string, string> = {
 login: "LogIn",
 logout: "LogOut",
 create_workflow: "Plus",
 update_workflow: "Edit",
 delete_workflow: "Trash2",
 run_workflow: "Play",
 update_profile: "User",
 change_password: "Lock",
 create_agent: "Bot",
 update_agent: "RefreshCw",
 create_api_key: "Key",
 delete_api_key: "KeyRound",
 };
 return iconMap[action] || "Activity";
}

/**
 * Get Execution Status Color
 */
export function getExecutionStatusColor(status: string): string {
 const colorMap: Record<string, string> = {
 running: "text-blue-400",
 completed: "text-emerald-400",
 failed: "text-red-400",
 pending: "text-amber-400",
 cancelled: "text-muted-foreground",
 };
 return colorMap[status] || "text-muted-foreground";
}

/**
 * Get Execution Status Background
 */
export function getExecutionStatusBgColor(status: string): string {
 const colorMap: Record<string, string> = {
 running: "bg-blue-500/10 border-blue-500/20",
 completed: "bg-emerald-500/10 border-emerald-500/20",
 failed: "bg-red-500/10 border-red-500/20",
 pending: "bg-amber-500/10 border-amber-500/20",
 cancelled: "bg-muted border-border",
 };
 return colorMap[status] || "bg-muted border-border";
}

/**
 * Get Execution Status Text
 */
export function getExecutionStatusText(status: string): string {
 const textMap: Record<string, string> = {
 running: "Run",
 completed: "Completed",
 failed: "Failed",
 pending: "Pending",
 cancelled: "Cancelled",
 };
 return textMap[status] || status;
}
