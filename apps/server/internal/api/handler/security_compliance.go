package handler

import (
	"net/http"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// SecurityComplianceHandler 安全合规处理器
type SecurityComplianceHandler struct {
	complianceService service.SecurityComplianceService
	workspaceService  service.WorkspaceService
}

// NewSecurityComplianceHandler 创建安全合规处理器
func NewSecurityComplianceHandler(
	complianceService service.SecurityComplianceService,
	workspaceService service.WorkspaceService,
) *SecurityComplianceHandler {
	return &SecurityComplianceHandler{
		complianceService: complianceService,
		workspaceService:  workspaceService,
	}
}

// RegisterRoutes 注册路由
func (h *SecurityComplianceHandler) RegisterRoutes(g *echo.Group) {
	// 安全合规相关路由
	g.GET("/security/compliance/:workspaceId", h.CheckCompliance)
	g.GET("/security/data-classification", h.GetDataClassification)
	g.GET("/security/sensitive-fields", h.GetSensitiveFields)
	g.GET("/security/masking-rules", h.GetMaskingRules)
	g.GET("/security/audit-actions", h.GetAuditActions)
	g.GET("/security/audit-checklist", h.GetAuditChecklist)
	g.GET("/security/dependency-scan", h.GetDependencyScanStatus)
	g.GET("/security/rotation-policies", h.GetRotationPolicies)
}

// CheckCompliance 检查工作空间合规性
// @Summary 检查工作空间合规性
// @Tags Security
// @Accept json
// @Produce json
// @Param workspaceId path string true "工作空间ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Router /api/v1/security/compliance/{workspaceId} [get]
func (h *SecurityComplianceHandler) CheckCompliance(c echo.Context) error {
	workspaceIDStr := c.Param("workspaceId")
	workspaceID, err := uuid.Parse(workspaceIDStr)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_INVALID_ID", "无效的工作空间ID")
	}

	// 获取当前用户
	userID, ok := c.Get("user_id").(uuid.UUID)
	if !ok {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "未授权访问")
	}

	// 检查权限
	access, err := h.workspaceService.GetWorkspaceAccess(c.Request().Context(), workspaceID, userID)
	if err != nil {
		return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权访问此工作空间")
	}

	// 需要管理员或所有者权限
	if !access.IsOwner && !hasPermissionJSON(access.Permissions, "workspace_admin") {
		return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "需要管理员权限")
	}

	result, err := h.complianceService.CheckCompliance(c.Request().Context(), workspaceID)
	if err != nil {
		return errorResponseWithDetails(c, http.StatusInternalServerError, "INTERNAL_ERROR", "合规检查失败", map[string]interface{}{
			"error": err.Error(),
		})
	}

	return successResponse(c, result)
}

// GetDataClassification 获取数据分级信息
// @Summary 获取数据分级信息
// @Tags Security
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/security/data-classification [get]
func (h *SecurityComplianceHandler) GetDataClassification(c echo.Context) error {
	classifications := h.complianceService.GetDataClassification()

	return successResponse(c, classifications)
}

// GetSensitiveFields 获取敏感字段配置
// @Summary 获取敏感字段配置
// @Tags Security
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/security/sensitive-fields [get]
func (h *SecurityComplianceHandler) GetSensitiveFields(c echo.Context) error {
	fields := h.complianceService.GetSensitiveFields()

	return successResponse(c, fields)
}

// GetMaskingRules 获取脱敏展示规则
// @Summary 获取脱敏展示规则
// @Tags Security
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/security/masking-rules [get]
func (h *SecurityComplianceHandler) GetMaskingRules(c echo.Context) error {
	rules := h.complianceService.GetMaskingRules()
	return successResponse(c, rules)
}

// GetAuditActions 获取审计动作列表
// @Summary 获取审计动作列表
// @Tags Security
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/security/audit-actions [get]
func (h *SecurityComplianceHandler) GetAuditActions(c echo.Context) error {
	actions := h.complianceService.GetAuditActions()

	return successResponse(c, actions)
}

// GetAuditChecklist 获取审计清单
// @Summary 获取审计清单
// @Tags Security
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/security/audit-checklist [get]
func (h *SecurityComplianceHandler) GetAuditChecklist(c echo.Context) error {
	checklist := h.complianceService.GetAuditChecklist()

	return successResponse(c, checklist)
}

// GetDependencyScanStatus 获取依赖扫描状态
// @Summary 获取依赖扫描状态
// @Tags Security
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/security/dependency-scan [get]
func (h *SecurityComplianceHandler) GetDependencyScanStatus(c echo.Context) error {
	status := h.complianceService.GetDependencyScanStatus()

	return successResponse(c, status)
}

// GetRotationPolicies 获取密钥轮换策略
// @Summary 获取密钥轮换策略
// @Tags Security
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/security/rotation-policies [get]
func (h *SecurityComplianceHandler) GetRotationPolicies(c echo.Context) error {
	policies := h.complianceService.GetRotationPolicies()

	return successResponse(c, policies)
}

// hasPermissionJSON 检查权限（辅助函数，处理entity.JSON类型）
func hasPermissionJSON(permissions entity.JSON, key string) bool {
	if permissions == nil {
		return false
	}
	raw, ok := permissions[key]
	if !ok {
		return false
	}
	switch value := raw.(type) {
	case bool:
		return value
	case float64:
		return value != 0
	default:
		return false
	}
}
