package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanWBSHandler WBS 规划处理器
type PlanWBSHandler struct {
	planWBSService service.PlanWBSService
}

// NewPlanWBSHandler 创建 WBS 规划处理器
func NewPlanWBSHandler(planWBSService service.PlanWBSService) *PlanWBSHandler {
	return &PlanWBSHandler{
		planWBSService: planWBSService,
	}
}

// GetModuleWBS 获取指定模块 WBS
func (h *PlanWBSHandler) GetModuleWBS(c echo.Context) error {
	key := c.Param("module")
	module, err := h.planWBSService.GetModule(c.Request().Context(), key)
	if err != nil {
		if err == service.ErrWBSModuleNotFound {
			return errorResponse(c, http.StatusNotFound, "WBS_MODULE_NOT_FOUND", "WBS 模块不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "WBS_GET_FAILED", "获取 WBS 失败")
	}
	return successResponse(c, map[string]interface{}{
		"module": module,
	})
}
