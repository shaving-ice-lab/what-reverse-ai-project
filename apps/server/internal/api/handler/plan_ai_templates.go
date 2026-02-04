package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanAITemplateHandler AI 模板库处理器
type PlanAITemplateHandler struct {
	planAITemplateService service.PlanAITemplateService
}

// NewPlanAITemplateHandler 创建 AI 模板库处理器
func NewPlanAITemplateHandler(planAITemplateService service.PlanAITemplateService) *PlanAITemplateHandler {
	return &PlanAITemplateHandler{planAITemplateService: planAITemplateService}
}

// GetLibrary 获取 AI 模板库
func (h *PlanAITemplateHandler) GetLibrary(c echo.Context) error {
	library, err := h.planAITemplateService.GetLibrary(c.Request().Context())
	if err != nil {
		if err == service.ErrAITemplateNotFound {
			return errorResponse(c, http.StatusNotFound, "AI_TEMPLATE_NOT_FOUND", "AI 模板库不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "AI_TEMPLATE_GET_FAILED", "获取 AI 模板库失败")
	}
	return successResponse(c, map[string]interface{}{
		"library": library,
	})
}
