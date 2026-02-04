package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanQueueSystemHandler 异步任务与队列系统规划处理器
type PlanQueueSystemHandler struct {
	planQueueSystemService service.PlanQueueSystemService
}

// NewPlanQueueSystemHandler 创建异步任务与队列系统规划处理器
func NewPlanQueueSystemHandler(planQueueSystemService service.PlanQueueSystemService) *PlanQueueSystemHandler {
	return &PlanQueueSystemHandler{planQueueSystemService: planQueueSystemService}
}

// GetPlan 获取异步任务与队列系统规划
func (h *PlanQueueSystemHandler) GetPlan(c echo.Context) error {
	plan, err := h.planQueueSystemService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrQueueSystemPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "QUEUE_SYSTEM_PLAN_NOT_FOUND", "队列系统规划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "QUEUE_SYSTEM_PLAN_GET_FAILED", "获取队列系统规划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
