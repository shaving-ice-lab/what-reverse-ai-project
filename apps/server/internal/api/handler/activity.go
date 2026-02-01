package handler

import (
	"net/http"
	"strconv"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type ActivityHandler struct {
	activityService service.ActivityService
}

func NewActivityHandler(activityService service.ActivityService) *ActivityHandler {
	return &ActivityHandler{activityService: activityService}
}

// List 获取用户活动列表
// @Summary 获取用户活动历史
// @Tags Activity
// @Security BearerAuth
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Success 200 {object} SuccessResponse
// @Router /api/v1/users/me/activities [get]
func (h *ActivityHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	page := 1
	if p := c.QueryParam("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	pageSize := 20
	if ps := c.QueryParam("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
			pageSize = parsed
		}
	}

	activities, total, err := h.activityService.ListActivities(c.Request().Context(), uid, page, pageSize)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取活动历史失败")
	}

	// 转换为响应格式
	responses := make([]service.ActivityResponse, len(activities))
	for i, a := range activities {
		responses[i] = service.ToActivityResponse(&a)
	}

	return successResponseWithMeta(c, responses, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}
