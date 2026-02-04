package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanLegacyMigrationHandler 旧功能迁移规划处理器
type PlanLegacyMigrationHandler struct {
	planLegacyMigrationService service.PlanLegacyMigrationService
}

// NewPlanLegacyMigrationHandler 创建旧功能迁移规划处理器
func NewPlanLegacyMigrationHandler(planLegacyMigrationService service.PlanLegacyMigrationService) *PlanLegacyMigrationHandler {
	return &PlanLegacyMigrationHandler{planLegacyMigrationService: planLegacyMigrationService}
}

// GetPlan 获取旧功能迁移执行细化方案
func (h *PlanLegacyMigrationHandler) GetPlan(c echo.Context) error {
	plan, err := h.planLegacyMigrationService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrLegacyMigrationPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "LEGACY_MIGRATION_PLAN_NOT_FOUND", "旧功能迁移方案不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "LEGACY_MIGRATION_PLAN_GET_FAILED", "获取旧功能迁移方案失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
