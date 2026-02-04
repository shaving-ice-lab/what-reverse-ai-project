package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanChaosEngineeringHandler 混沌工程与稳定性演练处理器
type PlanChaosEngineeringHandler struct {
	planService service.PlanChaosEngineeringService
}

// NewPlanChaosEngineeringHandler 创建混沌工程处理器
func NewPlanChaosEngineeringHandler(planService service.PlanChaosEngineeringService) *PlanChaosEngineeringHandler {
	return &PlanChaosEngineeringHandler{planService: planService}
}

// GetChaosScenarioCatalog 获取混沌场景清单
func (h *PlanChaosEngineeringHandler) GetChaosScenarioCatalog(c echo.Context) error {
	catalog, err := h.planService.GetChaosScenarioCatalog(c.Request().Context())
	if err != nil {
		if err == service.ErrChaosScenarioCatalogNotFound {
			return errorResponse(c, http.StatusNotFound, "CHAOS_SCENARIOS_NOT_FOUND", "混沌场景清单不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "CHAOS_SCENARIOS_GET_FAILED", "获取混沌场景清单失败")
	}
	return successResponse(c, map[string]interface{}{
		"catalog": catalog,
	})
}

// GetChaosAutomationPlan 获取注入与回滚流程
func (h *PlanChaosEngineeringHandler) GetChaosAutomationPlan(c echo.Context) error {
	plan, err := h.planService.GetChaosAutomationPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrChaosAutomationPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "CHAOS_AUTOMATION_NOT_FOUND", "自动化流程不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "CHAOS_AUTOMATION_GET_FAILED", "获取自动化流程失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}

// GetChaosEvaluationTemplate 获取演练评估模板
func (h *PlanChaosEngineeringHandler) GetChaosEvaluationTemplate(c echo.Context) error {
	template, err := h.planService.GetChaosEvaluationTemplate(c.Request().Context())
	if err != nil {
		if err == service.ErrChaosEvaluationTemplateNotFound {
			return errorResponse(c, http.StatusNotFound, "CHAOS_TEMPLATE_NOT_FOUND", "评估模板不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "CHAOS_TEMPLATE_GET_FAILED", "获取评估模板失败")
	}
	return successResponse(c, map[string]interface{}{
		"template": template,
	})
}
