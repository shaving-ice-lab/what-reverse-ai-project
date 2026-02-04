package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanResponsiveExperienceHandler 响应式体验规划处理器
type PlanResponsiveExperienceHandler struct {
	planResponsiveExperienceService service.PlanResponsiveExperienceService
}

// NewPlanResponsiveExperienceHandler 创建响应式体验规划处理器
func NewPlanResponsiveExperienceHandler(planResponsiveExperienceService service.PlanResponsiveExperienceService) *PlanResponsiveExperienceHandler {
	return &PlanResponsiveExperienceHandler{planResponsiveExperienceService: planResponsiveExperienceService}
}

// GetPlan 获取响应式与多端体验规划
func (h *PlanResponsiveExperienceHandler) GetPlan(c echo.Context) error {
	plan, err := h.planResponsiveExperienceService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrResponsiveExperiencePlanNotFound {
			return errorResponse(c, http.StatusNotFound, "RESPONSIVE_PLAN_NOT_FOUND", "响应式体验规划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "RESPONSIVE_PLAN_GET_FAILED", "获取响应式体验规划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
