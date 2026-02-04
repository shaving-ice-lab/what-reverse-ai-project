package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanFeatureFlagsHandler Feature Flags 规划处理器
type PlanFeatureFlagsHandler struct {
	planFeatureFlagsService service.PlanFeatureFlagsService
}

// NewPlanFeatureFlagsHandler 创建 Feature Flags 规划处理器
func NewPlanFeatureFlagsHandler(planFeatureFlagsService service.PlanFeatureFlagsService) *PlanFeatureFlagsHandler {
	return &PlanFeatureFlagsHandler{planFeatureFlagsService: planFeatureFlagsService}
}

// GetPolicy 获取 Feature Flags 规范
func (h *PlanFeatureFlagsHandler) GetPolicy(c echo.Context) error {
	policy, err := h.planFeatureFlagsService.GetPolicy(c.Request().Context())
	if err != nil {
		if err == service.ErrFeatureFlagPolicyNotFound {
			return errorResponse(c, http.StatusNotFound, "FEATURE_FLAG_POLICY_NOT_FOUND", "Feature Flag 规范不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "FEATURE_FLAG_POLICY_GET_FAILED", "获取 Feature Flag 规范失败")
	}
	return successResponse(c, map[string]interface{}{
		"policy": policy,
	})
}
