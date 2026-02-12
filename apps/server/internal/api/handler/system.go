package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/config"
	"github.com/reverseai/server/internal/service"
)

type SystemHandler struct {
	systemService service.SystemService
	features      service.FeatureFlagsService
	deployment    *config.DeploymentConfig
}

func NewSystemHandler(
	systemService service.SystemService,
	features service.FeatureFlagsService,
	deployment *config.DeploymentConfig,
) *SystemHandler {
	return &SystemHandler{
		systemService: systemService,
		features:      features,
		deployment:    deployment,
	}
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

// GetFeatures 获取功能开关
// @Summary 获取功能开关
// @Tags System
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/system/features [get]
func (h *SystemHandler) GetFeatures(c echo.Context) error {
	return successResponse(c, map[string]interface{}{
		"features": h.features.Get(),
	})
}

// GetDeployment 获取部署信息
// @Summary 获取部署信息
// @Tags System
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/system/deployment [get]
func (h *SystemHandler) GetDeployment(c echo.Context) error {
	return successResponse(c, map[string]interface{}{
		"deployment": h.deployment,
	})
}

// GetErrorCodes 获取错误码清单
// @Summary 获取错误码清单
// @Tags System
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/system/error-codes [get]
func (h *SystemHandler) GetErrorCodes(c echo.Context) error {
	return successResponse(c, map[string]interface{}{
		"codes": ErrorCodeTable,
	})
}

// HealthCheck 健康检查
// @Summary 健康检查
// @Tags System
// @Success 200 {object} map[string]string
// @Router /health [get]
func (h *SystemHandler) HealthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}
