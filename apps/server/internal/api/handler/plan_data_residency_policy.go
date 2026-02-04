package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanDataResidencyPolicyHandler 数据地域合规策略处理器
type PlanDataResidencyPolicyHandler struct {
	planDataResidencyPolicyService service.PlanDataResidencyPolicyService
}

// NewPlanDataResidencyPolicyHandler 创建数据地域合规策略处理器
func NewPlanDataResidencyPolicyHandler(planDataResidencyPolicyService service.PlanDataResidencyPolicyService) *PlanDataResidencyPolicyHandler {
	return &PlanDataResidencyPolicyHandler{planDataResidencyPolicyService: planDataResidencyPolicyService}
}

// GetPolicy 获取数据地域合规策略
func (h *PlanDataResidencyPolicyHandler) GetPolicy(c echo.Context) error {
	policy, err := h.planDataResidencyPolicyService.GetPolicy(c.Request().Context())
	if err != nil {
		if err == service.ErrDataResidencyPolicyNotFound {
			return errorResponse(c, http.StatusNotFound, "DATA_RESIDENCY_POLICY_NOT_FOUND", "数据地域策略不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "DATA_RESIDENCY_POLICY_GET_FAILED", "获取数据地域策略失败")
	}
	return successResponse(c, map[string]interface{}{
		"policy": policy,
	})
}
