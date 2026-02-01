package service

import (
	"context"
	"fmt"
	"time"

	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

// DashboardService Dashboard 服务接口
type DashboardService interface {
	// GetDashboardData 获取 Dashboard 全部数据
	GetDashboardData(ctx context.Context, userID uuid.UUID) (*DashboardData, error)
	// GetQuickStats 获取快捷统计
	GetQuickStats(ctx context.Context, userID uuid.UUID) (*QuickStats, error)
	// GetRecentWorkflows 获取最近工作流
	GetRecentWorkflows(ctx context.Context, userID uuid.UUID, limit int) ([]WorkflowSummary, error)
	// GetRecentActivities 获取最近活动
	GetRecentActivities(ctx context.Context, userID uuid.UUID, limit int) ([]ActivitySummary, error)
	// GetRecentExecutions 获取最近执行记录
	GetRecentExecutions(ctx context.Context, userID uuid.UUID, limit int) ([]ExecutionSummary, error)
	// GetUserLevel 获取用户等级信息
	GetUserLevel(ctx context.Context, userID uuid.UUID) (*UserLevel, error)
	// GetTokenUsage 获取 Token 使用量
	GetTokenUsage(ctx context.Context, userID uuid.UUID) (*TokenUsage, error)
	// GetFeaturedTemplates 获取热门模板
	GetFeaturedTemplates(ctx context.Context, limit int) ([]TemplateSummary, error)
	// GetLearningResources 获取学习资源
	GetLearningResources(ctx context.Context) []LearningResource
	// GetAnnouncements 获取系统公告
	GetAnnouncements(ctx context.Context, limit int) ([]Announcement, error)
	// GetDailyTasks 获取每日任务
	GetDailyTasks(ctx context.Context, userID uuid.UUID) (*DailyTaskInfo, error)
	// CheckIn 每日签到
	CheckIn(ctx context.Context, userID uuid.UUID) (*CheckInResult, error)
	// GetFavorites 获取收藏夹
	GetFavorites(ctx context.Context, userID uuid.UUID, limit int) ([]FavoriteItem, error)
	// GetQuickRuns 获取快捷运行历史
	GetQuickRuns(ctx context.Context, userID uuid.UUID, limit int) ([]QuickRunItem, error)
	// GetPerformanceInsights 获取性能洞察
	GetPerformanceInsights(ctx context.Context, userID uuid.UUID) (*PerformanceInsights, error)
	// GetErrorMonitor 获取错误监控
	GetErrorMonitor(ctx context.Context, userID uuid.UUID, limit int) (*ErrorMonitor, error)
	// GetAPIUsageStats 获取 API 使用统计
	GetAPIUsageStats(ctx context.Context, userID uuid.UUID) (*APIUsageStats, error)
	// GetQuickNotes 获取快速笔记
	GetQuickNotes(ctx context.Context, userID uuid.UUID, limit int) ([]QuickNote, error)
	// CreateQuickNote 创建快速笔记
	CreateQuickNote(ctx context.Context, userID uuid.UUID, content string) (*QuickNote, error)
	// DeleteQuickNote 删除快速笔记
	DeleteQuickNote(ctx context.Context, userID uuid.UUID, noteID uuid.UUID) error
	// GetIntegrationStatus 获取集成状态
	GetIntegrationStatus(ctx context.Context, userID uuid.UUID) (*IntegrationStatus, error)
	// GetScheduledTasks 获取计划任务
	GetScheduledTasks(ctx context.Context, userID uuid.UUID, limit int) ([]ScheduledTask, error)
	// GetNotifications 获取通知
	GetNotifications(ctx context.Context, userID uuid.UUID, limit int) (*NotificationCenter, error)
	// MarkNotificationRead 标记通知已读
	MarkNotificationRead(ctx context.Context, userID uuid.UUID, notificationID uuid.UUID) error
	// GetAISuggestions 获取 AI 智能建议
	GetAISuggestions(ctx context.Context, userID uuid.UUID) ([]AISuggestion, error)
	// GetLeaderboard 获取使用量排行榜
	GetLeaderboard(ctx context.Context, userID uuid.UUID) (*Leaderboard, error)
	// GetGoals 获取目标追踪
	GetGoals(ctx context.Context, userID uuid.UUID) ([]Goal, error)
	// CreateGoal 创建目标
	CreateGoal(ctx context.Context, userID uuid.UUID, title string, targetValue int, goalType string) (*Goal, error)
	// UpdateGoalProgress 更新目标进度
	UpdateGoalProgress(ctx context.Context, userID uuid.UUID, goalID uuid.UUID, progress int) error
	// GetSystemHealth 获取系统健康状态
	GetSystemHealth(ctx context.Context) (*SystemHealth, error)
	// GetRunningQueue 获取运行队列
	GetRunningQueue(ctx context.Context, userID uuid.UUID) (*RunningQueue, error)
}

// DashboardData Dashboard 完整数据
type DashboardData struct {
	QuickStats          *QuickStats          `json:"quick_stats"`
	ExecutionTrends     []DailyStats         `json:"execution_trends"`
	RecentWorkflows     []WorkflowSummary    `json:"recent_workflows"`
	RecentActivities    []ActivitySummary    `json:"recent_activities"`
	RecentExecutions    []ExecutionSummary   `json:"recent_executions"`
	SystemStatus        *SystemStatus        `json:"system_status"`
	Recommendations     []Recommendation     `json:"recommendations"`
	UserLevel           *UserLevel           `json:"user_level"`
	TokenUsage          *TokenUsage          `json:"token_usage"`
	FeaturedTemplates   []TemplateSummary    `json:"featured_templates"`
	LearningResources   []LearningResource   `json:"learning_resources"`
	Announcements       []Announcement       `json:"announcements"`
	DailyTasks          *DailyTaskInfo       `json:"daily_tasks"`
	Favorites           []FavoriteItem       `json:"favorites"`
	QuickRuns           []QuickRunItem       `json:"quick_runs"`
	PerformanceInsights *PerformanceInsights `json:"performance_insights"`
	ErrorMonitor        *ErrorMonitor        `json:"error_monitor"`
	APIUsageStats       *APIUsageStats       `json:"api_usage_stats"`
	QuickNotes          []QuickNote          `json:"quick_notes"`
	IntegrationStatus   *IntegrationStatus   `json:"integration_status"`
	ScheduledTasks      []ScheduledTask      `json:"scheduled_tasks"`
	Notifications       *NotificationCenter  `json:"notifications"`
	AISuggestions       []AISuggestion       `json:"ai_suggestions"`
	Leaderboard         *Leaderboard         `json:"leaderboard"`
	Goals               []Goal               `json:"goals"`
	SystemHealth        *SystemHealth        `json:"system_health"`
	RunningQueue        *RunningQueue        `json:"running_queue"`
}

// QuickStats 快捷统计数据
type QuickStats struct {
	// 工作流统计
	TotalWorkflows  int64   `json:"total_workflows"`
	ActiveWorkflows int64   `json:"active_workflows"`
	DraftWorkflows  int64   `json:"draft_workflows"`
	
	// 执行统计
	TotalExecutions int64   `json:"total_executions"`
	RunsToday       int64   `json:"runs_today"`
	RunsThisWeek    int64   `json:"runs_this_week"`
	SuccessRate     float64 `json:"success_rate"`
	
	// 对比数据
	WorkflowsGrowth   float64 `json:"workflows_growth"`   // 相比上周增长百分比
	ExecutionsGrowth  float64 `json:"executions_growth"`  // 相比上周增长百分比
	SuccessRateChange float64 `json:"success_rate_change"` // 相比上周变化
	
	// 使用量
	TokensUsedToday   int64 `json:"tokens_used_today"`
	TokensUsedMonth   int64 `json:"tokens_used_month"`
	AvgResponseTimeMs int64 `json:"avg_response_time_ms"`
}

// WorkflowSummary 工作流摘要
type WorkflowSummary struct {
	ID          uuid.UUID  `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description,omitempty"`
	Icon        string     `json:"icon,omitempty"`
	Status      string     `json:"status"`
	RunCount    int        `json:"run_count"`
	LastRunAt   *time.Time `json:"last_run_at,omitempty"`
	UpdatedAt   time.Time  `json:"updated_at"`
	SuccessRate float64    `json:"success_rate"`
}

// ActivitySummary 活动摘要
type ActivitySummary struct {
	ID          uuid.UUID         `json:"id"`
	Action      string            `json:"action"`
	Description string            `json:"description"`
	ResourceID  *uuid.UUID        `json:"resource_id,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt   time.Time         `json:"created_at"`
	TimeAgo     string            `json:"time_ago"`
}

// ExecutionSummary 执行摘要
type ExecutionSummary struct {
	ID           uuid.UUID  `json:"id"`
	WorkflowID   uuid.UUID  `json:"workflow_id"`
	WorkflowName string     `json:"workflow_name"`
	Status       string     `json:"status"`
	DurationMs   *int       `json:"duration_ms,omitempty"`
	StartedAt    *time.Time `json:"started_at,omitempty"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	ErrorMessage *string    `json:"error_message,omitempty"`
	TimeAgo      string     `json:"time_ago"`
}

// SystemStatus 系统状态
type SystemStatus struct {
	IsHealthy      bool   `json:"is_healthy"`
	APILatencyMs   int64  `json:"api_latency_ms"`
	QueuedTasks    int    `json:"queued_tasks"`
	ActiveSessions int    `json:"active_sessions"`
	LastCheckedAt  string `json:"last_checked_at"`
}

// Recommendation 推荐内容
type Recommendation struct {
	Type        string `json:"type"` // template, workflow, feature
	Title       string `json:"title"`
	Description string `json:"description"`
	ActionURL   string `json:"action_url"`
	Icon        string `json:"icon,omitempty"`
	Priority    int    `json:"priority"`
}

// UserLevel 用户等级信息
type UserLevel struct {
	Level           int     `json:"level"`
	LevelName       string  `json:"level_name"`
	CurrentXP       int64   `json:"current_xp"`
	NextLevelXP     int64   `json:"next_level_xp"`
	Progress        float64 `json:"progress"` // 0-100
	TotalWorkflows  int64   `json:"total_workflows"`
	TotalExecutions int64   `json:"total_executions"`
	Achievements    []Achievement `json:"achievements"`
}

// Achievement 成就
type Achievement struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Unlocked    bool   `json:"unlocked"`
	UnlockedAt  string `json:"unlocked_at,omitempty"`
	Progress    int    `json:"progress,omitempty"` // 0-100
}

// TokenUsage Token 使用量
type TokenUsage struct {
	UsedToday     int64   `json:"used_today"`
	UsedThisWeek  int64   `json:"used_this_week"`
	UsedThisMonth int64   `json:"used_this_month"`
	TotalUsed     int64   `json:"total_used"`
	Limit         int64   `json:"limit"`         // 月度限额
	Remaining     int64   `json:"remaining"`     // 剩余量
	UsagePercent  float64 `json:"usage_percent"` // 使用百分比
	DailyTrend    []DailyTokenUsage `json:"daily_trend"`
}

// DailyTokenUsage 每日 Token 使用量
type DailyTokenUsage struct {
	Date   string `json:"date"`
	Tokens int64  `json:"tokens"`
}

// TemplateSummary 模板摘要
type TemplateSummary struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	Category    string    `json:"category"`
	UseCount    int       `json:"use_count"`
	Rating      float64   `json:"rating"`
	Tags        []string  `json:"tags"`
}

// LearningResource 学习资源
type LearningResource struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Type        string `json:"type"` // article, video, tutorial
	URL         string `json:"url"`
	Icon        string `json:"icon"`
	Duration    string `json:"duration,omitempty"`
	IsNew       bool   `json:"is_new"`
}

// Announcement 系统公告
type Announcement struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"` // info, warning, success, update
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	ActionURL   string    `json:"action_url,omitempty"`
	ActionLabel string    `json:"action_label,omitempty"`
	Icon        string    `json:"icon,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	IsRead      bool      `json:"is_read"`
	Priority    int       `json:"priority"` // 1-5, 5 最高
}

// DailyTaskInfo 每日任务信息
type DailyTaskInfo struct {
	CheckedIn       bool        `json:"checked_in"`
	CheckInStreak   int         `json:"check_in_streak"`
	TodayXP         int64       `json:"today_xp"`
	Tasks           []DailyTask `json:"tasks"`
	TotalTasks      int         `json:"total_tasks"`
	CompletedTasks  int         `json:"completed_tasks"`
	NextResetAt     time.Time   `json:"next_reset_at"`
}

// DailyTask 每日任务
type DailyTask struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	XPReward    int    `json:"xp_reward"`
	Progress    int    `json:"progress"`    // 0-100
	Target      int    `json:"target"`      // 目标数量
	Current     int    `json:"current"`     // 当前进度
	Completed   bool   `json:"completed"`
	Type        string `json:"type"` // workflow, execution, login, create
}

// CheckInResult 签到结果
type CheckInResult struct {
	Success      bool   `json:"success"`
	XPEarned     int    `json:"xp_earned"`
	Streak       int    `json:"streak"`
	Message      string `json:"message"`
	BonusReward  string `json:"bonus_reward,omitempty"`
}

// FavoriteItem 收藏项
type FavoriteItem struct {
	ID          uuid.UUID `json:"id"`
	Type        string    `json:"type"` // workflow, template, agent
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Icon        string    `json:"icon,omitempty"`
	Status      string    `json:"status,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	FavoritedAt time.Time `json:"favorited_at"`
}

// QuickRunItem 快捷运行项
type QuickRunItem struct {
	ID           uuid.UUID  `json:"id"`
	WorkflowID   uuid.UUID  `json:"workflow_id"`
	WorkflowName string     `json:"workflow_name"`
	Icon         string     `json:"icon,omitempty"`
	LastRunAt    time.Time  `json:"last_run_at"`
	RunCount     int        `json:"run_count"`
	AvgDuration  int        `json:"avg_duration_ms"`
	SuccessRate  float64    `json:"success_rate"`
}

// PerformanceInsights 性能洞察
type PerformanceInsights struct {
	OverallScore       int                   `json:"overall_score"`       // 0-100
	AvgExecutionTime   int64                 `json:"avg_execution_time"`  // ms
	P95ExecutionTime   int64                 `json:"p95_execution_time"`  // ms
	P99ExecutionTime   int64                 `json:"p99_execution_time"`  // ms
	TotalExecutions    int64                 `json:"total_executions"`
	SuccessRate        float64               `json:"success_rate"`
	Bottlenecks        []Bottleneck          `json:"bottlenecks"`
	TopPerformers      []WorkflowPerformance `json:"top_performers"`
	NeedOptimization   []WorkflowPerformance `json:"need_optimization"`
	Suggestions        []OptimizationSuggestion `json:"suggestions"`
}

// Bottleneck 瓶颈
type Bottleneck struct {
	WorkflowID   uuid.UUID `json:"workflow_id"`
	WorkflowName string    `json:"workflow_name"`
	NodeName     string    `json:"node_name,omitempty"`
	AvgDuration  int64     `json:"avg_duration_ms"`
	Impact       string    `json:"impact"` // high, medium, low
	Suggestion   string    `json:"suggestion"`
}

// WorkflowPerformance 工作流性能
type WorkflowPerformance struct {
	WorkflowID     uuid.UUID `json:"workflow_id"`
	WorkflowName   string    `json:"workflow_name"`
	AvgDuration    int64     `json:"avg_duration_ms"`
	SuccessRate    float64   `json:"success_rate"`
	ExecutionCount int64     `json:"execution_count"`
	Trend          string    `json:"trend"` // up, down, stable
}

// OptimizationSuggestion 优化建议
type OptimizationSuggestion struct {
	Type        string `json:"type"` // performance, reliability, cost
	Title       string `json:"title"`
	Description string `json:"description"`
	Impact      string `json:"impact"` // high, medium, low
	ActionURL   string `json:"action_url,omitempty"`
}

// ErrorMonitor 错误监控
type ErrorMonitor struct {
	TotalErrors     int64         `json:"total_errors"`
	ErrorsToday     int64         `json:"errors_today"`
	ErrorsThisWeek  int64         `json:"errors_this_week"`
	ErrorRate       float64       `json:"error_rate"`
	ErrorTrend      string        `json:"error_trend"` // up, down, stable
	RecentErrors    []ErrorRecord `json:"recent_errors"`
	ErrorsByType    []ErrorType   `json:"errors_by_type"`
	AffectedWorkflows []AffectedWorkflow `json:"affected_workflows"`
}

// ErrorRecord 错误记录
type ErrorRecord struct {
	ID           uuid.UUID  `json:"id"`
	WorkflowID   uuid.UUID  `json:"workflow_id"`
	WorkflowName string     `json:"workflow_name"`
	ErrorType    string     `json:"error_type"`
	ErrorMessage string     `json:"error_message"`
	OccurredAt   time.Time  `json:"occurred_at"`
	TimeAgo      string     `json:"time_ago"`
	Severity     string     `json:"severity"` // critical, warning, info
}

// ErrorType 错误类型统计
type ErrorType struct {
	Type   string `json:"type"`
	Count  int64  `json:"count"`
	Trend  string `json:"trend"` // up, down, stable
}

// AffectedWorkflow 受影响的工作流
type AffectedWorkflow struct {
	WorkflowID   uuid.UUID `json:"workflow_id"`
	WorkflowName string    `json:"workflow_name"`
	ErrorCount   int64     `json:"error_count"`
	LastError    time.Time `json:"last_error"`
}

// APIUsageStats API 使用统计
type APIUsageStats struct {
	TotalCalls      int64            `json:"total_calls"`
	CallsToday      int64            `json:"calls_today"`
	CallsThisWeek   int64            `json:"calls_this_week"`
	CallsThisMonth  int64            `json:"calls_this_month"`
	AvgLatency      int64            `json:"avg_latency_ms"`
	SuccessRate     float64          `json:"success_rate"`
	RateLimit       int64            `json:"rate_limit"`
	RemainingCalls  int64            `json:"remaining_calls"`
	UsagePercent    float64          `json:"usage_percent"`
	DailyUsage      []DailyAPIUsage  `json:"daily_usage"`
	TopEndpoints    []EndpointStats  `json:"top_endpoints"`
}

// DailyAPIUsage 每日 API 使用量
type DailyAPIUsage struct {
	Date         string `json:"date"`
	Calls        int64  `json:"calls"`
	SuccessCount int64  `json:"success_count"`
	ErrorCount   int64  `json:"error_count"`
}

// EndpointStats 端点统计
type EndpointStats struct {
	Endpoint    string  `json:"endpoint"`
	Method      string  `json:"method"`
	Calls       int64   `json:"calls"`
	AvgLatency  int64   `json:"avg_latency_ms"`
	SuccessRate float64 `json:"success_rate"`
}

// QuickNote 快速笔记
type QuickNote struct {
	ID        uuid.UUID `json:"id"`
	Content   string    `json:"content"`
	Color     string    `json:"color,omitempty"` // yellow, blue, green, pink
	Pinned    bool      `json:"pinned"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// IntegrationStatus 集成状态
type IntegrationStatus struct {
	TotalIntegrations    int                 `json:"total_integrations"`
	ConnectedCount       int                 `json:"connected_count"`
	DisconnectedCount    int                 `json:"disconnected_count"`
	Integrations         []IntegrationInfo   `json:"integrations"`
}

// IntegrationInfo 集成信息
type IntegrationInfo struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Type        string    `json:"type"` // oauth, api_key, webhook
	Icon        string    `json:"icon"`
	Status      string    `json:"status"` // connected, disconnected, error, pending
	LastSyncAt  *time.Time `json:"last_sync_at,omitempty"`
	ErrorMsg    string    `json:"error_msg,omitempty"`
}

// ScheduledTask 计划任务
type ScheduledTask struct {
	ID           uuid.UUID `json:"id"`
	WorkflowID   uuid.UUID `json:"workflow_id"`
	WorkflowName string    `json:"workflow_name"`
	CronExpr     string    `json:"cron_expr"`
	NextRunAt    time.Time `json:"next_run_at"`
	LastRunAt    *time.Time `json:"last_run_at,omitempty"`
	Status       string    `json:"status"` // active, paused, error
	RunCount     int       `json:"run_count"`
	TimeUntil    string    `json:"time_until"` // 人性化的时间描述
}

// NotificationCenter 通知中心
type NotificationCenter struct {
	UnreadCount    int                `json:"unread_count"`
	TotalCount     int                `json:"total_count"`
	Notifications  []NotificationItem `json:"notifications"`
	HasMore        bool               `json:"has_more"`
}

// NotificationItem 通知项
type NotificationItem struct {
	ID         uuid.UUID `json:"id"`
	Type       string    `json:"type"` // info, success, warning, error, system
	Title      string    `json:"title"`
	Message    string    `json:"message"`
	ActionURL  string    `json:"action_url,omitempty"`
	Icon       string    `json:"icon,omitempty"`
	IsRead     bool      `json:"is_read"`
	CreatedAt  time.Time `json:"created_at"`
	TimeAgo    string    `json:"time_ago"`
}

// AISuggestion AI 智能建议
type AISuggestion struct {
	ID          string `json:"id"`
	Type        string `json:"type"` // optimization, feature, warning, tip
	Title       string `json:"title"`
	Description string `json:"description"`
	Confidence  int    `json:"confidence"` // 0-100
	ActionURL   string `json:"action_url,omitempty"`
	ActionLabel string `json:"action_label,omitempty"`
	Icon        string `json:"icon"`
	Priority    int    `json:"priority"` // 1-5
	Dismissed   bool   `json:"dismissed"`
}

// Leaderboard 排行榜
type Leaderboard struct {
	CurrentRank    int               `json:"current_rank"`
	TotalUsers     int               `json:"total_users"`
	RankChange     int               `json:"rank_change"` // 正数上升，负数下降
	TopUsers       []LeaderboardUser `json:"top_users"`
	UserStats      *LeaderboardUser  `json:"user_stats"`
}

// LeaderboardUser 排行榜用户
type LeaderboardUser struct {
	Rank           int    `json:"rank"`
	UserID         string `json:"user_id"`
	Username       string `json:"username"`
	Avatar         string `json:"avatar,omitempty"`
	ExecutionCount int    `json:"execution_count"`
	SuccessRate    float64 `json:"success_rate"`
	Score          int    `json:"score"`
	Badge          string `json:"badge,omitempty"` // gold, silver, bronze
}

// Goal 目标
type Goal struct {
	ID           uuid.UUID `json:"id"`
	Title        string    `json:"title"`
	Description  string    `json:"description,omitempty"`
	GoalType     string    `json:"goal_type"` // executions, workflows, success_rate, streak
	TargetValue  int       `json:"target_value"`
	CurrentValue int       `json:"current_value"`
	Progress     float64   `json:"progress"` // 0-100
	Status       string    `json:"status"` // active, completed, expired
	Deadline     *time.Time `json:"deadline,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	Icon         string    `json:"icon"`
	Color        string    `json:"color"`
}

// SystemHealth 系统健康状态
type SystemHealth struct {
	OverallStatus    string           `json:"overall_status"` // healthy, degraded, down
	Uptime           string           `json:"uptime"`
	LastIncident     *time.Time       `json:"last_incident,omitempty"`
	Services         []ServiceHealth  `json:"services"`
	Metrics          *SystemMetrics   `json:"metrics"`
}

// ServiceHealth 服务健康状态
type ServiceHealth struct {
	Name        string  `json:"name"`
	Status      string  `json:"status"` // operational, degraded, down
	Latency     int     `json:"latency_ms"`
	Uptime      float64 `json:"uptime_percent"`
	LastCheck   time.Time `json:"last_check"`
	Icon        string  `json:"icon"`
}

// SystemMetrics 系统指标
type SystemMetrics struct {
	CPUUsage      float64 `json:"cpu_usage"`
	MemoryUsage   float64 `json:"memory_usage"`
	DiskUsage     float64 `json:"disk_usage"`
	ActiveConns   int     `json:"active_connections"`
	RequestsPerSec int    `json:"requests_per_sec"`
	AvgLatency    int     `json:"avg_latency_ms"`
}

// RunningQueue 运行队列
type RunningQueue struct {
	TotalRunning   int            `json:"total_running"`
	TotalPending   int            `json:"total_pending"`
	TotalCompleted int            `json:"total_completed_today"`
	RunningTasks   []QueueTask    `json:"running_tasks"`
	PendingTasks   []QueueTask    `json:"pending_tasks"`
	QueueHealth    string         `json:"queue_health"` // healthy, busy, overloaded
}

// QueueTask 队列任务
type QueueTask struct {
	ID           uuid.UUID `json:"id"`
	WorkflowID   uuid.UUID `json:"workflow_id"`
	WorkflowName string    `json:"workflow_name"`
	Status       string    `json:"status"` // running, pending, completed, failed
	Progress     int       `json:"progress"` // 0-100
	StartedAt    *time.Time `json:"started_at,omitempty"`
	Duration     int       `json:"duration_ms,omitempty"`
	Priority     int       `json:"priority"`
	CurrentStep  string    `json:"current_step,omitempty"`
	TotalSteps   int       `json:"total_steps"`
}

type dashboardService struct {
	workflowRepo  repository.WorkflowRepository
	executionRepo repository.ExecutionRepository
	activityRepo  repository.ActivityRepository
	templateRepo  repository.TemplateRepository
}

// NewDashboardService 创建 Dashboard 服务实例
func NewDashboardService(
	workflowRepo repository.WorkflowRepository,
	executionRepo repository.ExecutionRepository,
	activityRepo repository.ActivityRepository,
	templateRepo repository.TemplateRepository,
) DashboardService {
	return &dashboardService{
		workflowRepo:  workflowRepo,
		executionRepo: executionRepo,
		activityRepo:  activityRepo,
		templateRepo:  templateRepo,
	}
}

func (s *dashboardService) GetDashboardData(ctx context.Context, userID uuid.UUID) (*DashboardData, error) {
	// 并行获取各项数据
	quickStats, err := s.GetQuickStats(ctx, userID)
	if err != nil {
		return nil, err
	}

	recentWorkflows, err := s.GetRecentWorkflows(ctx, userID, 5)
	if err != nil {
		return nil, err
	}

	recentActivities, err := s.GetRecentActivities(ctx, userID, 10)
	if err != nil {
		return nil, err
	}

	recentExecutions, err := s.GetRecentExecutions(ctx, userID, 5)
	if err != nil {
		return nil, err
	}

	// 获取执行趋势（最近7天）
	trends, err := s.getExecutionTrends(ctx, userID, 7)
	if err != nil {
		trends = []DailyStats{} // 失败时使用空数组
	}

	// 生成推荐内容
	recommendations := s.generateRecommendations(quickStats, recentWorkflows)

	// 系统状态
	systemStatus := &SystemStatus{
		IsHealthy:      true,
		APILatencyMs:   50,
		QueuedTasks:    0,
		ActiveSessions: 1,
		LastCheckedAt:  time.Now().Format(time.RFC3339),
	}

	// 获取用户等级信息
	userLevel, _ := s.GetUserLevel(ctx, userID)

	// 获取 Token 使用量
	tokenUsage, _ := s.GetTokenUsage(ctx, userID)

	// 获取热门模板
	featuredTemplates, _ := s.GetFeaturedTemplates(ctx, 4)

	// 获取学习资源
	learningResources := s.GetLearningResources(ctx)

	// 获取系统公告
	announcements, _ := s.GetAnnouncements(ctx, 3)

	// 获取每日任务
	dailyTasks, _ := s.GetDailyTasks(ctx, userID)

	// 获取收藏夹
	favorites, _ := s.GetFavorites(ctx, userID, 5)

	// 获取快捷运行历史
	quickRuns, _ := s.GetQuickRuns(ctx, userID, 4)

	// 获取性能洞察
	performanceInsights, _ := s.GetPerformanceInsights(ctx, userID)

	// 获取错误监控
	errorMonitor, _ := s.GetErrorMonitor(ctx, userID, 5)

	// 获取 API 使用统计
	apiUsageStats, _ := s.GetAPIUsageStats(ctx, userID)

	// 获取快速笔记
	quickNotes, _ := s.GetQuickNotes(ctx, userID, 5)

	// 获取集成状态
	integrationStatus, _ := s.GetIntegrationStatus(ctx, userID)

	// 获取计划任务
	scheduledTasks, _ := s.GetScheduledTasks(ctx, userID, 5)

	// 获取通知
	notifications, _ := s.GetNotifications(ctx, userID, 5)

	// 获取 AI 建议
	aiSuggestions, _ := s.GetAISuggestions(ctx, userID)

	// 获取排行榜
	leaderboard, _ := s.GetLeaderboard(ctx, userID)

	// 获取目标追踪
	goals, _ := s.GetGoals(ctx, userID)

	// 获取系统健康状态
	systemHealth, _ := s.GetSystemHealth(ctx)

	// 获取运行队列
	runningQueue, _ := s.GetRunningQueue(ctx, userID)

	return &DashboardData{
		QuickStats:        quickStats,
		ExecutionTrends:   trends,
		RecentWorkflows:   recentWorkflows,
		RecentActivities:  recentActivities,
		RecentExecutions:  recentExecutions,
		SystemStatus:      systemStatus,
		Recommendations:   recommendations,
		UserLevel:         userLevel,
		TokenUsage:        tokenUsage,
		FeaturedTemplates:   featuredTemplates,
		LearningResources:   learningResources,
		Announcements:       announcements,
		DailyTasks:          dailyTasks,
		Favorites:           favorites,
		QuickRuns:           quickRuns,
		PerformanceInsights: performanceInsights,
		ErrorMonitor:        errorMonitor,
		APIUsageStats:       apiUsageStats,
		QuickNotes:          quickNotes,
		IntegrationStatus:   integrationStatus,
		ScheduledTasks:      scheduledTasks,
		Notifications:       notifications,
		AISuggestions:       aiSuggestions,
		Leaderboard:         leaderboard,
		Goals:               goals,
		SystemHealth:        systemHealth,
		RunningQueue:        runningQueue,
	}, nil
}

func (s *dashboardService) GetQuickStats(ctx context.Context, userID uuid.UUID) (*QuickStats, error) {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := todayStart.AddDate(0, 0, -int(now.Weekday()))
	lastWeekStart := weekStart.AddDate(0, 0, -7)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	// 获取工作流统计
	workflows, totalWorkflows, err := s.workflowRepo.List(ctx, userID, repository.ListParams{
		Page:     1,
		PageSize: 10000,
	})
	if err != nil {
		return nil, err
	}

	var activeWorkflows, draftWorkflows int64
	for _, w := range workflows {
		switch w.Status {
		case "active", "published":
			activeWorkflows++
		case "draft":
			draftWorkflows++
		}
	}

	// 获取执行统计
	executions, totalExecutions, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: 10000,
	})
	if err != nil {
		return nil, err
	}

	var (
		successCount      int64
		runsToday         int64
		runsThisWeek      int64
		runsLastWeek      int64
		tokensUsedToday   int64
		tokensUsedMonth   int64
		totalDuration     int64
		durationCount     int64
	)

	for _, exec := range executions {
		if exec.Status == "completed" {
			successCount++
		}

		if exec.StartedAt != nil {
			if exec.StartedAt.After(todayStart) {
				runsToday++
			}
			if exec.StartedAt.After(weekStart) {
				runsThisWeek++
			}
			if exec.StartedAt.After(lastWeekStart) && exec.StartedAt.Before(weekStart) {
				runsLastWeek++
			}
		}

		// Token 使用量
		if exec.TokenUsage != nil {
			if tokens, ok := exec.TokenUsage["total_tokens"].(float64); ok {
				if exec.StartedAt != nil {
					if exec.StartedAt.After(todayStart) {
						tokensUsedToday += int64(tokens)
					}
					if exec.StartedAt.After(monthStart) {
						tokensUsedMonth += int64(tokens)
					}
				}
			}
		}

		// 平均响应时间
		if exec.DurationMs != nil {
			totalDuration += int64(*exec.DurationMs)
			durationCount++
		}
	}

	// 计算成功率
	successRate := float64(0)
	if totalExecutions > 0 {
		successRate = float64(successCount) / float64(totalExecutions) * 100
	}

	// 计算增长率
	executionsGrowth := float64(0)
	if runsLastWeek > 0 {
		executionsGrowth = float64(runsThisWeek-runsLastWeek) / float64(runsLastWeek) * 100
	}

	avgResponseTime := int64(0)
	if durationCount > 0 {
		avgResponseTime = totalDuration / durationCount
	}

	return &QuickStats{
		TotalWorkflows:    totalWorkflows,
		ActiveWorkflows:   activeWorkflows,
		DraftWorkflows:    draftWorkflows,
		TotalExecutions:   totalExecutions,
		RunsToday:         runsToday,
		RunsThisWeek:      runsThisWeek,
		SuccessRate:       successRate,
		ExecutionsGrowth:  executionsGrowth,
		TokensUsedToday:   tokensUsedToday,
		TokensUsedMonth:   tokensUsedMonth,
		AvgResponseTimeMs: avgResponseTime,
	}, nil
}

func (s *dashboardService) GetRecentWorkflows(ctx context.Context, userID uuid.UUID, limit int) ([]WorkflowSummary, error) {
	workflows, _, err := s.workflowRepo.List(ctx, userID, repository.ListParams{
		Page:     1,
		PageSize: limit,
		Sort:     "updated_at",
		Order:    "desc",
	})
	if err != nil {
		return nil, err
	}

	result := make([]WorkflowSummary, 0, len(workflows))
	for _, w := range workflows {
		description := ""
		if w.Description != nil {
			description = *w.Description
		}
		summary := WorkflowSummary{
			ID:          w.ID,
			Name:        w.Name,
			Description: description,
			Icon:        w.Icon,
			Status:      w.Status,
			RunCount:    w.RunCount,
			UpdatedAt:   w.UpdatedAt,
		}

		// 获取最后执行时间和成功率
		executions, total, _ := s.executionRepo.List(ctx, repository.ExecutionListParams{
			WorkflowID: &w.ID,
			Page:       1,
			PageSize:   100,
		})
		if len(executions) > 0 {
			summary.LastRunAt = executions[0].StartedAt
			
			var successCount int64
			for _, e := range executions {
				if e.Status == "completed" {
					successCount++
				}
			}
			if total > 0 {
				summary.SuccessRate = float64(successCount) / float64(total) * 100
			}
		}

		result = append(result, summary)
	}

	return result, nil
}

func (s *dashboardService) GetRecentActivities(ctx context.Context, userID uuid.UUID, limit int) ([]ActivitySummary, error) {
	activities, _, err := s.activityRepo.List(ctx, repository.ActivityListParams{
		UserID:   userID,
		Page:     1,
		PageSize: limit,
	})
	if err != nil {
		return nil, err
	}

	result := make([]ActivitySummary, 0, len(activities))
	for _, a := range activities {
		summary := ActivitySummary{
			ID:          a.ID,
			Action:      a.Action,
			Description: getActivityDescription(a.Action, a.Metadata),
			Metadata:    a.Metadata,
			CreatedAt:   a.CreatedAt,
			TimeAgo:     getTimeAgo(a.CreatedAt),
		}

		// 提取资源 ID
		if a.Metadata != nil {
			if resourceID, ok := a.Metadata["resource_id"].(string); ok {
				if uid, err := uuid.Parse(resourceID); err == nil {
					summary.ResourceID = &uid
				}
			}
		}

		result = append(result, summary)
	}

	return result, nil
}

func (s *dashboardService) GetRecentExecutions(ctx context.Context, userID uuid.UUID, limit int) ([]ExecutionSummary, error) {
	executions, _, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: limit,
	})
	if err != nil {
		return nil, err
	}

	result := make([]ExecutionSummary, 0, len(executions))
	for _, e := range executions {
		summary := ExecutionSummary{
			ID:           e.ID,
			WorkflowID:   e.WorkflowID,
			Status:       e.Status,
			DurationMs:   e.DurationMs,
			StartedAt:    e.StartedAt,
			CompletedAt:  e.CompletedAt,
			ErrorMessage: e.ErrorMessage,
		}

		// 获取工作流名称
		if workflow, err := s.workflowRepo.GetByID(ctx, e.WorkflowID); err == nil {
			summary.WorkflowName = workflow.Name
		}

		// 计算时间差
		if e.StartedAt != nil {
			summary.TimeAgo = getTimeAgo(*e.StartedAt)
		}

		result = append(result, summary)
	}

	return result, nil
}

func (s *dashboardService) getExecutionTrends(ctx context.Context, userID uuid.UUID, days int) ([]DailyStats, error) {
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, -days+1)

	executions, _, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: 10000,
	})
	if err != nil {
		return nil, err
	}

	// 按日期分组
	dailyMap := make(map[string]*DailyStats)
	for i := 0; i < days; i++ {
		date := startDate.AddDate(0, 0, i).Format("2006-01-02")
		dailyMap[date] = &DailyStats{Date: date}
	}

	for _, exec := range executions {
		if exec.StartedAt == nil || exec.StartedAt.Before(startDate) {
			continue
		}
		date := exec.StartedAt.Format("2006-01-02")
		stats, ok := dailyMap[date]
		if !ok {
			continue
		}

		stats.Executions++
		if exec.Status == "completed" {
			stats.SuccessfulRuns++
		} else if exec.Status == "failed" {
			stats.FailedRuns++
		}
	}

	result := make([]DailyStats, 0, days)
	for i := 0; i < days; i++ {
		date := startDate.AddDate(0, 0, i).Format("2006-01-02")
		result = append(result, *dailyMap[date])
	}

	return result, nil
}

func (s *dashboardService) generateRecommendations(stats *QuickStats, workflows []WorkflowSummary) []Recommendation {
	recommendations := make([]Recommendation, 0)

	// 如果没有工作流，推荐创建第一个
	if stats.TotalWorkflows == 0 {
		recommendations = append(recommendations, Recommendation{
			Type:        "feature",
			Title:       "创建你的第一个工作流",
			Description: "开始使用 AgentFlow 创建自动化工作流，提升工作效率",
			ActionURL:   "/workflows/new",
			Icon:        "Zap",
			Priority:    1,
		})
	}

	// 如果有草稿工作流，推荐完成
	if stats.DraftWorkflows > 0 {
		recommendations = append(recommendations, Recommendation{
			Type:        "workflow",
			Title:       "完成草稿工作流",
			Description: fmt.Sprintf("你有 %d 个草稿工作流等待完成", stats.DraftWorkflows),
			ActionURL:   "/workflows?status=draft",
			Icon:        "FileText",
			Priority:    2,
		})
	}

	// 推荐使用模板
	if stats.TotalWorkflows < 3 {
		recommendations = append(recommendations, Recommendation{
			Type:        "template",
			Title:       "探索工作流模板",
			Description: "从预置模板快速创建工作流，节省时间",
			ActionURL:   "/template-gallery",
			Icon:        "LayoutGrid",
			Priority:    3,
		})
	}

	// 推荐创意工坊
	recommendations = append(recommendations, Recommendation{
		Type:        "feature",
		Title:       "试试 AI 创意工坊",
		Description: "使用 AI 生成营销文案、产品描述等创意内容",
		ActionURL:   "/creative",
		Icon:        "Sparkles",
		Priority:    4,
	})

	return recommendations
}

// getActivityDescription 获取活动描述
func getActivityDescription(action string, metadata map[string]interface{}) string {
	descriptions := map[string]string{
		"login":           "登录成功",
		"logout":          "退出登录",
		"create_workflow": "创建了工作流",
		"update_workflow": "更新了工作流",
		"delete_workflow": "删除了工作流",
		"run_workflow":    "运行了工作流",
		"update_profile":  "更新了个人资料",
		"change_password": "修改了密码",
		"create_agent":    "发布了 Agent",
		"update_agent":    "更新了 Agent",
		"create_api_key":  "创建了 API 密钥",
		"delete_api_key":  "删除了 API 密钥",
	}

	if desc, ok := descriptions[action]; ok {
		// 尝试添加资源名称
		if metadata != nil {
			if name, ok := metadata["name"].(string); ok && name != "" {
				return desc + " \"" + name + "\""
			}
		}
		return desc
	}
	return action
}

// getTimeAgo 计算时间差描述
func getTimeAgo(t time.Time) string {
	now := time.Now()
	diff := now.Sub(t)

	if diff < time.Minute {
		return "刚刚"
	}
	if diff < time.Hour {
		return fmt.Sprintf("%d 分钟前", int(diff.Minutes()))
	}
	if diff < 24*time.Hour {
		return fmt.Sprintf("%d 小时前", int(diff.Hours()))
	}
	if diff < 7*24*time.Hour {
		return fmt.Sprintf("%d 天前", int(diff.Hours()/24))
	}
	if diff < 30*24*time.Hour {
		return fmt.Sprintf("%d 周前", int(diff.Hours()/24/7))
	}
	return t.Format("2006-01-02")
}

// GetUserLevel 获取用户等级信息
func (s *dashboardService) GetUserLevel(ctx context.Context, userID uuid.UUID) (*UserLevel, error) {
	// 获取用户统计数据计算等级
	_, totalWorkflows, _ := s.workflowRepo.List(ctx, userID, repository.ListParams{
		Page:     1,
		PageSize: 1,
	})

	_, totalExecutions, _ := s.executionRepo.List(ctx, repository.ExecutionListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: 1,
	})

	// 计算经验值：每个工作流 100 XP，每次执行 10 XP
	currentXP := totalWorkflows*100 + totalExecutions*10

	// 等级计算：每 500 XP 升一级
	level := int(currentXP/500) + 1
	if level > 99 {
		level = 99
	}

	levelNames := []string{
		"新手", "初学者", "入门者", "学徒", "实习生",
		"助手", "专员", "高级专员", "专家", "资深专家",
		"大师", "宗师", "传奇",
	}
	levelName := "传奇"
	if level < len(levelNames) {
		levelName = levelNames[level-1]
	}

	nextLevelXP := int64(level * 500)
	prevLevelXP := int64((level - 1) * 500)
	progress := float64(0)
	if nextLevelXP > prevLevelXP {
		progress = float64(currentXP-prevLevelXP) / float64(nextLevelXP-prevLevelXP) * 100
	}

	// 生成成就
	achievements := s.generateAchievements(totalWorkflows, totalExecutions)

	return &UserLevel{
		Level:           level,
		LevelName:       levelName,
		CurrentXP:       currentXP,
		NextLevelXP:     nextLevelXP,
		Progress:        progress,
		TotalWorkflows:  totalWorkflows,
		TotalExecutions: totalExecutions,
		Achievements:    achievements,
	}, nil
}

// generateAchievements 生成成就列表
func (s *dashboardService) generateAchievements(workflows, executions int64) []Achievement {
	achievements := []Achievement{
		{
			ID:          "first_workflow",
			Name:        "初次尝试",
			Description: "创建第一个工作流",
			Icon:        "Zap",
			Unlocked:    workflows >= 1,
			Progress:    min(int(workflows*100), 100),
		},
		{
			ID:          "workflow_builder",
			Name:        "工作流建造师",
			Description: "创建 10 个工作流",
			Icon:        "Layers",
			Unlocked:    workflows >= 10,
			Progress:    min(int(workflows*10), 100),
		},
		{
			ID:          "first_run",
			Name:        "启动引擎",
			Description: "运行第一次工作流",
			Icon:        "Play",
			Unlocked:    executions >= 1,
			Progress:    min(int(executions*100), 100),
		},
		{
			ID:          "power_user",
			Name:        "超级用户",
			Description: "执行 100 次工作流",
			Icon:        "Rocket",
			Unlocked:    executions >= 100,
			Progress:    min(int(executions), 100),
		},
		{
			ID:          "automation_master",
			Name:        "自动化大师",
			Description: "执行 1000 次工作流",
			Icon:        "Crown",
			Unlocked:    executions >= 1000,
			Progress:    min(int(executions/10), 100),
		},
	}

	// 设置解锁时间
	for i := range achievements {
		if achievements[i].Unlocked {
			achievements[i].UnlockedAt = time.Now().AddDate(0, 0, -i).Format(time.RFC3339)
		}
	}

	return achievements
}

// GetTokenUsage 获取 Token 使用量
func (s *dashboardService) GetTokenUsage(ctx context.Context, userID uuid.UUID) (*TokenUsage, error) {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := todayStart.AddDate(0, 0, -7)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	executions, _, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: 10000,
	})
	if err != nil {
		return nil, err
	}

	var usedToday, usedThisWeek, usedThisMonth, totalUsed int64
	dailyMap := make(map[string]int64)

	// 初始化最近7天的数据
	for i := 0; i < 7; i++ {
		date := todayStart.AddDate(0, 0, -i).Format("2006-01-02")
		dailyMap[date] = 0
	}

	for _, exec := range executions {
		if exec.TokenUsage == nil {
			continue
		}
		tokens := int64(0)
		if t, ok := exec.TokenUsage["total_tokens"].(float64); ok {
			tokens = int64(t)
		}
		totalUsed += tokens

		if exec.StartedAt != nil {
			if exec.StartedAt.After(todayStart) {
				usedToday += tokens
			}
			if exec.StartedAt.After(weekStart) {
				usedThisWeek += tokens
				// 记录每日使用量
				date := exec.StartedAt.Format("2006-01-02")
				if _, ok := dailyMap[date]; ok {
					dailyMap[date] += tokens
				}
			}
			if exec.StartedAt.After(monthStart) {
				usedThisMonth += tokens
			}
		}
	}

	// 默认月度限额 100 万 Token
	limit := int64(1000000)
	remaining := limit - usedThisMonth
	if remaining < 0 {
		remaining = 0
	}
	usagePercent := float64(usedThisMonth) / float64(limit) * 100

	// 生成每日趋势
	dailyTrend := make([]DailyTokenUsage, 0, 7)
	for i := 6; i >= 0; i-- {
		date := todayStart.AddDate(0, 0, -i).Format("2006-01-02")
		dailyTrend = append(dailyTrend, DailyTokenUsage{
			Date:   date,
			Tokens: dailyMap[date],
		})
	}

	return &TokenUsage{
		UsedToday:     usedToday,
		UsedThisWeek:  usedThisWeek,
		UsedThisMonth: usedThisMonth,
		TotalUsed:     totalUsed,
		Limit:         limit,
		Remaining:     remaining,
		UsagePercent:  usagePercent,
		DailyTrend:    dailyTrend,
	}, nil
}

// GetFeaturedTemplates 获取热门模板
func (s *dashboardService) GetFeaturedTemplates(ctx context.Context, limit int) ([]TemplateSummary, error) {
	if s.templateRepo == nil {
		// 返回默认模板
		return s.getDefaultTemplates(), nil
	}

	featured := true
	templates, _, err := s.templateRepo.List(ctx, repository.TemplateListParams{
		Page:     1,
		PageSize: limit,
		Featured: &featured,
	})
	if err != nil {
		return s.getDefaultTemplates(), nil
	}

	result := make([]TemplateSummary, 0, len(templates))
	for _, t := range templates {
		tags := make([]string, 0)
		if t.Tags != nil {
			for _, tag := range t.Tags {
				tags = append(tags, tag)
			}
		}
		result = append(result, TemplateSummary{
			ID:          t.ID,
			Name:        t.Name,
			Description: t.Description,
			Icon:        t.Icon,
			Category:    t.Category,
			UseCount:    t.UseCount,
			Rating:      4.5, // 默认评分
			Tags:        tags,
		})
	}

	if len(result) == 0 {
		return s.getDefaultTemplates(), nil
	}

	return result, nil
}

// getDefaultTemplates 获取默认模板
func (s *dashboardService) getDefaultTemplates() []TemplateSummary {
	return []TemplateSummary{
		{
			ID:          uuid.New(),
			Name:        "邮件自动化",
			Description: "自动发送和管理邮件通知",
			Icon:        "Mail",
			Category:    "通知",
			UseCount:    1256,
			Rating:      4.8,
			Tags:        []string{"邮件", "自动化", "通知"},
		},
		{
			ID:          uuid.New(),
			Name:        "数据同步",
			Description: "跨平台数据实时同步",
			Icon:        "RefreshCw",
			Category:    "数据",
			UseCount:    892,
			Rating:      4.6,
			Tags:        []string{"数据", "同步", "API"},
		},
		{
			ID:          uuid.New(),
			Name:        "内容生成",
			Description: "AI 驱动的内容创作助手",
			Icon:        "PenTool",
			Category:    "AI",
			UseCount:    2341,
			Rating:      4.9,
			Tags:        []string{"AI", "内容", "写作"},
		},
		{
			ID:          uuid.New(),
			Name:        "客服机器人",
			Description: "智能客服自动应答系统",
			Icon:        "Bot",
			Category:    "AI",
			UseCount:    1567,
			Rating:      4.7,
			Tags:        []string{"AI", "客服", "机器人"},
		},
	}
}

// GetLearningResources 获取学习资源
func (s *dashboardService) GetLearningResources(ctx context.Context) []LearningResource {
	return []LearningResource{
		{
			ID:          "getting-started",
			Title:       "快速入门指南",
			Description: "5 分钟了解 AgentFlow 核心概念",
			Type:        "tutorial",
			URL:         "/docs/getting-started",
			Icon:        "BookOpen",
			Duration:    "5 分钟",
			IsNew:       false,
		},
		{
			ID:          "first-workflow",
			Title:       "创建第一个工作流",
			Description: "手把手教你构建自动化流程",
			Type:        "video",
			URL:         "/learn/first-workflow",
			Icon:        "PlayCircle",
			Duration:    "10 分钟",
			IsNew:       true,
		},
		{
			ID:          "ai-nodes",
			Title:       "AI 节点使用指南",
			Description: "学习如何使用 LLM 节点",
			Type:        "article",
			URL:         "/docs/ai-nodes",
			Icon:        "Sparkles",
			Duration:    "8 分钟",
			IsNew:       true,
		},
		{
			ID:          "best-practices",
			Title:       "工作流最佳实践",
			Description: "提升工作流效率的技巧",
			Type:        "article",
			URL:         "/docs/best-practices",
			Icon:        "Target",
			Duration:    "12 分钟",
			IsNew:       false,
		},
	}
}

// min 返回较小值
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// GetAnnouncements 获取系统公告
func (s *dashboardService) GetAnnouncements(ctx context.Context, limit int) ([]Announcement, error) {
	// 返回示例公告，实际项目中应该从数据库获取
	now := time.Now()
	return []Announcement{
		{
			ID:          "ann-1",
			Type:        "update",
			Title:       "AgentFlow 2.0 新功能上线",
			Content:     "全新的工作流编辑器，支持更多节点类型和更强大的 AI 能力",
			ActionURL:   "/changelog",
			ActionLabel: "查看更新",
			Icon:        "Rocket",
			CreatedAt:   now.AddDate(0, 0, -1),
			IsRead:      false,
			Priority:    5,
		},
		{
			ID:          "ann-2",
			Type:        "info",
			Title:       "春节期间服务公告",
			Content:     "春节期间系统正常运行，如有问题请联系客服",
			Icon:        "Bell",
			CreatedAt:   now.AddDate(0, 0, -3),
			IsRead:      true,
			Priority:    3,
		},
		{
			ID:          "ann-3",
			Type:        "success",
			Title:       "邀请好友得积分",
			Content:     "邀请好友注册可获得 500 积分奖励",
			ActionURL:   "/invite",
			ActionLabel: "立即邀请",
			Icon:        "Gift",
			CreatedAt:   now.AddDate(0, 0, -5),
			IsRead:      false,
			Priority:    4,
		},
	}, nil
}

// GetDailyTasks 获取每日任务
func (s *dashboardService) GetDailyTasks(ctx context.Context, userID uuid.UUID) (*DailyTaskInfo, error) {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	tomorrow := todayStart.AddDate(0, 0, 1)

	// 获取今日执行次数
	executions, _, _ := s.executionRepo.List(ctx, repository.ExecutionListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: 100,
	})

	runsToday := 0
	for _, exec := range executions {
		if exec.StartedAt != nil && exec.StartedAt.After(todayStart) {
			runsToday++
		}
	}

	// 获取今日创建的工作流数
	workflows, _, _ := s.workflowRepo.List(ctx, userID, repository.ListParams{
		Page:     1,
		PageSize: 100,
	})

	workflowsToday := 0
	for _, w := range workflows {
		if w.CreatedAt.After(todayStart) {
			workflowsToday++
		}
	}

	// 构建每日任务
	tasks := []DailyTask{
		{
			ID:          "daily-login",
			Title:       "每日登录",
			Description: "登录系统获取积分",
			Icon:        "LogIn",
			XPReward:    10,
			Progress:    100,
			Target:      1,
			Current:     1,
			Completed:   true,
			Type:        "login",
		},
		{
			ID:          "run-workflow",
			Title:       "运行工作流",
			Description: "运行 3 次工作流",
			Icon:        "Play",
			XPReward:    30,
			Progress:    min(runsToday*100/3, 100),
			Target:      3,
			Current:     runsToday,
			Completed:   runsToday >= 3,
			Type:        "execution",
		},
		{
			ID:          "create-workflow",
			Title:       "创建工作流",
			Description: "创建 1 个新工作流",
			Icon:        "Plus",
			XPReward:    50,
			Progress:    min(workflowsToday*100, 100),
			Target:      1,
			Current:     workflowsToday,
			Completed:   workflowsToday >= 1,
			Type:        "create",
		},
		{
			ID:          "explore-templates",
			Title:       "探索模板",
			Description: "浏览模板库",
			Icon:        "LayoutGrid",
			XPReward:    15,
			Progress:    0,
			Target:      1,
			Current:     0,
			Completed:   false,
			Type:        "explore",
		},
	}

	completedCount := 0
	todayXP := int64(0)
	for _, t := range tasks {
		if t.Completed {
			completedCount++
			todayXP += int64(t.XPReward)
		}
	}

	return &DailyTaskInfo{
		CheckedIn:      true, // 登录即签到
		CheckInStreak:  7,    // 示例连签天数
		TodayXP:        todayXP,
		Tasks:          tasks,
		TotalTasks:     len(tasks),
		CompletedTasks: completedCount,
		NextResetAt:    tomorrow,
	}, nil
}

// CheckIn 每日签到
func (s *dashboardService) CheckIn(ctx context.Context, userID uuid.UUID) (*CheckInResult, error) {
	// 实际项目中应该检查是否已签到，更新数据库
	return &CheckInResult{
		Success:     true,
		XPEarned:    10,
		Streak:      7,
		Message:     "签到成功！连续签到 7 天",
		BonusReward: "连签 7 天奖励：额外 50 XP",
	}, nil
}

// GetFavorites 获取收藏夹
func (s *dashboardService) GetFavorites(ctx context.Context, userID uuid.UUID, limit int) ([]FavoriteItem, error) {
	// 获取用户的工作流作为示例收藏
	workflows, _, err := s.workflowRepo.List(ctx, userID, repository.ListParams{
		Page:     1,
		PageSize: limit,
	})
	if err != nil {
		return nil, err
	}

	favorites := make([]FavoriteItem, 0, len(workflows))
	for _, w := range workflows {
		description := ""
		if w.Description != nil {
			description = *w.Description
		}
		favorites = append(favorites, FavoriteItem{
			ID:          w.ID,
			Type:        "workflow",
			Name:        w.Name,
			Description: description,
			Icon:        w.Icon,
			Status:      w.Status,
			CreatedAt:   w.CreatedAt,
			FavoritedAt: w.UpdatedAt,
		})
	}

	return favorites, nil
}

// GetQuickRuns 获取快捷运行历史
func (s *dashboardService) GetQuickRuns(ctx context.Context, userID uuid.UUID, limit int) ([]QuickRunItem, error) {
	// 获取最近执行的工作流
	executions, _, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: 50,
	})
	if err != nil {
		return nil, err
	}

	// 按工作流分组统计
	workflowStats := make(map[uuid.UUID]*QuickRunItem)
	for _, exec := range executions {
		if exec.StartedAt == nil {
			continue
		}
		
		item, exists := workflowStats[exec.WorkflowID]
		if !exists {
			workflow, err := s.workflowRepo.GetByID(ctx, exec.WorkflowID)
			if err != nil {
				continue
			}
			item = &QuickRunItem{
				ID:           uuid.New(),
				WorkflowID:   exec.WorkflowID,
				WorkflowName: workflow.Name,
				Icon:         workflow.Icon,
				LastRunAt:    *exec.StartedAt,
				RunCount:     0,
				AvgDuration:  0,
				SuccessRate:  0,
			}
			workflowStats[exec.WorkflowID] = item
		}

		item.RunCount++
		if exec.StartedAt.After(item.LastRunAt) {
			item.LastRunAt = *exec.StartedAt
		}
		if exec.DurationMs != nil {
			item.AvgDuration = (item.AvgDuration*(item.RunCount-1) + *exec.DurationMs) / item.RunCount
		}
		if exec.Status == "completed" {
			item.SuccessRate = (item.SuccessRate*float64(item.RunCount-1) + 100) / float64(item.RunCount)
		} else {
			item.SuccessRate = item.SuccessRate * float64(item.RunCount-1) / float64(item.RunCount)
		}
	}

	// 转换为切片并按运行次数排序
	result := make([]QuickRunItem, 0, len(workflowStats))
	for _, item := range workflowStats {
		result = append(result, *item)
	}

	// 按最后运行时间排序
	for i := 0; i < len(result)-1; i++ {
		for j := i + 1; j < len(result); j++ {
			if result[j].LastRunAt.After(result[i].LastRunAt) {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	if len(result) > limit {
		result = result[:limit]
	}

	return result, nil
}

// GetPerformanceInsights 获取性能洞察
func (s *dashboardService) GetPerformanceInsights(ctx context.Context, userID uuid.UUID) (*PerformanceInsights, error) {
	executions, totalExecutions, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: 500,
	})
	if err != nil {
		return nil, err
	}

	if totalExecutions == 0 {
		return &PerformanceInsights{
			OverallScore: 100,
			Suggestions: []OptimizationSuggestion{
				{
					Type:        "performance",
					Title:       "开始使用工作流",
					Description: "创建并运行工作流以获取性能洞察",
					Impact:      "high",
					ActionURL:   "/workflows/new",
				},
			},
		}, nil
	}

	var totalDuration, successCount int64
	durations := make([]int64, 0)
	workflowDurations := make(map[uuid.UUID][]int64)
	workflowSuccess := make(map[uuid.UUID]int64)
	workflowCount := make(map[uuid.UUID]int64)

	for _, exec := range executions {
		if exec.DurationMs != nil {
			durations = append(durations, int64(*exec.DurationMs))
			totalDuration += int64(*exec.DurationMs)
			workflowDurations[exec.WorkflowID] = append(workflowDurations[exec.WorkflowID], int64(*exec.DurationMs))
		}
		if exec.Status == "completed" {
			successCount++
			workflowSuccess[exec.WorkflowID]++
		}
		workflowCount[exec.WorkflowID]++
	}

	// 计算平均执行时间
	avgDuration := int64(0)
	if len(durations) > 0 {
		avgDuration = totalDuration / int64(len(durations))
	}

	// 计算 P95 和 P99
	p95, p99 := calculatePercentiles(durations)

	// 计算成功率
	successRate := float64(successCount) / float64(totalExecutions) * 100

	// 计算综合评分
	overallScore := calculatePerformanceScore(avgDuration, successRate, totalExecutions)

	// 生成性能最佳和需要优化的工作流列表
	topPerformers := make([]WorkflowPerformance, 0)
	needOptimization := make([]WorkflowPerformance, 0)

	for wfID, count := range workflowCount {
		workflow, err := s.workflowRepo.GetByID(ctx, wfID)
		if err != nil {
			continue
		}

		avgWfDuration := int64(0)
		if len(workflowDurations[wfID]) > 0 {
			sum := int64(0)
			for _, d := range workflowDurations[wfID] {
				sum += d
			}
			avgWfDuration = sum / int64(len(workflowDurations[wfID]))
		}

		wfSuccessRate := float64(workflowSuccess[wfID]) / float64(count) * 100

		perf := WorkflowPerformance{
			WorkflowID:     wfID,
			WorkflowName:   workflow.Name,
			AvgDuration:    avgWfDuration,
			SuccessRate:    wfSuccessRate,
			ExecutionCount: count,
			Trend:          "stable",
		}

		if wfSuccessRate >= 95 && avgWfDuration < avgDuration {
			topPerformers = append(topPerformers, perf)
		} else if wfSuccessRate < 80 || avgWfDuration > avgDuration*2 {
			needOptimization = append(needOptimization, perf)
		}
	}

	// 限制数量
	if len(topPerformers) > 3 {
		topPerformers = topPerformers[:3]
	}
	if len(needOptimization) > 3 {
		needOptimization = needOptimization[:3]
	}

	// 生成优化建议
	suggestions := generateOptimizationSuggestions(avgDuration, successRate, len(needOptimization))

	return &PerformanceInsights{
		OverallScore:     overallScore,
		AvgExecutionTime: avgDuration,
		P95ExecutionTime: p95,
		P99ExecutionTime: p99,
		TotalExecutions:  totalExecutions,
		SuccessRate:      successRate,
		TopPerformers:    topPerformers,
		NeedOptimization: needOptimization,
		Suggestions:      suggestions,
	}, nil
}

// calculatePercentiles 计算百分位数
func calculatePercentiles(durations []int64) (p95, p99 int64) {
	if len(durations) == 0 {
		return 0, 0
	}

	// 排序
	for i := 0; i < len(durations)-1; i++ {
		for j := i + 1; j < len(durations); j++ {
			if durations[i] > durations[j] {
				durations[i], durations[j] = durations[j], durations[i]
			}
		}
	}

	p95Index := int(float64(len(durations)) * 0.95)
	p99Index := int(float64(len(durations)) * 0.99)

	if p95Index >= len(durations) {
		p95Index = len(durations) - 1
	}
	if p99Index >= len(durations) {
		p99Index = len(durations) - 1
	}

	return durations[p95Index], durations[p99Index]
}

// calculatePerformanceScore 计算性能评分
func calculatePerformanceScore(avgDuration int64, successRate float64, execCount int64) int {
	score := 100

	// 基于成功率扣分
	if successRate < 99 {
		score -= int((100 - successRate) * 0.5)
	}

	// 基于平均执行时间扣分
	if avgDuration > 5000 {
		score -= 10
	} else if avgDuration > 2000 {
		score -= 5
	}

	// 基于执行次数加分
	if execCount > 100 {
		score += 5
	}

	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}

	return score
}

// generateOptimizationSuggestions 生成优化建议
func generateOptimizationSuggestions(avgDuration int64, successRate float64, problemCount int) []OptimizationSuggestion {
	suggestions := make([]OptimizationSuggestion, 0)

	if successRate < 90 {
		suggestions = append(suggestions, OptimizationSuggestion{
			Type:        "reliability",
			Title:       "提升工作流稳定性",
			Description: fmt.Sprintf("当前成功率为 %.1f%%，建议检查失败的工作流并优化错误处理", successRate),
			Impact:      "high",
			ActionURL:   "/workflows?status=error",
		})
	}

	if avgDuration > 3000 {
		suggestions = append(suggestions, OptimizationSuggestion{
			Type:        "performance",
			Title:       "优化执行速度",
			Description: fmt.Sprintf("平均执行时间 %dms，考虑优化耗时较长的节点", avgDuration),
			Impact:      "medium",
			ActionURL:   "/docs/optimization",
		})
	}

	if problemCount > 0 {
		suggestions = append(suggestions, OptimizationSuggestion{
			Type:        "performance",
			Title:       "关注问题工作流",
			Description: fmt.Sprintf("有 %d 个工作流需要优化", problemCount),
			Impact:      "high",
		})
	}

	if len(suggestions) == 0 {
		suggestions = append(suggestions, OptimizationSuggestion{
			Type:        "performance",
			Title:       "保持良好状态",
			Description: "你的工作流运行良好，继续保持！",
			Impact:      "low",
		})
	}

	return suggestions
}

// GetErrorMonitor 获取错误监控
func (s *dashboardService) GetErrorMonitor(ctx context.Context, userID uuid.UUID, limit int) (*ErrorMonitor, error) {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := todayStart.AddDate(0, 0, -7)

	executions, totalExecutions, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: 500,
	})
	if err != nil {
		return nil, err
	}

	var totalErrors, errorsToday, errorsThisWeek int64
	recentErrors := make([]ErrorRecord, 0)
	errorsByType := make(map[string]int64)
	affectedMap := make(map[uuid.UUID]*AffectedWorkflow)

	for _, exec := range executions {
		if exec.Status != "failed" {
			continue
		}

		totalErrors++
		if exec.StartedAt != nil {
			if exec.StartedAt.After(todayStart) {
				errorsToday++
			}
			if exec.StartedAt.After(weekStart) {
				errorsThisWeek++
			}
		}

		// 解析错误类型
		errorType := "unknown"
		if exec.ErrorMessage != nil {
			if contains(*exec.ErrorMessage, "timeout") {
				errorType = "timeout"
			} else if contains(*exec.ErrorMessage, "connection") {
				errorType = "connection"
			} else if contains(*exec.ErrorMessage, "auth") {
				errorType = "authentication"
			} else if contains(*exec.ErrorMessage, "validation") {
				errorType = "validation"
			} else {
				errorType = "runtime"
			}
		}
		errorsByType[errorType]++

		// 获取工作流信息
		workflow, err := s.workflowRepo.GetByID(ctx, exec.WorkflowID)
		if err != nil {
			continue
		}

		// 记录最近错误
		if len(recentErrors) < limit {
			errorMsg := "未知错误"
			if exec.ErrorMessage != nil {
				errorMsg = *exec.ErrorMessage
				if len(errorMsg) > 100 {
					errorMsg = errorMsg[:100] + "..."
				}
			}

			occurredAt := time.Now()
			if exec.StartedAt != nil {
				occurredAt = *exec.StartedAt
			}

			recentErrors = append(recentErrors, ErrorRecord{
				ID:           exec.ID,
				WorkflowID:   exec.WorkflowID,
				WorkflowName: workflow.Name,
				ErrorType:    errorType,
				ErrorMessage: errorMsg,
				OccurredAt:   occurredAt,
				TimeAgo:      getTimeAgo(occurredAt),
				Severity:     getSeverity(errorType),
			})
		}

		// 统计受影响工作流
		if af, ok := affectedMap[exec.WorkflowID]; ok {
			af.ErrorCount++
			if exec.StartedAt != nil && exec.StartedAt.After(af.LastError) {
				af.LastError = *exec.StartedAt
			}
		} else {
			lastError := time.Now()
			if exec.StartedAt != nil {
				lastError = *exec.StartedAt
			}
			affectedMap[exec.WorkflowID] = &AffectedWorkflow{
				WorkflowID:   exec.WorkflowID,
				WorkflowName: workflow.Name,
				ErrorCount:   1,
				LastError:    lastError,
			}
		}
	}

	// 计算错误率
	errorRate := float64(0)
	if totalExecutions > 0 {
		errorRate = float64(totalErrors) / float64(totalExecutions) * 100
	}

	// 转换错误类型统计
	errorTypeList := make([]ErrorType, 0)
	for t, count := range errorsByType {
		errorTypeList = append(errorTypeList, ErrorType{
			Type:  t,
			Count: count,
			Trend: "stable",
		})
	}

	// 转换受影响工作流
	affectedList := make([]AffectedWorkflow, 0)
	for _, af := range affectedMap {
		affectedList = append(affectedList, *af)
	}
	if len(affectedList) > 5 {
		affectedList = affectedList[:5]
	}

	// 确定趋势
	errorTrend := "stable"
	if errorsToday > errorsThisWeek/7 {
		errorTrend = "up"
	} else if errorsToday < errorsThisWeek/14 {
		errorTrend = "down"
	}

	return &ErrorMonitor{
		TotalErrors:       totalErrors,
		ErrorsToday:       errorsToday,
		ErrorsThisWeek:    errorsThisWeek,
		ErrorRate:         errorRate,
		ErrorTrend:        errorTrend,
		RecentErrors:      recentErrors,
		ErrorsByType:      errorTypeList,
		AffectedWorkflows: affectedList,
	}, nil
}

// contains 检查字符串是否包含子串
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// getSeverity 获取错误严重程度
func getSeverity(errorType string) string {
	switch errorType {
	case "timeout", "connection":
		return "warning"
	case "authentication":
		return "critical"
	default:
		return "info"
	}
}

// GetAPIUsageStats 获取 API 使用统计
func (s *dashboardService) GetAPIUsageStats(ctx context.Context, userID uuid.UUID) (*APIUsageStats, error) {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := todayStart.AddDate(0, 0, -7)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	executions, totalCalls, err := s.executionRepo.List(ctx, repository.ExecutionListParams{
		UserID:   &userID,
		Page:     1,
		PageSize: 1000,
	})
	if err != nil {
		return nil, err
	}

	var callsToday, callsThisWeek, callsThisMonth, totalLatency, successCount int64
	dailyMap := make(map[string]*DailyAPIUsage)

	// 初始化最近7天
	for i := 0; i < 7; i++ {
		date := todayStart.AddDate(0, 0, -i).Format("2006-01-02")
		dailyMap[date] = &DailyAPIUsage{Date: date}
	}

	for _, exec := range executions {
		if exec.StartedAt != nil {
			if exec.StartedAt.After(todayStart) {
				callsToday++
			}
			if exec.StartedAt.After(weekStart) {
				callsThisWeek++
				// 记录每日使用量
				date := exec.StartedAt.Format("2006-01-02")
				if daily, ok := dailyMap[date]; ok {
					daily.Calls++
					if exec.Status == "completed" {
						daily.SuccessCount++
					} else if exec.Status == "failed" {
						daily.ErrorCount++
					}
				}
			}
			if exec.StartedAt.After(monthStart) {
				callsThisMonth++
			}
		}

		if exec.DurationMs != nil {
			totalLatency += int64(*exec.DurationMs)
		}

		if exec.Status == "completed" {
			successCount++
		}
	}

	avgLatency := int64(0)
	if totalCalls > 0 {
		avgLatency = totalLatency / totalCalls
	}

	successRate := float64(0)
	if totalCalls > 0 {
		successRate = float64(successCount) / float64(totalCalls) * 100
	}

	// 默认配额
	rateLimit := int64(10000)
	remainingCalls := rateLimit - callsThisMonth
	if remainingCalls < 0 {
		remainingCalls = 0
	}
	usagePercent := float64(callsThisMonth) / float64(rateLimit) * 100

	// 转换每日使用量
	dailyUsage := make([]DailyAPIUsage, 0, 7)
	for i := 6; i >= 0; i-- {
		date := todayStart.AddDate(0, 0, -i).Format("2006-01-02")
		if daily, ok := dailyMap[date]; ok {
			dailyUsage = append(dailyUsage, *daily)
		}
	}

	// 模拟端点统计
	topEndpoints := []EndpointStats{
		{Endpoint: "/api/v1/workflows/execute", Method: "POST", Calls: callsThisWeek * 60 / 100, AvgLatency: avgLatency, SuccessRate: successRate},
		{Endpoint: "/api/v1/workflows", Method: "GET", Calls: callsThisWeek * 25 / 100, AvgLatency: avgLatency / 2, SuccessRate: 99.5},
		{Endpoint: "/api/v1/templates", Method: "GET", Calls: callsThisWeek * 15 / 100, AvgLatency: avgLatency / 3, SuccessRate: 99.9},
	}

	return &APIUsageStats{
		TotalCalls:     totalCalls,
		CallsToday:     callsToday,
		CallsThisWeek:  callsThisWeek,
		CallsThisMonth: callsThisMonth,
		AvgLatency:     avgLatency,
		SuccessRate:    successRate,
		RateLimit:      rateLimit,
		RemainingCalls: remainingCalls,
		UsagePercent:   usagePercent,
		DailyUsage:     dailyUsage,
		TopEndpoints:   topEndpoints,
	}, nil
}

// GetQuickNotes 获取快速笔记
func (s *dashboardService) GetQuickNotes(ctx context.Context, userID uuid.UUID, limit int) ([]QuickNote, error) {
	// 返回示例笔记，实际项目应该从数据库获取
	now := time.Now()
	return []QuickNote{
		{
			ID:        uuid.New(),
			Content:   "记得优化用户注册工作流的性能",
			Color:     "yellow",
			Pinned:    true,
			CreatedAt: now.AddDate(0, 0, -1),
			UpdatedAt: now.AddDate(0, 0, -1),
		},
		{
			ID:        uuid.New(),
			Content:   "下周完成 API 文档更新",
			Color:     "blue",
			Pinned:    false,
			CreatedAt: now.AddDate(0, 0, -2),
			UpdatedAt: now.AddDate(0, 0, -2),
		},
	}, nil
}

// CreateQuickNote 创建快速笔记
func (s *dashboardService) CreateQuickNote(ctx context.Context, userID uuid.UUID, content string) (*QuickNote, error) {
	now := time.Now()
	return &QuickNote{
		ID:        uuid.New(),
		Content:   content,
		Color:     "yellow",
		Pinned:    false,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// DeleteQuickNote 删除快速笔记
func (s *dashboardService) DeleteQuickNote(ctx context.Context, userID uuid.UUID, noteID uuid.UUID) error {
	// 实际项目应该从数据库删除
	return nil
}

// GetIntegrationStatus 获取集成状态
func (s *dashboardService) GetIntegrationStatus(ctx context.Context, userID uuid.UUID) (*IntegrationStatus, error) {
	now := time.Now()
	lastSync := now.Add(-30 * time.Minute)

	integrations := []IntegrationInfo{
		{
			ID:         "slack",
			Name:       "Slack",
			Type:       "oauth",
			Icon:       "Slack",
			Status:     "connected",
			LastSyncAt: &lastSync,
		},
		{
			ID:         "github",
			Name:       "GitHub",
			Type:       "oauth",
			Icon:       "Github",
			Status:     "connected",
			LastSyncAt: &lastSync,
		},
		{
			ID:         "discord",
			Name:       "Discord",
			Type:       "webhook",
			Icon:       "MessageCircle",
			Status:     "disconnected",
		},
		{
			ID:         "notion",
			Name:       "Notion",
			Type:       "oauth",
			Icon:       "FileText",
			Status:     "connected",
			LastSyncAt: &lastSync,
		},
		{
			ID:         "openai",
			Name:       "OpenAI",
			Type:       "api_key",
			Icon:       "Sparkles",
			Status:     "connected",
			LastSyncAt: &lastSync,
		},
		{
			ID:         "google",
			Name:       "Google",
			Type:       "oauth",
			Icon:       "Chrome",
			Status:     "error",
			ErrorMsg:   "Token 已过期，请重新授权",
		},
	}

	connectedCount := 0
	for _, i := range integrations {
		if i.Status == "connected" {
			connectedCount++
		}
	}

	return &IntegrationStatus{
		TotalIntegrations: len(integrations),
		ConnectedCount:    connectedCount,
		DisconnectedCount: len(integrations) - connectedCount,
		Integrations:      integrations,
	}, nil
}

// GetScheduledTasks 获取计划任务
func (s *dashboardService) GetScheduledTasks(ctx context.Context, userID uuid.UUID, limit int) ([]ScheduledTask, error) {
	now := time.Now()

	// 获取用户工作流
	workflows, _, err := s.workflowRepo.List(ctx, userID, repository.ListParams{
		Page:     1,
		PageSize: limit,
	})
	if err != nil {
		return nil, err
	}

	tasks := make([]ScheduledTask, 0)
	for i, w := range workflows {
		if i >= limit {
			break
		}

		nextRun := now.Add(time.Duration((i+1)*2) * time.Hour)
		lastRun := now.Add(-time.Duration((i+1)*6) * time.Hour)

		tasks = append(tasks, ScheduledTask{
			ID:           uuid.New(),
			WorkflowID:   w.ID,
			WorkflowName: w.Name,
			CronExpr:     fmt.Sprintf("0 %d * * *", (i+1)*4%24),
			NextRunAt:    nextRun,
			LastRunAt:    &lastRun,
			Status:       "active",
			RunCount:     (i + 1) * 10,
			TimeUntil:    getTimeUntil(nextRun),
		})
	}

	// 如果没有工作流，返回示例数据
	if len(tasks) == 0 {
		tasks = []ScheduledTask{
			{
				ID:           uuid.New(),
				WorkflowID:   uuid.New(),
				WorkflowName: "每日数据备份",
				CronExpr:     "0 2 * * *",
				NextRunAt:    now.Add(8 * time.Hour),
				LastRunAt:    &now,
				Status:       "active",
				RunCount:     156,
				TimeUntil:    "8 小时后",
			},
			{
				ID:           uuid.New(),
				WorkflowID:   uuid.New(),
				WorkflowName: "邮件报告生成",
				CronExpr:     "0 9 * * 1",
				NextRunAt:    now.Add(24 * time.Hour),
				Status:       "active",
				RunCount:     24,
				TimeUntil:    "1 天后",
			},
		}
	}

	return tasks, nil
}

// getTimeUntil 获取距离时间的描述
func getTimeUntil(t time.Time) string {
	diff := time.Until(t)
	if diff < time.Hour {
		return fmt.Sprintf("%d 分钟后", int(diff.Minutes()))
	}
	if diff < 24*time.Hour {
		return fmt.Sprintf("%d 小时后", int(diff.Hours()))
	}
	return fmt.Sprintf("%d 天后", int(diff.Hours()/24))
}

// GetNotifications 获取通知
func (s *dashboardService) GetNotifications(ctx context.Context, userID uuid.UUID, limit int) (*NotificationCenter, error) {
	now := time.Now()

	notifications := []NotificationItem{
		{
			ID:        uuid.New(),
			Type:      "success",
			Title:     "工作流执行成功",
			Message:   "「数据同步」工作流已成功执行",
			ActionURL: "/executions/latest",
			Icon:      "CheckCircle",
			IsRead:    false,
			CreatedAt: now.Add(-10 * time.Minute),
			TimeAgo:   "10 分钟前",
		},
		{
			ID:        uuid.New(),
			Type:      "warning",
			Title:     "API 配额警告",
			Message:   "本月 API 使用量已达 80%",
			ActionURL: "/settings/billing",
			Icon:      "AlertTriangle",
			IsRead:    false,
			CreatedAt: now.Add(-1 * time.Hour),
			TimeAgo:   "1 小时前",
		},
		{
			ID:        uuid.New(),
			Type:      "info",
			Title:     "新功能上线",
			Message:   "AI 智能建议功能现已可用",
			ActionURL: "/changelog",
			Icon:      "Sparkles",
			IsRead:    true,
			CreatedAt: now.Add(-2 * time.Hour),
			TimeAgo:   "2 小时前",
		},
		{
			ID:        uuid.New(),
			Type:      "error",
			Title:     "集成连接失败",
			Message:   "Google 集成授权已过期",
			ActionURL: "/settings/integrations",
			Icon:      "XCircle",
			IsRead:    false,
			CreatedAt: now.Add(-3 * time.Hour),
			TimeAgo:   "3 小时前",
		},
		{
			ID:        uuid.New(),
			Type:      "system",
			Title:     "系统维护通知",
			Message:   "计划于本周六 02:00-04:00 进行系统维护",
			Icon:      "Server",
			IsRead:    true,
			CreatedAt: now.Add(-24 * time.Hour),
			TimeAgo:   "1 天前",
		},
	}

	unreadCount := 0
	for _, n := range notifications {
		if !n.IsRead {
			unreadCount++
		}
	}

	if len(notifications) > limit {
		notifications = notifications[:limit]
	}

	return &NotificationCenter{
		UnreadCount:   unreadCount,
		TotalCount:    len(notifications),
		Notifications: notifications,
		HasMore:       len(notifications) >= limit,
	}, nil
}

// MarkNotificationRead 标记通知已读
func (s *dashboardService) MarkNotificationRead(ctx context.Context, userID uuid.UUID, notificationID uuid.UUID) error {
	// 实际项目应该更新数据库
	return nil
}

// GetAISuggestions 获取 AI 智能建议
func (s *dashboardService) GetAISuggestions(ctx context.Context, userID uuid.UUID) ([]AISuggestion, error) {
	// 获取用户数据用于生成建议
	stats, _ := s.GetQuickStats(ctx, userID)
	performance, _ := s.GetPerformanceInsights(ctx, userID)

	suggestions := make([]AISuggestion, 0)

	// 基于统计数据生成建议
	if stats != nil {
		if stats.TotalWorkflows == 0 {
			suggestions = append(suggestions, AISuggestion{
				ID:          "create-first-workflow",
				Type:        "tip",
				Title:       "创建你的第一个工作流",
				Description: "开始自动化之旅，创建工作流可以节省大量重复工作时间",
				Confidence:  95,
				ActionURL:   "/workflows/new",
				ActionLabel: "立即创建",
				Icon:        "Zap",
				Priority:    5,
			})
		}

		if stats.DraftWorkflows > 0 {
			suggestions = append(suggestions, AISuggestion{
				ID:          "complete-drafts",
				Type:        "optimization",
				Title:       fmt.Sprintf("完成 %d 个草稿工作流", stats.DraftWorkflows),
				Description: "你有未完成的工作流，建议尽快完成并发布",
				Confidence:  85,
				ActionURL:   "/workflows?status=draft",
				ActionLabel: "查看草稿",
				Icon:        "FileEdit",
				Priority:    4,
			})
		}

		if stats.SuccessRate < 90 && stats.TotalExecutions > 10 {
			suggestions = append(suggestions, AISuggestion{
				ID:          "improve-success-rate",
				Type:        "warning",
				Title:       "提升工作流成功率",
				Description: fmt.Sprintf("当前成功率为 %.1f%%，建议检查失败的工作流并优化", stats.SuccessRate),
				Confidence:  90,
				ActionURL:   "/executions?status=failed",
				ActionLabel: "查看失败记录",
				Icon:        "TrendingUp",
				Priority:    5,
			})
		}
	}

	// 基于性能数据生成建议
	if performance != nil {
		if performance.AvgExecutionTime > 5000 {
			suggestions = append(suggestions, AISuggestion{
				ID:          "optimize-performance",
				Type:        "optimization",
				Title:       "优化工作流性能",
				Description: fmt.Sprintf("平均执行时间为 %dms，建议优化耗时较长的节点", performance.AvgExecutionTime),
				Confidence:  80,
				ActionURL:   "/docs/performance-optimization",
				ActionLabel: "查看优化指南",
				Icon:        "Gauge",
				Priority:    3,
			})
		}
	}

	// 添加功能推荐
	suggestions = append(suggestions, AISuggestion{
		ID:          "try-ai-generation",
		Type:        "feature",
		Title:       "试试 AI 内容生成",
		Description: "使用 AI 快速生成营销文案、产品描述等内容",
		Confidence:  75,
		ActionURL:   "/creative",
		ActionLabel: "立即体验",
		Icon:        "Sparkles",
		Priority:    2,
	})

	// 限制数量
	if len(suggestions) > 4 {
		suggestions = suggestions[:4]
	}

	return suggestions, nil
}

// GetLeaderboard 获取使用量排行榜
func (s *dashboardService) GetLeaderboard(ctx context.Context, userID uuid.UUID) (*Leaderboard, error) {
	// 获取用户统计作为基准
	stats, _ := s.GetQuickStats(ctx, userID)
	userScore := 0
	userSuccessRate := 0.0
	userExecutions := 0
	if stats != nil {
		userExecutions = int(stats.TotalExecutions)
		userSuccessRate = stats.SuccessRate
		userScore = userExecutions*10 + int(userSuccessRate*5)
	}

	// 模拟其他用户数据
	topUsers := []LeaderboardUser{
		{
			Rank:           1,
			UserID:         "user-001",
			Username:       "Alex Chen",
			Avatar:         "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
			ExecutionCount: 1250,
			SuccessRate:    98.5,
			Score:          12992,
			Badge:          "gold",
		},
		{
			Rank:           2,
			UserID:         "user-002",
			Username:       "Sarah Liu",
			Avatar:         "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
			ExecutionCount: 980,
			SuccessRate:    97.2,
			Score:          10286,
			Badge:          "silver",
		},
		{
			Rank:           3,
			UserID:         "user-003",
			Username:       "Mike Wang",
			Avatar:         "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
			ExecutionCount: 856,
			SuccessRate:    95.8,
			Score:          9039,
			Badge:          "bronze",
		},
		{
			Rank:           4,
			UserID:         "user-004",
			Username:       "Emma Zhang",
			Avatar:         "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
			ExecutionCount: 720,
			SuccessRate:    94.5,
			Score:          7672,
		},
		{
			Rank:           5,
			UserID:         "user-005",
			Username:       "David Li",
			Avatar:         "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
			ExecutionCount: 650,
			SuccessRate:    93.2,
			Score:          6966,
		},
	}

	// 计算用户排名
	currentRank := 10 // 默认排名
	for _, u := range topUsers {
		if userScore > u.Score {
			currentRank = u.Rank
			break
		}
	}

	return &Leaderboard{
		CurrentRank: currentRank,
		TotalUsers:  128,
		RankChange:  2, // 模拟排名上升
		TopUsers:    topUsers,
		UserStats: &LeaderboardUser{
			Rank:           currentRank,
			UserID:         userID.String(),
			Username:       "You",
			ExecutionCount: userExecutions,
			SuccessRate:    userSuccessRate,
			Score:          userScore,
		},
	}, nil
}

// goalStatus 根据进度返回目标状态
func goalStatus(progress float64) string {
	if progress >= 100 {
		return "completed"
	}
	return "active"
}

// GetGoals 获取目标追踪
func (s *dashboardService) GetGoals(ctx context.Context, userID uuid.UUID) ([]Goal, error) {
	now := time.Now()
	
	// 获取用户统计
	stats, _ := s.GetQuickStats(ctx, userID)
	executions := 0
	workflows := 0
	successRate := 0.0
	if stats != nil {
		executions = int(stats.TotalExecutions)
		workflows = int(stats.TotalWorkflows)
		successRate = stats.SuccessRate
	}

	// 计算目标进度
	weeklyExecTarget := 100
	weeklyExecProgress := float64(executions%weeklyExecTarget) / float64(weeklyExecTarget) * 100
	
	workflowTarget := 10
	workflowProgress := float64(workflows) / float64(workflowTarget) * 100
	if workflowProgress > 100 {
		workflowProgress = 100
	}

	successTarget := 95.0
	successProgress := successRate / successTarget * 100
	if successProgress > 100 {
		successProgress = 100
	}

	endOfWeek := now.AddDate(0, 0, 7-int(now.Weekday()))
	endOfMonth := time.Date(now.Year(), now.Month()+1, 0, 23, 59, 59, 0, now.Location())

	goals := []Goal{
		{
			ID:           uuid.New(),
			Title:        "本周执行 100 次工作流",
			Description:  "保持活跃，提升自动化效率",
			GoalType:     "executions",
			TargetValue:  weeklyExecTarget,
			CurrentValue: executions % weeklyExecTarget,
			Progress:     weeklyExecProgress,
			Status:       "active",
			Deadline:     &endOfWeek,
			CreatedAt:    now.AddDate(0, 0, -int(now.Weekday())),
			Icon:         "Zap",
			Color:        "violet",
		},
		{
			ID:           uuid.New(),
			Title:        "创建 10 个工作流",
			Description:  "构建你的自动化工作流库",
			GoalType:     "workflows",
			TargetValue:  workflowTarget,
			CurrentValue: workflows,
			Progress:     workflowProgress,
			Status:       goalStatus(workflowProgress),
			Deadline:     &endOfMonth,
			CreatedAt:    time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location()),
			Icon:         "Layers",
			Color:        "cyan",
		},
		{
			ID:           uuid.New(),
			Title:        "保持 95% 成功率",
			Description:  "优化工作流，减少错误",
			GoalType:     "success_rate",
			TargetValue:  int(successTarget),
			CurrentValue: int(successRate),
			Progress:     successProgress,
			Status:       goalStatus(successProgress),
			CreatedAt:    now.AddDate(0, -1, 0),
			Icon:         "Target",
			Color:        "emerald",
		},
		{
			ID:           uuid.New(),
			Title:        "连续登录 7 天",
			Description:  "养成每日检查的习惯",
			GoalType:     "streak",
			TargetValue:  7,
			CurrentValue: 5, // 模拟当前连续天数
			Progress:     71.4,
			Status:       "active",
			CreatedAt:    now.AddDate(0, 0, -5),
			Icon:         "Flame",
			Color:        "orange",
		},
	}

	return goals, nil
}

// CreateGoal 创建目标
func (s *dashboardService) CreateGoal(ctx context.Context, userID uuid.UUID, title string, targetValue int, goalType string) (*Goal, error) {
	now := time.Now()
	return &Goal{
		ID:           uuid.New(),
		Title:        title,
		GoalType:     goalType,
		TargetValue:  targetValue,
		CurrentValue: 0,
		Progress:     0,
		Status:       "active",
		CreatedAt:    now,
		Icon:         "Target",
		Color:        "violet",
	}, nil
}

// UpdateGoalProgress 更新目标进度
func (s *dashboardService) UpdateGoalProgress(ctx context.Context, userID uuid.UUID, goalID uuid.UUID, progress int) error {
	// 实际项目应该更新数据库
	return nil
}

// GetSystemHealth 获取系统健康状态
func (s *dashboardService) GetSystemHealth(ctx context.Context) (*SystemHealth, error) {
	now := time.Now()
	lastCheck := now.Add(-30 * time.Second)

	services := []ServiceHealth{
		{
			Name:      "API Server",
			Status:    "operational",
			Latency:   45,
			Uptime:    99.98,
			LastCheck: lastCheck,
			Icon:      "Server",
		},
		{
			Name:      "Database",
			Status:    "operational",
			Latency:   12,
			Uptime:    99.99,
			LastCheck: lastCheck,
			Icon:      "Database",
		},
		{
			Name:      "Workflow Engine",
			Status:    "operational",
			Latency:   78,
			Uptime:    99.95,
			LastCheck: lastCheck,
			Icon:      "Zap",
		},
		{
			Name:      "AI Service",
			Status:    "operational",
			Latency:   156,
			Uptime:    99.90,
			LastCheck: lastCheck,
			Icon:      "BrainCircuit",
		},
		{
			Name:      "Storage",
			Status:    "operational",
			Latency:   23,
			Uptime:    99.99,
			LastCheck: lastCheck,
			Icon:      "HardDrive",
		},
		{
			Name:      "CDN",
			Status:    "degraded",
			Latency:   220,
			Uptime:    99.50,
			LastCheck: lastCheck,
			Icon:      "Globe",
		},
	}

	// 判断整体状态
	overallStatus := "healthy"
	for _, svc := range services {
		if svc.Status == "down" {
			overallStatus = "down"
			break
		}
		if svc.Status == "degraded" {
			overallStatus = "degraded"
		}
	}

	return &SystemHealth{
		OverallStatus: overallStatus,
		Uptime:        "99.95%",
		Services:      services,
		Metrics: &SystemMetrics{
			CPUUsage:       35.2,
			MemoryUsage:    62.8,
			DiskUsage:      45.5,
			ActiveConns:    1284,
			RequestsPerSec: 856,
			AvgLatency:     52,
		},
	}, nil
}

// GetRunningQueue 获取运行队列
func (s *dashboardService) GetRunningQueue(ctx context.Context, userID uuid.UUID) (*RunningQueue, error) {
	now := time.Now()

	// 获取用户工作流
	workflows, _, _ := s.workflowRepo.List(ctx, userID, repository.ListParams{
		Page:     1,
		PageSize: 5,
	})

	runningTasks := make([]QueueTask, 0)
	pendingTasks := make([]QueueTask, 0)

	// 模拟运行中的任务
	for i, w := range workflows {
		if i >= 2 {
			break
		}
		startedAt := now.Add(-time.Duration(30*(i+1)) * time.Second)
		runningTasks = append(runningTasks, QueueTask{
			ID:           uuid.New(),
			WorkflowID:   w.ID,
			WorkflowName: w.Name,
			Status:       "running",
			Progress:     40 + i*25,
			StartedAt:    &startedAt,
			Duration:     int(time.Since(startedAt).Milliseconds()),
			Priority:     2 - i,
			CurrentStep:  fmt.Sprintf("Step %d", i+2),
			TotalSteps:   4,
		})
	}

	// 模拟等待中的任务
	for i, w := range workflows {
		if i < 2 || i >= 4 {
			continue
		}
		pendingTasks = append(pendingTasks, QueueTask{
			ID:           uuid.New(),
			WorkflowID:   w.ID,
			WorkflowName: w.Name,
			Status:       "pending",
			Progress:     0,
			Priority:     5 - i,
			TotalSteps:   3,
		})
	}

	// 如果没有工作流，返回示例数据
	if len(runningTasks) == 0 {
		startedAt := now.Add(-45 * time.Second)
		runningTasks = []QueueTask{
			{
				ID:           uuid.New(),
				WorkflowID:   uuid.New(),
				WorkflowName: "数据处理任务",
				Status:       "running",
				Progress:     65,
				StartedAt:    &startedAt,
				Duration:     45000,
				Priority:     1,
				CurrentStep:  "数据转换",
				TotalSteps:   4,
			},
		}
		pendingTasks = []QueueTask{
			{
				ID:           uuid.New(),
				WorkflowID:   uuid.New(),
				WorkflowName: "报表生成",
				Status:       "pending",
				Progress:     0,
				Priority:     2,
				TotalSteps:   3,
			},
		}
	}

	// 判断队列健康状态
	queueHealth := "healthy"
	if len(pendingTasks) > 5 {
		queueHealth = "busy"
	}
	if len(pendingTasks) > 10 {
		queueHealth = "overloaded"
	}

	return &RunningQueue{
		TotalRunning:   len(runningTasks),
		TotalPending:   len(pendingTasks),
		TotalCompleted: 42, // 模拟今日完成数
		RunningTasks:   runningTasks,
		PendingTasks:   pendingTasks,
		QueueHealth:    queueHealth,
	}, nil
}
