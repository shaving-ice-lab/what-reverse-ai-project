package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanRuntimeErrorMappingHandler 运行时错误映射处理器
type PlanRuntimeErrorMappingHandler struct {
	planRuntimeErrorMappingService service.PlanRuntimeErrorMappingService
}

// NewPlanRuntimeErrorMappingHandler 创建运行时错误映射处理器
func NewPlanRuntimeErrorMappingHandler(planRuntimeErrorMappingService service.PlanRuntimeErrorMappingService) *PlanRuntimeErrorMappingHandler {
	return &PlanRuntimeErrorMappingHandler{planRuntimeErrorMappingService: planRuntimeErrorMappingService}
}

// GetErrorMappingTable 获取运行时错误映射表
func (h *PlanRuntimeErrorMappingHandler) GetErrorMappingTable(c echo.Context) error {
	table, err := h.planRuntimeErrorMappingService.GetTable(c.Request().Context())
	if err != nil {
		if err == service.ErrRuntimeErrorMappingNotFound {
			return errorResponse(c, http.StatusNotFound, "RUNTIME_ERROR_MAPPING_NOT_FOUND", "运行时错误映射表不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "RUNTIME_ERROR_MAPPING_GET_FAILED", "获取运行时错误映射失败")
	}
	return successResponse(c, map[string]interface{}{
		"table": table,
	})
}
