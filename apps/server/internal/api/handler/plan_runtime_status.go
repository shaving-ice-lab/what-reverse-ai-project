package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanRuntimeStatusHandler 运行时状态规划处理器
type PlanRuntimeStatusHandler struct {
	planRuntimeStatusService service.PlanRuntimeStatusService
}

// NewPlanRuntimeStatusHandler 创建运行时状态规划处理器
func NewPlanRuntimeStatusHandler(planRuntimeStatusService service.PlanRuntimeStatusService) *PlanRuntimeStatusHandler {
	return &PlanRuntimeStatusHandler{planRuntimeStatusService: planRuntimeStatusService}
}

// GetStatusTable 获取运行时状态枚举表
func (h *PlanRuntimeStatusHandler) GetStatusTable(c echo.Context) error {
	table, err := h.planRuntimeStatusService.GetStatusTable(c.Request().Context())
	if err != nil {
		if err == service.ErrRuntimeStatusTableNotFound {
			return errorResponse(c, http.StatusNotFound, "RUNTIME_STATUS_TABLE_NOT_FOUND", "运行时状态表不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "RUNTIME_STATUS_TABLE_GET_FAILED", "获取运行时状态表失败")
	}
	return successResponse(c, map[string]interface{}{
		"table": table,
	})
}
