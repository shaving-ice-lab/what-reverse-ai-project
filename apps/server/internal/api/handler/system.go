package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

type SystemHandler struct {
	systemService service.SystemService
}

func NewSystemHandler(systemService service.SystemService) *SystemHandler {
	return &SystemHandler{systemService: systemService}
}

// GetHealth 获取系统健康状态
// @Summary 获取系统健康状态
// @Tags System
// @Success 200 {array} entity.SystemHealth
// @Router /api/v1/system/health [get]
func (h *SystemHandler) GetHealth(c echo.Context) error {
	health := h.systemService.GetHealth(c.Request().Context())
	return successResponse(c, health)
}

// HealthCheck 健康检查
// @Summary 健康检查
// @Tags System
// @Success 200 {object} map[string]string
// @Router /health [get]
func (h *SystemHandler) HealthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}
