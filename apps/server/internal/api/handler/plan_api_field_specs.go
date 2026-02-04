package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanAPIFieldSpecsHandler API 字段级规范处理器
type PlanAPIFieldSpecsHandler struct {
	planAPIFieldSpecService service.PlanAPIFieldSpecService
}

// NewPlanAPIFieldSpecsHandler 创建 API 字段级规范处理器
func NewPlanAPIFieldSpecsHandler(planAPIFieldSpecService service.PlanAPIFieldSpecService) *PlanAPIFieldSpecsHandler {
	return &PlanAPIFieldSpecsHandler{planAPIFieldSpecService: planAPIFieldSpecService}
}

// GetTable 获取 API 字段级规范
func (h *PlanAPIFieldSpecsHandler) GetTable(c echo.Context) error {
	table, err := h.planAPIFieldSpecService.GetTable(c.Request().Context())
	if err != nil {
		if err == service.ErrAPIFieldSpecNotFound {
			return errorResponse(c, http.StatusNotFound, "API_FIELD_SPEC_NOT_FOUND", "API 字段级规范不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "API_FIELD_SPEC_GET_FAILED", "获取 API 字段级规范失败")
	}
	return successResponse(c, map[string]interface{}{
		"table": table,
	})
}
