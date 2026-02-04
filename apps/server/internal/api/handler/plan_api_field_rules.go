package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanAPIFieldRulesHandler API 字段规范处理器
type PlanAPIFieldRulesHandler struct {
	planAPIFieldRulesService service.PlanAPIFieldRulesService
}

// NewPlanAPIFieldRulesHandler 创建 API 字段规范处理器
func NewPlanAPIFieldRulesHandler(planAPIFieldRulesService service.PlanAPIFieldRulesService) *PlanAPIFieldRulesHandler {
	return &PlanAPIFieldRulesHandler{planAPIFieldRulesService: planAPIFieldRulesService}
}

// GetRules 获取 API 字段规范与校验规则
func (h *PlanAPIFieldRulesHandler) GetRules(c echo.Context) error {
	spec, err := h.planAPIFieldRulesService.GetRules(c.Request().Context())
	if err != nil {
		if err == service.ErrAPIFieldRulesNotFound {
			return errorResponse(c, http.StatusNotFound, "API_FIELD_RULES_NOT_FOUND", "API 字段规范不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "API_FIELD_RULES_GET_FAILED", "获取 API 字段规范失败")
	}
	return successResponse(c, map[string]interface{}{
		"rules": spec,
	})
}
