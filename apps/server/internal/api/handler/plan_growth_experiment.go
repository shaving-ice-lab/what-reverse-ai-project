package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanGrowthExperimentHandler 运营与增长实验平台规划处理器
type PlanGrowthExperimentHandler struct {
	planGrowthExperimentService service.PlanGrowthExperimentService
}

// NewPlanGrowthExperimentHandler 创建运营与增长实验平台规划处理器
func NewPlanGrowthExperimentHandler(planGrowthExperimentService service.PlanGrowthExperimentService) *PlanGrowthExperimentHandler {
	return &PlanGrowthExperimentHandler{planGrowthExperimentService: planGrowthExperimentService}
}

// GetPlan 获取运营与增长实验平台规划
func (h *PlanGrowthExperimentHandler) GetPlan(c echo.Context) error {
	plan, err := h.planGrowthExperimentService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrGrowthExperimentPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "GROWTH_EXPERIMENT_PLAN_NOT_FOUND", "运营与增长实验平台规划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "GROWTH_EXPERIMENT_PLAN_GET_FAILED", "获取运营与增长实验平台规划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
