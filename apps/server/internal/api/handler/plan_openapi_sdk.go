package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanOpenAPISDKHandler OpenAPI 与 SDK 生成计划处理器
type PlanOpenAPISDKHandler struct {
	planOpenAPISDKService service.PlanOpenAPISDKService
}

// NewPlanOpenAPISDKHandler 创建 OpenAPI 与 SDK 生成计划处理器
func NewPlanOpenAPISDKHandler(planOpenAPISDKService service.PlanOpenAPISDKService) *PlanOpenAPISDKHandler {
	return &PlanOpenAPISDKHandler{planOpenAPISDKService: planOpenAPISDKService}
}

// GetPlan 获取 OpenAPI 与 SDK 生成计划
func (h *PlanOpenAPISDKHandler) GetPlan(c echo.Context) error {
	plan, err := h.planOpenAPISDKService.GetPlan(c.Request().Context())
	if err != nil {
		if err == service.ErrOpenAPISDKPlanNotFound {
			return errorResponse(c, http.StatusNotFound, "OPENAPI_SDK_PLAN_NOT_FOUND", "OpenAPI 与 SDK 生成计划不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "OPENAPI_SDK_PLAN_GET_FAILED", "获取 OpenAPI 与 SDK 生成计划失败")
	}
	return successResponse(c, map[string]interface{}{
		"plan": plan,
	})
}
