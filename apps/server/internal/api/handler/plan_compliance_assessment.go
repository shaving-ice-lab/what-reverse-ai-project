package handler

import (
	"net/http"
	"strings"

	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// PlanComplianceAssessmentHandler 合规清单与差距评估规划处理器
type PlanComplianceAssessmentHandler struct {
	planComplianceService service.PlanComplianceAssessmentService
	complianceService     service.SecurityComplianceService
	workspaceService      service.WorkspaceService
}

// NewPlanComplianceAssessmentHandler 创建合规清单规划处理器
func NewPlanComplianceAssessmentHandler(
	planComplianceService service.PlanComplianceAssessmentService,
	complianceService service.SecurityComplianceService,
	workspaceService service.WorkspaceService,
) *PlanComplianceAssessmentHandler {
	return &PlanComplianceAssessmentHandler{
		planComplianceService: planComplianceService,
		complianceService:     complianceService,
		workspaceService:      workspaceService,
	}
}

// GetPlan 获取合规清单与差距评估规划
func (h *PlanComplianceAssessmentHandler) GetPlan(c echo.Context) error {
	plan, err := h.planComplianceService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrCompliancePlanNotFound {
			return errorResponse(c, http.StatusNotFound, "COMPLIANCE_PLAN_NOT_FOUND", "合规清单不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "COMPLIANCE_PLAN_GET_FAILED", "获取合规清单失败")
	}

	var assessment interface{}
	workspaceIDRaw := strings.TrimSpace(c.QueryParam("workspace_id"))
	if workspaceIDRaw != "" {
		workspaceID, err := uuid.Parse(workspaceIDRaw)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "WORKSPACE_INVALID_ID", "无效的工作空间ID")
		}

		userID, ok := c.Get("user_id").(uuid.UUID)
		if !ok {
			return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "未授权访问")
		}

		access, err := h.workspaceService.GetWorkspaceAccess(c.Request().Context(), workspaceID, userID)
		if err != nil {
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权访问此工作空间")
		}
		if !access.IsOwner && !hasPermissionJSON(access.Permissions, "workspace_admin") {
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "需要管理员权限")
		}

		result, err := h.complianceService.CheckCompliance(c.Request().Context(), workspaceID)
		if err != nil {
			return errorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "合规评估失败", map[string]interface{}{
				"error": err.Error(),
			})
		}
		assessment = result
	}

	return successResponse(c, map[string]interface{}{
		"plan":       plan,
		"assessment": assessment,
	})
}
