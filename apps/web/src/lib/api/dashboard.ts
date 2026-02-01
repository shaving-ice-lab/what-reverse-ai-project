/**
 * Dashboard API 服务
 */

import { request } from "./shared";

/**
 * 快捷统计数据
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
 * 工作流摘要
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
 * 活动摘要
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
 * 执行摘要
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
 * 系统状态
 */
export interface SystemStatus {
  is_healthy: boolean;
  api_latency_ms: number;
  queued_tasks: number;
  active_sessions: number;
  last_checked_at: string;
}

/**
 * 推荐内容
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
 * 用户等级信息
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
 * 成就
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
 * Token 使用量
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
 * 每日 Token 使用量
 */
export interface DailyTokenUsage {
  date: string;
  tokens: number;
}

/**
 * 模板摘要
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
 * 学习资源
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
 * 系统公告
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
 * 每日任务信息
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
 * 每日任务
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
 * 签到结果
 */
export interface CheckInResult {
  success: boolean;
  xp_earned: number;
  streak: number;
  message: string;
  bonus_reward?: string;
}

/**
 * 收藏项
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
 * 快捷运行项
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
 * 性能洞察
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
 * 错误监控
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
 * API 使用统计
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
 * 快速笔记
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
 * 集成状态
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
 * 计划任务
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
 * 通知中心
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
 * AI 智能建议
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
 * 排行榜
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
 * 目标
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
 * 系统健康状态
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
 * 运行队列
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
 * Dashboard 完整数据
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
 * Dashboard API 响应
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
   * 获取 Dashboard 全部数据
   * @returns Dashboard 数据
   */
  async getDashboardData(): Promise<DashboardResponse> {
    return request<DashboardResponse>("/dashboard");
  },

  /**
   * 获取快捷统计
   * @returns 快捷统计数据
   */
  async getQuickStats(): Promise<QuickStatsResponse> {
    return request<QuickStatsResponse>("/dashboard/stats");
  },

  /**
   * 获取最近工作流
   * @param limit 返回数量限制 (默认5，最大20)
   * @returns 工作流列表
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
   * 获取最近活动
   * @param limit 返回数量限制 (默认10，最大50)
   * @returns 活动列表
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
   * 获取最近执行记录
   * @param limit 返回数量限制 (默认5，最大20)
   * @returns 执行记录列表
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
   * 获取用户等级信息
   * @returns 用户等级和成就
   */
  async getUserLevel(): Promise<UserLevelResponse> {
    return request<UserLevelResponse>("/dashboard/level");
  },

  /**
   * 获取 Token 使用量
   * @returns Token 使用量统计
   */
  async getTokenUsage(): Promise<TokenUsageResponse> {
    return request<TokenUsageResponse>("/dashboard/tokens");
  },

  /**
   * 获取热门模板
   * @param limit 返回数量限制 (默认4，最大10)
   * @returns 模板列表
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
   * 获取学习资源
   * @returns 学习资源列表
   */
  async getLearningResources(): Promise<LearningResourcesResponse> {
    return request<LearningResourcesResponse>("/dashboard/learning");
  },

  /**
   * 获取系统公告
   * @param limit 返回数量限制 (默认3，最大10)
   * @returns 公告列表
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
   * 获取每日任务
   * @returns 每日任务信息
   */
  async getDailyTasks(): Promise<DailyTasksResponse> {
    return request<DailyTasksResponse>("/dashboard/daily-tasks");
  },

  /**
   * 每日签到
   * @returns 签到结果
   */
  async checkIn(): Promise<CheckInResponse> {
    return request<CheckInResponse>("/dashboard/check-in", {
      method: "POST",
    });
  },

  /**
   * 获取收藏夹
   * @param limit 返回数量限制 (默认5，最大20)
   * @returns 收藏列表
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
   * 获取快捷运行历史
   * @param limit 返回数量限制 (默认4，最大10)
   * @returns 快捷运行列表
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
   * 获取性能洞察
   * @returns 性能洞察数据
   */
  async getPerformanceInsights(): Promise<PerformanceInsightsResponse> {
    return request<PerformanceInsightsResponse>("/dashboard/performance");
  },

  /**
   * 获取错误监控
   * @param limit 返回数量限制 (默认5，最大20)
   * @returns 错误监控数据
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
   * 获取 API 使用统计
   * @returns API 使用统计数据
   */
  async getAPIUsageStats(): Promise<APIUsageStatsResponse> {
    return request<APIUsageStatsResponse>("/dashboard/api-usage");
  },

  /**
   * 获取快速笔记
   * @param limit 返回数量限制 (默认5，最大20)
   * @returns 笔记列表
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
   * 创建快速笔记
   * @param content 笔记内容
   * @returns 创建的笔记
   */
  async createQuickNote(content: string): Promise<QuickNoteResponse> {
    return request<QuickNoteResponse>("/dashboard/notes", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  /**
   * 删除快速笔记
   * @param noteId 笔记 ID
   */
  async deleteQuickNote(noteId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/dashboard/notes/${noteId}`, {
      method: "DELETE",
    });
  },

  /**
   * 获取集成状态
   * @returns 集成状态数据
   */
  async getIntegrationStatus(): Promise<IntegrationStatusResponse> {
    return request<IntegrationStatusResponse>("/dashboard/integrations");
  },

  /**
   * 获取计划任务
   * @param limit 返回数量限制 (默认5，最大20)
   * @returns 计划任务列表
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
   * 获取通知
   * @param limit 返回数量限制 (默认5，最大20)
   * @returns 通知列表
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
   * 标记通知已读
   * @param notificationId 通知 ID
   */
  async markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/dashboard/notifications/${notificationId}/read`, {
      method: "POST",
    });
  },

  /**
   * 获取 AI 智能建议
   * @returns AI 建议列表
   */
  async getAISuggestions(): Promise<AISuggestionsResponse> {
    return request<AISuggestionsResponse>("/dashboard/ai-suggestions");
  },

  /**
   * 获取排行榜
   * @returns 排行榜数据
   */
  async getLeaderboard(): Promise<LeaderboardResponse> {
    return request<LeaderboardResponse>("/dashboard/leaderboard");
  },

  /**
   * 获取目标追踪
   * @returns 目标列表
   */
  async getGoals(): Promise<GoalsResponse> {
    return request<GoalsResponse>("/dashboard/goals");
  },

  /**
   * 创建目标
   * @param title 目标标题
   * @param targetValue 目标值
   * @param goalType 目标类型
   * @returns 创建的目标
   */
  async createGoal(title: string, targetValue: number, goalType: string): Promise<GoalResponse> {
    return request<GoalResponse>("/dashboard/goals", {
      method: "POST",
      body: JSON.stringify({ title, target_value: targetValue, goal_type: goalType }),
    });
  },

  /**
   * 获取系统健康状态
   * @returns 系统健康状态
   */
  async getSystemHealth(): Promise<SystemHealthResponse> {
    return request<SystemHealthResponse>("/dashboard/system-health");
  },

  /**
   * 获取运行队列
   * @returns 运行队列数据
   */
  async getRunningQueue(): Promise<RunningQueueResponse> {
    return request<RunningQueueResponse>("/dashboard/running-queue");
  },
};

/**
 * 格式化快捷统计为前端友好格式
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
 * 格式化工作流摘要为前端友好格式
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
 * 格式化活动摘要为前端友好格式
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
 * 格式化执行摘要为前端友好格式
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
 * 获取活动图标
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
 * 获取执行状态颜色
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
 * 获取执行状态背景色
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
 * 获取执行状态文本
 */
export function getExecutionStatusText(status: string): string {
  const textMap: Record<string, string> = {
    running: "运行中",
    completed: "已完成",
    failed: "失败",
    pending: "待执行",
    cancelled: "已取消",
  };
  return textMap[status] || status;
}
