package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanObservabilityHandler handles monitoring dictionary and tracking plans.
type PlanObservabilityHandler struct {
	planService service.PlanObservabilityService
}

// NewPlanObservabilityHandler creates a new observability plan handler.
func NewPlanObservabilityHandler(planService service.PlanObservabilityService) *PlanObservabilityHandler {
	return &PlanObservabilityHandler{planService: planService}
}

// GetMetricsDictionary returns the observability metrics dictionary.
func (h *PlanObservabilityHandler) GetMetricsDictionary(c echo.Context) error {
	table, err := h.planService.GetMetricsDictionary(c.Request().Context())
	if err != nil {
		if err == service.ErrMetricsDictionaryNotFound {
			return errorResponse(c, http.StatusNotFound, "METRICS_DICTIONARY_NOT_FOUND", "Metrics dictionary not found")
		}
		return errorResponse(c, http.StatusInternalServerError, "METRICS_DICTIONARY_GET_FAILED", "Failed to get metrics dictionary")
	}
	return successResponse(c, map[string]interface{}{
		"table": table,
	})
}

// GetFrontendTrackingPlan returns frontend tracking event table.
func (h *PlanObservabilityHandler) GetFrontendTrackingPlan(c echo.Context) error {
	table, err := h.planService.GetFrontendTrackingPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrFrontendTrackingPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "FRONTEND_TRACKING_PLAN_NOT_FOUND", "Frontend tracking plan not found")
		}
		return errorResponse(c, http.StatusInternalServerError, "FRONTEND_TRACKING_PLAN_GET_FAILED", "Failed to get frontend tracking plan")
	}
	return successResponse(c, map[string]interface{}{
		"table": table,
	})
}

// GetBackendTrackingPlan returns backend tracking event table.
func (h *PlanObservabilityHandler) GetBackendTrackingPlan(c echo.Context) error {
	table, err := h.planService.GetBackendTrackingPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrBackendTrackingPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "BACKEND_TRACKING_PLAN_NOT_FOUND", "Backend tracking plan not found")
		}
		return errorResponse(c, http.StatusInternalServerError, "BACKEND_TRACKING_PLAN_GET_FAILED", "Failed to get backend tracking plan")
	}
	return successResponse(c, map[string]interface{}{
		"table": table,
	})
}
