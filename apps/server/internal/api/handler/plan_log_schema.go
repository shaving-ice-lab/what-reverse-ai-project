package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanLogSchemaHandler 日志字段规范处理器
type PlanLogSchemaHandler struct {
	planLogSchemaService service.PlanLogSchemaService
}

// NewPlanLogSchemaHandler 创建日志字段规范处理器
func NewPlanLogSchemaHandler(planLogSchemaService service.PlanLogSchemaService) *PlanLogSchemaHandler {
	return &PlanLogSchemaHandler{
		planLogSchemaService: planLogSchemaService,
	}
}

// GetSchema 获取日志字段规范
func (h *PlanLogSchemaHandler) GetSchema(c echo.Context) error {
	schema, err := h.planLogSchemaService.GetSchema(c.Request().Context())
	if err != nil {
		if err == service.ErrLogSchemaNotFound {
			return errorResponse(c, http.StatusNotFound, "LOG_SCHEMA_NOT_FOUND", "日志字段规范不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "LOG_SCHEMA_GET_FAILED", "获取日志字段规范失败")
	}
	return successResponse(c, map[string]interface{}{
		"schema": schema,
	})
}
