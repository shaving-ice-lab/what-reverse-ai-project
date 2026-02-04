package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanRACIHandler RACI 规划处理器
type PlanRACIHandler struct {
	planRACIService service.PlanRACIService
}

// NewPlanRACIHandler 创建 RACI 规划处理器
func NewPlanRACIHandler(planRACIService service.PlanRACIService) *PlanRACIHandler {
	return &PlanRACIHandler{planRACIService: planRACIService}
}

// GetPlan 获取 RACI 规划
func (h *PlanRACIHandler) GetPlan(c echo.Context) error {
	plan, err := h.planRACIService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrRACIPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "RACI_PLAN_NOT_FOUND", "RACI 规划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "RACI_PLAN_GET_FAILED", "获取 RACI 规划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
