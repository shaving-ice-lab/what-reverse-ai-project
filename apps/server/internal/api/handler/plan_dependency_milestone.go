package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanDependencyMilestoneHandler 依赖与里程碑处理器
type PlanDependencyMilestoneHandler struct {
	planDependencyMilestoneService service.PlanDependencyMilestoneService
}

// NewPlanDependencyMilestoneHandler 创建依赖与里程碑处理器
func NewPlanDependencyMilestoneHandler(planDependencyMilestoneService service.PlanDependencyMilestoneService) *PlanDependencyMilestoneHandler {
	return &PlanDependencyMilestoneHandler{planDependencyMilestoneService: planDependencyMilestoneService}
}

// GetPlan 获取依赖与里程碑计划
func (h *PlanDependencyMilestoneHandler) GetPlan(c echo.Context) error {
	plan, err := h.planDependencyMilestoneService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrDependencyMilestonePlanNotFound {
			return errorResponse(c, http.StatusNotFound, "DEPENDENCY_MILESTONE_NOT_FOUND", "依赖与里程碑计划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "DEPENDENCY_MILESTONE_GET_FAILED", "获取依赖与里程碑失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
