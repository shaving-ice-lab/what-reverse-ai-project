package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanAuditCompliancePolicyHandler 审计合规策略处理器
type PlanAuditCompliancePolicyHandler struct {
	planAuditCompliancePolicyService service.PlanAuditCompliancePolicyService
}

// NewPlanAuditCompliancePolicyHandler 创建审计合规策略处理器
func NewPlanAuditCompliancePolicyHandler(planAuditCompliancePolicyService service.PlanAuditCompliancePolicyService) *PlanAuditCompliancePolicyHandler {
	return &PlanAuditCompliancePolicyHandler{planAuditCompliancePolicyService: planAuditCompliancePolicyService}
}

// GetPolicy 获取审计合规策略
func (h *PlanAuditCompliancePolicyHandler) GetPolicy(c echo.Context) error {
	policy, err := h.planAuditCompliancePolicyService.GetPolicy(c.Request().Context())
	if err != nil {
		if err == service.ErrAuditCompliancePolicyNotFound {
			return errorResponse(c, http.StatusNotFound, "AUDIT_COMPLIANCE_POLICY_NOT_FOUND", "审计合规策略不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "AUDIT_COMPLIANCE_POLICY_GET_FAILED", "获取审计合规策略失败")
	}
	return successResponse(c, map[string]interface{}{
		"policy": policy,
	})
}
