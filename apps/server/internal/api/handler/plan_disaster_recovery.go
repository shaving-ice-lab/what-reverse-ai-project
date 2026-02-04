package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanDisasterRecoveryHandler 灾备规划处理器
type PlanDisasterRecoveryHandler struct {
	planDisasterRecoveryService service.PlanDisasterRecoveryService
}

// NewPlanDisasterRecoveryHandler 创建灾备规划处理器
func NewPlanDisasterRecoveryHandler(planDisasterRecoveryService service.PlanDisasterRecoveryService) *PlanDisasterRecoveryHandler {
	return &PlanDisasterRecoveryHandler{planDisasterRecoveryService: planDisasterRecoveryService}
}

// GetPlan 获取灾备与恢复（DR）规划
func (h *PlanDisasterRecoveryHandler) GetPlan(c echo.Context) error {
	plan, err := h.planDisasterRecoveryService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrDisasterRecoveryPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "DR_PLAN_NOT_FOUND", "灾备规划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "DR_PLAN_GET_FAILED", "获取灾备规划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
