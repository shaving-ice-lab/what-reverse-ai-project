package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanRuntimeSecurityPolicyHandler 运行时安全策略处理器
type PlanRuntimeSecurityPolicyHandler struct {
	planRuntimeSecurityService service.PlanRuntimeSecurityService
}

// NewPlanRuntimeSecurityPolicyHandler 创建运行时安全策略处理器
func NewPlanRuntimeSecurityPolicyHandler(planRuntimeSecurityService service.PlanRuntimeSecurityService) *PlanRuntimeSecurityPolicyHandler {
	return &PlanRuntimeSecurityPolicyHandler{planRuntimeSecurityService: planRuntimeSecurityService}
}

// GetPolicy 获取运行时安全策略
func (h *PlanRuntimeSecurityPolicyHandler) GetPolicy(c echo.Context) error {
	policy, err := h.planRuntimeSecurityService.GetPolicy(c.Request().Context())
	if err != nil {
		if err == service.ErrRuntimeSecurityPolicyNotFound {
			return errorResponse(c, http.StatusNotFound, "RUNTIME_SECURITY_POLICY_NOT_FOUND", "运行时安全策略不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "RUNTIME_SECURITY_POLICY_GET_FAILED", "获取运行时安全策略失败")
	}
	return successResponse(c, map[string]interface{}{
		"policy": policy,
	})
}
