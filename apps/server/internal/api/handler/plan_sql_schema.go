package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

// PlanSQLSchemaHandler SQL 草案处理器
type PlanSQLSchemaHandler struct {
	planSQLSchemaService service.PlanSQLSchemaService
}

// NewPlanSQLSchemaHandler 创建 SQL 草案处理器
func NewPlanSQLSchemaHandler(planSQLSchemaService service.PlanSQLSchemaService) *PlanSQLSchemaHandler {
	return &PlanSQLSchemaHandler{planSQLSchemaService: planSQLSchemaService}
}

// GetSQLDraft 获取 SQL 全量建表草案
func (h *PlanSQLSchemaHandler) GetSQLDraft(c echo.Context) error {
	draft, err := h.planSQLSchemaService.GetSQLDraft(c.Request().Context())
	if err != nil {
		if err == service.ErrSQLSchemaDraftNotFound {
			return errorResponse(c, http.StatusNotFound, "SQL_SCHEMA_NOT_FOUND", "SQL 草案不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "SQL_SCHEMA_GET_FAILED", "获取 SQL 草案失败")
	}
	return successResponse(c, map[string]interface{}{
		"draft": draft,
	})
}
