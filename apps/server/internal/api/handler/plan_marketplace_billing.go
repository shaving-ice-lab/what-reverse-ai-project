package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanMarketplaceBillingHandler Marketplace 计费与分成规划处理器
type PlanMarketplaceBillingHandler struct {
	planService service.PlanMarketplaceBillingService
}

// NewPlanMarketplaceBillingHandler 创建 Marketplace 计费与分成规划处理器
func NewPlanMarketplaceBillingHandler(planService service.PlanMarketplaceBillingService) *PlanMarketplaceBillingHandler {
	return &PlanMarketplaceBillingHandler{planService: planService}
}

// GetPlan 获取 Marketplace 计费与分成规划
func (h *PlanMarketplaceBillingHandler) GetPlan(c echo.Context) error {
	plan, err := h.planService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrMarketplaceBillingPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "MARKETPLACE_BILLING_PLAN_NOT_FOUND", "Marketplace 计费与分成规划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "MARKETPLACE_BILLING_PLAN_GET_FAILED", "获取 Marketplace 计费与分成规划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
