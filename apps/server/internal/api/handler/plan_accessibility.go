package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanAccessibilityHandler 可访问性规划处理器
type PlanAccessibilityHandler struct {
	planAccessibilityService service.PlanAccessibilityService
}

// NewPlanAccessibilityHandler 创建可访问性规划处理器
func NewPlanAccessibilityHandler(planAccessibilityService service.PlanAccessibilityService) *PlanAccessibilityHandler {
	return &PlanAccessibilityHandler{planAccessibilityService: planAccessibilityService}
}

// GetPlan 获取可访问性（A11y）规划
func (h *PlanAccessibilityHandler) GetPlan(c echo.Context) error {
	plan, err := h.planAccessibilityService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrAccessibilityPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "ACCESSIBILITY_PLAN_NOT_FOUND", "可访问性规划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "ACCESSIBILITY_PLAN_GET_FAILED", "获取可访问性规划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
