package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanI18nHandler 国际化规划处理器
type PlanI18nHandler struct {
	planI18nService service.PlanI18nService
}

// NewPlanI18nHandler 创建国际化规划处理器
func NewPlanI18nHandler(planI18nService service.PlanI18nService) *PlanI18nHandler {
	return &PlanI18nHandler{planI18nService: planI18nService}
}

// GetPlan 获取国际化与多语言支持规划
func (h *PlanI18nHandler) GetPlan(c echo.Context) error {
	plan, err := h.planI18nService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrI18nPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "I18N_PLAN_NOT_FOUND", "国际化规划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "I18N_PLAN_GET_FAILED", "获取国际化规划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
