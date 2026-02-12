package handler

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/api/middleware"
	"github.com/reverseai/server/internal/service"
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

// GetRecentActivities 获取最近活动
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
