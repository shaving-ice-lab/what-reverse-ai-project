package handler

import (
	"net/http"
	"strconv"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// DashboardHandler Dashboard 处理器
type DashboardHandler struct {
	dashboardService service.DashboardService
}

// NewDashboardHandler 创建 Dashboard 处理器实例
func NewDashboardHandler(dashboardService service.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashboardService: dashboardService}
}

// GetDashboardData 获取 Dashboard 全部数据
// @Summary 获取 Dashboard 全部数据
// @Description 获取用户 Dashboard 所需的所有数据，包括统计、工作流、活动、执行记录等
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {object} service.DashboardData
// @Router /api/v1/dashboard [get]
func (h *DashboardHandler) GetDashboardData(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	data, err := h.dashboardService.GetDashboardData(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "DASHBOARD_FAILED", "获取 Dashboard 数据失败")
	}

	return successResponse(c, data)
}

// GetQuickStats 获取快捷统计
// @Summary 获取快捷统计数据
// @Description 获取用户的快捷统计数据，包括工作流数量、执行次数、成功率等
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {object} service.QuickStats
// @Router /api/v1/dashboard/stats [get]
func (h *DashboardHandler) GetQuickStats(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	stats, err := h.dashboardService.GetQuickStats(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "STATS_FAILED", "获取统计数据失败")
	}

	return successResponse(c, stats)
}

// GetRecentWorkflows 获取最近工作流
// @Summary 获取最近更新的工作流
// @Description 获取用户最近更新的工作流列表
// @Tags Dashboard
// @Security BearerAuth
// @Param limit query int false "返回数量限制 (默认5，最大20)"
// @Success 200 {array} service.WorkflowSummary
// @Router /api/v1/dashboard/workflows [get]
func (h *DashboardHandler) GetRecentWorkflows(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	limit := 5
	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 20 {
			limit = parsed
		}
	}

	workflows, err := h.dashboardService.GetRecentWorkflows(c.Request().Context(), uid, limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "WORKFLOWS_FAILED", "获取工作流失败")
	}

	return successResponse(c, workflows)
}

// GetRecentActivities 获取最近活动
// @Summary 获取最近活动记录
// @Description 获取用户最近的活动记录
// @Tags Dashboard
// @Security BearerAuth
// @Param limit query int false "返回数量限制 (默认10，最大50)"
// @Success 200 {array} service.ActivitySummary
// @Router /api/v1/dashboard/activities [get]
func (h *DashboardHandler) GetRecentActivities(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	limit := 10
	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	activities, err := h.dashboardService.GetRecentActivities(c.Request().Context(), uid, limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "ACTIVITIES_FAILED", "获取活动记录失败")
	}

	return successResponse(c, activities)
}

// GetRecentExecutions 获取最近执行记录
// @Summary 获取最近执行记录
// @Description 获取用户最近的工作流执行记录
// @Tags Dashboard
// @Security BearerAuth
// @Param limit query int false "返回数量限制 (默认5，最大20)"
// @Success 200 {array} service.ExecutionSummary
// @Router /api/v1/dashboard/executions [get]
func (h *DashboardHandler) GetRecentExecutions(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	limit := 5
	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 20 {
			limit = parsed
		}
	}

	executions, err := h.dashboardService.GetRecentExecutions(c.Request().Context(), uid, limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "EXECUTIONS_FAILED", "获取执行记录失败")
	}

	return successResponse(c, executions)
}

// GetUserLevel 获取用户等级信息
// @Summary 获取用户等级和成就
// @Description 获取用户的等级、经验值和成就列表
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {object} service.UserLevel
// @Router /api/v1/dashboard/level [get]
func (h *DashboardHandler) GetUserLevel(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	level, err := h.dashboardService.GetUserLevel(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LEVEL_FAILED", "获取等级信息失败")
	}

	return successResponse(c, level)
}

// GetTokenUsage 获取 Token 使用量
// @Summary 获取 Token 使用量统计
// @Description 获取用户的 Token 使用量和配额信息
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {object} service.TokenUsage
// @Router /api/v1/dashboard/tokens [get]
func (h *DashboardHandler) GetTokenUsage(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	usage, err := h.dashboardService.GetTokenUsage(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "TOKEN_USAGE_FAILED", "获取 Token 使用量失败")
	}

	return successResponse(c, usage)
}

// GetFeaturedTemplates 获取热门模板
// @Summary 获取热门模板列表
// @Description 获取推荐的热门工作流模板
// @Tags Dashboard
// @Security BearerAuth
// @Param limit query int false "返回数量限制 (默认4，最大10)"
// @Success 200 {array} service.TemplateSummary
// @Router /api/v1/dashboard/templates [get]
func (h *DashboardHandler) GetFeaturedTemplates(c echo.Context) error {
	limit := 4
	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 10 {
			limit = parsed
		}
	}

	templates, err := h.dashboardService.GetFeaturedTemplates(c.Request().Context(), limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "TEMPLATES_FAILED", "获取模板失败")
	}

	return successResponse(c, templates)
}

// GetLearningResources 获取学习资源
// @Summary 获取学习资源列表
// @Description 获取新手指南和学习资料
// @Tags Dashboard
// @Success 200 {array} service.LearningResource
// @Router /api/v1/dashboard/learning [get]
func (h *DashboardHandler) GetLearningResources(c echo.Context) error {
	resources := h.dashboardService.GetLearningResources(c.Request().Context())
	return successResponse(c, resources)
}

// GetAnnouncements 获取系统公告
// @Summary 获取系统公告列表
// @Description 获取最新的系统公告和通知
// @Tags Dashboard
// @Param limit query int false "返回数量限制 (默认3，最大10)"
// @Success 200 {array} service.Announcement
// @Router /api/v1/dashboard/announcements [get]
func (h *DashboardHandler) GetAnnouncements(c echo.Context) error {
	limit := 3
	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 10 {
			limit = parsed
		}
	}

	announcements, err := h.dashboardService.GetAnnouncements(c.Request().Context(), limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "ANNOUNCEMENTS_FAILED", "获取公告失败")
	}

	return successResponse(c, announcements)
}

// GetDailyTasks 获取每日任务
// @Summary 获取每日任务列表
// @Description 获取用户的每日任务和完成进度
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {object} service.DailyTaskInfo
// @Router /api/v1/dashboard/daily-tasks [get]
func (h *DashboardHandler) GetDailyTasks(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	tasks, err := h.dashboardService.GetDailyTasks(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "DAILY_TASKS_FAILED", "获取每日任务失败")
	}

	return successResponse(c, tasks)
}

// CheckIn 每日签到
// @Summary 每日签到
// @Description 用户每日签到获取积分
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {object} service.CheckInResult
// @Router /api/v1/dashboard/check-in [post]
func (h *DashboardHandler) CheckIn(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	result, err := h.dashboardService.CheckIn(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "CHECK_IN_FAILED", "签到失败")
	}

	return successResponse(c, result)
}

// GetFavorites 获取收藏夹
// @Summary 获取收藏夹列表
// @Description 获取用户收藏的工作流和模板
// @Tags Dashboard
// @Security BearerAuth
// @Param limit query int false "返回数量限制 (默认5，最大20)"
// @Success 200 {array} service.FavoriteItem
// @Router /api/v1/dashboard/favorites [get]
func (h *DashboardHandler) GetFavorites(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	limit := 5
	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 20 {
			limit = parsed
		}
	}

	favorites, err := h.dashboardService.GetFavorites(c.Request().Context(), uid, limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "FAVORITES_FAILED", "获取收藏失败")
	}

	return successResponse(c, favorites)
}

// GetQuickRuns 获取快捷运行历史
// @Summary 获取快捷运行历史
// @Description 获取用户最近运行的工作流，用于快捷运行
// @Tags Dashboard
// @Security BearerAuth
// @Param limit query int false "返回数量限制 (默认4，最大10)"
// @Success 200 {array} service.QuickRunItem
// @Router /api/v1/dashboard/quick-runs [get]
func (h *DashboardHandler) GetQuickRuns(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	limit := 4
	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 10 {
			limit = parsed
		}
	}

	quickRuns, err := h.dashboardService.GetQuickRuns(c.Request().Context(), uid, limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "QUICK_RUNS_FAILED", "获取快捷运行失败")
	}

	return successResponse(c, quickRuns)
}

// GetPerformanceInsights 获取性能洞察
// @Summary 获取性能洞察
// @Description 获取工作流性能分析和优化建议
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {object} service.PerformanceInsights
// @Router /api/v1/dashboard/performance [get]
func (h *DashboardHandler) GetPerformanceInsights(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	insights, err := h.dashboardService.GetPerformanceInsights(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "PERFORMANCE_FAILED", "获取性能洞察失败")
	}

	return successResponse(c, insights)
}

// GetErrorMonitor 获取错误监控
// @Summary 获取错误监控
// @Description 获取最近的错误和警告信息
// @Tags Dashboard
// @Security BearerAuth
// @Param limit query int false "返回数量限制 (默认5，最大20)"
// @Success 200 {object} service.ErrorMonitor
// @Router /api/v1/dashboard/errors [get]
func (h *DashboardHandler) GetErrorMonitor(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	limit := 5
	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 20 {
			limit = parsed
		}
	}

	errors, err := h.dashboardService.GetErrorMonitor(c.Request().Context(), uid, limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "ERROR_MONITOR_FAILED", "获取错误监控失败")
	}

	return successResponse(c, errors)
}

// GetAPIUsageStats 获取 API 使用统计
// @Summary 获取 API 使用统计
// @Description 获取 API 调用量和使用情况
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {object} service.APIUsageStats
// @Router /api/v1/dashboard/api-usage [get]
func (h *DashboardHandler) GetAPIUsageStats(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	stats, err := h.dashboardService.GetAPIUsageStats(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "API_USAGE_FAILED", "获取 API 使用统计失败")
	}

	return successResponse(c, stats)
}

// GetQuickNotes 获取快速笔记
// @Summary 获取快速笔记
// @Description 获取用户的快速笔记列表
// @Tags Dashboard
// @Security BearerAuth
// @Param limit query int false "返回数量限制 (默认5，最大20)"
// @Success 200 {array} service.QuickNote
// @Router /api/v1/dashboard/notes [get]
func (h *DashboardHandler) GetQuickNotes(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	limit := 5
	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 20 {
			limit = parsed
		}
	}

	notes, err := h.dashboardService.GetQuickNotes(c.Request().Context(), uid, limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "NOTES_FAILED", "获取笔记失败")
	}

	return successResponse(c, notes)
}

// CreateQuickNote 创建快速笔记
// @Summary 创建快速笔记
// @Description 创建一个新的快速笔记
// @Tags Dashboard
// @Security BearerAuth
// @Accept json
// @Param request body object{content string} true "笔记内容"
// @Success 200 {object} service.QuickNote
// @Router /api/v1/dashboard/notes [post]
func (h *DashboardHandler) CreateQuickNote(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求格式错误")
	}

	if req.Content == "" {
		return errorResponse(c, http.StatusBadRequest, "EMPTY_CONTENT", "笔记内容不能为空")
	}

	note, err := h.dashboardService.CreateQuickNote(c.Request().Context(), uid, req.Content)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "CREATE_NOTE_FAILED", "创建笔记失败")
	}

	return successResponse(c, note)
}

// DeleteQuickNote 删除快速笔记
// @Summary 删除快速笔记
// @Description 删除一个快速笔记
// @Tags Dashboard
// @Security BearerAuth
// @Param id path string true "笔记 ID"
// @Success 200
// @Router /api/v1/dashboard/notes/{id} [delete]
func (h *DashboardHandler) DeleteQuickNote(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	noteID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_NOTE_ID", "笔记 ID 无效")
	}

	if err := h.dashboardService.DeleteQuickNote(c.Request().Context(), uid, noteID); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "DELETE_NOTE_FAILED", "删除笔记失败")
	}

	return successResponse(c, map[string]bool{"success": true})
}

// GetIntegrationStatus 获取集成状态
// @Summary 获取集成状态
// @Description 获取第三方服务集成状态
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {object} service.IntegrationStatus
// @Router /api/v1/dashboard/integrations [get]
func (h *DashboardHandler) GetIntegrationStatus(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	status, err := h.dashboardService.GetIntegrationStatus(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "INTEGRATION_STATUS_FAILED", "获取集成状态失败")
	}

	return successResponse(c, status)
}

// GetScheduledTasks 获取计划任务
// @Summary 获取计划任务
// @Description 获取即将执行的计划任务
// @Tags Dashboard
// @Security BearerAuth
// @Param limit query int false "返回数量限制 (默认5，最大20)"
// @Success 200 {array} service.ScheduledTask
// @Router /api/v1/dashboard/scheduled-tasks [get]
func (h *DashboardHandler) GetScheduledTasks(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	limit := 5
	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 20 {
			limit = parsed
		}
	}

	tasks, err := h.dashboardService.GetScheduledTasks(c.Request().Context(), uid, limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SCHEDULED_TASKS_FAILED", "获取计划任务失败")
	}

	return successResponse(c, tasks)
}

// GetNotifications 获取通知
// @Summary 获取通知
// @Description 获取用户通知列表
// @Tags Dashboard
// @Security BearerAuth
// @Param limit query int false "返回数量限制 (默认5，最大20)"
// @Success 200 {object} service.NotificationCenter
// @Router /api/v1/dashboard/notifications [get]
func (h *DashboardHandler) GetNotifications(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	limit := 5
	if l := c.QueryParam("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 20 {
			limit = parsed
		}
	}

	notifications, err := h.dashboardService.GetNotifications(c.Request().Context(), uid, limit)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "NOTIFICATIONS_FAILED", "获取通知失败")
	}

	return successResponse(c, notifications)
}

// MarkNotificationRead 标记通知已读
// @Summary 标记通知已读
// @Description 标记一条通知为已读
// @Tags Dashboard
// @Security BearerAuth
// @Param id path string true "通知 ID"
// @Success 200
// @Router /api/v1/dashboard/notifications/{id}/read [post]
func (h *DashboardHandler) MarkNotificationRead(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	notificationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_NOTIFICATION_ID", "通知 ID 无效")
	}

	if err := h.dashboardService.MarkNotificationRead(c.Request().Context(), uid, notificationID); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "MARK_READ_FAILED", "标记已读失败")
	}

	return successResponse(c, map[string]bool{"success": true})
}

// GetAISuggestions 获取 AI 智能建议
// @Summary 获取 AI 智能建议
// @Description 获取基于用户数据的 AI 智能建议
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {array} service.AISuggestion
// @Router /api/v1/dashboard/ai-suggestions [get]
func (h *DashboardHandler) GetAISuggestions(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	suggestions, err := h.dashboardService.GetAISuggestions(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "AI_SUGGESTIONS_FAILED", "获取 AI 建议失败")
	}

	return successResponse(c, suggestions)
}

// GetLeaderboard 获取使用量排行榜
// @Summary 获取使用量排行榜
// @Description 获取用户活跃度排行榜
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {object} service.Leaderboard
// @Router /api/v1/dashboard/leaderboard [get]
func (h *DashboardHandler) GetLeaderboard(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	leaderboard, err := h.dashboardService.GetLeaderboard(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LEADERBOARD_FAILED", "获取排行榜失败")
	}

	return successResponse(c, leaderboard)
}

// GetGoals 获取目标追踪
// @Summary 获取目标追踪
// @Description 获取用户目标列表
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {array} service.Goal
// @Router /api/v1/dashboard/goals [get]
func (h *DashboardHandler) GetGoals(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	goals, err := h.dashboardService.GetGoals(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GOALS_FAILED", "获取目标失败")
	}

	return successResponse(c, goals)
}

// CreateGoal 创建目标
// @Summary 创建目标
// @Description 创建一个新目标
// @Tags Dashboard
// @Security BearerAuth
// @Param body body object true "目标信息"
// @Success 200 {object} service.Goal
// @Router /api/v1/dashboard/goals [post]
func (h *DashboardHandler) CreateGoal(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req struct {
		Title       string `json:"title"`
		TargetValue int    `json:"target_value"`
		GoalType    string `json:"goal_type"`
	}
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求格式错误")
	}

	if req.Title == "" {
		return errorResponse(c, http.StatusBadRequest, "EMPTY_TITLE", "目标标题不能为空")
	}

	goal, err := h.dashboardService.CreateGoal(c.Request().Context(), uid, req.Title, req.TargetValue, req.GoalType)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "CREATE_GOAL_FAILED", "创建目标失败")
	}

	return successResponse(c, goal)
}

// GetSystemHealth 获取系统健康状态
// @Summary 获取系统健康状态
// @Description 获取系统服务健康状态
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {object} service.SystemHealth
// @Router /api/v1/dashboard/system-health [get]
func (h *DashboardHandler) GetSystemHealth(c echo.Context) error {
	health, err := h.dashboardService.GetSystemHealth(c.Request().Context())
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "SYSTEM_HEALTH_FAILED", "获取系统状态失败")
	}

	return successResponse(c, health)
}

// GetRunningQueue 获取运行队列
// @Summary 获取运行队列
// @Description 获取当前运行和等待中的任务
// @Tags Dashboard
// @Security BearerAuth
// @Success 200 {object} service.RunningQueue
// @Router /api/v1/dashboard/running-queue [get]
func (h *DashboardHandler) GetRunningQueue(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	queue, err := h.dashboardService.GetRunningQueue(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "RUNNING_QUEUE_FAILED", "获取运行队列失败")
	}

	return successResponse(c, queue)
}
