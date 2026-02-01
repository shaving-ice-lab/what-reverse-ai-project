package handler

import (
	"net/http"
	"strconv"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type StatsHandler struct {
	statsService service.StatsService
}

func NewStatsHandler(statsService service.StatsService) *StatsHandler {
	return &StatsHandler{statsService: statsService}
}

// Overview 获取总览统计
// @Summary 获取用户统计总览
// @Tags Stats
// @Security BearerAuth
// @Success 200 {object} service.OverviewStats
// @Router /api/v1/stats/overview [get]
func (h *StatsHandler) Overview(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	stats, err := h.statsService.GetOverview(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "STATS_FAILED", "获取统计失败")
	}

	return successResponse(c, stats)
}

// ExecutionTrends 获取执行趋势
// @Summary 获取执行趋势统计
// @Tags Stats
// @Security BearerAuth
// @Param days query int false "天数 (默认7天，最大90天)"
// @Success 200 {array} service.DailyStats
// @Router /api/v1/stats/executions [get]
func (h *StatsHandler) ExecutionTrends(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	days := 7
	if d := c.QueryParam("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
			days = parsed
		}
	}

	trends, err := h.statsService.GetExecutionTrends(c.Request().Context(), uid, days)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "STATS_FAILED", "获取趋势失败")
	}

	return successResponse(c, trends)
}

// WorkflowStats 获取工作流统计
// @Summary 获取单个工作流统计
// @Tags Stats
// @Security BearerAuth
// @Param id path string true "工作流 ID"
// @Success 200 {object} service.WorkflowStats
// @Router /api/v1/stats/workflows/{id} [get]
func (h *StatsHandler) WorkflowStats(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workflowID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作流 ID 无效")
	}

	stats, err := h.statsService.GetWorkflowStats(c.Request().Context(), workflowID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作流不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看")
		default:
			return errorResponse(c, http.StatusInternalServerError, "STATS_FAILED", "获取统计失败")
		}
	}

	return successResponse(c, stats)
}

// WorkflowAnalytics 获取工作流分析
// @Summary 获取工作流分析（按状态和节点类型分布）
// @Tags Stats
// @Security BearerAuth
// @Success 200 {object} WorkflowAnalyticsResponse
// @Router /api/v1/stats/workflow-analytics [get]
func (h *StatsHandler) WorkflowAnalytics(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	analytics, err := h.statsService.GetWorkflowAnalytics(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "STATS_FAILED", "获取分析数据失败")
	}

	return successResponse(c, analytics)
}

// WorkflowAnalyticsResponse 工作流分析响应
type WorkflowAnalyticsResponse struct {
	StatusDistribution   []DistributionItem `json:"status_distribution"`
	NodeTypeDistribution []DistributionItem `json:"node_type_distribution"`
}

// DistributionItem 分布项
type DistributionItem struct {
	Label string `json:"label"`
	Value int64  `json:"value"`
	Color string `json:"color"`
	Icon  string `json:"icon,omitempty"`
}
