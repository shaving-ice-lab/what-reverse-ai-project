package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanCapacityCostHandler 容量规划与成本优化处理器
type PlanCapacityCostHandler struct {
	planService service.PlanCapacityCostService
}

// NewPlanCapacityCostHandler 创建容量规划与成本优化处理器
func NewPlanCapacityCostHandler(planService service.PlanCapacityCostService) *PlanCapacityCostHandler {
	return &PlanCapacityCostHandler{planService: planService}
}

// GetPlan 获取容量规划与成本优化方案
func (h *PlanCapacityCostHandler) GetPlan(c echo.Context) error {
	plan, err := h.planService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrCapacityCostPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "CAPACITY_COST_PLAN_NOT_FOUND", "容量规划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "CAPACITY_COST_PLAN_GET_FAILED", "获取容量规划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
