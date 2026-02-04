package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanUISchemaTemplatesHandler UI Schema 模板库处理器
type PlanUISchemaTemplatesHandler struct {
	planUISchemaTemplateService service.PlanUISchemaTemplateService
}

// NewPlanUISchemaTemplatesHandler 创建 UI Schema 模板库处理器
func NewPlanUISchemaTemplatesHandler(planUISchemaTemplateService service.PlanUISchemaTemplateService) *PlanUISchemaTemplatesHandler {
	return &PlanUISchemaTemplatesHandler{planUISchemaTemplateService: planUISchemaTemplateService}
}

// GetLibrary 获取 UI Schema 模板库
func (h *PlanUISchemaTemplatesHandler) GetLibrary(c echo.Context) error {
	library, err := h.planUISchemaTemplateService.GetLibrary(c.Request().Context())
	if err != nil {
		if err == service.ErrUISchemaTemplateNotFound {
			return errorResponse(c, http.StatusNotFound, "UI_SCHEMA_TEMPLATE_NOT_FOUND", "UI Schema 模板不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "UI_SCHEMA_TEMPLATE_GET_FAILED", "获取 UI Schema 模板失败")
	}
	return successResponse(c, map[string]interface{}{
		"library": library,
	})
}
