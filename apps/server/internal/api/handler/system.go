package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
)

type SystemHandler struct {
	systemService service.SystemService
	features      service.FeatureFlagsService
	deployment    *config.DeploymentConfig
	adminService  service.AdminService
}

func NewSystemHandler(
	systemService service.SystemService,
	features service.FeatureFlagsService,
	deployment *config.DeploymentConfig,
	adminService service.AdminService,
) *SystemHandler {
	return &SystemHandler{
		systemService: systemService,
		features:      features,
		deployment:    deployment,
		adminService:  adminService,
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

// UpdateFeatures 更新功能开关（管理员）
// @Summary 更新功能开关
// @Tags System
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/admin/system/features [patch]
func (h *SystemHandler) UpdateFeatures(c echo.Context) error {
	if err := requireAdminCapability(c, h.adminService, "system.write"); err != nil {
		return err
	}
	var req FeatureFlagsUpdateRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.WorkspaceEnabled == nil && req.AppRuntimeEnabled == nil && req.DomainEnabled == nil {
		return errorResponse(c, http.StatusBadRequest, "EMPTY_PATCH", "未提供可更新的功能开关")
	}

	updated := h.features.Update(service.FeatureFlagsPatch{
		WorkspaceEnabled:  req.WorkspaceEnabled,
		AppRuntimeEnabled: req.AppRuntimeEnabled,
		DomainEnabled:     req.DomainEnabled,
	})

	return successResponse(c, map[string]interface{}{
		"features": updated,
	})
}

// FeatureFlagsUpdateRequest 功能开关更新请求
type FeatureFlagsUpdateRequest struct {
	WorkspaceEnabled  *bool `json:"workspace_enabled"`
	AppRuntimeEnabled *bool `json:"app_runtime_enabled"`
	DomainEnabled     *bool `json:"domain_enabled"`
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
