package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanDataGovernancePolicyHandler 数据治理策略处理器
type PlanDataGovernancePolicyHandler struct {
	planDataGovernancePolicyService service.PlanDataGovernancePolicyService
}

// NewPlanDataGovernancePolicyHandler 创建数据治理策略处理器
func NewPlanDataGovernancePolicyHandler(planDataGovernancePolicyService service.PlanDataGovernancePolicyService) *PlanDataGovernancePolicyHandler {
	return &PlanDataGovernancePolicyHandler{planDataGovernancePolicyService: planDataGovernancePolicyService}
}

// GetPolicy 获取数据治理与隐私策略
func (h *PlanDataGovernancePolicyHandler) GetPolicy(c echo.Context) error {
	policy, err := h.planDataGovernancePolicyService.GetPolicy(c.Request().Context())
	if err != nil {
		if err == service.ErrDataGovernancePolicyNotFound {
			return errorResponse(c, http.StatusNotFound, "DATA_GOVERNANCE_POLICY_NOT_FOUND", "数据治理策略不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "DATA_GOVERNANCE_POLICY_GET_FAILED", "获取数据治理策略失败")
	}
	return successResponse(c, map[string]interface{}{
		"policy": policy,
	})
}
