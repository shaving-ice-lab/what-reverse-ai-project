package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanAPIExamplesHandler API 示例处理器
type PlanAPIExamplesHandler struct {
	planAPIExamplesService service.PlanAPIExamplesService
}

// NewPlanAPIExamplesHandler 创建 API 示例处理器
func NewPlanAPIExamplesHandler(planAPIExamplesService service.PlanAPIExamplesService) *PlanAPIExamplesHandler {
	return &PlanAPIExamplesHandler{planAPIExamplesService: planAPIExamplesService}
}

// GetExamples 获取 API 请求/响应示例
func (h *PlanAPIExamplesHandler) GetExamples(c echo.Context) error {
	table, err := h.planAPIExamplesService.GetExamples(c.Request().Context())
	if err != nil {
		if err == service.ErrAPIExamplesNotFound {
			return errorResponse(c, http.StatusNotFound, "API_EXAMPLES_NOT_FOUND", "API 示例不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "API_EXAMPLES_GET_FAILED", "获取 API 示例失败")
	}
	return successResponse(c, map[string]interface{}{
		"table": table,
	})
}
