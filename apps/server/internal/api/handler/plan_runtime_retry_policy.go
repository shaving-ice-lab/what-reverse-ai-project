package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanRuntimeRetryPolicyHandler 运行时重试策略处理器
type PlanRuntimeRetryPolicyHandler struct {
	planRuntimeRetryPolicyService service.PlanRuntimeRetryPolicyService
}

// NewPlanRuntimeRetryPolicyHandler 创建运行时重试策略处理器
func NewPlanRuntimeRetryPolicyHandler(planRuntimeRetryPolicyService service.PlanRuntimeRetryPolicyService) *PlanRuntimeRetryPolicyHandler {
	return &PlanRuntimeRetryPolicyHandler{planRuntimeRetryPolicyService: planRuntimeRetryPolicyService}
}

// GetRetryPolicy 获取运行时重试策略
func (h *PlanRuntimeRetryPolicyHandler) GetRetryPolicy(c echo.Context) error {
	policy, err := h.planRuntimeRetryPolicyService.GetPolicy(c.Request().Context())
	if err != nil {
		if err == service.ErrRuntimeRetryPolicyNotFound {
			return errorResponse(c, http.StatusNotFound, "RUNTIME_RETRY_POLICY_NOT_FOUND", "运行时重试策略不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "RUNTIME_RETRY_POLICY_GET_FAILED", "获取运行时重试策略失败")
	}
	return successResponse(c, map[string]interface{}{
		"table": policy,
	})
}
