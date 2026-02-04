package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanSLOHandler SLO/SLA 指标处理器
type PlanSLOHandler struct {
	planSLOService service.PlanSLOService
}

// NewPlanSLOHandler 创建 SLO/SLA 指标处理器
func NewPlanSLOHandler(planSLOService service.PlanSLOService) *PlanSLOHandler {
	return &PlanSLOHandler{planSLOService: planSLOService}
}

// GetSLOTable 获取 SLO/SLA 指标表
func (h *PlanSLOHandler) GetSLOTable(c echo.Context) error {
	table, err := h.planSLOService.GetSLOTable(c.Request().Context())
	if err != nil {
		if err == service.ErrSLOTableNotFound {
			return errorResponse(c, http.StatusNotFound, "SLO_TABLE_NOT_FOUND", "指标表不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "SLO_TABLE_GET_FAILED", "获取指标表失败")
	}
	return successResponse(c, map[string]interface{}{
		"table": table,
	})
}
