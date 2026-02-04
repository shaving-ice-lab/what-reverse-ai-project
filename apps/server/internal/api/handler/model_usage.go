package handler

import (
	"net/http"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// ModelUsageHandler 模型用量处理器
type ModelUsageHandler struct {
	modelUsageService service.ModelUsageService
}

// NewModelUsageHandler 创建模型用量处理器
func NewModelUsageHandler(modelUsageService service.ModelUsageService) *ModelUsageHandler {
	return &ModelUsageHandler{modelUsageService: modelUsageService}
}

// GetWorkspaceModelUsage 获取 Workspace 模型用量
func (h *ModelUsageHandler) GetWorkspaceModelUsage(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	start, err := parseRFC3339Time(c.QueryParam("start"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_START", "start 参数无效")
	}
	end, err := parseRFC3339Time(c.QueryParam("end"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_END", "end 参数无效")
	}

	if start == nil && end == nil {
		defaultStart := time.Now().AddDate(0, 0, -30)
		defaultEnd := time.Now()
		start = &defaultStart
		end = &defaultEnd
	}

	report, err := h.modelUsageService.GetWorkspaceUsage(c.Request().Context(), uid, workspaceID, start, end)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "USAGE_FAILED", "获取模型用量失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"report": report,
	})
}

func parseRFC3339Time(value string) (*time.Time, error) {
	if value == "" {
		return nil, nil
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}
