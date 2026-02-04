package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanRunbookHandler 运行手册规划处理器
type PlanRunbookHandler struct {
	planRunbookService service.PlanRunbookService
}

// NewPlanRunbookHandler 创建运行手册规划处理器
func NewPlanRunbookHandler(planRunbookService service.PlanRunbookService) *PlanRunbookHandler {
	return &PlanRunbookHandler{planRunbookService: planRunbookService}
}

// GetPlan 获取 SRE 运行手册规划
func (h *PlanRunbookHandler) GetPlan(c echo.Context) error {
	plan, err := h.planRunbookService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrRunbookPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "RUNBOOK_PLAN_NOT_FOUND", "运行手册规划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "RUNBOOK_PLAN_GET_FAILED", "获取运行手册规划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
