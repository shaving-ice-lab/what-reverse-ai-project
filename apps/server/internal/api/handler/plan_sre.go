package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanSREHandler 可用性与错误预算（SRE）规划处理器
type PlanSREHandler struct {
	planSREService service.PlanSREService
}

// NewPlanSREHandler 创建 SRE 规划处理器
func NewPlanSREHandler(planSREService service.PlanSREService) *PlanSREHandler {
	return &PlanSREHandler{planSREService: planSREService}
}

// GetErrorBudgetPolicy 获取错误预算规则
func (h *PlanSREHandler) GetErrorBudgetPolicy(c echo.Context) error {
	policy, err := h.planSREService.GetErrorBudgetPolicy(c.Request().Context())
	if err != nil {
		if err == service.ErrErrorBudgetPolicyNotFound {
			return errorResponse(c, http.StatusNotFound, "ERROR_BUDGET_POLICY_NOT_FOUND", "错误预算规则不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "ERROR_BUDGET_POLICY_GET_FAILED", "获取错误预算规则失败")
	}
	return successResponse(c, map[string]interface{}{
		"table": policy,
	})
}

// GetSyntheticMonitoringPlan 获取合成监控与探针部署方案
func (h *PlanSREHandler) GetSyntheticMonitoringPlan(c echo.Context) error {
	plan, err := h.planSREService.GetSyntheticMonitoringPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrSyntheticMonitoringPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "SYNTHETIC_MONITORING_PLAN_NOT_FOUND", "合成监控方案不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "SYNTHETIC_MONITORING_PLAN_GET_FAILED", "获取合成监控方案失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}

// GetOnCallSLOTable 获取值班与响应时间目标表
func (h *PlanSREHandler) GetOnCallSLOTable(c echo.Context) error {
	table, err := h.planSREService.GetOnCallSLOTable(c.Request().Context())
	if err != nil {
		if err == service.ErrOnCallSLOTableNotFound {
			return errorResponse(c, http.StatusNotFound, "ONCALL_SLO_TABLE_NOT_FOUND", "值班 SLO 表不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "ONCALL_SLO_TABLE_GET_FAILED", "获取值班 SLO 表失败")
	}
	return successResponse(c, map[string]interface{}{
		"table": table,
	})
}

// GetStabilityPlan 获取回归与稳定性专项计划
func (h *PlanSREHandler) GetStabilityPlan(c echo.Context) error {
	plan, err := h.planSREService.GetStabilityPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrStabilityPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "STABILITY_PLAN_NOT_FOUND", "稳定性专项计划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "STABILITY_PLAN_GET_FAILED", "获取稳定性专项计划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
