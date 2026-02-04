package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanRetentionPolicyHandler 数据保留策略处理器
type PlanRetentionPolicyHandler struct {
	planRetentionPolicyService service.PlanRetentionPolicyService
}

// NewPlanRetentionPolicyHandler 创建数据保留策略处理器
func NewPlanRetentionPolicyHandler(planRetentionPolicyService service.PlanRetentionPolicyService) *PlanRetentionPolicyHandler {
	return &PlanRetentionPolicyHandler{
		planRetentionPolicyService: planRetentionPolicyService,
	}
}

// GetPolicy 获取数据保留策略
func (h *PlanRetentionPolicyHandler) GetPolicy(c echo.Context) error {
	policy, err := h.planRetentionPolicyService.GetPolicy(c.Request().Context())
	if err != nil {
		if err == service.ErrRetentionPolicyNotFound {
			return errorResponse(c, http.StatusNotFound, "RETENTION_POLICY_NOT_FOUND", "保留策略不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "RETENTION_POLICY_GET_FAILED", "获取保留策略失败")
	}
	return successResponse(c, map[string]interface{}{
		"policy": policy,
	})
}
