package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanMigrationChecklistHandler 迁移清单规划处理器
type PlanMigrationChecklistHandler struct {
	planMigrationChecklistService service.PlanMigrationChecklistService
}

// NewPlanMigrationChecklistHandler 创建迁移清单规划处理器
func NewPlanMigrationChecklistHandler(planMigrationChecklistService service.PlanMigrationChecklistService) *PlanMigrationChecklistHandler {
	return &PlanMigrationChecklistHandler{
		planMigrationChecklistService: planMigrationChecklistService,
	}
}

// GetChecklist 获取迁移脚本执行清单
func (h *PlanMigrationChecklistHandler) GetChecklist(c echo.Context) error {
	checklist, err := h.planMigrationChecklistService.GetChecklist(c.Request().Context())
	if err != nil {
		if err == service.ErrMigrationChecklistNotFound {
			return errorResponse(c, http.StatusNotFound, "MIGRATION_CHECKLIST_NOT_FOUND", "迁移清单不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "MIGRATION_CHECKLIST_GET_FAILED", "获取迁移清单失败")
	}
	return successResponse(c, map[string]interface{}{
		"checklist": checklist,
	})
}
