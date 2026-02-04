package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanModuleWBSHandler 模块级 WBS 细分处理器
type PlanModuleWBSHandler struct {
	planModuleWBSService service.PlanModuleWBSService
}

// NewPlanModuleWBSHandler 创建模块级 WBS 细分处理器
func NewPlanModuleWBSHandler(planModuleWBSService service.PlanModuleWBSService) *PlanModuleWBSHandler {
	return &PlanModuleWBSHandler{planModuleWBSService: planModuleWBSService}
}

// GetBreakdown 获取模块级 WBS 细分列表
func (h *PlanModuleWBSHandler) GetBreakdown(c echo.Context) error {
	breakdown, err := h.planModuleWBSService.GetBreakdown(c.Request().Context())
	if err != nil {
		if err == service.ErrModuleWBSNotFound {
			return errorResponse(c, http.StatusNotFound, "MODULE_WBS_NOT_FOUND", "模块级 WBS 不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "MODULE_WBS_GET_FAILED", "获取模块级 WBS 失败")
	}
	return successResponse(c, map[string]interface{}{
		"breakdown": breakdown,
	})
}
