package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanIdentityAccountHandler identity/account plan handler.
type PlanIdentityAccountHandler struct {
	planIdentityAccountService service.PlanIdentityAccountService
}

// NewPlanIdentityAccountHandler creates identity/account plan handler.
func NewPlanIdentityAccountHandler(planIdentityAccountService service.PlanIdentityAccountService) *PlanIdentityAccountHandler {
	return &PlanIdentityAccountHandler{planIdentityAccountService: planIdentityAccountService}
}

// GetPlan returns identity/account plan.
func (h *PlanIdentityAccountHandler) GetPlan(c echo.Context) error {
	plan, err := h.planIdentityAccountService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrIdentityAccountPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "IDENTITY_ACCOUNT_PLAN_NOT_FOUND", "Identity account plan not found")
		}
		return errorResponse(c, http.StatusInternalServerError, "IDENTITY_ACCOUNT_PLAN_GET_FAILED", "Failed to get identity account plan")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
