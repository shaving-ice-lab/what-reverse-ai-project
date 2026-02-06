package handler

import (
	"net/http"
	"strconv"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// MetricsHandler 指标处理器
type MetricsHandler struct {
	metricsService service.MetricsService
}

// NewMetricsHandler 创建指标处理器
func NewMetricsHandler(metricsService service.MetricsService) *MetricsHandler {
	return &MetricsHandler{metricsService: metricsService}
}

// GetWorkspaceMetrics 获取 Workspace 指标
func (h *MetricsHandler) GetWorkspaceMetrics(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	metrics, err := h.metricsService.GetWorkspaceMetrics(c.Request().Context(), uid, workspaceID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该工作空间")
		case service.ErrWorkspaceVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "Workspace 版本不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "METRICS_FAILED", "获取 Workspace 指标失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"metrics": metrics,
	})
}

// GetWorkspaceAccessStats 获取 Workspace 访问统计概览
func (h *MetricsHandler) GetWorkspaceAccessStats(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	windowDays := 0
	if rawDays := c.QueryParam("days"); rawDays != "" {
		parsed, err := strconv.Atoi(rawDays)
		if err != nil || parsed < 1 || parsed > 365 {
			return errorResponse(c, http.StatusBadRequest, "INVALID_DAYS", "days 参数无效")
		}
		windowDays = parsed
	}

	stats, err := h.metricsService.GetWorkspaceAccessStats(c.Request().Context(), uid, workspaceID, windowDays)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "STATS_FAILED", "获取 Workspace 访问统计失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"stats": stats,
	})
}

// GetWorkspaceUsage 获取 Workspace 用量
func (h *MetricsHandler) GetWorkspaceUsage(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	usage, err := h.metricsService.GetWorkspaceUsage(c.Request().Context(), uid, workspaceID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "USAGE_FAILED", "获取 Workspace 用量失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"usage": usage,
	})
}
